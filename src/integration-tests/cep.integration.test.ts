import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { api, authHeader } from './helpers';

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

const fetchMock = vi.fn();

describe('CEP (integração, ViaCEP mockado)', () => {
  let auth: string;

  beforeEach(async () => {
    auth = await authHeader();
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should return the endereço for a valid CEP', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        cep: '11410-000',
        logradouro: 'Avenida Marechal Deodoro da Fonseca',
        complemento: '',
        bairro: 'Pitangueiras',
        localidade: 'Guarujá',
        uf: 'SP',
      }),
    );

    const response = await api().get('/api/cep/11410000').set('Authorization', auth);

    expect(response.status).toBe(200);
    expect(response.body.cidade).toBe('Guarujá');
  });

  it('should return 404 for a CEP that does not exist', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ erro: true }));

    const response = await api().get('/api/cep/00000000').set('Authorization', auth);

    expect(response.status).toBe(404);
  });

  it('should return 503 when the network call fails', async () => {
    fetchMock.mockRejectedValue(new Error('network down'));

    const response = await api().get('/api/cep/11410000').set('Authorization', auth);

    expect(response.status).toBe(503);
  });
});
