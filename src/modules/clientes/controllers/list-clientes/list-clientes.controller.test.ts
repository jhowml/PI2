import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { listClientesController } from './list-clientes.controller';

vi.mock('../../services/list-clientes/list-clientes.service', () => ({
  listClientes: vi.fn(),
}));

import { listClientes } from '../../services/list-clientes/list-clientes.service';

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

describe('listClientesController', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('should call res.json with the service result', async () => {
    vi.mocked(listClientes).mockResolvedValue(fakeResult);

    const { req, res, next } = makeMocks();
    await listClientesController(req, res, next);

    expect(listClientes).toHaveBeenCalledWith({ page: 1, pageSize: 20 });
    expect(res.json).toHaveBeenCalledWith(fakeResult);
    expect(next).not.toHaveBeenCalled();
  });

  it('should forward search and pagination params', async () => {
    vi.mocked(listClientes).mockResolvedValue(fakeResult);

    const { req, res, next } = makeMocks({ page: '3', search: 'maria' });
    await listClientesController(req, res, next);

    expect(listClientes).toHaveBeenCalledWith({ page: 3, pageSize: 20, search: 'maria' });
  });

  it('should call next with validation error for invalid page', async () => {
    const { req, res, next } = makeMocks({ page: '0' });
    await listClientesController(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(ZodError));
    expect(listClientes).not.toHaveBeenCalled();
  });

  it('should call next with the error when the service throws', async () => {
    const error = new Error('database failure');
    vi.mocked(listClientes).mockRejectedValue(error);

    const { req, res, next } = makeMocks();
    await listClientesController(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
    expect(res.json).not.toHaveBeenCalled();
  });
});
