import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { getClienteController } from './get-cliente.controller';
import { NotFoundError } from '@/shared/errors/AppError';

vi.mock('../../services/get-cliente/get-cliente.service', () => ({
  getCliente: vi.fn(),
}));

import { getCliente } from '../../services/get-cliente/get-cliente.service';

function makeMocks(id: string) {
  const req = { params: { id } } as unknown as Request;
  const res = { json: vi.fn() } as unknown as Response;
  const next = vi.fn() as unknown as NextFunction;
  return { req, res, next };
}

describe('getClienteController', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('should return the cliente', async () => {
    const fakeCliente = { id: 1, nome: 'Maria', telefone: '13991234567' };
    vi.mocked(getCliente).mockResolvedValue(fakeCliente as never);

    const { req, res, next } = makeMocks('1');
    await getClienteController(req, res, next);

    expect(getCliente).toHaveBeenCalledWith(1);
    expect(res.json).toHaveBeenCalledWith(fakeCliente);
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next with validation error for a non-numeric id', async () => {
    const { req, res, next } = makeMocks('abc');
    await getClienteController(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(ZodError));
    expect(getCliente).not.toHaveBeenCalled();
  });

  it('should call next with NotFoundError when the service throws it', async () => {
    const error = new NotFoundError('Cliente');
    vi.mocked(getCliente).mockRejectedValue(error);

    const { req, res, next } = makeMocks('999');
    await getClienteController(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
    expect(res.json).not.toHaveBeenCalled();
  });
});
