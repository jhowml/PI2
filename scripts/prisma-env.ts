import 'dotenv/config';
import { spawnSync } from 'node:child_process';
import { buildDatabaseUrl } from '../src/config/buildDatabaseUrl';

if (!process.env.DATABASE_URL) {
  const host = process.env.DB_HOST;
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD ?? '';
  const database = process.env.DB_NAME;
  const port = Number(process.env.DB_PORT ?? 5432);

  if (!host || !user || !database) {
    console.error('Set DATABASE_URL or DB_HOST + DB_USER + DB_PASSWORD + DB_NAME');
    process.exit(1);
  }

  process.env.DATABASE_URL = buildDatabaseUrl({ host, port, user, password, database });
}

const prismaArgs = process.argv.slice(2);
const result = spawnSync('npx', ['prisma', ...prismaArgs], {
  stdio: 'inherit',
  env: process.env,
  shell: true,
});

process.exit(result.status ?? 1);
