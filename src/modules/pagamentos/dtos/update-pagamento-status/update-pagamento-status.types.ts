import { z } from 'zod';
import { updatePagamentoStatusParamsSchema, updatePagamentoStatusBodySchema } from './update-pagamento-status.dto';

export type UpdatePagamentoStatusParamsDTO = z.infer<typeof updatePagamentoStatusParamsSchema>;
export type UpdatePagamentoStatusBodyDTO = z.infer<typeof updatePagamentoStatusBodySchema>;
