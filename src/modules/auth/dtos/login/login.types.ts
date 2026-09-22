import { z } from 'zod';
import { loginSchema } from './login.dto';

export type LoginInput = z.infer<typeof loginSchema>;

export interface LoginResponse {
  token: string;
}
