import { Prisma } from '@prisma/client';
import type { CreatePedidoDTO } from '@/modules/pedidos/dtos/create-pedido/create-pedido.types';
import type { CreatePedidoPorts } from '@/composition/pedido-creation.ports';
import { calculatePedidoTotal } from '@/modules/pedidos/services/calculate-pedido-total/calculate-pedido-total';
import { resolveItensPedido } from '@/modules/pedidos/services/resolve-itens-pedido/resolve-itens-pedido';
import { NotFoundError } from '@/shared/errors/AppError';

export async function createPedido(dto: CreatePedidoDTO, ports: CreatePedidoPorts) {
  const { findClienteById, findCardapioItensByIds, insertPedido } = ports;

  const cliente = await findClienteById(dto.clienteId);
  if (!cliente) throw new NotFoundError('Cliente');

  const itensCardapio = await findCardapioItensByIds(dto.itens.map((item) => item.cardapioId));
  const itens = resolveItensPedido(dto.itens, itensCardapio);

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
