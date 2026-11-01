import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { updatePagamentoStatusController } from './update-pagamento-status.controller';

vi.mock('../../services/update-pagamento-status/update-pagamento-status.service', () => ({
  updatePagamentoStatus: vi.fn(),
}));

import { updatePagamentoStatus } from '../../services/update-pagamento-status/update-pagamento-status.service';

function makeMocks(pedidoId: string, body: unknown = { status: 'PAGO' }) {
  const req = { params: { pedidoId }, body } as unknown as Request;
  const res = { json: vi.fn() } as unknown as Response;
  const next = vi.fn() as unknown as NextFunction;
  return { req, res, next };
}

describe('updatePagamentoStatusController', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('should return the updated pagamento', async () => {
    const fakePagamento = { pedidoId: 7, status: 'PAGO' };
    vi.mocked(updatePagamentoStatus).mockResolvedValue(fakePagamento as never);

    const { req, res, next } = makeMocks('7');
    await updatePagamentoStatusController(req, res, next);

    expect(updatePagamentoStatus).toHaveBeenCalledWith(7, { status: 'PAGO' });
    expect(res.json).toHaveBeenCalledWith(fakePagamento);
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next with validation error for an invalid pedidoId', async () => {
    const { req, res, next } = makeMocks('-1');
    await updatePagamentoStatusController(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(ZodError));
    expect(updatePagamentoStatus).not.toHaveBeenCalled();
  });

  it('should call next with validation error for an invalid status', async () => {
    const { req, res, next } = makeMocks('7', { status: 'PENDENTE' });
    await updatePagamentoStatusController(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(ZodError));
    expect(updatePagamentoStatus).not.toHaveBeenCalled();
  });

  it('should call next with error when service throws', async () => {
    const error = new Error('service failure');
    vi.mocked(updatePagamentoStatus).mockRejectedValue(error);

    const { req, res, next } = makeMocks('7');
    await updatePagamentoStatusController(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
    expect(res.json).not.toHaveBeenCalled();
  });
});
