import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { getDashboardController } from './get-dashboard.controller';

vi.mock('../../services/get-dashboard/get-dashboard.service', () => ({
  getDashboard: vi.fn(),
}));

import { getDashboard } from '../../services/get-dashboard/get-dashboard.service';

function makeMocks(query: unknown = {}) {
  const req = { query } as unknown as Request;
  const res = { json: vi.fn() } as unknown as Response;
  const next = vi.fn() as unknown as NextFunction;
  return { req, res, next };
}

const fakeResult = {
  faturamentoTotal: '100.00',
  ticketMedio: '50.00',
  faturamentoPorPeriodo: [],
  pedidosPorStatus: { CONFIRMADO: 0, PREPARANDO: 0, ENTREGUE: 2, CANCELADO: 0 },
  itensMaisVendidos: [],
};

describe('getDashboardController', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('should return the dashboard with no query params', async () => {
    vi.mocked(getDashboard).mockResolvedValue(fakeResult as never);

    const { req, res, next } = makeMocks();
    await getDashboardController(req, res, next);

    expect(getDashboard).toHaveBeenCalledWith({});
    expect(res.json).toHaveBeenCalledWith(fakeResult);
    expect(next).not.toHaveBeenCalled();
  });

  it('should parse from/to query params into dates', async () => {
    vi.mocked(getDashboard).mockResolvedValue(fakeResult as never);

    const { req, res, next } = makeMocks({ from: '2026-10-01', to: '2026-10-31' });
    await getDashboardController(req, res, next);

    const calledWith = vi.mocked(getDashboard).mock.calls[0][0];
    expect(calledWith.from).toBeInstanceOf(Date);
    expect(calledWith.to).toBeInstanceOf(Date);
  });

  it('should call next with validation error when from is after to', async () => {
    const { req, res, next } = makeMocks({ from: '2026-10-31', to: '2026-10-01' });
    await getDashboardController(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(ZodError));
    expect(getDashboard).not.toHaveBeenCalled();
  });

  it('should call next with error when service throws', async () => {
    const error = new Error('service failure');
    vi.mocked(getDashboard).mockRejectedValue(error);

    const { req, res, next } = makeMocks();
    await getDashboardController(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
    expect(res.json).not.toHaveBeenCalled();
  });
});
