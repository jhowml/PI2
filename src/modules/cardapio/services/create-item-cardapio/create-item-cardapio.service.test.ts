import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Prisma } from '@prisma/client';
import { createItemCardapio } from './create-item-cardapio.service';

vi.mock('../../repositories/cardapio.repository', () => ({
  createItemCardapio: vi.fn(),
}));

import { createItemCardapio as createItemCardapioRepository } from '../../repositories/cardapio.repository';

const validDTO = {
  nome: 'Isca de peixe',
  descricao: 'Porção com limão',
  preco: 48,
  categoria: 'Porções',
  disponivel: true,
};

const fakeItem = {
  id: 1,
  ...validDTO,
  preco: new Prisma.Decimal('48.00'),
  createdAt: new Date('2026-09-01'),
  deletedAt: null,
};

describe('createItemCardapio service', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('should return the created item', async () => {
    vi.mocked(createItemCardapioRepository).mockResolvedValue(fakeItem);

    const result = await createItemCardapio(validDTO);

    expect(result).toEqual(fakeItem);
    expect(createItemCardapioRepository).toHaveBeenCalledWith(validDTO);
  });

  it('should propagate repository errors', async () => {
    vi.mocked(createItemCardapioRepository).mockRejectedValue(new Error('db error'));

    await expect(createItemCardapio(validDTO)).rejects.toThrow('db error');
  });
});
