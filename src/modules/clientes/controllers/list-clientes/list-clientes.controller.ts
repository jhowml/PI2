import { NextFunction, Request, Response } from 'express';
import { listClientesSchema } from '../../dtos/list-clientes/list-clientes.dto';
import { listClientes } from '../../services/list-clientes/list-clientes.service';

export async function listClientesController(req: Request, res: Response, next: NextFunction) {
  try {
    const query = listClientesSchema.parse(req.query);
    const result = await listClientes(query);
    res.json(result);
  } catch (err) {
    next(err);
  }
}
