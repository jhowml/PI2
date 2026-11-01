import { describe, it, expect, vi } from 'vitest';
import { updatePedidoStatus } from './update-pedido-status.service';
import { ConflictError, NotFoundError } from '@/shared/errors/AppError';
import type { UpdatePedidoStatusPorts } from '@/composition/pedido-status-update.ports';

function makePorts(overrides: Partial<UpdatePedidoStatusPorts> = {}): UpdatePedidoStatusPorts {
  return {
    findPedidoById: vi.fn().mockResolvedValue({ id: 1, status: 'CONFIRMADO' }),
    findPagamentoByPedidoId: vi.fn().mockResolvedValue(null),
    updatePedidoStatus: vi.fn().mockResolvedValue({ id: 1, status: 'PREPARANDO' }),
    ...overrides,
  };
}

describe('updatePedidoStatus service', () => {
  it('should throw NotFoundError when the pedido does not exist', async () => {
    const ports = makePorts({ findPedidoById: vi.fn().mockResolvedValue(null) });

    await expect(updatePedidoStatus(999, { status: 'PREPARANDO' }, ports)).rejects.toThrow(NotFoundError);
    expect(ports.updatePedidoStatus).not.toHaveBeenCalled();
  });

  it.each([
    ['CONFIRMADO', 'PREPARANDO'],
    ['PREPARANDO', 'ENTREGUE'],
  ])('should allow transition from %s to %s', async (status, nextStatus) => {
    const ports = makePorts({ findPedidoById: vi.fn().mockResolvedValue({ id: 1, status }) });

    await updatePedidoStatus(1, { status: nextStatus as never }, ports);

    expect(ports.updatePedidoStatus).toHaveBeenCalledWith(1, nextStatus);
  });

  it.each([
    ['CONFIRMADO', 'ENTREGUE'],
    ['ENTREGUE', 'PREPARANDO'],
    ['ENTREGUE', 'CANCELADO'],
    ['CANCELADO', 'CONFIRMADO'],
    ['CANCELADO', 'PREPARANDO'],
  ])('should throw ConflictError for invalid transition from %s to %s', async (status, nextStatus) => {
    const ports = makePorts({ findPedidoById: vi.fn().mockResolvedValue({ id: 1, status }) });

    await expect(updatePedidoStatus(1, { status: nextStatus as never }, ports)).rejects.toThrow(ConflictError);
    expect(ports.updatePedidoStatus).not.toHaveBeenCalled();
  });

  it.each(['CONFIRMADO', 'PREPARANDO'])('should cancel a pedido %s when there is no pagamento', async (status) => {
    const ports = makePorts({
      findPedidoById: vi.fn().mockResolvedValue({ id: 1, status }),
      updatePedidoStatus: vi.fn().mockResolvedValue({ id: 1, status: 'CANCELADO' }),
    });

    await updatePedidoStatus(1, { status: 'CANCELADO' }, ports);

    expect(ports.updatePedidoStatus).toHaveBeenCalledWith(1, 'CANCELADO');
  });

  it.each(['CONFIRMADO', 'PREPARANDO'])('should cancel a pedido %s when the pagamento is PENDENTE', async (status) => {
    const ports = makePorts({
      findPedidoById: vi.fn().mockResolvedValue({ id: 1, status }),
      findPagamentoByPedidoId: vi.fn().mockResolvedValue({ status: 'PENDENTE' }),
      updatePedidoStatus: vi.fn().mockResolvedValue({ id: 1, status: 'CANCELADO' }),
    });

    await updatePedidoStatus(1, { status: 'CANCELADO' }, ports);

    expect(ports.updatePedidoStatus).toHaveBeenCalledWith(1, 'CANCELADO');
  });

  it('should throw ConflictError and not persist when canceling a pedido with pagamento PAGO', async () => {
    const ports = makePorts({ findPagamentoByPedidoId: vi.fn().mockResolvedValue({ status: 'PAGO' }) });

    await expect(updatePedidoStatus(1, { status: 'CANCELADO' }, ports)).rejects.toThrow(
      'Estorne o pagamento antes de cancelar o pedido.',
    );
    expect(ports.updatePedidoStatus).not.toHaveBeenCalled();
  });

  it('should not check the pagamento for non-CANCELADO transitions', async () => {
    const ports = makePorts();

    await updatePedidoStatus(1, { status: 'PREPARANDO' }, ports);

    expect(ports.findPagamentoByPedidoId).not.toHaveBeenCalled();
  });
});
