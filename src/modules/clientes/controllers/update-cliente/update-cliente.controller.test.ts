import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { updateClienteController } from './update-cliente.controller';

vi.mock('../../services/update-cliente/update-cliente.service', () => ({
  updateCliente: vi.fn(),
}));

import { updateCliente } from '../../services/update-cliente/update-cliente.service';

const validBody = { nome: 'Carlos Eduardo Lima', telefone: '13997654321', cidade: 'Guarujá', uf: 'SP' };

function makeMocks(id: string, body: unknown = validBody) {
  const req = { params: { id }, body } as unknown as Request;
  const res = { json: vi.fn() } as unknown as Response;
  const next = vi.fn() as unknown as NextFunction;
  return { req, res, next };
}

describe('updateClienteController', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('should return the updated cliente', async () => {
    const fakeCliente = { id: 1, ...validBody };
    vi.mocked(updateCliente).mockResolvedValue(fakeCliente as never);

    const { req, res, next } = makeMocks('1');
    await updateClienteController(req, res, next);

    expect(updateCliente).toHaveBeenCalledWith(1, validBody);
    expect(res.json).toHaveBeenCalledWith(fakeCliente);
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next with validation error for an invalid id', async () => {
    const { req, res, next } = makeMocks('-1');
    await updateClienteController(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(ZodError));
    expect(updateCliente).not.toHaveBeenCalled();
  });

  it('should call next with validation error for an empty nome', async () => {
    const { req, res, next } = makeMocks('1', { ...validBody, nome: '' });
    await updateClienteController(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(ZodError));
    expect(updateCliente).not.toHaveBeenCalled();
  });

  it('should call next with error when service throws', async () => {
    const error = new Error('service failure');
    vi.mocked(updateCliente).mockRejectedValue(error);

    const { req, res, next } = makeMocks('1');
    await updateClienteController(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
    expect(res.json).not.toHaveBeenCalled();
  });
});
