import { z } from 'zod';
import { updatePagamentoFormaBodySchema, updatePagamentoFormaParamsSchema } from './update-pagamento-forma.dto';

export type UpdatePagamentoFormaParamsDTO = z.infer<typeof updatePagamentoFormaParamsSchema>;
export type UpdatePagamentoFormaBodyDTO = z.infer<typeof updatePagamentoFormaBodySchema>;
