import { Router } from 'express';
import { getDashboardController } from './controllers/get-dashboard/get-dashboard.controller';

const router = Router();

router.get('/', getDashboardController);

export default router;
