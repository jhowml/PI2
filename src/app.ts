import express from 'express';
import cors from 'cors';
import pinoHttp from 'pino-http';
import { logger } from './config/logger';
import { env } from './config/env';
import { prisma } from './config/database';
import { errorHandler } from './shared/middleware/errorHandler.middleware';
import { authenticate } from './shared/middleware/auth.middleware';
import authRoutes from './modules/auth/auth.routes';
import cardapioRoutes from './modules/cardapio/cardapio.routes';
import clienteRoutes from './modules/clientes/cliente.routes';
import cepRoutes from './modules/cep/cep.routes';

const app = express();
app.use(cors({ origin: env.ALLOWED_ORIGINS.split(',') }));
app.use(express.json());
const SENSITIVE_FIELDS = ['password', 'senha', 'token', 'authorization', 'Authorization'];

function maskFields(obj: Record<string, unknown>): Record<string, unknown> {
  if (!obj || typeof obj !== 'object') return obj;
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) =>
      SENSITIVE_FIELDS.some(f => k.toLowerCase() === f.toLowerCase())
        ? [k, '[REDACTED]']
        : [k, typeof v === 'object' && v !== null ? maskFields(v as Record<string, unknown>) : v]
    )
  );
}

app.use(pinoHttp({
  logger,
  serializers: {
    req(req) {
      return {
        method: req.method,
        url: req.url,
        body: req.raw.body ? maskFields(req.raw.body as Record<string, unknown>) : undefined,
      };
    },
    res(res) {
      return { statusCode: res.statusCode };
    },
  },
}));
app.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRawUnsafe('SELECT 1');
    res.json({ status: 'ok', db: 'ok' });
  } catch (err) {
    res.status(503).json({ status: 'error', db: 'unreachable' });
  }
});
app.use('/api/auth', authRoutes);
app.use('/api/cardapio', authenticate, cardapioRoutes);
app.use('/api/clientes', authenticate, clienteRoutes);
app.use('/api/cep', authenticate, cepRoutes);
app.use(errorHandler);
export { app };
