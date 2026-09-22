import { NextFunction, Request, Response } from 'express';
import { createPedidoSchema } from '../../dtos/create-pedido/create-pedido.dto';
import { createPedido } from '@/composition/pedido-creation';

export async function createPedidoController(req: Request, res: Response, next: NextFunction) {
  try {
    const body = createPedidoSchema.parse(req.body);
    const result = await createPedido(body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}
