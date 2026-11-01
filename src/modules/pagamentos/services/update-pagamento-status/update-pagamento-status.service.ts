import { StatusPagamento } from '@prisma/client';
import { ConflictError, NotFoundError } from '@/shared/errors/AppError';
import {
  findPagamentoByPedidoId,
  updatePagamentoStatus as updatePagamentoStatusRepo,
} from '@/modules/pagamentos/repositories/pagamento.repository';
import type { UpdatePagamentoStatusBodyDTO } from '@/modules/pagamentos/dtos/update-pagamento-status/update-pagamento-status.types';

const ALLOWED_TRANSITIONS: Record<StatusPagamento, StatusPagamento[]> = {
  PENDENTE: [StatusPagamento.PAGO],
  PAGO: [StatusPagamento.ESTORNADO],
  ESTORNADO: [StatusPagamento.PAGO],
};

export async function updatePagamentoStatus(pedidoId: number, body: UpdatePagamentoStatusBodyDTO) {
  const pagamento = await findPagamentoByPedidoId(pedidoId);
  if (!pagamento) throw new NotFoundError('Pagamento');

  if (!ALLOWED_TRANSITIONS[pagamento.status].includes(body.status)) {
    throw new ConflictError(`Não é possível alterar o pagamento de ${pagamento.status} para ${body.status}.`);
  }

  const dataPagamento = body.status === StatusPagamento.PAGO ? new Date() : pagamento.dataPagamento;
  return updatePagamentoStatusRepo(pedidoId, body.status, dataPagamento);
}
