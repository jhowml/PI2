import { NextFunction, Request, Response } from 'express';
import { getPedidoParamsSchema } from '../../dtos/get-pedido/get-pedido.dto';
import { getPedido } from '../../services/get-pedido/get-pedido.service';

export async function getPedidoController(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = getPedidoParamsSchema.parse(req.params);
    const result = await getPedido(id);
    res.json(result);
  } catch (err) {
    next(err);
  }
}
