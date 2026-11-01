import { NextFunction, Request, Response } from 'express';
import {
  updatePagamentoStatusParamsSchema,
  updatePagamentoStatusBodySchema,
} from '../../dtos/update-pagamento-status/update-pagamento-status.dto';
import { updatePagamentoStatus } from '../../services/update-pagamento-status/update-pagamento-status.service';

export async function updatePagamentoStatusController(req: Request, res: Response, next: NextFunction) {
  try {
    const { pedidoId } = updatePagamentoStatusParamsSchema.parse(req.params);
    const body = updatePagamentoStatusBodySchema.parse(req.body);
    const result = await updatePagamentoStatus(pedidoId, body);
    res.json(result);
  } catch (err) {
    next(err);
  }
}
