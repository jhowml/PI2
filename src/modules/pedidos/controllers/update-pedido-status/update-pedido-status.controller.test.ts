import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { updatePedidoStatusController } from './update-pedido-status.controller';

vi.mock('../../services/update-pedido-status/update-pedido-status.service', () => ({
  updatePedidoStatus: vi.fn(),
}));

import { updatePedidoStatus } from '../../services/update-pedido-status/update-pedido-status.service';

function makeMocks(id: string, body: unknown = { status: 'PREPARANDO' }) {
  const req = { params: { id }, body } as unknown as Request;
  const res = { json: vi.fn() } as unknown as Response;
  const next = vi.fn() as unknown as NextFunction;
  return { req, res, next };
}

describe('updatePedidoStatusController', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('should return the updated pedido', async () => {
    const fakePedido = { id: 1, status: 'PREPARANDO' };
    vi.mocked(updatePedidoStatus).mockResolvedValue(fakePedido as never);

    const { req, res, next } = makeMocks('1');
    await updatePedidoStatusController(req, res, next);

    expect(updatePedidoStatus).toHaveBeenCalledWith(1, { status: 'PREPARANDO' });
    expect(res.json).toHaveBeenCalledWith(fakePedido);
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next with validation error for CONFIRMADO (no longer a valid target, pedidos start there)', async () => {
    const { req, res, next } = makeMocks('1', { status: 'CONFIRMADO' });
    await updatePedidoStatusController(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(ZodError));
    expect(updatePedidoStatus).not.toHaveBeenCalled();
  });

  it('should call next with error when service throws', async () => {
    const error = new Error('service failure');
    vi.mocked(updatePedidoStatus).mockRejectedValue(error);

    const { req, res, next } = makeMocks('1');
    await updatePedidoStatusController(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
    expect(res.json).not.toHaveBeenCalled();
  });
});
