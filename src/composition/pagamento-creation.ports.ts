import { findPedidoById } from '@/modules/pedidos/repositories/pedido.repository';
import { findPagamentoByPedidoId, insertPagamento } from '@/modules/pagamentos/repositories/pagamento.repository';

export type CreatePagamentoPorts = {
  findPedidoById: typeof findPedidoById;
  findPagamentoByPedidoId: typeof findPagamentoByPedidoId;
  insertPagamento: typeof insertPagamento;
};
