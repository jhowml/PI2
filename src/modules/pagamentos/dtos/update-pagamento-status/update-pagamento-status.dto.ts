import { z } from 'zod';

export const updatePagamentoStatusParamsSchema = z.object({
  pedidoId: z.coerce.number().int().positive(),
});

export const updatePagamentoStatusBodySchema = z.object({
  status: z.enum(['PAGO', 'ESTORNADO']),
});
