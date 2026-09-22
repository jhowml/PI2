import { Prisma } from '@prisma/client';
import type { CreatePedidoDTO } from '@/modules/pedidos/dtos/create-pedido/create-pedido.types';
import type { CreatePedidoPorts } from '@/composition/pedido-creation.ports';
import { calculatePedidoTotal } from '@/modules/pedidos/services/calculate-pedido-total/calculate-pedido-total';
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

  const taxaEntrega = new Prisma.Decimal(dto.taxaEntrega);
  const desconto = new Prisma.Decimal(dto.desconto);
  const valorTotal = calculatePedidoTotal(itens, taxaEntrega, desconto);

  return insertPedido({
    clienteId: dto.clienteId,
    tipoEntrega: dto.tipoEntrega,
    taxaEntrega,
    desconto,
    valorTotal,
    obs: dto.obs,
    itens,
  });
}
