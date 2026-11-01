import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updatePagamentoStatus } from './update-pagamento-status.service';
import { ConflictError, NotFoundError } from '@/shared/errors/AppError';

vi.mock('@/modules/pagamentos/repositories/pagamento.repository', () => ({
  findPagamentoByPedidoId: vi.fn(),
  updatePagamentoStatus: vi.fn(),
}));

import {
  findPagamentoByPedidoId,
  updatePagamentoStatus as updatePagamentoStatusRepo,
} from '@/modules/pagamentos/repositories/pagamento.repository';

describe('updatePagamentoStatus service', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('should throw NotFoundError when the pedido has no pagamento registered', async () => {
    vi.mocked(findPagamentoByPedidoId).mockResolvedValue(null);

    await expect(updatePagamentoStatus(999, { status: 'PAGO' })).rejects.toThrow(NotFoundError);
    expect(updatePagamentoStatusRepo).not.toHaveBeenCalled();
  });

  it('should move PENDENTE to PAGO and set dataPagamento to now', async () => {
    vi.mocked(findPagamentoByPedidoId).mockResolvedValue({
      pedidoId: 7,
      status: 'PENDENTE',
      dataPagamento: null,
    } as never);
    vi.mocked(updatePagamentoStatusRepo).mockResolvedValue({ pedidoId: 7, status: 'PAGO' } as never);

    await updatePagamentoStatus(7, { status: 'PAGO' });

    expect(updatePagamentoStatusRepo).toHaveBeenCalledWith(7, 'PAGO', expect.any(Date));
  });

  it('should move PAGO to ESTORNADO and keep the original dataPagamento', async () => {
    const dataPagamento = new Date('2026-10-01T12:00:00Z');
    vi.mocked(findPagamentoByPedidoId).mockResolvedValue({
      pedidoId: 7,
      status: 'PAGO',
      dataPagamento,
    } as never);
    vi.mocked(updatePagamentoStatusRepo).mockResolvedValue({ pedidoId: 7, status: 'ESTORNADO' } as never);

    await updatePagamentoStatus(7, { status: 'ESTORNADO' });

    expect(updatePagamentoStatusRepo).toHaveBeenCalledWith(7, 'ESTORNADO', dataPagamento);
  });

  it('should throw ConflictError when trying to go from PENDENTE to ESTORNADO', async () => {
    vi.mocked(findPagamentoByPedidoId).mockResolvedValue({
      pedidoId: 7,
      status: 'PENDENTE',
      dataPagamento: null,
    } as never);

    await expect(updatePagamentoStatus(7, { status: 'ESTORNADO' })).rejects.toThrow(ConflictError);
    expect(updatePagamentoStatusRepo).not.toHaveBeenCalled();
  });

  it('should move ESTORNADO back to PAGO and refresh dataPagamento', async () => {
    vi.mocked(findPagamentoByPedidoId).mockResolvedValue({
      pedidoId: 7,
      status: 'ESTORNADO',
      dataPagamento: new Date('2026-10-01T12:00:00Z'),
    } as never);
    vi.mocked(updatePagamentoStatusRepo).mockResolvedValue({ pedidoId: 7, status: 'PAGO' } as never);

    await updatePagamentoStatus(7, { status: 'PAGO' });

    expect(updatePagamentoStatusRepo).toHaveBeenCalledWith(7, 'PAGO', expect.any(Date));
  });

  it('should throw ConflictError when trying to go from ESTORNADO to ESTORNADO', async () => {
    vi.mocked(findPagamentoByPedidoId).mockResolvedValue({
      pedidoId: 7,
      status: 'ESTORNADO',
      dataPagamento: new Date(),
    } as never);

    await expect(updatePagamentoStatus(7, { status: 'ESTORNADO' })).rejects.toThrow(ConflictError);
    expect(updatePagamentoStatusRepo).not.toHaveBeenCalled();
  });
});
