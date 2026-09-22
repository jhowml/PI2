import { Prisma } from '@prisma/client';
import type { CreatePedidoDTO } from '@/modules/pedidos/dtos/create-pedido/create-pedido.types';
import type { CreatePedidoPorts } from '@/composition/pedido-creation.ports';
import { ConflictError, NotFoundError } from '@/shared/errors/AppError';

export async function createPedido(dto: CreatePedidoDTO, ports: CreatePedidoPorts) {
  const { findClienteById, findCardapioItensByIds, insertPedido } = ports;

  const cliente = await findClienteById(dto.clienteId);
  if (!cliente) throw new NotFoundError('Cliente');

  const itensCardapio = await findCardapioItensByIds(dto.itens.map((item) => item.cardapioId));
  const itensCardapioById = new Map(itensCardapio.map((itemCardapio) => [itemCardapio.id, itemCardapio]));

  const itens = dto.itens.map((item) => {
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

  const valorTotal = itens.reduce(
    (total, item) => total.plus(item.precoUnitario.times(item.quantidade)),
    new Prisma.Decimal(0),
  );

  return insertPedido({
    clienteId: dto.clienteId,
    valorTotal,
    obs: dto.obs,
    itens,
  });
}
