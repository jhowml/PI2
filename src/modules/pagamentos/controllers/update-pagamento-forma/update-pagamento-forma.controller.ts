import { NextFunction, Request, Response } from 'express';
import {
  updatePagamentoFormaBodySchema,
  updatePagamentoFormaParamsSchema,
} from '../../dtos/update-pagamento-forma/update-pagamento-forma.dto';
import { updatePagamentoForma } from '../../services/update-pagamento-forma/update-pagamento-forma.service';

export async function updatePagamentoFormaController(req: Request, res: Response, next: NextFunction) {
  try {
    const { pedidoId } = updatePagamentoFormaParamsSchema.parse(req.params);
    const body = updatePagamentoFormaBodySchema.parse(req.body);
    const result = await updatePagamentoForma(pedidoId, body);
    res.json(result);
  } catch (err) {
    next(err);
  }
}
