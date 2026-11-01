import { NextFunction, Request, Response } from 'express';
import { getDashboardQuerySchema } from '../../dtos/get-dashboard/get-dashboard.dto';
import { getDashboard } from '../../services/get-dashboard/get-dashboard.service';

export async function getDashboardController(req: Request, res: Response, next: NextFunction) {
  try {
    const query = getDashboardQuerySchema.parse(req.query);
    const result = await getDashboard(query);
    res.json(result);
  } catch (err) {
    next(err);
  }
}
