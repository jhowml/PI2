import { Router } from 'express';
import { createPagamentoController } from './controllers/create-pagamento/create-pagamento.controller';
import { getPagamentoController } from './controllers/get-pagamento/get-pagamento.controller';
import { updatePagamentoStatusController } from './controllers/update-pagamento-status/update-pagamento-status.controller';
import { updatePagamentoFormaController } from './controllers/update-pagamento-forma/update-pagamento-forma.controller';

const router = Router();

router.post('/', createPagamentoController);
router.get('/:pedidoId', getPagamentoController);
router.patch('/:pedidoId', updatePagamentoStatusController);
router.patch('/:pedidoId/forma', updatePagamentoFormaController);

export default router;
