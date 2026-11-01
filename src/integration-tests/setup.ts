import 'dotenv/config';
import { afterEach, beforeAll } from 'vitest';
import { prisma } from '@/config/database';

beforeAll(() => {
  // Defense in depth: refuse to run (and never TRUNCATE) unless DATABASE_URL
  // was explicitly pointed at TEST_DATABASE_URL by the npm script.
  if (!process.env.TEST_DATABASE_URL || process.env.DATABASE_URL !== process.env.TEST_DATABASE_URL) {
    throw new Error(
      'DATABASE_URL não está apontando para TEST_DATABASE_URL — rode via "npm run test:integration", nunca direto.',
    );
  }
});

afterEach(async () => {
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE "pagamentos", "itens_pedido", "pedidos", "clientes", "cardapio" RESTART IDENTITY CASCADE',
  );
});
