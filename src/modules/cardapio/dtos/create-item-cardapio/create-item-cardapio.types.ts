import { Cardapio } from '@prisma/client';
import { z } from 'zod';
import { createItemCardapioSchema } from './create-item-cardapio.dto';

export type CreateItemCardapioDTO = z.infer<typeof createItemCardapioSchema>;
export type CreateItemCardapioResult = Cardapio;
