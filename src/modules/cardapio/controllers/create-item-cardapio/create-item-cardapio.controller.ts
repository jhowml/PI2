import { NextFunction, Request, Response } from 'express';
import { createItemCardapioSchema } from '../../dtos/create-item-cardapio/create-item-cardapio.dto';
import { createItemCardapio } from '../../services/create-item-cardapio/create-item-cardapio.service';

export async function createItemCardapioController(req: Request, res: Response, next: NextFunction) {
  try {
    const body = createItemCardapioSchema.parse(req.body);
    const result = await createItemCardapio(body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}
