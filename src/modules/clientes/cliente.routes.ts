import { Router } from 'express';
import { listClientesController } from './controllers/list-clientes/list-clientes.controller';
import { createClienteController } from './controllers/create-cliente/create-cliente.controller';
import { getClienteController } from './controllers/get-cliente/get-cliente.controller';

const router = Router();

router.get('/', listClientesController);
router.post('/', createClienteController);
router.get('/:id', getClienteController);

export default router;
