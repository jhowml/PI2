import { Prisma, FormaPagamento, StatusPagamento } from '@prisma/client';
import { prisma } from '@/config/database';

export async function findPagamentoByPedidoId(pedidoId: number) {
  return prisma.pagamento.findUnique({ where: { pedidoId } });
}

export type PagamentoInsertInput = {
  pedidoId: number;
  forma: FormaPagamento;
  valor: Prisma.Decimal;
};

export async function insertPagamento(input: PagamentoInsertInput) {
  return prisma.pagamento.create({ data: input });
}

export async function updatePagamentoStatus(pedidoId: number, status: StatusPagamento, dataPagamento: Date | null) {
  return prisma.pagamento.update({ where: { pedidoId }, data: { status, dataPagamento } });
}

export async function updatePagamentoForma(pedidoId: number, forma: FormaPagamento) {
  return prisma.pagamento.update({ where: { pedidoId }, data: { forma } });
}
