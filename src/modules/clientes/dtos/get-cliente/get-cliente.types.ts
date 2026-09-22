import { Cliente } from '@prisma/client';
import { z } from 'zod';
import { getClienteParamsSchema } from './get-cliente.dto';

export type GetClienteDTO = z.infer<typeof getClienteParamsSchema>;
export type GetClienteResult = Cliente;
