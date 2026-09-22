import { buildPaginatedResult } from '@/shared/types/pagination';
import { ListPedidosDTO } from '@/modules/pedidos/dtos/list-pedidos/list-pedidos.types';
import { listPedidos as listPedidosRepository } from '@/modules/pedidos/repositories/pedido.repository';

export async function listPedidos(query: ListPedidosDTO) {
  const { data, total } = await listPedidosRepository(query);
  return buildPaginatedResult(data, total, query.page, query.pageSize);
}
