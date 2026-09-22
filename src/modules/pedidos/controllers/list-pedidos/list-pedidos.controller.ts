import { NextFunction, Request, Response } from 'express';
import { listPedidosSchema } from '../../dtos/list-pedidos/list-pedidos.dto';
import { listPedidos } from '../../services/list-pedidos/list-pedidos.service';

export async function listPedidosController(req: Request, res: Response, next: NextFunction) {
  try {
    const query = listPedidosSchema.parse(req.query);
    const result = await listPedidos(query);
    res.json(result);
  } catch (err) {
    next(err);
  }
}
