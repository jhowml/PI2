import { Prisma, TipoEntrega } from '@prisma/client';
import { prisma } from '@/config/database';
import { paginate } from '@/shared/types/pagination';
import { ListPedidosDTO } from '@/modules/pedidos/dtos/list-pedidos/list-pedidos.types';

const pedidoInclude = {
  cliente: true,
  itens: { include: { cardapio: true } },
} satisfies Prisma.PedidoInclude;

export async function listPedidos(query: ListPedidosDTO) {
  const { take, skip } = paginate(query.page, query.pageSize);

  const where: Prisma.PedidoWhereInput = {
    ...(query.status && { status: query.status }),
  };

  const [data, total] = await prisma.$transaction([
    prisma.pedido.findMany({ where, take, skip, orderBy: { dataPedido: 'desc' }, include: pedidoInclude }),
    prisma.pedido.count({ where }),
  ]);

  return { data, total };
}

export type ItemPedidoInsertInput = {
  cardapioId: number;
  quantidade: number;
  precoUnitario: Prisma.Decimal;
};

export type PedidoInsertInput = {
  clienteId: number;
  tipoEntrega: TipoEntrega;
  taxaEntrega: Prisma.Decimal;
  desconto: Prisma.Decimal;
  valorTotal: Prisma.Decimal;
  obs?: string;
  itens: ItemPedidoInsertInput[];
};

export async function insertPedido(input: PedidoInsertInput) {
  return prisma.pedido.create({
    data: {
      clienteId: input.clienteId,
      tipoEntrega: input.tipoEntrega,
      taxaEntrega: input.taxaEntrega,
      desconto: input.desconto,
      valorTotal: input.valorTotal,
      obs: input.obs,
      itens: { create: input.itens },
    },
    include: pedidoInclude,
  });
}

export async function findPedidoById(id: number) {
  return prisma.pedido.findUnique({ where: { id }, include: pedidoInclude });
}
