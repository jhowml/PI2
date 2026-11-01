import { findPagamentoByPedidoId } from '@/modules/pagamentos/repositories/pagamento.repository';
import { findPedidoById, updatePedidoStatus } from '@/modules/pedidos/repositories/pedido.repository';

export type UpdatePedidoStatusPorts = {
  findPedidoById: typeof findPedidoById;
  findPagamentoByPedidoId: typeof findPagamentoByPedidoId;
  updatePedidoStatus: typeof updatePedidoStatus;
};
