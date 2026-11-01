import { Prisma } from '@prisma/client';
import type { CreatePagamentoDTO } from '@/modules/pagamentos/dtos/create-pagamento/create-pagamento.types';
import type { CreatePagamentoPorts } from '@/composition/pagamento-creation.ports';
import { ConflictError, NotFoundError } from '@/shared/errors/AppError';

export async function createPagamento(dto: CreatePagamentoDTO, ports: CreatePagamentoPorts) {
  const { findPedidoById, findPagamentoByPedidoId, insertPagamento } = ports;

  const pedido = await findPedidoById(dto.pedidoId);
  if (!pedido) throw new NotFoundError('Pedido');

  if (pedido.status === 'CANCELADO') {
    throw new ConflictError('Não é possível registrar pagamento para um pedido cancelado.');
  }

  const pagamentoExistente = await findPagamentoByPedidoId(dto.pedidoId);
  if (pagamentoExistente) {
    throw new ConflictError('Este pedido já possui um pagamento registrado.');
  }

  return insertPagamento({
    pedidoId: dto.pedidoId,
    forma: dto.forma,
    valor: new Prisma.Decimal(pedido.valorTotal),
  });
}
