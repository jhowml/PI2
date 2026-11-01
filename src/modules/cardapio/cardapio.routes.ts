import { Router } from 'express';
import { listCardapioController } from './controllers/list-cardapio/list-cardapio.controller';
import { createItemCardapioController } from './controllers/create-item-cardapio/create-item-cardapio.controller';
import { updateItemCardapioController } from './controllers/update-item-cardapio/update-item-cardapio.controller';

const router = Router();

router.get('/', listCardapioController);
router.post('/', createItemCardapioController);
router.patch('/:id', updateItemCardapioController);

export default router;
