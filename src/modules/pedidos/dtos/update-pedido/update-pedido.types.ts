import { z } from 'zod';
import { updatePedidoBodySchema, updatePedidoParamsSchema } from './update-pedido.dto';

export type UpdatePedidoParamsDTO = z.infer<typeof updatePedidoParamsSchema>;
export type UpdatePedidoBodyDTO = z.infer<typeof updatePedidoBodySchema>;
