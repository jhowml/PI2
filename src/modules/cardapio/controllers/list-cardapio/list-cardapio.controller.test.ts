import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { listCardapioController } from './list-cardapio.controller';

vi.mock('../../services/list-cardapio/list-cardapio.service', () => ({
  listCardapio: vi.fn(),
}));

import { listCardapio } from '../../services/list-cardapio/list-cardapio.service';

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

describe('listCardapioController', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('should call res.json with the service result', async () => {
    vi.mocked(listCardapio).mockResolvedValue(fakeResult);

    const { req, res, next } = makeMocks();
    await listCardapioController(req, res, next);

    expect(listCardapio).toHaveBeenCalledWith({ page: 1, pageSize: 20 });
    expect(res.json).toHaveBeenCalledWith(fakeResult);
    expect(next).not.toHaveBeenCalled();
  });

  it('should coerce pagination params and forward search', async () => {
    vi.mocked(listCardapio).mockResolvedValue(fakeResult);

    const { req, res, next } = makeMocks({ page: '2', pageSize: '10', search: 'suco' });
    await listCardapioController(req, res, next);

    expect(listCardapio).toHaveBeenCalledWith({ page: 2, pageSize: 10, search: 'suco' });
  });

  it('should call next with validation error when pageSize exceeds the limit', async () => {
    const { req, res, next } = makeMocks({ pageSize: '101' });
    await listCardapioController(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(ZodError));
    expect(listCardapio).not.toHaveBeenCalled();
  });

  it('should call next with the error when the service throws', async () => {
    const error = new Error('database failure');
    vi.mocked(listCardapio).mockRejectedValue(error);

    const { req, res, next } = makeMocks();
    await listCardapioController(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
    expect(res.json).not.toHaveBeenCalled();
  });
});
