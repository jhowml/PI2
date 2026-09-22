import { Prisma } from '@prisma/client';
import { prisma } from '@/config/database';
import { paginate } from '@/shared/types/pagination';
import { ListCardapioDTO } from '@/modules/cardapio/dtos/list-cardapio/list-cardapio.types';
import { CreateItemCardapioDTO } from '@/modules/cardapio/dtos/create-item-cardapio/create-item-cardapio.types';

export async function listCardapio(query: ListCardapioDTO) {
  const { take, skip } = paginate(query.page, query.pageSize);

  const where: Prisma.CardapioWhereInput = {
    deletedAt: null,
    ...(query.search && { nome: { contains: query.search, mode: 'insensitive' } }),
  };

  const [data, total] = await prisma.$transaction([
    prisma.cardapio.findMany({ where, take, skip, orderBy: [{ categoria: 'asc' }, { nome: 'asc' }] }),
    prisma.cardapio.count({ where }),
  ]);

  return { data, total };
}

export async function createItemCardapio(data: CreateItemCardapioDTO) {
  return prisma.cardapio.create({ data });
}
