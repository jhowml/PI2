import { describe, it, expect, vi } from 'vitest';
import { Prisma } from '@prisma/client';
import { createPagamento } from './create-pagamento.service';
import { ConflictError, NotFoundError } from '@/shared/errors/AppError';
import type { CreatePagamentoPorts } from '@/composition/pagamento-creation.ports';
import type { CreatePagamentoDTO } from '@/modules/pagamentos/dtos/create-pagamento/create-pagamento.types';

const fakePedido = {
  id: 7,
  status: 'CONFIRMADO',
  valorTotal: new Prisma.Decimal('39.00'),
};

function makePorts(overrides: Partial<CreatePagamentoPorts> = {}): CreatePagamentoPorts {
  return {
    findPedidoById: vi.fn().mockResolvedValue(fakePedido),
    findPagamentoByPedidoId: vi.fn().mockResolvedValue(null),
    insertPagamento: vi.fn().mockResolvedValue({ pedidoId: 7, forma: 'PIX', status: 'PENDENTE' }),
    ...overrides,
  };
}

const validDto: CreatePagamentoDTO = {
  pedidoId: 7,
  forma: 'PIX',
};

describe('createPagamento service', () => {
  it('should throw NotFoundError when the pedido does not exist', async () => {
    const ports = makePorts({ findPedidoById: vi.fn().mockResolvedValue(null) });

    await expect(createPagamento(validDto, ports)).rejects.toThrow(NotFoundError);
    expect(ports.findPagamentoByPedidoId).not.toHaveBeenCalled();
    expect(ports.insertPagamento).not.toHaveBeenCalled();
  });

  it('should throw ConflictError when the pedido is CANCELADO', async () => {
    const ports = makePorts({ findPedidoById: vi.fn().mockResolvedValue({ ...fakePedido, status: 'CANCELADO' }) });

    await expect(createPagamento(validDto, ports)).rejects.toThrow(ConflictError);
    expect(ports.insertPagamento).not.toHaveBeenCalled();
  });

  it('should throw ConflictError when the pedido already has a pagamento', async () => {
    const ports = makePorts({
      findPagamentoByPedidoId: vi.fn().mockResolvedValue({ pedidoId: 7, forma: 'DINHEIRO', status: 'PAGO' }),
    });

    await expect(createPagamento(validDto, ports)).rejects.toThrow(ConflictError);
    expect(ports.insertPagamento).not.toHaveBeenCalled();
  });

  it('should take valor from the pedido valorTotal, not from the request', async () => {
    const ports = makePorts();

    await createPagamento({ ...validDto, valor: 0.01 } as CreatePagamentoDTO, ports);

    const input = vi.mocked(ports.insertPagamento).mock.calls[0][0];
    expect(input.valor.toFixed(2)).toBe('39.00');
    expect(input.pedidoId).toBe(7);
    expect(input.forma).toBe('PIX');
  });

  it('should return the created pagamento', async () => {
    const ports = makePorts({ insertPagamento: vi.fn().mockResolvedValue({ pedidoId: 7, forma: 'PIX', status: 'PENDENTE' }) });

    const result = await createPagamento(validDto, ports);

    expect(result).toEqual({ pedidoId: 7, forma: 'PIX', status: 'PENDENTE' });
  });
});
