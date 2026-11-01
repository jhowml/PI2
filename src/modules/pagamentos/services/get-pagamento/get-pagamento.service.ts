import { NotFoundError } from '@/shared/errors/AppError';
import { findPagamentoByPedidoId } from '@/modules/pagamentos/repositories/pagamento.repository';

export async function getPagamento(pedidoId: number) {
  const pagamento = await findPagamentoByPedidoId(pedidoId);
  if (!pagamento) throw new NotFoundError('Pagamento');
  return pagamento;
}
