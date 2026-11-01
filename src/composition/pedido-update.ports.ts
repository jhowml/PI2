import { findCardapioItensByIds } from '@/modules/cardapio/repositories/cardapio.repository';
import { findPedidoById, updatePedido } from '@/modules/pedidos/repositories/pedido.repository';

export type UpdatePedidoPorts = {
  findPedidoById: typeof findPedidoById;
  findCardapioItensByIds: typeof findCardapioItensByIds;
  updatePedido: typeof updatePedido;
};
