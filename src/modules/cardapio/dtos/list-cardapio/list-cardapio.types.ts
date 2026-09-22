import { Cardapio } from '@prisma/client';
import { z } from 'zod';
import { PaginatedResult } from '@/shared/types/pagination';
import { listCardapioSchema } from './list-cardapio.dto';

export type ListCardapioDTO = z.infer<typeof listCardapioSchema>;
export type ListCardapioResult = PaginatedResult<Cardapio>;
