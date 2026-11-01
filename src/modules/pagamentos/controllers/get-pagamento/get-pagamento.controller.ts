import { NextFunction, Request, Response } from 'express';
import { getPagamentoParamsSchema } from '../../dtos/get-pagamento/get-pagamento.dto';
import { getPagamento } from '../../services/get-pagamento/get-pagamento.service';

export async function getPagamentoController(req: Request, res: Response, next: NextFunction) {
  try {
    const { pedidoId } = getPagamentoParamsSchema.parse(req.params);
    const result = await getPagamento(pedidoId);
    res.json(result);
  } catch (err) {
    next(err);
  }
}
