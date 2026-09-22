import { z } from 'zod';
import { cepSchema } from '@/modules/cep/dtos/get-cep/get-cep.dto';

const emptyToUndefined = (value: unknown) =>
  typeof value === 'string' && value.trim() === '' ? undefined : value;

const optionalText = (max: number) =>
  z.preprocess(emptyToUndefined, z.string().trim().max(max).optional());

export const createClienteSchema = z.object({
  nome: z.string().trim().min(1).max(100),
  telefone: z
    .string()
    .transform((telefone) => telefone.replace(/\D/g, ''))
    .pipe(z.string().regex(/^\d{10,11}$/, 'Telefone deve conter DDD + número (10 ou 11 dígitos).')),
  obs: optionalText(255),
  cep: z.preprocess(emptyToUndefined, cepSchema.optional()),
  logradouro: optionalText(150),
  numero: optionalText(10),
  complemento: optionalText(60),
  bairro: optionalText(80),
  cidade: optionalText(80),
  uf: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z]{2}$/, 'UF deve conter 2 letras.')
      .optional(),
  ),
});
