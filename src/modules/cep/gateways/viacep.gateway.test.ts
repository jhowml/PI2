import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchEnderecoByCep } from './viacep.gateway';
import { BadGatewayError, ServiceUnavailableError } from '@/shared/errors/AppError';

const viaCepBody = {
  cep: '11410-000',
  logradouro: 'Avenida Marechal Deodoro da Fonseca',
  complemento: '',
  bairro: 'Pitangueiras',
  localidade: 'Guarujá',
  uf: 'SP',
  ibge: '3518701',
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

const fetchMock = vi.fn();

describe('fetchEnderecoByCep gateway', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should call ViaCEP with the cep and a timeout signal', async () => {
    fetchMock.mockResolvedValue(jsonResponse(viaCepBody));

    await fetchEnderecoByCep('11410000');

    expect(fetchMock).toHaveBeenCalledWith(
      'https://viacep.com.br/ws/11410000/json/',
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it('should return the endereco when ViaCEP finds the cep', async () => {
    fetchMock.mockResolvedValue(jsonResponse(viaCepBody));

    const result = await fetchEnderecoByCep('11410000');

    expect(result).toEqual({
      cep: '11410-000',
      logradouro: 'Avenida Marechal Deodoro da Fonseca',
      bairro: 'Pitangueiras',
      localidade: 'Guarujá',
      uf: 'SP',
    });
  });

  it('should return null when ViaCEP answers {"erro": true}', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ erro: true }));

    await expect(fetchEnderecoByCep('99999999')).resolves.toBeNull();
  });

  it('should return null when ViaCEP answers {"erro": "true"}', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ erro: 'true' }));

    await expect(fetchEnderecoByCep('99999999')).resolves.toBeNull();
  });

  it('should throw ServiceUnavailableError on network failure', async () => {
    fetchMock.mockRejectedValue(new TypeError('fetch failed'));

    await expect(fetchEnderecoByCep('11410000')).rejects.toThrow(ServiceUnavailableError);
  });

  it('should throw ServiceUnavailableError on timeout', async () => {
    fetchMock.mockRejectedValue(new DOMException('The operation was aborted due to timeout', 'TimeoutError'));

    await expect(fetchEnderecoByCep('11410000')).rejects.toThrow(ServiceUnavailableError);
  });

  it('should throw BadGatewayError when ViaCEP answers with an error status', async () => {
    fetchMock.mockResolvedValue(new Response('Bad Request', { status: 400 }));

    await expect(fetchEnderecoByCep('11410000')).rejects.toThrow(BadGatewayError);
  });

  it('should throw BadGatewayError when the body is not JSON', async () => {
    fetchMock.mockResolvedValue(new Response('<html>erro</html>', { status: 200 }));

    await expect(fetchEnderecoByCep('11410000')).rejects.toThrow(BadGatewayError);
  });

  it('should throw BadGatewayError when the body has an unexpected shape', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ foo: 'bar' }));

    await expect(fetchEnderecoByCep('11410000')).rejects.toThrow(BadGatewayError);
  });
});
