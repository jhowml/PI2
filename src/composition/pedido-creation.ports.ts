import { findClienteById } from '@/modules/clientes/repositories/cliente.repository';
import { findCardapioItensByIds } from '@/modules/cardapio/repositories/cardapio.repository';
import { insertPedido } from '@/modules/pedidos/repositories/pedido.repository';

export type CreatePedidoPorts = {
  findClienteById: typeof findClienteById;
  findCardapioItensByIds: typeof findCardapioItensByIds;
  insertPedido: typeof insertPedido;
};
