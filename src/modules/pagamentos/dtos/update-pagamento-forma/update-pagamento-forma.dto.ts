import { z } from 'zod';
import { FormaPagamento } from '@prisma/client';

export const updatePagamentoFormaParamsSchema = z.object({
  pedidoId: z.coerce.number().int().positive(),
});

export const updatePagamentoFormaBodySchema = z.object({
  forma: z.nativeEnum(FormaPagamento),
});
