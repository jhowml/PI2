import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getPagamento } from './get-pagamento.service';
import { NotFoundError } from '@/shared/errors/AppError';

vi.mock('@/modules/pagamentos/repositories/pagamento.repository', () => ({
  findPagamentoByPedidoId: vi.fn(),
}));

import { findPagamentoByPedidoId } from '@/modules/pagamentos/repositories/pagamento.repository';

describe('getPagamento service', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('should return the pagamento when it exists', async () => {
    const fakePagamento = { pedidoId: 7, forma: 'PIX', status: 'PENDENTE' };
    vi.mocked(findPagamentoByPedidoId).mockResolvedValue(fakePagamento as never);

    const result = await getPagamento(7);

    expect(findPagamentoByPedidoId).toHaveBeenCalledWith(7);
    expect(result).toEqual(fakePagamento);
  });

  it('should throw NotFoundError when the pedido has no pagamento registered', async () => {
    vi.mocked(findPagamentoByPedidoId).mockResolvedValue(null);

    await expect(getPagamento(999)).rejects.toThrow(NotFoundError);
  });
});
