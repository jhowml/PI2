import { findPagamentoByPedidoId } from '@/modules/pagamentos/repositories/pagamento.repository';
import { findPedidoById, updatePedidoStatus as updatePedidoStatusRepository } from '@/modules/pedidos/repositories/pedido.repository';
import type { UpdatePedidoStatusBodyDTO } from '@/modules/pedidos/dtos/update-pedido-status/update-pedido-status.types';
import { updatePedidoStatus as updatePedidoStatusService } from '@/modules/pedidos/services/update-pedido-status/update-pedido-status.service';
import type { UpdatePedidoStatusPorts } from './pedido-status-update.ports';

const updatePedidoStatusPorts: UpdatePedidoStatusPorts = {
  findPedidoById,
  findPagamentoByPedidoId,
  updatePedidoStatus: updatePedidoStatusRepository,
};

export async function updatePedidoStatus(id: number, body: UpdatePedidoStatusBodyDTO) {
  return updatePedidoStatusService(id, body, updatePedidoStatusPorts);
}
