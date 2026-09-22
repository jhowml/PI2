import { buildPaginatedResult } from '@/shared/types/pagination';
import { ListClientesDTO } from '@/modules/clientes/dtos/list-clientes/list-clientes.types';
import { listClientes as listClientesRepository } from '@/modules/clientes/repositories/cliente.repository';

export async function listClientes(query: ListClientesDTO) {
  const { data, total } = await listClientesRepository(query);
  return buildPaginatedResult(data, total, query.page, query.pageSize);
}
