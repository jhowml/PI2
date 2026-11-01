import { findPedidoById } from '@/modules/pedidos/repositories/pedido.repository';
import { findPagamentoByPedidoId, insertPagamento } from '@/modules/pagamentos/repositories/pagamento.repository';
import type { CreatePagamentoDTO } from '@/modules/pagamentos/dtos/create-pagamento/create-pagamento.types';
import { createPagamento as createPagamentoService } from '@/modules/pagamentos/services/create-pagamento/create-pagamento.service';
import type { CreatePagamentoPorts } from './pagamento-creation.ports';

const createPagamentoPorts: CreatePagamentoPorts = {
  findPedidoById,
  findPagamentoByPedidoId,
  insertPagamento,
};

export async function createPagamento(dto: CreatePagamentoDTO) {
  return createPagamentoService(dto, createPagamentoPorts);
}
