import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { getPedidoController } from './get-pedido.controller';
import { NotFoundError } from '@/shared/errors/AppError';

vi.mock('../../services/get-pedido/get-pedido.service', () => ({
  getPedido: vi.fn(),
}));

import { getPedido } from '../../services/get-pedido/get-pedido.service';

function makeMocks(id: string) {
  const req = { params: { id } } as unknown as Request;
  const res = { json: vi.fn() } as unknown as Response;
  const next = vi.fn() as unknown as NextFunction;
  return { req, res, next };
}

describe('getPedidoController', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('should return the pedido', async () => {
    const fakePedido = { id: 7, status: 'PENDENTE', itens: [] };
    vi.mocked(getPedido).mockResolvedValue(fakePedido as never);

    const { req, res, next } = makeMocks('7');
    await getPedidoController(req, res, next);

    expect(getPedido).toHaveBeenCalledWith(7);
    expect(res.json).toHaveBeenCalledWith(fakePedido);
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next with validation error for an invalid id', async () => {
    const { req, res, next } = makeMocks('-1');
    await getPedidoController(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(ZodError));
    expect(getPedido).not.toHaveBeenCalled();
  });

  it('should call next with NotFoundError when the service throws it', async () => {
    const error = new NotFoundError('Pedido');
    vi.mocked(getPedido).mockRejectedValue(error);

    const { req, res, next } = makeMocks('999');
    await getPedidoController(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
    expect(res.json).not.toHaveBeenCalled();
  });
});
