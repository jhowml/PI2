import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '@/config/env';
import { UnauthorizedError } from '@/shared/errors/AppError';

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return next(new UnauthorizedError());
  }

  const token = authHeader.slice(7);

  try {
    jwt.verify(token, env.JWT_SECRET);
    next();
  } catch {
    next(new UnauthorizedError());
  }
}
