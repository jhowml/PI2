import { FormaPagamento, Prisma, StatusPedido } from '@prisma/client';
import {
  countPagamentosPorForma,
  countPedidosPorStatus,
  findItensMaisVendidos,
  findPedidosFaturamento,
  type DashboardRange,
} from '@/modules/dashboard/repositories/dashboard.repository';

const TOP_ITENS_LIMIT = 5;

const DIAS_SEMANA = ['DOMINGO', 'SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA', 'SABADO'] as const;
type DiaSemana = (typeof DIAS_SEMANA)[number];
const ORDEM_SEMANA: DiaSemana[] = ['SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA', 'SABADO', 'DOMINGO'];

function toDayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function toDiaSemana(date: Date): DiaSemana {
  return DIAS_SEMANA[date.getUTCDay()];
}

export async function getDashboard(range: DashboardRange) {
  const [pedidos, statusGroups, itensMaisVendidos, formaGroups] = await Promise.all([
    findPedidosFaturamento(range),
    countPedidosPorStatus(range),
    findItensMaisVendidos(range, TOP_ITENS_LIMIT),
    countPagamentosPorForma(range),
  ]);

  const porDia = new Map<string, { pedidos: number; faturamento: Prisma.Decimal }>();
  for (const pedido of pedidos) {
    const key = toDayKey(pedido.dataPedido);
    const atual = porDia.get(key) ?? { pedidos: 0, faturamento: new Prisma.Decimal(0) };
    atual.pedidos += 1;
    atual.faturamento = atual.faturamento.plus(pedido.valorTotal);
    porDia.set(key, atual);
  }

  const faturamentoPorPeriodo = [...porDia.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([data, resumo]) => ({ data, pedidos: resumo.pedidos, faturamento: resumo.faturamento }));

  const porDiaSemana = new Map<DiaSemana, { pedidos: number; faturamento: Prisma.Decimal }>();
  for (const pedido of pedidos) {
    const diaSemana = toDiaSemana(pedido.dataPedido);
    const atual = porDiaSemana.get(diaSemana) ?? { pedidos: 0, faturamento: new Prisma.Decimal(0) };
    atual.pedidos += 1;
    atual.faturamento = atual.faturamento.plus(pedido.valorTotal);
    porDiaSemana.set(diaSemana, atual);
  }

  const vendasPorDiaSemana = ORDEM_SEMANA.map((diaSemana) => {
    const resumo = porDiaSemana.get(diaSemana) ?? { pedidos: 0, faturamento: new Prisma.Decimal(0) };
    const ticketMedio = resumo.pedidos > 0 ? resumo.faturamento.dividedBy(resumo.pedidos) : new Prisma.Decimal(0);
    return { diaSemana, pedidos: resumo.pedidos, faturamento: resumo.faturamento, ticketMedio };
  });

  const formaGroupByForma = new Map(formaGroups.map((group) => [group.forma, group]));
  const pagamentosPorForma = Object.values(FormaPagamento).map((forma) => {
    const group = formaGroupByForma.get(forma);
    return {
      forma,
      quantidade: group?._count._all ?? 0,
      valor: group?._sum.valor ?? new Prisma.Decimal(0),
    };
  });

  const faturamentoTotal = pedidos.reduce((total, pedido) => total.plus(pedido.valorTotal), new Prisma.Decimal(0));
  const ticketMedio = pedidos.length > 0 ? faturamentoTotal.dividedBy(pedidos.length) : new Prisma.Decimal(0);

  const pedidosPorStatus = Object.fromEntries(
    Object.values(StatusPedido).map((status) => [status, 0]),
  ) as Record<StatusPedido, number>;
  for (const group of statusGroups) {
    pedidosPorStatus[group.status] = group._count._all;
  }

  return {
    faturamentoTotal,
    ticketMedio,
    faturamentoPorPeriodo,
    vendasPorDiaSemana,
    pedidosPorStatus,
    itensMaisVendidos,
    pagamentosPorForma,
  };
}
