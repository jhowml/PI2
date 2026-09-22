import { z } from 'zod';

const itemPedidoSchema = z.object({
  cardapioId: z.number().int().positive(),
  quantidade: z.number().int().positive().max(999),
});

export const createPedidoSchema = z.object({
  clienteId: z.number().int().positive(),
  itens: z
    .array(itemPedidoSchema)
    .min(1)
    .max(100)
    .refine(
      (itens) => new Set(itens.map((item) => item.cardapioId)).size === itens.length,
      'Cada item do cardápio deve aparecer uma única vez; ajuste a quantidade.',
    ),
  obs: z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    z.string().trim().max(255).optional(),
  ),
});
