import { z } from 'zod';
import { createClienteSchema } from '@/modules/clientes/dtos/create-cliente/create-cliente.dto';

export const updateClienteParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const updateClienteBodySchema = createClienteSchema;
