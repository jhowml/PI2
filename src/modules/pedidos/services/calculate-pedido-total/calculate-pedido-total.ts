import { Prisma } from '@prisma/client';
import { InvalidDescontoError } from '@/shared/errors/AppError';

export type PedidoTotalItem = {
  quantidade: number;
  precoUnitario: Prisma.Decimal.Value;
};

export function calculatePedidoTotal(
  itens: PedidoTotalItem[],
  taxaEntrega: Prisma.Decimal.Value,
  desconto: Prisma.Decimal.Value,
): Prisma.Decimal {
  const subtotal = itens.reduce(
    (total, item) => total.plus(new Prisma.Decimal(item.precoUnitario).times(item.quantidade)),
    new Prisma.Decimal(0),
  );

  const valorTotal = subtotal.plus(taxaEntrega).minus(desconto);
  if (valorTotal.isNegative()) throw new InvalidDescontoError();

  return valorTotal;
}
