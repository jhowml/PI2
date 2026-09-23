import { Prisma } from '@prisma/client';
import { prisma } from '@/config/database';
import { paginate } from '@/shared/types/pagination';
import { ListClientesDTO } from '@/modules/clientes/dtos/list-clientes/list-clientes.types';
import { CreateClienteDTO } from '@/modules/clientes/dtos/create-cliente/create-cliente.types';

const TEXT_SEARCH_FIELDS = ['nome', 'logradouro', 'numero', 'complemento', 'bairro', 'cidade'] as const;
const DIGIT_SEARCH_FIELDS = ['telefone', 'cep'] as const;

export function buildClienteSearchWhere(search?: string): Prisma.ClienteWhereInput {
  const terms = search?.split(/[\s,]+/).filter(Boolean) ?? [];
  if (terms.length === 0) return {};

  return {
    AND: terms.map((term) => {
      const digits = term.replace(/\D/g, '');
      return {
        OR: [
          ...TEXT_SEARCH_FIELDS.map((field) => ({ [field]: { contains: term, mode: 'insensitive' as const } })),
          ...(digits ? DIGIT_SEARCH_FIELDS.map((field) => ({ [field]: { contains: digits } })) : []),
        ],
      };
    }),
  };
}

export async function listClientes(query: ListClientesDTO) {
  const { take, skip } = paginate(query.page, query.pageSize);
  const where = buildClienteSearchWhere(query.search);

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
