import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createCliente } from './create-cliente.service';

vi.mock('../../repositories/cliente.repository', () => ({
  createCliente: vi.fn(),
}));

import { createCliente as createClienteRepository } from '../../repositories/cliente.repository';

const validDTO = {
  nome: 'Maria Aparecida Santos',
  telefone: '13991234567',
  cep: '11450000',
  logradouro: 'Avenida Thiago Ferreira',
  numero: '1200',
  bairro: 'Vicente de Carvalho',
  cidade: 'Guarujá',
  uf: 'SP',
};

const fakeCliente = {
  id: 1,
  ...validDTO,
  obs: null,
  complemento: null,
  createdAt: new Date('2026-09-01'),
};

describe('createCliente service', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('should call the repository with the data and return the created cliente', async () => {
    vi.mocked(createClienteRepository).mockResolvedValue(fakeCliente);

    const result = await createCliente(validDTO);

    expect(createClienteRepository).toHaveBeenCalledWith(validDTO);
    expect(result).toEqual(fakeCliente);
  });

  it('should propagate repository errors', async () => {
    vi.mocked(createClienteRepository).mockRejectedValue(new Error('db error'));

    await expect(createCliente(validDTO)).rejects.toThrow('db error');
  });
});
