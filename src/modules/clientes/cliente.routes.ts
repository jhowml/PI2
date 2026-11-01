import { Router } from 'express';
import { listClientesController } from './controllers/list-clientes/list-clientes.controller';
import { createClienteController } from './controllers/create-cliente/create-cliente.controller';
import { getClienteController } from './controllers/get-cliente/get-cliente.controller';
import { updateClienteController } from './controllers/update-cliente/update-cliente.controller';

const router = Router();

router.get('/', listClientesController);
router.post('/', createClienteController);
router.get('/:id', getClienteController);
router.patch('/:id', updateClienteController);

export default router;
