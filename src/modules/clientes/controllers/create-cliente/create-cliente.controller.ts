import { NextFunction, Request, Response } from 'express';
import { createClienteSchema } from '../../dtos/create-cliente/create-cliente.dto';
import { createCliente } from '../../services/create-cliente/create-cliente.service';

export async function createClienteController(req: Request, res: Response, next: NextFunction) {
  try {
    const body = createClienteSchema.parse(req.body);
    const result = await createCliente(body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}
