import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { listPedidosController } from './list-pedidos.controller';

vi.mock('../../services/list-pedidos/list-pedidos.service', () => ({
  listPedidos: vi.fn(),
}));

import { listPedidos } from '../../services/list-pedidos/list-pedidos.service';

function makeMocks(query: Record<string, unknown> = {}) {
  const req = { query } as unknown as Request;
  const res = { json: vi.fn() } as unknown as Response;
  const next = vi.fn() as unknown as NextFunction;
  return { req, res, next };
}

const fakeResult = {
  data: [],
  meta: { total: 0, page: 1, pageSize: 20, totalPages: 0, hasNextPage: false, hasPreviousPage: false },
};

describe('listPedidosController', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('should call res.json with the service result', async () => {
    vi.mocked(listPedidos).mockResolvedValue(fakeResult);

    const { req, res, next } = makeMocks();
    await listPedidosController(req, res, next);

    expect(listPedidos).toHaveBeenCalledWith({ page: 1, pageSize: 20 });
    expect(res.json).toHaveBeenCalledWith(fakeResult);
    expect(next).not.toHaveBeenCalled();
  });

  it('should forward a valid status filter', async () => {
    vi.mocked(listPedidos).mockResolvedValue(fakeResult);

    const { req, res, next } = makeMocks({ status: 'CONFIRMADO' });
    await listPedidosController(req, res, next);

    expect(listPedidos).toHaveBeenCalledWith({ page: 1, pageSize: 20, status: 'CONFIRMADO' });
  });

  it('should call next with validation error for an invalid status', async () => {
    const { req, res, next } = makeMocks({ status: 'INVALIDO' });
    await listPedidosController(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(ZodError));
    expect(listPedidos).not.toHaveBeenCalled();
  });

  it('should call next with the error when the service throws', async () => {
    const error = new Error('database failure');
    vi.mocked(listPedidos).mockRejectedValue(error);

    const { req, res, next } = makeMocks();
    await listPedidosController(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
    expect(res.json).not.toHaveBeenCalled();
  });
});
