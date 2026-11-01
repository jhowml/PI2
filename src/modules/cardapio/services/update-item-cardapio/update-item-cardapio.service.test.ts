import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updateItemCardapio } from './update-item-cardapio.service';
import { NotFoundError } from '@/shared/errors/AppError';

vi.mock('@/modules/cardapio/repositories/cardapio.repository', () => ({
  findCardapioItemById: vi.fn(),
  updateItemCardapio: vi.fn(),
}));

import {
  findCardapioItemById,
  updateItemCardapio as updateItemCardapioRepository,
} from '@/modules/cardapio/repositories/cardapio.repository';

const validBody = { nome: 'Frango grelhado', preco: 34.9, categoria: 'Pratos', disponivel: true };

describe('updateItemCardapio service', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('should throw NotFoundError when the item does not exist or was soft-deleted', async () => {
    vi.mocked(findCardapioItemById).mockResolvedValue(null);

    await expect(updateItemCardapio(999, validBody as never)).rejects.toThrow(NotFoundError);
    expect(updateItemCardapioRepository).not.toHaveBeenCalled();
  });

  it('should update and return the item', async () => {
    vi.mocked(findCardapioItemById).mockResolvedValue({ id: 1 } as never);
    vi.mocked(updateItemCardapioRepository).mockResolvedValue({ id: 1, ...validBody } as never);

    const result = await updateItemCardapio(1, validBody as never);

    expect(updateItemCardapioRepository).toHaveBeenCalledWith(1, validBody);
    expect(result).toEqual({ id: 1, ...validBody });
  });
});
