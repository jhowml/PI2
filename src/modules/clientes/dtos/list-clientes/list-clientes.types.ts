import { Cliente } from '@prisma/client';
import { z } from 'zod';
import { PaginatedResult } from '@/shared/types/pagination';
import { listClientesSchema } from './list-clientes.dto';

export type ListClientesDTO = z.infer<typeof listClientesSchema>;
export type ListClientesResult = PaginatedResult<Cliente>;
