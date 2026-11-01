import { describe, it, expect, beforeEach } from 'vitest';
import { api, authHeader } from './helpers';

describe('Fluxo completo de pedido (integração)', () => {
  let auth: string;

  beforeEach(async () => {
    auth = await authHeader();
  });

  it('should go from cardápio/cliente through pedido, edit, status, pagamento and dashboard', async () => {
    // 1. cardápio
    const itemA = await api()
      .post('/api/cardapio')
      .set('Authorization', auth)
      .send({ nome: 'Picanha na chapa', preco: 50, categoria: 'Pratos', disponivel: true });
    expect(itemA.status).toBe(201);

    const itemB = await api()
      .post('/api/cardapio')
      .set('Authorization', auth)
      .send({ nome: 'Refrigerante lata', preco: 10, categoria: 'Bebidas', disponivel: true });
    expect(itemB.status).toBe(201);

    // 2. cliente
    const cliente = await api()
      .post('/api/clientes')
      .set('Authorization', auth)
      .send({ nome: 'Maria Teste', telefone: '13991234567' });
    expect(cliente.status).toBe(201);

    // 3. pedido (entrega, com taxa e desconto)
    const criado = await api()
      .post('/api/pedidos')
      .set('Authorization', auth)
      .send({
        clienteId: cliente.body.id,
        tipoEntrega: 'ENTREGA',
        taxaEntrega: 8,
        desconto: 2,
        itens: [
          { cardapioId: itemA.body.id, quantidade: 2 },
          { cardapioId: itemB.body.id, quantidade: 1 },
        ],
      });
    expect(criado.status).toBe(201);
    // 2 × 50,00 + 1 × 10,00 + 8,00 − 2,00 = 116,00
    expect(criado.body.valorTotal).toBe('116');
    expect(criado.body.status).toBe('CONFIRMADO');

    const pedidoId = criado.body.id;

    // 4. editar pedido (recálculo)
    const editado = await api()
      .patch(`/api/pedidos/${pedidoId}`)
      .set('Authorization', auth)
      .send({
        tipoEntrega: 'ENTREGA',
        taxaEntrega: 8,
        desconto: 0,
        itens: [{ cardapioId: itemA.body.id, quantidade: 1 }],
      });
    expect(editado.status).toBe(200);
    // 1 × 50,00 + 8,00 − 0 = 58,00
    expect(editado.body.valorTotal).toBe('58');
    expect(editado.body.itens).toHaveLength(1);

    // 5. avançar status até ENTREGUE
    const confirmadoParaPreparando = await api()
      .patch(`/api/pedidos/${pedidoId}/status`)
      .set('Authorization', auth)
      .send({ status: 'PREPARANDO' });
    expect(confirmadoParaPreparando.status).toBe(200);

    const paraEntregue = await api()
      .patch(`/api/pedidos/${pedidoId}/status`)
      .set('Authorization', auth)
      .send({ status: 'ENTREGUE' });
    expect(paraEntregue.status).toBe(200);
    expect(paraEntregue.body.status).toBe('ENTREGUE');

    // 6. registrar pagamento
    const pagamento = await api()
      .post('/api/pagamentos')
      .set('Authorization', auth)
      .send({ pedidoId, forma: 'PIX' });
    expect(pagamento.status).toBe(201);
    expect(pagamento.body.valor).toBe('58');
    expect(pagamento.body.status).toBe('PENDENTE');

    // 7. marcar como PAGO
    const pago = await api()
      .patch(`/api/pagamentos/${pedidoId}`)
      .set('Authorization', auth)
      .send({ status: 'PAGO' });
    expect(pago.status).toBe(200);
    expect(pago.body.status).toBe('PAGO');
    expect(pago.body.dataPagamento).not.toBeNull();

    // 8. conferir o dashboard
    const dashboard = await api().get('/api/dashboard').set('Authorization', auth);
    expect(dashboard.status).toBe(200);
    expect(dashboard.body.faturamentoTotal).toBe('58');
    expect(dashboard.body.pedidosPorStatus.ENTREGUE).toBe(1);
    expect(dashboard.body.pagamentosPorForma.find((p: { forma: string }) => p.forma === 'PIX').quantidade).toBe(1);
  });
});
