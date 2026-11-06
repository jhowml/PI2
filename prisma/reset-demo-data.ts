/**
 * Apaga TODOS os dados (clientes, cardápio, pedidos, pagamentos) e recria os
 * dados de demonstração a partir do zero, usando `prisma/seed.ts` e
 * `prisma/seed-outubro.ts` — ambos já com nomes, telefones e endereços
 * inteiramente fictícios (CEP 00000-000, ruas "Exemplo"/"Modelo").
 *
 * ATENÇÃO: operação destrutiva e irreversível. Confirme que DATABASE_URL
 * aponta para o banco certo (nunca produção, a menos que seja essa a intenção)
 * antes de rodar.
 *
 * Uso: npx tsx prisma/reset-demo-data.ts
 */
import 'dotenv/config';
import { execSync } from 'node:child_process';
import { PrismaClient } from '@prisma/client';
import { buildDatabaseUrl } from '../src/config/buildDatabaseUrl';

function resolveDatabaseUrl(): string {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

  const host = process.env.DB_HOST;
  const user = process.env.DB_USER;
  const database = process.env.DB_NAME;

  if (!host || !user || !database) {
    throw new Error('Defina DATABASE_URL ou DB_HOST, DB_USER, DB_PASSWORD e DB_NAME no .env.');
  }

  return buildDatabaseUrl({
    host,
    port: Number(process.env.DB_PORT ?? 5432),
    user,
    password: process.env.DB_PASSWORD ?? '',
    database,
  });
}

const databaseUrl = resolveDatabaseUrl();
const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });

async function main() {
  console.log(`Apagando todos os dados de: ${databaseUrl.replace(/:[^:@]*@/, ':***@')}`);

  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE "pagamentos", "itens_pedido", "pedidos", "clientes", "cardapio" RESTART IDENTITY CASCADE',
  );
  console.log('Tabelas limpas.');
  await prisma.$disconnect();

  console.log('\nRecriando cardápio, clientes e pedidos de exemplo...');
  execSync('npx tsx prisma/seed.ts', { stdio: 'inherit', env: { ...process.env, DATABASE_URL: databaseUrl } });

  console.log('\nPopulando outubro/2026 com pedidos de demonstração...');
  execSync('npx tsx prisma/seed-outubro.ts', { stdio: 'inherit', env: { ...process.env, DATABASE_URL: databaseUrl } });

  console.log('\nConcluído: banco limpo e repovoado com dados fictícios.');
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
