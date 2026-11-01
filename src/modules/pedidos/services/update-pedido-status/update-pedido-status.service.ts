import { StatusPedido } from '@prisma/client';
import { ConflictError, NotFoundError } from '@/shared/errors/AppError';
import {
  findPedidoById,
  updatePedidoStatus as updatePedidoStatusRepository,
} from '@/modules/pedidos/repositories/pedido.repository';
import type { UpdatePedidoStatusBodyDTO } from '@/modules/pedidos/dtos/update-pedido-status/update-pedido-status.types';

const ALLOWED_TRANSITIONS: Record<StatusPedido, StatusPedido[]> = {
  CONFIRMADO: [StatusPedido.PREPARANDO, StatusPedido.CANCELADO],
  PREPARANDO: [StatusPedido.ENTREGUE, StatusPedido.CANCELADO],
  ENTREGUE: [],
  CANCELADO: [],
};

export async function updatePedidoStatus(id: number, body: UpdatePedidoStatusBodyDTO) {
  const pedido = await findPedidoById(id);
  if (!pedido) throw new NotFoundError('Pedido');

  if (!ALLOWED_TRANSITIONS[pedido.status].includes(body.status)) {
    throw new ConflictError(`Não é possível alterar o pedido de ${pedido.status} para ${body.status}.`);
  }

  return updatePedidoStatusRepository(id, body.status);
}
