import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { getPagamentoController } from './get-pagamento.controller';
import { NotFoundError } from '@/shared/errors/AppError';

vi.mock('../../services/get-pagamento/get-pagamento.service', () => ({
  getPagamento: vi.fn(),
}));

import { getPagamento } from '../../services/get-pagamento/get-pagamento.service';

function makeMocks(pedidoId: string) {
  const req = { params: { pedidoId } } as unknown as Request;
  const res = { json: vi.fn() } as unknown as Response;
  const next = vi.fn() as unknown as NextFunction;
  return { req, res, next };
}

describe('getPagamentoController', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('should return the pagamento', async () => {
    const fakePagamento = { pedidoId: 7, forma: 'PIX', status: 'PENDENTE' };
    vi.mocked(getPagamento).mockResolvedValue(fakePagamento as never);

    const { req, res, next } = makeMocks('7');
    await getPagamentoController(req, res, next);

    expect(getPagamento).toHaveBeenCalledWith(7);
    expect(res.json).toHaveBeenCalledWith(fakePagamento);
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next with validation error for an invalid pedidoId', async () => {
    const { req, res, next } = makeMocks('-1');
    await getPagamentoController(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(ZodError));
    expect(getPagamento).not.toHaveBeenCalled();
  });

  it('should call next with NotFoundError when the service throws it', async () => {
    const error = new NotFoundError('Pagamento');
    vi.mocked(getPagamento).mockRejectedValue(error);

    const { req, res, next } = makeMocks('999');
    await getPagamentoController(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
    expect(res.json).not.toHaveBeenCalled();
  });
});
