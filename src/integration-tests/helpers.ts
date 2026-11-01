import request from 'supertest';
import { app } from '@/app';
import { env } from '@/config/env';

export function api() {
  return request(app);
}

export async function loginToken() {
  const response = await request(app)
    .post('/api/auth/login')
    .send({ username: env.APP_USERNAME, password: env.APP_PASSWORD });

  return response.body.token as string;
}

export async function authHeader() {
  return `Bearer ${await loginToken()}`;
}
