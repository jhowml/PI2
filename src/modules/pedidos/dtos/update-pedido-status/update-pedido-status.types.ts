import { z } from 'zod';
import { updatePedidoStatusBodySchema, updatePedidoStatusParamsSchema } from './update-pedido-status.dto';

export type UpdatePedidoStatusParamsDTO = z.infer<typeof updatePedidoStatusParamsSchema>;
export type UpdatePedidoStatusBodyDTO = z.infer<typeof updatePedidoStatusBodySchema>;
