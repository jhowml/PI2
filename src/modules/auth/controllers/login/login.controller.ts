import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { loginSchema } from '../../dtos/login/login.dto';
import { env } from '@/config/env';
import { UnauthorizedError } from '@/shared/errors/AppError';

export async function loginController(req: Request, res: Response, next: NextFunction) {
  try {
    const { username, password } = loginSchema.parse(req.body);

    if (username !== env.APP_USERNAME || password !== env.APP_PASSWORD) {
      throw new UnauthorizedError('Credenciais inválidas.');
    }

    const token = jwt.sign({ sub: username }, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    });

    res.json({ token });
  } catch (err) {
    next(err);
  }
}
