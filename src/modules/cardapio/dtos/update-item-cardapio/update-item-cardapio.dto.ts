import { z } from 'zod';
import { createItemCardapioSchema } from '@/modules/cardapio/dtos/create-item-cardapio/create-item-cardapio.dto';

export const updateItemCardapioParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const updateItemCardapioBodySchema = createItemCardapioSchema;
