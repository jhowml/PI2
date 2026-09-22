import { z } from 'zod';
import { buildDatabaseUrl } from './buildDatabaseUrl';

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().url().optional(),
  ALLOWED_ORIGINS: z.string().default('http://localhost:3000,http://localhost:3001'),
  DB_HOST: z.string().optional(),
  DB_PORT: z.coerce.number().default(5432),
  DB_USER: z.string().optional(),
  DB_PASSWORD: z.string().optional(),
  DB_NAME: z.string().optional(),
  JWT_SECRET: z.string().min(10),
  JWT_EXPIRES_IN: z.string().default('7d'),
  APP_USERNAME: z.string().min(1),
  APP_PASSWORD: z.string().min(1),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

const data = parsed.data;

function resolveDatabaseUrl(): string {
  if (data.DATABASE_URL) return data.DATABASE_URL;

  const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = data;
  if (DB_HOST && DB_USER && DB_NAME) {
    return buildDatabaseUrl({ host: DB_HOST, port: DB_PORT, user: DB_USER, password: DB_PASSWORD ?? '', database: DB_NAME });
  }

  console.error('Set DATABASE_URL or DB_HOST + DB_USER + DB_PASSWORD + DB_NAME');
  process.exit(1);
}

export const env = {
  ...data,
  databaseUrl: resolveDatabaseUrl(),
};
