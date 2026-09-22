import { z } from 'zod';
import { getCepParamsSchema } from './get-cep.dto';

export type GetCepDTO = z.infer<typeof getCepParamsSchema>;

export interface GetCepResult {
  cep: string;
  logradouro: string;
  bairro: string;
  cidade: string;
  uf: string;
}
