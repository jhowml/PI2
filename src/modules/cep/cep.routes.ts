import { Router } from 'express';
import { getCepController } from './controllers/get-cep/get-cep.controller';

const router = Router();

router.get('/:cep', getCepController);

export default router;
