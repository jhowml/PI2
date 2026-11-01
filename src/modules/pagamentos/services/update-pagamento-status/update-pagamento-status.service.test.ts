import { describe, it, expect, vi } from 'vitest';
import { updatePagamentoStatus } from './update-pagamento-status.service';
import { ConflictError, NotFoundError } from '@/shared/errors/AppError';
import type { UpdatePagamentoStatusPorts } from '@/composition/pagamento-status-update.ports';

function makePorts(overrides: Partial<UpdatePagamentoStatusPorts> = {}): UpdatePagamentoStatusPorts {
  return {
    findPedidoById: vi.fn().mockResolvedValue({ id: 7, status: 'ENTREGUE' }),
    findPagamentoByPedidoId: vi.fn().mockResolvedValue(null),
    updatePagamentoStatus: vi.fn().mockResolvedValue({ pedidoId: 7, status: 'PAGO' }),
    ...overrides,
  };
}

describe('updatePagamentoStatus service', () => {
  it('should throw NotFoundError when the pedido has no pagamento registered', async () => {
    const ports = makePorts({ findPagamentoByPedidoId: vi.fn().mockResolvedValue(null) });

    await expect(updatePagamentoStatus(999, { status: 'PAGO' }, ports)).rejects.toThrow(NotFoundError);
    expect(ports.updatePagamentoStatus).not.toHaveBeenCalled();
  });

  it('should move PENDENTE to PAGO and set dataPagamento to now', async () => {
    const ports = makePorts({
      findPagamentoByPedidoId: vi.fn().mockResolvedValue({ pedidoId: 7, status: 'PENDENTE', dataPagamento: null }),
    });

    await updatePagamentoStatus(7, { status: 'PAGO' }, ports);

    expect(ports.updatePagamentoStatus).toHaveBeenCalledWith(7, 'PAGO', expect.any(Date));
    expect(ports.findPedidoById).not.toHaveBeenCalled();
  });

  it('should move PAGO to ESTORNADO and keep the original dataPagamento', async () => {
    const dataPagamento = new Date('2026-10-01T12:00:00Z');
    const ports = makePorts({
      findPagamentoByPedidoId: vi.fn().mockResolvedValue({ pedidoId: 7, status: 'PAGO', dataPagamento }),
    });

    await updatePagamentoStatus(7, { status: 'ESTORNADO' }, ports);

    expect(ports.updatePagamentoStatus).toHaveBeenCalledWith(7, 'ESTORNADO', dataPagamento);
  });

  it('should throw ConflictError when trying to go from PENDENTE to ESTORNADO', async () => {
    const ports = makePorts({
      findPagamentoByPedidoId: vi.fn().mockResolvedValue({ pedidoId: 7, status: 'PENDENTE', dataPagamento: null }),
    });

    await expect(updatePagamentoStatus(7, { status: 'ESTORNADO' }, ports)).rejects.toThrow(ConflictError);
    expect(ports.updatePagamentoStatus).not.toHaveBeenCalled();
  });

  it('should move ESTORNADO back to PAGO and refresh dataPagamento when the pedido is not CANCELADO', async () => {
    const ports = makePorts({
      findPedidoById: vi.fn().mockResolvedValue({ id: 7, status: 'ENTREGUE' }),
      findPagamentoByPedidoId: vi.fn().mockResolvedValue({
        pedidoId: 7,
        status: 'ESTORNADO',
        dataPagamento: new Date('2026-10-01T12:00:00Z'),
      }),
    });

    await updatePagamentoStatus(7, { status: 'PAGO' }, ports);

    expect(ports.updatePagamentoStatus).toHaveBeenCalledWith(7, 'PAGO', expect.any(Date));
  });

  it('should throw ConflictError when trying to go from ESTORNADO to ESTORNADO', async () => {
    const ports = makePorts({
      findPagamentoByPedidoId: vi.fn().mockResolvedValue({ pedidoId: 7, status: 'ESTORNADO', dataPagamento: new Date() }),
    });

    await expect(updatePagamentoStatus(7, { status: 'ESTORNADO' }, ports)).rejects.toThrow(ConflictError);
    expect(ports.updatePagamentoStatus).not.toHaveBeenCalled();
  });

  it('should throw ConflictError when trying to pay again a CANCELADO pedido after an estorno', async () => {
    const ports = makePorts({
      findPedidoById: vi.fn().mockResolvedValue({ id: 7, status: 'CANCELADO' }),
      findPagamentoByPedidoId: vi.fn().mockResolvedValue({
        pedidoId: 7,
        status: 'ESTORNADO',
        dataPagamento: new Date('2026-10-01T12:00:00Z'),
      }),
    });

    await expect(updatePagamentoStatus(7, { status: 'PAGO' }, ports)).rejects.toThrow(
      'Não é possível pagar novamente um pedido cancelado.',
    );
    expect(ports.updatePagamentoStatus).not.toHaveBeenCalled();
  });
});
