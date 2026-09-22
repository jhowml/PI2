import { z } from 'zod';
import { createPedidoSchema } from './create-pedido.dto';
import { PedidoWithRelations } from '@/modules/pedidos/dtos/list-pedidos/list-pedidos.types';

export type CreatePedidoDTO = z.infer<typeof createPedidoSchema>;
export type CreatePedidoResult = PedidoWithRelations;
