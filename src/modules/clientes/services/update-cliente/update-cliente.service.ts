import { UpdateClienteBodyDTO } from '@/modules/clientes/dtos/update-cliente/update-cliente.types';
import { findClienteById, updateCliente as updateClienteRepository } from '@/modules/clientes/repositories/cliente.repository';
import { NotFoundError } from '@/shared/errors/AppError';

export async function updateCliente(id: number, data: UpdateClienteBodyDTO) {
  const cliente = await findClienteById(id);
  if (!cliente) throw new NotFoundError('Cliente');

  return updateClienteRepository(id, data);
}
