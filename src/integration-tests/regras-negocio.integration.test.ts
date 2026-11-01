import { describe, it, expect, beforeEach } from 'vitest';
import { api, authHeader } from './helpers';

describe('Regras de negócio (integração)', () => {
  let auth: string;
  let clienteId: number;
  let itemDisponivelId: number;
  let itemIndisponivelId: number;

  beforeEach(async () => {
    auth = await authHeader();

    const cliente = await api()
      .post('/api/clientes')
      .set('Authorization', auth)
      .send({ nome: 'Cliente Teste', telefone: '13991234567' });
    clienteId = cliente.body.id;

    const disponivel = await api()
      .post('/api/cardapio')
      .set('Authorization', auth)
      .send({ nome: 'Item disponível', preco: 20, categoria: 'Pratos', disponivel: true });
    itemDisponivelId = disponivel.body.id;

    const indisponivel = await api()
      .post('/api/cardapio')
      .set('Authorization', auth)
      .send({ nome: 'Item indisponível', preco: 20, categoria: 'Pratos', disponivel: false });
    itemIndisponivelId = indisponivel.body.id;
  });

  async function criarPedido(overrides: Partial<{ taxaEntrega: number; desconto: number; itens: { cardapioId: number; quantidade: number }[] }> = {}) {
    return api()
      .post('/api/pedidos')
      .set('Authorization', auth)
      .send({
        clienteId,
        tipoEntrega: 'RETIRADA',
        taxaEntrega: 0,
        desconto: 0,
        itens: [{ cardapioId: itemDisponivelId, quantidade: 1 }],
        ...overrides,
      });
  }

  it('should return 409 when a cardapio item is unavailable', async () => {
    const response = await criarPedido({ itens: [{ cardapioId: itemIndisponivelId, quantidade: 1 }] });

    expect(response.status).toBe(409);
  });

  it('should return 404 when a cardapio item does not exist', async () => {
    const response = await criarPedido({ itens: [{ cardapioId: 999999, quantidade: 1 }] });

    expect(response.status).toBe(404);
  });

  it('should return 422 when the desconto exceeds the subtotal', async () => {
    const response = await criarPedido({ desconto: 21 });

    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe('INVALID_DESCONTO');
  });

  it('should return 409 for an invalid status transition', async () => {
    const pedido = await criarPedido();

    const response = await api()
      .patch(`/api/pedidos/${pedido.body.id}/status`)
      .set('Authorization', auth)
      .send({ status: 'ENTREGUE' }); // CONFIRMADO → ENTREGUE pula PREPARANDO

    expect(response.status).toBe(409);
  });

  it('should return 409 when registering a pagamento for a CANCELADO pedido', async () => {
    const pedido = await criarPedido();
    await api().patch(`/api/pedidos/${pedido.body.id}/status`).set('Authorization', auth).send({ status: 'CANCELADO' });

    const response = await api()
      .post('/api/pagamentos')
      .set('Authorization', auth)
      .send({ pedidoId: pedido.body.id, forma: 'DINHEIRO' });

    expect(response.status).toBe(409);
  });

  describe('consistência pedido ↔ pagamento', () => {
    it('should return 409 when editing a pedido whose pagamento is PAGO', async () => {
      const pedido = await criarPedido();
      await api().post('/api/pagamentos').set('Authorization', auth).send({ pedidoId: pedido.body.id, forma: 'PIX' });
      await api().patch(`/api/pagamentos/${pedido.body.id}`).set('Authorization', auth).send({ status: 'PAGO' });

      const response = await api()
        .patch(`/api/pedidos/${pedido.body.id}`)
        .set('Authorization', auth)
        .send({ tipoEntrega: 'RETIRADA', taxaEntrega: 0, desconto: 0, itens: [{ cardapioId: itemDisponivelId, quantidade: 2 }] });

      expect(response.status).toBe(409);
    });

    it('should sync pagamento.valor when editing a pedido whose pagamento is PENDENTE', async () => {
      const pedido = await criarPedido();
      await api().post('/api/pagamentos').set('Authorization', auth).send({ pedidoId: pedido.body.id, forma: 'PIX' });

      await api()
        .patch(`/api/pedidos/${pedido.body.id}`)
        .set('Authorization', auth)
        .send({ tipoEntrega: 'RETIRADA', taxaEntrega: 0, desconto: 0, itens: [{ cardapioId: itemDisponivelId, quantidade: 2 }] });

      const pagamento = await api().get(`/api/pagamentos/${pedido.body.id}`).set('Authorization', auth);
      expect(pagamento.body.valor).toBe('40');
    });

    it('should return 409 when cancelling a pedido whose pagamento is PAGO', async () => {
      const pedido = await criarPedido();
      await api().post('/api/pagamentos').set('Authorization', auth).send({ pedidoId: pedido.body.id, forma: 'PIX' });
      await api().patch(`/api/pagamentos/${pedido.body.id}`).set('Authorization', auth).send({ status: 'PAGO' });

      const response = await api()
        .patch(`/api/pedidos/${pedido.body.id}/status`)
        .set('Authorization', auth)
        .send({ status: 'CANCELADO' });

      expect(response.status).toBe(409);
    });

    it('should return 409 when undoing an estorno on a CANCELADO pedido', async () => {
      const pedido = await criarPedido();
      await api().post('/api/pagamentos').set('Authorization', auth).send({ pedidoId: pedido.body.id, forma: 'PIX' });
      await api().patch(`/api/pagamentos/${pedido.body.id}`).set('Authorization', auth).send({ status: 'PAGO' });
      await api().patch(`/api/pagamentos/${pedido.body.id}`).set('Authorization', auth).send({ status: 'ESTORNADO' });
      await api().patch(`/api/pedidos/${pedido.body.id}/status`).set('Authorization', auth).send({ status: 'CANCELADO' });

      const response = await api()
        .patch(`/api/pagamentos/${pedido.body.id}`)
        .set('Authorization', auth)
        .send({ status: 'PAGO' });

      expect(response.status).toBe(409);
    });
  });
});
