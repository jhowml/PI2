import { findPedidoById } from '@/modules/pedidos/repositories/pedido.repository';
import {
  findPagamentoByPedidoId,
  updatePagamentoStatus as updatePagamentoStatusRepository,
} from '@/modules/pagamentos/repositories/pagamento.repository';
import type { UpdatePagamentoStatusBodyDTO } from '@/modules/pagamentos/dtos/update-pagamento-status/update-pagamento-status.types';
import { updatePagamentoStatus as updatePagamentoStatusService } from '@/modules/pagamentos/services/update-pagamento-status/update-pagamento-status.service';
import type { UpdatePagamentoStatusPorts } from './pagamento-status-update.ports';

const updatePagamentoStatusPorts: UpdatePagamentoStatusPorts = {
  findPedidoById,
  findPagamentoByPedidoId,
  updatePagamentoStatus: updatePagamentoStatusRepository,
};

export async function updatePagamentoStatus(pedidoId: number, body: UpdatePagamentoStatusBodyDTO) {
  return updatePagamentoStatusService(pedidoId, body, updatePagamentoStatusPorts);
}
