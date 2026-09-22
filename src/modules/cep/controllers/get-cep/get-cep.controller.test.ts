import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { getCepController } from './get-cep.controller';
import { NotFoundError } from '@/shared/errors/AppError';

vi.mock('../../services/get-cep/get-cep.service', () => ({
  getCep: vi.fn(),
}));

import { getCep } from '../../services/get-cep/get-cep.service';

const fakeEndereco = {
  cep: '11450000',
  logradouro: 'Avenida Thiago Ferreira',
  bairro: 'Vicente de Carvalho',
  cidade: 'Guarujá',
  uf: 'SP',
};

function makeMocks(cep: string) {
  const req = { params: { cep } } as unknown as Request;
  const res = { json: vi.fn() } as unknown as Response;
  const next = vi.fn() as unknown as NextFunction;
  return { req, res, next };
}

describe('getCepController', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('should return the endereco for a cep without hyphen', async () => {
    vi.mocked(getCep).mockResolvedValue(fakeEndereco);

    const { req, res, next } = makeMocks('11450000');
    await getCepController(req, res, next);

    expect(getCep).toHaveBeenCalledWith('11450000');
    expect(res.json).toHaveBeenCalledWith(fakeEndereco);
    expect(next).not.toHaveBeenCalled();
  });

  it('should accept a cep with hyphen and normalize it', async () => {
    vi.mocked(getCep).mockResolvedValue(fakeEndereco);

    const { req, res, next } = makeMocks('11450-000');
    await getCepController(req, res, next);

    expect(getCep).toHaveBeenCalledWith('11450000');
  });

  it.each(['1145000', '114500000', '11450-00a', 'abcdefgh', '1145-0000'])(
    'should call next with validation error for invalid cep "%s"',
    async (cep) => {
      const { req, res, next } = makeMocks(cep);
      await getCepController(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(ZodError));
      expect(getCep).not.toHaveBeenCalled();
    },
  );

  it('should call next with the error when the service throws', async () => {
    const error = new NotFoundError('CEP');
    vi.mocked(getCep).mockRejectedValue(error);

    const { req, res, next } = makeMocks('99999999');
    await getCepController(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
    expect(res.json).not.toHaveBeenCalled();
  });
});
