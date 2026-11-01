import { describe, it, expect, vi } from 'vitest';
import { Prisma } from '@prisma/client';
import { updatePedido } from './update-pedido.service';
import { ConflictError, InvalidDescontoError, NotFoundError } from '@/shared/errors/AppError';
import type { UpdatePedidoPorts } from '@/composition/pedido-update.ports';
import type { UpdatePedidoBodyDTO } from '@/modules/pedidos/dtos/update-pedido/update-pedido.types';

function makePedidoAtual(overrides: Record<string, unknown> = {}) {
  return { id: 1, status: 'CONFIRMADO', clienteId: 1, ...overrides };
}

function makeItemCardapio(id: number, preco: string, overrides: Record<string, unknown> = {}) {
  return { id, nome: `Item ${id}`, preco: new Prisma.Decimal(preco), disponivel: true, ...overrides };
}

function makePorts(overrides: Partial<UpdatePedidoPorts> = {}): UpdatePedidoPorts {
  return {
    findPedidoById: vi.fn().mockResolvedValue(makePedidoAtual()),
    findCardapioItensByIds: vi.fn().mockResolvedValue([makeItemCardapio(2, '15.00'), makeItemCardapio(4, '6.00')]),
    updatePedido: vi.fn().mockResolvedValue({ id: 1 }),
    ...overrides,
  };
}

const validDto: UpdatePedidoBodyDTO = {
  tipoEntrega: 'ENTREGA',
  taxaEntrega: 5,
  desconto: 2,
  itens: [
    { cardapioId: 2, quantidade: 2 },
    { cardapioId: 4, quantidade: 1 },
  ],
};

function updatedInput(ports: UpdatePedidoPorts) {
  return vi.mocked(ports.updatePedido).mock.calls[0][1];
}

describe('updatePedido service', () => {
  it('should throw NotFoundError when the pedido does not exist', async () => {
    const ports = makePorts({ findPedidoById: vi.fn().mockResolvedValue(null) });

    await expect(updatePedido(1, validDto, ports)).rejects.toThrow(NotFoundError);
    expect(ports.updatePedido).not.toHaveBeenCalled();
  });

  it.each(['PREPARANDO', 'ENTREGUE', 'CANCELADO'])('should throw ConflictError when the pedido status is %s', async (status) => {
    const ports = makePorts({ findPedidoById: vi.fn().mockResolvedValue(makePedidoAtual({ status })) });

    await expect(updatePedido(1, validDto, ports)).rejects.toThrow(ConflictError);
    expect(ports.updatePedido).not.toHaveBeenCalled();
  });

  it('should allow editing when the pedido status is CONFIRMADO', async () => {
    const ports = makePorts({ findPedidoById: vi.fn().mockResolvedValue(makePedidoAtual({ status: 'CONFIRMADO' })) });

    await expect(updatePedido(1, validDto, ports)).resolves.toBeDefined();
  });

  it('should recompute valorTotal from the current cardapio prices', async () => {
    const ports = makePorts();

    await updatePedido(1, validDto, ports);

    const input = updatedInput(ports);
    expect(input.valorTotal.toFixed(2)).toBe('39.00');
    expect(input.itens[0].precoUnitario.toFixed(2)).toBe('15.00');
  });

  it('should throw InvalidDescontoError and not persist when the desconto exceeds the total', async () => {
    const ports = makePorts();

    await expect(updatePedido(1, { ...validDto, desconto: 41.01 }, ports)).rejects.toThrow(InvalidDescontoError);
    expect(ports.updatePedido).not.toHaveBeenCalled();
  });

  it('should throw ConflictError when an item is unavailable', async () => {
    const ports = makePorts({
      findCardapioItensByIds: vi.fn().mockResolvedValue([
        makeItemCardapio(2, '15.00', { nome: 'Pudim', disponivel: false }),
        makeItemCardapio(4, '6.00'),
      ]),
    });

    await expect(updatePedido(1, validDto, ports)).rejects.toThrow(ConflictError);
  });
});
