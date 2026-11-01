import { findCardapioItensByIds } from '@/modules/cardapio/repositories/cardapio.repository';
import { findPagamentoByPedidoId } from '@/modules/pagamentos/repositories/pagamento.repository';
import { findPedidoById, updatePedido } from '@/modules/pedidos/repositories/pedido.repository';

export type UpdatePedidoPorts = {
  findPedidoById: typeof findPedidoById;
  findCardapioItensByIds: typeof findCardapioItensByIds;
  findPagamentoByPedidoId: typeof findPagamentoByPedidoId;
  updatePedido: typeof updatePedido;
};
