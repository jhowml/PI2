import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { updateItemCardapioController } from './update-item-cardapio.controller';

vi.mock('../../services/update-item-cardapio/update-item-cardapio.service', () => ({
  updateItemCardapio: vi.fn(),
}));

import { updateItemCardapio } from '../../services/update-item-cardapio/update-item-cardapio.service';

const validBody = { nome: 'Frango grelhado', preco: 34.9, categoria: 'Pratos', disponivel: true };

function makeMocks(id: string, body: unknown = validBody) {
  const req = { params: { id }, body } as unknown as Request;
  const res = { json: vi.fn() } as unknown as Response;
  const next = vi.fn() as unknown as NextFunction;
  return { req, res, next };
}

describe('updateItemCardapioController', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('should return the updated item', async () => {
    const fakeItem = { id: 1, ...validBody };
    vi.mocked(updateItemCardapio).mockResolvedValue(fakeItem as never);

    const { req, res, next } = makeMocks('1');
    await updateItemCardapioController(req, res, next);

    expect(updateItemCardapio).toHaveBeenCalledWith(1, validBody);
    expect(res.json).toHaveBeenCalledWith(fakeItem);
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next with validation error for an invalid id', async () => {
    const { req, res, next } = makeMocks('-1');
    await updateItemCardapioController(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(ZodError));
    expect(updateItemCardapio).not.toHaveBeenCalled();
  });

  it('should call next with validation error for a non-positive preco', async () => {
    const { req, res, next } = makeMocks('1', { ...validBody, preco: 0 });
    await updateItemCardapioController(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(ZodError));
    expect(updateItemCardapio).not.toHaveBeenCalled();
  });

  it('should call next with error when service throws', async () => {
    const error = new Error('service failure');
    vi.mocked(updateItemCardapio).mockRejectedValue(error);

    const { req, res, next } = makeMocks('1');
    await updateItemCardapioController(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
    expect(res.json).not.toHaveBeenCalled();
  });
});
