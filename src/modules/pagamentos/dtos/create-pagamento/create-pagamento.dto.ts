import { z } from 'zod';
import { FormaPagamento } from '@prisma/client';

export const createPagamentoSchema = z.object({
  pedidoId: z.number().int().positive(),
  forma: z.nativeEnum(FormaPagamento),
});
