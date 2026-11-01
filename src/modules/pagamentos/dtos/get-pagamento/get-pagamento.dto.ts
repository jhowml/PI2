import { z } from 'zod';

export const getPagamentoParamsSchema = z.object({
  pedidoId: z.coerce.number().int().positive(),
});
