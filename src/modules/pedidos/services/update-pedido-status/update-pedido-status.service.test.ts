import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updatePedidoStatus } from './update-pedido-status.service';
import { ConflictError, NotFoundError } from '@/shared/errors/AppError';

vi.mock('@/modules/pedidos/repositories/pedido.repository', () => ({
  findPedidoById: vi.fn(),
  updatePedidoStatus: vi.fn(),
}));

import {
  findPedidoById,
  updatePedidoStatus as updatePedidoStatusRepository,
} from '@/modules/pedidos/repositories/pedido.repository';

describe('updatePedidoStatus service', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('should throw NotFoundError when the pedido does not exist', async () => {
    vi.mocked(findPedidoById).mockResolvedValue(null);

    await expect(updatePedidoStatus(999, { status: 'PREPARANDO' })).rejects.toThrow(NotFoundError);
    expect(updatePedidoStatusRepository).not.toHaveBeenCalled();
  });

  it.each([
    ['CONFIRMADO', 'PREPARANDO'],
    ['CONFIRMADO', 'CANCELADO'],
    ['PREPARANDO', 'ENTREGUE'],
    ['PREPARANDO', 'CANCELADO'],
  ])('should allow transition from %s to %s', async (status, nextStatus) => {
    vi.mocked(findPedidoById).mockResolvedValue({ id: 1, status } as never);
    vi.mocked(updatePedidoStatusRepository).mockResolvedValue({ id: 1, status: nextStatus } as never);

    await updatePedidoStatus(1, { status: nextStatus as never });

    expect(updatePedidoStatusRepository).toHaveBeenCalledWith(1, nextStatus);
  });

  it.each([
    ['CONFIRMADO', 'ENTREGUE'],
    ['ENTREGUE', 'PREPARANDO'],
    ['ENTREGUE', 'CANCELADO'],
    ['CANCELADO', 'CONFIRMADO'],
    ['CANCELADO', 'PREPARANDO'],
  ])('should throw ConflictError for invalid transition from %s to %s', async (status, nextStatus) => {
    vi.mocked(findPedidoById).mockResolvedValue({ id: 1, status } as never);

    await expect(updatePedidoStatus(1, { status: nextStatus as never })).rejects.toThrow(ConflictError);
    expect(updatePedidoStatusRepository).not.toHaveBeenCalled();
  });
});
