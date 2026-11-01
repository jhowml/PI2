import { Prisma } from '@prisma/client';
import { ConflictError, NotFoundError } from '@/shared/errors/AppError';

export type ItemPedidoDTO = {
  cardapioId: number;
  quantidade: number;
};

export type CardapioItemDisponivel = {
  id: number;
  nome: string;
  preco: Prisma.Decimal.Value;
  disponivel: boolean;
};

export function resolveItensPedido(itensDto: ItemPedidoDTO[], itensCardapio: CardapioItemDisponivel[]) {
  const itensCardapioById = new Map(itensCardapio.map((itemCardapio) => [itemCardapio.id, itemCardapio]));

  return itensDto.map((item) => {
    const itemCardapio = itensCardapioById.get(item.cardapioId);
    if (!itemCardapio) throw new NotFoundError(`Item do cardápio (id ${item.cardapioId})`);
    if (!itemCardapio.disponivel) {
      throw new ConflictError(`O item "${itemCardapio.nome}" está indisponível no cardápio.`);
    }

    return {
      cardapioId: item.cardapioId,
      quantidade: item.quantidade,
      precoUnitario: new Prisma.Decimal(itemCardapio.preco),
    };
  });
}
