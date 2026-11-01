import { Prisma, StatusPedido } from '@prisma/client';
import type { UpdatePedidoBodyDTO } from '@/modules/pedidos/dtos/update-pedido/update-pedido.types';
import type { UpdatePedidoPorts } from '@/composition/pedido-update.ports';
import { calculatePedidoTotal } from '@/modules/pedidos/services/calculate-pedido-total/calculate-pedido-total';
import { resolveItensPedido } from '@/modules/pedidos/services/resolve-itens-pedido/resolve-itens-pedido';
import { ConflictError, NotFoundError } from '@/shared/errors/AppError';

const EDITABLE_STATUSES: StatusPedido[] = [StatusPedido.CONFIRMADO];

export async function updatePedido(id: number, dto: UpdatePedidoBodyDTO, ports: UpdatePedidoPorts) {
  const { findPedidoById, findCardapioItensByIds, updatePedido: updatePedidoRepository } = ports;

  const pedidoAtual = await findPedidoById(id);
  if (!pedidoAtual) throw new NotFoundError('Pedido');

  if (!EDITABLE_STATUSES.includes(pedidoAtual.status)) {
    throw new ConflictError(`Pedidos com status ${pedidoAtual.status} não podem ser editados.`);
  }

  const itensCardapio = await findCardapioItensByIds(dto.itens.map((item) => item.cardapioId));
  const itens = resolveItensPedido(dto.itens, itensCardapio);

  const taxaEntrega = new Prisma.Decimal(dto.taxaEntrega);
  const desconto = new Prisma.Decimal(dto.desconto);
  const valorTotal = calculatePedidoTotal(itens, taxaEntrega, desconto);

  return updatePedidoRepository(id, {
    tipoEntrega: dto.tipoEntrega,
    taxaEntrega,
    desconto,
    valorTotal,
    obs: dto.obs,
    itens,
  });
}
