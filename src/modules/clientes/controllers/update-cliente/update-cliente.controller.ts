import { NextFunction, Request, Response } from 'express';
import { updateClienteBodySchema, updateClienteParamsSchema } from '../../dtos/update-cliente/update-cliente.dto';
import { updateCliente } from '../../services/update-cliente/update-cliente.service';

export async function updateClienteController(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = updateClienteParamsSchema.parse(req.params);
    const body = updateClienteBodySchema.parse(req.body);
    const result = await updateCliente(id, body);
    res.json(result);
  } catch (err) {
    next(err);
  }
}
