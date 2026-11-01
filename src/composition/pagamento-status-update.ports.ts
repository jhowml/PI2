import { findPedidoById } from '@/modules/pedidos/repositories/pedido.repository';
import {
  findPagamentoByPedidoId,
  updatePagamentoStatus,
} from '@/modules/pagamentos/repositories/pagamento.repository';

export type UpdatePagamentoStatusPorts = {
  findPedidoById: typeof findPedidoById;
  findPagamentoByPedidoId: typeof findPagamentoByPedidoId;
  updatePagamentoStatus: typeof updatePagamentoStatus;
};
