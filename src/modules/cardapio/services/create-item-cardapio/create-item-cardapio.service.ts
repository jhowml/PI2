import { CreateItemCardapioDTO } from '@/modules/cardapio/dtos/create-item-cardapio/create-item-cardapio.types';
import { createItemCardapio as createItemCardapioRepository } from '@/modules/cardapio/repositories/cardapio.repository';

export async function createItemCardapio(data: CreateItemCardapioDTO) {
  return createItemCardapioRepository(data);
}
