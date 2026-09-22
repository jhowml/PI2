import { Cliente } from '@prisma/client';
import { z } from 'zod';
import { createClienteSchema } from './create-cliente.dto';

export type CreateClienteDTO = z.infer<typeof createClienteSchema>;
export type CreateClienteResult = Cliente;
