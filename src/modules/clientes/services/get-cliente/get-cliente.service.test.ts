import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getCliente } from './get-cliente.service';
import { NotFoundError } from '@/shared/errors/AppError';

vi.mock('../../repositories/cliente.repository', () => ({
  findClienteById: vi.fn(),
}));

import { findClienteById } from '../../repositories/cliente.repository';

const fakeCliente = {
  id: 3,
  nome: 'Ana Paula Ferreira',
  telefone: '1333551020',
  obs: null,
  cep: '11410000',
  logradouro: 'Avenida Marechal Deodoro da Fonseca',
  numero: '88',
  complemento: null,
  bairro: 'Pitangueiras',
  cidade: 'Guarujá',
  uf: 'SP',
  createdAt: new Date('2026-09-01'),
};

describe('getCliente service', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('should return the cliente when it exists', async () => {
    vi.mocked(findClienteById).mockResolvedValue(fakeCliente);

    const result = await getCliente(3);

    expect(findClienteById).toHaveBeenCalledWith(3);
    expect(result).toEqual(fakeCliente);
  });

  it('should throw NotFoundError when the cliente does not exist', async () => {
    vi.mocked(findClienteById).mockResolvedValue(null);

    await expect(getCliente(999)).rejects.toThrow(NotFoundError);
  });
});
