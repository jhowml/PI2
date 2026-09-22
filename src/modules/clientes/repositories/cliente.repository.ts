import { Prisma } from '@prisma/client';
import { prisma } from '@/config/database';
import { paginate } from '@/shared/types/pagination';
import { ListClientesDTO } from '@/modules/clientes/dtos/list-clientes/list-clientes.types';
import { CreateClienteDTO } from '@/modules/clientes/dtos/create-cliente/create-cliente.types';

export async function listClientes(query: ListClientesDTO) {
  const { take, skip } = paginate(query.page, query.pageSize);
  const searchDigits = query.search?.replace(/\D/g, '');

  const where: Prisma.ClienteWhereInput = query.search
    ? {
        OR: [
          { nome: { contains: query.search, mode: 'insensitive' } },
          ...(searchDigits ? [{ telefone: { contains: searchDigits } }] : []),
        ],
      }
    : {};

  const [data, total] = await prisma.$transaction([
    prisma.cliente.findMany({ where, take, skip, orderBy: { nome: 'asc' } }),
    prisma.cliente.count({ where }),
  ]);

  return { data, total };
}

export async function createCliente(data: CreateClienteDTO) {
  return prisma.cliente.create({ data });
}

export async function findClienteById(id: number) {
  return prisma.cliente.findUnique({ where: { id } });
}
