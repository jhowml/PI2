import { Router } from 'express';
import { listPedidosController } from './controllers/list-pedidos/list-pedidos.controller';
import { createPedidoController } from './controllers/create-pedido/create-pedido.controller';
import { getPedidoController } from './controllers/get-pedido/get-pedido.controller';

const router = Router();

router.get('/', listPedidosController);
router.post('/', createPedidoController);
router.get('/:id', getPedidoController);

export default router;
