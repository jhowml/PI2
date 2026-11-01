import { NextFunction, Request, Response } from 'express';
import {
  updatePedidoStatusBodySchema,
  updatePedidoStatusParamsSchema,
} from '../../dtos/update-pedido-status/update-pedido-status.dto';
import { updatePedidoStatus } from '../../services/update-pedido-status/update-pedido-status.service';

export async function updatePedidoStatusController(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = updatePedidoStatusParamsSchema.parse(req.params);
    const body = updatePedidoStatusBodySchema.parse(req.body);
    const result = await updatePedidoStatus(id, body);
    res.json(result);
  } catch (err) {
    next(err);
  }
}
