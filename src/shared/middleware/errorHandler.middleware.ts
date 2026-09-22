import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../errors/AppError';
import { logger } from '../../config/logger';

type ErrorBody = { code: string; message: string; fields?: Record<string, unknown> };
type ResolvedError = { status: number; body: ErrorBody };

function resolve(err: Error): ResolvedError {
  if (err instanceof AppError) {
    return { status: err.statusCode, body: { code: err.code ?? 'ERROR', message: err.message } };
  }

  if (err instanceof ZodError) {
    return {
      status: 422,
      body: { code: 'VALIDATION_ERROR', message: 'Dados inválidos.', fields: err.flatten().fieldErrors },
    };
  }

  return { status: 500, body: { code: 'INTERNAL_ERROR', message: 'Erro interno do servidor.' } };
}

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  if (!(err instanceof AppError) && !(err instanceof ZodError)) {
    logger.error({ err }, err.name);
  }

  const { status, body } = resolve(err);
  res.status(status).json({ error: body });
}
