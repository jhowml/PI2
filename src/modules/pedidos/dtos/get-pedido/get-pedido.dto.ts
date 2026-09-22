import { z } from 'zod';

export const getPedidoParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});
