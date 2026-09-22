import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getPedido } from './get-pedido.service';
import { NotFoundError } from '@/shared/errors/AppError';

vi.mock('../../repositories/pedido.repository', () => ({
  findPedidoById: vi.fn(),
}));

import { findPedidoById } from '../../repositories/pedido.repository';

describe('getPedido service', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('should return the pedido when it exists', async () => {
    const fakePedido = { id: 7, status: 'PENDENTE', itens: [] };
    vi.mocked(findPedidoById).mockResolvedValue(fakePedido as never);

    const result = await getPedido(7);

    expect(findPedidoById).toHaveBeenCalledWith(7);
    expect(result).toEqual(fakePedido);
  });

  it('should throw NotFoundError when the pedido does not exist', async () => {
    vi.mocked(findPedidoById).mockResolvedValue(null);

    await expect(getPedido(999)).rejects.toThrow(NotFoundError);
  });
});
