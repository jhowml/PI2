import { z } from 'zod';

export const getClienteParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});
