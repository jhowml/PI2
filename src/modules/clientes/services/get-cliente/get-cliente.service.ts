import { NotFoundError } from '@/shared/errors/AppError';
import { findClienteById } from '@/modules/clientes/repositories/cliente.repository';

export async function getCliente(id: number) {
  const cliente = await findClienteById(id);
  if (!cliente) throw new NotFoundError('Cliente');
  return cliente;
}
