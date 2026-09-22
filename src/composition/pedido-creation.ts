import { findClienteById } from '@/modules/clientes/repositories/cliente.repository';
import { findCardapioItensByIds } from '@/modules/cardapio/repositories/cardapio.repository';
import type { CreatePedidoDTO } from '@/modules/pedidos/dtos/create-pedido/create-pedido.types';
import { insertPedido } from '@/modules/pedidos/repositories/pedido.repository';
import { createPedido as createPedidoService } from '@/modules/pedidos/services/create-pedido/create-pedido.service';
import type { CreatePedidoPorts } from './pedido-creation.ports';

const createPedidoPorts: CreatePedidoPorts = {
  findClienteById,
  findCardapioItensByIds,
  insertPedido,
};

export async function createPedido(dto: CreatePedidoDTO) {
  return createPedidoService(dto, createPedidoPorts);
}
