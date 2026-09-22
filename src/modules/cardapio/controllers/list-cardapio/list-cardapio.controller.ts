import { NextFunction, Request, Response } from 'express';
import { listCardapioSchema } from '../../dtos/list-cardapio/list-cardapio.dto';
import { listCardapio } from '../../services/list-cardapio/list-cardapio.service';

export async function listCardapioController(req: Request, res: Response, next: NextFunction) {
  try {
    const query = listCardapioSchema.parse(req.query);
    const result = await listCardapio(query);
    res.json(result);
  } catch (err) {
    next(err);
  }
}
