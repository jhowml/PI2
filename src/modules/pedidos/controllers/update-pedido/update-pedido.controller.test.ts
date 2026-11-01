import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { updatePedidoController } from './update-pedido.controller';

vi.mock('@/composition/pedido-update', () => ({
  updatePedido: vi.fn(),
}));

import { updatePedido } from '@/composition/pedido-update';

const validBody = {
  tipoEntrega: 'ENTREGA',
  taxaEntrega: 5,
  desconto: 2,
  itens: [{ cardapioId: 2, quantidade: 2 }],
};

const fakePedido = { id: 1, status: 'CONFIRMADO', valorTotal: '35.00', itens: [] };

function makeMocks(id: string, body: unknown = validBody) {
  const req = { params: { id }, body } as unknown as Request;
  const res = { json: vi.fn() } as unknown as Response;
  const next = vi.fn() as unknown as NextFunction;
  return { req, res, next };
}

describe('updatePedidoController', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('should return the updated pedido', async () => {
    vi.mocked(updatePedido).mockResolvedValue(fakePedido as never);

    const { req, res, next } = makeMocks('1');
    await updatePedidoController(req, res, next);

    expect(updatePedido).toHaveBeenCalledWith(1, validBody);
    expect(res.json).toHaveBeenCalledWith(fakePedido);
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next with validation error for an invalid id', async () => {
    const { req, res, next } = makeMocks('-1');
    await updatePedidoController(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(ZodError));
    expect(updatePedido).not.toHaveBeenCalled();
  });

  it('should call next with validation error for an empty itens list', async () => {
    const { req, res, next } = makeMocks('1', { ...validBody, itens: [] });
    await updatePedidoController(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(ZodError));
    expect(updatePedido).not.toHaveBeenCalled();
  });

  it('should call next with error when service throws', async () => {
    const error = new Error('service failure');
    vi.mocked(updatePedido).mockRejectedValue(error);

    const { req, res, next } = makeMocks('1');
    await updatePedidoController(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
    expect(res.json).not.toHaveBeenCalled();
  });
});
