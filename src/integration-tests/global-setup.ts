import { execSync } from 'node:child_process';

/**
 * Runs once, before any integration test file. Applies migrations to
 * TEST_DATABASE_URL so the schema is up to date; refuses to run without it
 * to avoid ever touching a real database by accident.
 */
export default function setup() {
  if (!process.env.TEST_DATABASE_URL) {
    throw new Error(
      'Defina TEST_DATABASE_URL para rodar os testes de integração (veja a seção "Testes de integração" no README).',
    );
  }

  execSync('npx prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: process.env.TEST_DATABASE_URL },
    stdio: 'inherit',
  });
}
