import { NextFunction, Request, Response } from 'express';
import { updatePedidoBodySchema, updatePedidoParamsSchema } from '../../dtos/update-pedido/update-pedido.dto';
import { updatePedido } from '@/composition/pedido-update';

export async function updatePedidoController(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = updatePedidoParamsSchema.parse(req.params);
    const body = updatePedidoBodySchema.parse(req.body);
    const result = await updatePedido(id, body);
    res.json(result);
  } catch (err) {
    next(err);
  }
}
