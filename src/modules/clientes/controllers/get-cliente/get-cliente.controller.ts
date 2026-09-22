import { NextFunction, Request, Response } from 'express';
import { getClienteParamsSchema } from '../../dtos/get-cliente/get-cliente.dto';
import { getCliente } from '../../services/get-cliente/get-cliente.service';

export async function getClienteController(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = getClienteParamsSchema.parse(req.params);
    const result = await getCliente(id);
    res.json(result);
  } catch (err) {
    next(err);
  }
}
