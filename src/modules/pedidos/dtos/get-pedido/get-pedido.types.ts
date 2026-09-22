import { z } from 'zod';
import { getPedidoParamsSchema } from './get-pedido.dto';
import { PedidoWithRelations } from '@/modules/pedidos/dtos/list-pedidos/list-pedidos.types';

export type GetPedidoDTO = z.infer<typeof getPedidoParamsSchema>;
export type GetPedidoResult = PedidoWithRelations;
