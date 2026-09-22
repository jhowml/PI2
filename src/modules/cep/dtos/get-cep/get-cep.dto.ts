import { z } from 'zod';

export const cepSchema = z
  .string()
  .trim()
  .regex(/^\d{5}-?\d{3}$/, 'CEP deve conter 8 dígitos, com ou sem hífen.')
  .transform((cep) => cep.replace('-', ''));

export const getCepParamsSchema = z.object({
  cep: cepSchema,
});
