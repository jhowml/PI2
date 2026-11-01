import { NextFunction, Request, Response } from 'express';
import {
  updateItemCardapioBodySchema,
  updateItemCardapioParamsSchema,
} from '../../dtos/update-item-cardapio/update-item-cardapio.dto';
import { updateItemCardapio } from '../../services/update-item-cardapio/update-item-cardapio.service';

export async function updateItemCardapioController(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = updateItemCardapioParamsSchema.parse(req.params);
    const body = updateItemCardapioBodySchema.parse(req.body);
    const result = await updateItemCardapio(id, body);
    res.json(result);
  } catch (err) {
    next(err);
  }
}
