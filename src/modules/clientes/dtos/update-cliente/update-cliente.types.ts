import { Cliente } from '@prisma/client';
import { z } from 'zod';
import { updateClienteBodySchema, updateClienteParamsSchema } from './update-cliente.dto';

export type UpdateClienteParamsDTO = z.infer<typeof updateClienteParamsSchema>;
export type UpdateClienteBodyDTO = z.infer<typeof updateClienteBodySchema>;
export type UpdateClienteResult = Cliente;
