import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { createItemCardapioController } from './create-item-cardapio.controller';

vi.mock('../../services/create-item-cardapio/create-item-cardapio.service', () => ({
  createItemCardapio: vi.fn(),
}));

import { createItemCardapio } from '../../services/create-item-cardapio/create-item-cardapio.service';

const validBody = {
  nome: 'Suco natural de laranja',
  preco: 12,
  categoria: 'Bebidas',
};

const fakeItem = { id: 1, ...validBody, disponivel: true };

function makeMocks(body: unknown = validBody) {
  const req = { body } as unknown as Request;
  const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as unknown as Response;
  const next = vi.fn() as unknown as NextFunction;
  return { req, res, next };
}

describe('createItemCardapioController', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('should return 201 with the created item', async () => {
    vi.mocked(createItemCardapio).mockResolvedValue(fakeItem as never);

    const { req, res, next } = makeMocks();
    await createItemCardapioController(req, res, next);

    expect(createItemCardapio).toHaveBeenCalledWith({ ...validBody, disponivel: true });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(fakeItem);
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next with validation error when body is invalid', async () => {
    const { req, res, next } = makeMocks({ nome: '', preco: -1, categoria: '' });
    await createItemCardapioController(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(ZodError));
    expect(createItemCardapio).not.toHaveBeenCalled();
  });

  it('should reject preco with more than two decimal places', async () => {
    const { req, res, next } = makeMocks({ ...validBody, preco: 12.345 });
    await createItemCardapioController(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(ZodError));
    expect(res.json).not.toHaveBeenCalled();
  });

  it('should reject nome longer than the column size', async () => {
    const { req, res, next } = makeMocks({ ...validBody, nome: 'a'.repeat(101) });
    await createItemCardapioController(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(ZodError));
  });

  it('should call next with error when service throws', async () => {
    const error = new Error('service failure');
    vi.mocked(createItemCardapio).mockRejectedValue(error);

    const { req, res, next } = makeMocks();
    await createItemCardapioController(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
    expect(res.json).not.toHaveBeenCalled();
  });
});
