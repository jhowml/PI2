import { z } from 'zod';
import { getPagamentoParamsSchema } from './get-pagamento.dto';

export type GetPagamentoDTO = z.infer<typeof getPagamentoParamsSchema>;
