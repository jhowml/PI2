import { NotFoundError } from '@/shared/errors/AppError';
import {
  findPagamentoByPedidoId,
  updatePagamentoForma as updatePagamentoFormaRepo,
} from '@/modules/pagamentos/repositories/pagamento.repository';
import type { UpdatePagamentoFormaBodyDTO } from '@/modules/pagamentos/dtos/update-pagamento-forma/update-pagamento-forma.types';

export async function updatePagamentoForma(pedidoId: number, body: UpdatePagamentoFormaBodyDTO) {
  const pagamento = await findPagamentoByPedidoId(pedidoId);
  if (!pagamento) throw new NotFoundError('Pagamento');

  return updatePagamentoFormaRepo(pedidoId, body.forma);
}
