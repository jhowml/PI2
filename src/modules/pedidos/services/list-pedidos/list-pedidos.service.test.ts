import { describe, it, expect, vi, beforeEach } from 'vitest';
import { listPedidos } from './list-pedidos.service';

vi.mock('../../repositories/pedido.repository', () => ({
  listPedidos: vi.fn(),
}));

import { listPedidos as listPedidosRepository } from '../../repositories/pedido.repository';

const fakePedido = { id: 1, status: 'PENDENTE', valorTotal: '117.70', clienteId: 1, itens: [] };

describe('listPedidos service', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('should return a paginated list of pedidos', async () => {
    vi.mocked(listPedidosRepository).mockResolvedValue({ data: [fakePedido], total: 1 } as never);

    const result = await listPedidos({ page: 1, pageSize: 20 });

    expect(result.data).toEqual([fakePedido]);
    expect(result.meta.total).toBe(1);
    expect(result.meta.totalPages).toBe(1);
    expect(result.meta.hasNextPage).toBe(false);
    expect(result.meta.hasPreviousPage).toBe(false);
  });

  it('should return an empty list when there are no pedidos', async () => {
    vi.mocked(listPedidosRepository).mockResolvedValue({ data: [], total: 0 });

    const result = await listPedidos({ page: 1, pageSize: 20 });

    expect(result.data).toHaveLength(0);
    expect(result.meta.total).toBe(0);
  });

  it('should pass the status filter to the repository', async () => {
    vi.mocked(listPedidosRepository).mockResolvedValue({ data: [], total: 0 });

    await listPedidos({ page: 1, pageSize: 20, status: 'PREPARANDO' });

    expect(listPedidosRepository).toHaveBeenCalledWith({ page: 1, pageSize: 20, status: 'PREPARANDO' });
  });

  it('should set hasNextPage and hasPreviousPage according to the page', async () => {
    vi.mocked(listPedidosRepository).mockResolvedValue({ data: [], total: 45 });

    const result = await listPedidos({ page: 2, pageSize: 20 });

    expect(result.meta.hasNextPage).toBe(true);
    expect(result.meta.hasPreviousPage).toBe(true);
  });
});
