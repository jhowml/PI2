import { CreateClienteDTO } from '@/modules/clientes/dtos/create-cliente/create-cliente.types';
import { createCliente as createClienteRepository } from '@/modules/clientes/repositories/cliente.repository';

export async function createCliente(data: CreateClienteDTO) {
  return createClienteRepository(data);
}
