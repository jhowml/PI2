import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { updatePagamentoFormaController } from './update-pagamento-forma.controller';

vi.mock('../../services/update-pagamento-forma/update-pagamento-forma.service', () => ({
  updatePagamentoForma: vi.fn(),
}));

import { updatePagamentoForma } from '../../services/update-pagamento-forma/update-pagamento-forma.service';

function makeMocks(pedidoId: string, body: unknown = { forma: 'PIX' }) {
  const req = { params: { pedidoId }, body } as unknown as Request;
  const res = { json: vi.fn() } as unknown as Response;
  const next = vi.fn() as unknown as NextFunction;
  return { req, res, next };
}

describe('updatePagamentoFormaController', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('should return the updated pagamento', async () => {
    const fakePagamento = { pedidoId: 7, forma: 'PIX', status: 'PENDENTE' };
    vi.mocked(updatePagamentoForma).mockResolvedValue(fakePagamento as never);

    const { req, res, next } = makeMocks('7');
    await updatePagamentoFormaController(req, res, next);

    expect(updatePagamentoForma).toHaveBeenCalledWith(7, { forma: 'PIX' });
    expect(res.json).toHaveBeenCalledWith(fakePagamento);
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next with validation error for an invalid pedidoId', async () => {
    const { req, res, next } = makeMocks('-1');
    await updatePagamentoFormaController(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(ZodError));
    expect(updatePagamentoForma).not.toHaveBeenCalled();
  });

  it('should call next with validation error for an invalid forma', async () => {
    const { req, res, next } = makeMocks('7', { forma: 'BOLETO' });
    await updatePagamentoFormaController(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(ZodError));
    expect(updatePagamentoForma).not.toHaveBeenCalled();
  });

  it('should call next with error when service throws', async () => {
    const error = new Error('service failure');
    vi.mocked(updatePagamentoForma).mockRejectedValue(error);

    const { req, res, next } = makeMocks('7');
    await updatePagamentoFormaController(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
    expect(res.json).not.toHaveBeenCalled();
  });
});
