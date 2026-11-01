import { z } from 'zod';
import { createPagamentoSchema } from './create-pagamento.dto';

export type CreatePagamentoDTO = z.infer<typeof createPagamentoSchema>;
