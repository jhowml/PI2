import { z } from 'zod';
import { StatusPedido } from '@prisma/client';

export const listPedidosSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  status: z.nativeEnum(StatusPedido).optional(),
});
