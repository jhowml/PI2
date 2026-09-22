import { z } from 'zod';

export const createItemCardapioSchema = z.object({
  nome: z.string().trim().min(1).max(100),
  descricao: z.string().trim().max(255).optional(),
  preco: z.number().positive().multipleOf(0.01).max(99_999_999.99),
  categoria: z.string().trim().min(1).max(50),
  disponivel: z.boolean().default(true),
});
