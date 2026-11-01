import { Prisma, StatusPagamento, StatusPedido } from '@prisma/client';
import { prisma } from '@/config/database';

export type DashboardRange = { from?: Date; to?: Date };

function buildDateFilter({ from, to }: DashboardRange): Prisma.DateTimeFilter | undefined {
  if (!from && !to) return undefined;
  return { ...(from && { gte: from }), ...(to && { lte: to }) };
}

export async function findPedidosFaturamento(range: DashboardRange) {
  const dataPedido = buildDateFilter(range);

  return prisma.pedido.findMany({
    where: { status: { not: StatusPedido.CANCELADO }, ...(dataPedido && { dataPedido }) },
    select: { dataPedido: true, valorTotal: true },
    orderBy: { dataPedido: 'asc' },
  });
}

export async function countPedidosPorStatus(range: DashboardRange) {
  const dataPedido = buildDateFilter(range);

  return prisma.pedido.groupBy({
    by: ['status'],
    where: dataPedido ? { dataPedido } : undefined,
    _count: { _all: true },
  });
}

export async function findItensMaisVendidos(range: DashboardRange, limit: number) {
  const dataPedido = buildDateFilter(range);

  const grouped = await prisma.itemPedido.groupBy({
    by: ['cardapioId'],
    where: {
      pedido: { status: { not: StatusPedido.CANCELADO }, ...(dataPedido && { dataPedido }) },
    },
    _sum: { quantidade: true },
    orderBy: { _sum: { quantidade: 'desc' } },
    take: limit,
  });

  const cardapioIds = grouped.map((item) => item.cardapioId);
  const itensCardapio = await prisma.cardapio.findMany({ where: { id: { in: cardapioIds } } });
  const itensCardapioById = new Map(itensCardapio.map((item) => [item.id, item]));

  return grouped.map((item) => ({
    cardapioId: item.cardapioId,
    nome: itensCardapioById.get(item.cardapioId)?.nome ?? 'Item removido',
    quantidade: item._sum.quantidade ?? 0,
  }));
}

export async function countPagamentosPorForma(range: DashboardRange) {
  const dataPedido = buildDateFilter(range);

  return prisma.pagamento.groupBy({
    by: ['forma'],
    where: {
      status: StatusPagamento.PAGO,
      ...(dataPedido && { pedido: { dataPedido } }),
    },
    _count: { _all: true },
    _sum: { valor: true },
  });
}
