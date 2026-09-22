import { buildPaginatedResult } from '@/shared/types/pagination';
import { ListCardapioDTO } from '@/modules/cardapio/dtos/list-cardapio/list-cardapio.types';
import { listCardapio as listCardapioRepository } from '@/modules/cardapio/repositories/cardapio.repository';

export async function listCardapio(query: ListCardapioDTO) {
  const { data, total } = await listCardapioRepository(query);
  return buildPaginatedResult(data, total, query.page, query.pageSize);
}
