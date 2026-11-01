import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { createPagamentoController } from './create-pagamento.controller';

vi.mock('@/composition/pagamento-creation', () => ({
  createPagamento: vi.fn(),
}));

import { createPagamento } from '@/composition/pagamento-creation';

const validBody = { pedidoId: 7, forma: 'PIX' };
const fakePagamento = { pedidoId: 7, forma: 'PIX', status: 'PENDENTE' };

function makeMocks(body: unknown = validBody) {
  const req = { body } as unknown as Request;
  const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as unknown as Response;
  const next = vi.fn() as unknown as NextFunction;
  return { req, res, next };
}

describe('createPagamentoController', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('should return 201 with the created pagamento', async () => {
    vi.mocked(createPagamento).mockResolvedValue(fakePagamento as never);

    const { req, res, next } = makeMocks();
    await createPagamentoController(req, res, next);

    expect(createPagamento).toHaveBeenCalledWith(validBody);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(fakePagamento);
    expect(next).not.toHaveBeenCalled();
  });

  it.each([
    ['sem pedidoId', { pedidoId: undefined }],
    ['pedidoId inválido', { pedidoId: 0 }],
    ['sem forma', { forma: undefined }],
    ['forma inválida', { forma: 'BOLETO' }],
  ])('should call next with validation error for %s', async (_case, override) => {
    const { req, res, next } = makeMocks({ ...validBody, ...override });
    await createPagamentoController(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(ZodError));
    expect(createPagamento).not.toHaveBeenCalled();
  });

  it('should call next with error when service throws', async () => {
    const error = new Error('service failure');
    vi.mocked(createPagamento).mockRejectedValue(error);

    const { req, res, next } = makeMocks();
    await createPagamentoController(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
    expect(res.json).not.toHaveBeenCalled();
  });
});
