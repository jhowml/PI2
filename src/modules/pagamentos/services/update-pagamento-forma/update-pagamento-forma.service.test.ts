import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updatePagamentoForma } from './update-pagamento-forma.service';
import { NotFoundError } from '@/shared/errors/AppError';

vi.mock('@/modules/pagamentos/repositories/pagamento.repository', () => ({
  findPagamentoByPedidoId: vi.fn(),
  updatePagamentoForma: vi.fn(),
}));

import {
  findPagamentoByPedidoId,
  updatePagamentoForma as updatePagamentoFormaRepo,
} from '@/modules/pagamentos/repositories/pagamento.repository';

describe('updatePagamentoForma service', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('should throw NotFoundError when the pedido has no pagamento registered', async () => {
    vi.mocked(findPagamentoByPedidoId).mockResolvedValue(null);

    await expect(updatePagamentoForma(999, { forma: 'PIX' })).rejects.toThrow(NotFoundError);
    expect(updatePagamentoFormaRepo).not.toHaveBeenCalled();
  });

  it('should update and return the pagamento with the new forma', async () => {
    vi.mocked(findPagamentoByPedidoId).mockResolvedValue({ pedidoId: 7, forma: 'DINHEIRO', status: 'PENDENTE' } as never);
    vi.mocked(updatePagamentoFormaRepo).mockResolvedValue({ pedidoId: 7, forma: 'PIX', status: 'PENDENTE' } as never);

    const result = await updatePagamentoForma(7, { forma: 'PIX' });

    expect(updatePagamentoFormaRepo).toHaveBeenCalledWith(7, 'PIX');
    expect(result).toEqual({ pedidoId: 7, forma: 'PIX', status: 'PENDENTE' });
  });
});
