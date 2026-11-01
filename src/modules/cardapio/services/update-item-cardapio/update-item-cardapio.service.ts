import { UpdateItemCardapioBodyDTO } from '@/modules/cardapio/dtos/update-item-cardapio/update-item-cardapio.types';
import {
  findCardapioItemById,
  updateItemCardapio as updateItemCardapioRepository,
} from '@/modules/cardapio/repositories/cardapio.repository';
import { NotFoundError } from '@/shared/errors/AppError';

export async function updateItemCardapio(id: number, data: UpdateItemCardapioBodyDTO) {
  const item = await findCardapioItemById(id);
  if (!item) throw new NotFoundError('Item do cardápio');

  return updateItemCardapioRepository(id, data);
}
