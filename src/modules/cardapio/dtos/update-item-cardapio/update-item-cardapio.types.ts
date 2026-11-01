import { Cardapio } from '@prisma/client';
import { z } from 'zod';
import { updateItemCardapioBodySchema, updateItemCardapioParamsSchema } from './update-item-cardapio.dto';

export type UpdateItemCardapioParamsDTO = z.infer<typeof updateItemCardapioParamsSchema>;
export type UpdateItemCardapioBodyDTO = z.infer<typeof updateItemCardapioBodySchema>;
export type UpdateItemCardapioResult = Cardapio;
