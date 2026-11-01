import { z } from 'zod';

export const updatePedidoStatusParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const updatePedidoStatusBodySchema = z.object({
  status: z.enum(['PREPARANDO', 'ENTREGUE', 'CANCELADO']),
});
