import { Router } from 'express';
import { listPedidosController } from './controllers/list-pedidos/list-pedidos.controller';
import { createPedidoController } from './controllers/create-pedido/create-pedido.controller';
import { getPedidoController } from './controllers/get-pedido/get-pedido.controller';
import { updatePedidoController } from './controllers/update-pedido/update-pedido.controller';
import { updatePedidoStatusController } from './controllers/update-pedido-status/update-pedido-status.controller';

const router = Router();

router.get('/', listPedidosController);
router.post('/', createPedidoController);
router.get('/:id', getPedidoController);
router.patch('/:id', updatePedidoController);
router.patch('/:id/status', updatePedidoStatusController);

export default router;
