import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getCep } from './get-cep.service';
import { NotFoundError, ServiceUnavailableError } from '@/shared/errors/AppError';

vi.mock('../../gateways/viacep.gateway', () => ({
  fetchEnderecoByCep: vi.fn(),
}));

import { fetchEnderecoByCep } from '../../gateways/viacep.gateway';

describe('getCep service', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('should return the endereco mapped to the API shape', async () => {
    vi.mocked(fetchEnderecoByCep).mockResolvedValue({
      cep: '11440-000',
      logradouro: 'Avenida Dom Pedro I',
      bairro: 'Enseada',
      localidade: 'Guarujá',
      uf: 'SP',
    });

    const result = await getCep('11440000');

    expect(fetchEnderecoByCep).toHaveBeenCalledWith('11440000');
    expect(result).toEqual({
      cep: '11440000',
      logradouro: 'Avenida Dom Pedro I',
      bairro: 'Enseada',
      cidade: 'Guarujá',
      uf: 'SP',
    });
  });

  it('should throw NotFoundError when the cep does not exist', async () => {
    vi.mocked(fetchEnderecoByCep).mockResolvedValue(null);

    await expect(getCep('99999999')).rejects.toThrow(NotFoundError);
  });

  it('should propagate gateway errors', async () => {
    vi.mocked(fetchEnderecoByCep).mockRejectedValue(new ServiceUnavailableError());

    await expect(getCep('11440000')).rejects.toThrow(ServiceUnavailableError);
  });
});
