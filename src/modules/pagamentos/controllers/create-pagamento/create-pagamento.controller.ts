import { NextFunction, Request, Response } from 'express';
import { createPagamentoSchema } from '../../dtos/create-pagamento/create-pagamento.dto';
import { createPagamento } from '@/composition/pagamento-creation';

export async function createPagamentoController(req: Request, res: Response, next: NextFunction) {
  try {
    const body = createPagamentoSchema.parse(req.body);
    const result = await createPagamento(body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}
