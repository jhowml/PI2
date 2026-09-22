import { NextFunction, Request, Response } from 'express';
import { getCepParamsSchema } from '../../dtos/get-cep/get-cep.dto';
import { getCep } from '../../services/get-cep/get-cep.service';

export async function getCepController(req: Request, res: Response, next: NextFunction) {
  try {
    const { cep } = getCepParamsSchema.parse(req.params);
    const result = await getCep(cep);
    res.json(result);
  } catch (err) {
    next(err);
  }
}
