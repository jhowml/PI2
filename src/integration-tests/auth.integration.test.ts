import { describe, it, expect } from 'vitest';
import { env } from '@/config/env';
import { api } from './helpers';

describe('Autenticação (integração)', () => {
  it('should return a token for valid credentials', async () => {
    const response = await api()
      .post('/api/auth/login')
      .send({ username: env.APP_USERNAME, password: env.APP_PASSWORD });

    expect(response.status).toBe(200);
    expect(typeof response.body.token).toBe('string');
    expect(response.body.token.length).toBeGreaterThan(0);
  });

  it('should return 401 for invalid credentials', async () => {
    const response = await api().post('/api/auth/login').send({ username: 'admin', password: 'senha-errada' });

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });

  it('should return 401 without a token on a protected route', async () => {
    const response = await api().get('/api/pedidos');

    expect(response.status).toBe(401);
  });

  it('should return 401 with a malformed token on a protected route', async () => {
    const response = await api().get('/api/pedidos').set('Authorization', 'Bearer token-invalido');

    expect(response.status).toBe(401);
  });
});
