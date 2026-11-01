import { z } from 'zod';

export const getDashboardQuerySchema = z
  .object({
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
  })
  .refine((query) => !query.from || !query.to || query.from <= query.to, {
    message: '"from" deve ser anterior ou igual a "to".',
    path: ['from'],
  });
