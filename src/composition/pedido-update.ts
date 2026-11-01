import { findCardapioItensByIds } from '@/modules/cardapio/repositories/cardapio.repository';
import { findPagamentoByPedidoId } from '@/modules/pagamentos/repositories/pagamento.repository';
import { findPedidoById, updatePedido as updatePedidoRepository } from '@/modules/pedidos/repositories/pedido.repository';
import type { UpdatePedidoBodyDTO } from '@/modules/pedidos/dtos/update-pedido/update-pedido.types';
import { updatePedido as updatePedidoService } from '@/modules/pedidos/services/update-pedido/update-pedido.service';
import type { UpdatePedidoPorts } from './pedido-update.ports';

const updatePedidoPorts: UpdatePedidoPorts = {
  findPedidoById,
  findCardapioItensByIds,
  findPagamentoByPedidoId,
  updatePedido: updatePedidoRepository,
};

export async function updatePedido(id: number, dto: UpdatePedidoBodyDTO) {
  return updatePedidoService(id, dto, updatePedidoPorts);
}
