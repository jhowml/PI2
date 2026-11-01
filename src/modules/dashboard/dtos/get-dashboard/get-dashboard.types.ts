import { z } from 'zod';
import { getDashboardQuerySchema } from './get-dashboard.dto';

export type GetDashboardDTO = z.infer<typeof getDashboardQuerySchema>;
