import { z } from 'zod';
import { TipoEntrega } from '@prisma/client';
import { itemPedidoSchema, moneySchema } from '@/modules/pedidos/dtos/create-pedido/create-pedido.dto';

export const updatePedidoParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const updatePedidoBodySchema = z
  .object({
    tipoEntrega: z.nativeEnum(TipoEntrega),
    taxaEntrega: moneySchema.default(0),
    desconto: moneySchema.default(0),
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
  })
  .superRefine((pedido, ctx) => {
    if (pedido.tipoEntrega === TipoEntrega.RETIRADA && pedido.taxaEntrega !== 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['taxaEntrega'],
        message: 'Pedidos para retirada não têm taxa de entrega.',
      });
    }
  });
