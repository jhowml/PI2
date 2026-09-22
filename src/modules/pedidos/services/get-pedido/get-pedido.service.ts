import { NotFoundError } from '@/shared/errors/AppError';
import { findPedidoById } from '@/modules/pedidos/repositories/pedido.repository';

export async function getPedido(id: number) {
  const pedido = await findPedidoById(id);
  if (!pedido) throw new NotFoundError('Pedido');
  return pedido;
}
