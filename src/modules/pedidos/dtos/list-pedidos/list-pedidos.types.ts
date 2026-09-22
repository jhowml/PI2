import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { PaginatedResult } from '@/shared/types/pagination';
import { listPedidosSchema } from './list-pedidos.dto';

export type ListPedidosDTO = z.infer<typeof listPedidosSchema>;
export type PedidoWithRelations = Prisma.PedidoGetPayload<{
  include: { cliente: true; itens: { include: { cardapio: true } } };
}>;
export type ListPedidosResult = PaginatedResult<PedidoWithRelations>;
