import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Prisma } from '@prisma/client';
import { listCardapio } from './list-cardapio.service';

vi.mock('../../repositories/cardapio.repository', () => ({
  listCardapio: vi.fn(),
}));

import { listCardapio as listCardapioRepository } from '../../repositories/cardapio.repository';

const fakeItem = {
  id: 1,
  nome: 'Picanha na chapa',
  descricao: 'Picanha fatiada com arroz, farofa e vinagrete',
  preco: new Prisma.Decimal('69.90'),
  categoria: 'Pratos',
  disponivel: true,
  createdAt: new Date('2026-09-01'),
  deletedAt: null,
};

describe('listCardapio service', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('should return a paginated list of cardapio items', async () => {
    vi.mocked(listCardapioRepository).mockResolvedValue({ data: [fakeItem], total: 1 });

    const result = await listCardapio({ page: 1, pageSize: 20 });

    expect(result.data).toEqual([fakeItem]);
    expect(result.meta.total).toBe(1);
    expect(result.meta.totalPages).toBe(1);
    expect(result.meta.hasNextPage).toBe(false);
    expect(result.meta.hasPreviousPage).toBe(false);
  });

  it('should return an empty list when there are no items', async () => {
    vi.mocked(listCardapioRepository).mockResolvedValue({ data: [], total: 0 });

    const result = await listCardapio({ page: 1, pageSize: 20 });

    expect(result.data).toHaveLength(0);
    expect(result.meta.total).toBe(0);
    expect(result.meta.totalPages).toBe(0);
  });

  it('should pass search to the repository', async () => {
    vi.mocked(listCardapioRepository).mockResolvedValue({ data: [fakeItem], total: 1 });

    await listCardapio({ page: 1, pageSize: 20, search: 'picanha' });

    expect(listCardapioRepository).toHaveBeenCalledWith({ page: 1, pageSize: 20, search: 'picanha' });
  });

  it('should set hasNextPage to true when there are more pages', async () => {
    vi.mocked(listCardapioRepository).mockResolvedValue({ data: [], total: 25 });

    const result = await listCardapio({ page: 1, pageSize: 20 });

    expect(result.meta.hasNextPage).toBe(true);
    expect(result.meta.hasPreviousPage).toBe(false);
  });

  it('should set hasPreviousPage to true when not on the first page', async () => {
    vi.mocked(listCardapioRepository).mockResolvedValue({ data: [], total: 25 });

    const result = await listCardapio({ page: 2, pageSize: 20 });

    expect(result.meta.hasPreviousPage).toBe(true);
    expect(result.meta.hasNextPage).toBe(false);
  });
});
