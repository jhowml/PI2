import { describe, it, expect, vi, beforeEach } from 'vitest';
import { listClientes } from './list-clientes.service';

vi.mock('../../repositories/cliente.repository', () => ({
  listClientes: vi.fn(),
}));

import { listClientes as listClientesRepository } from '../../repositories/cliente.repository';

const fakeCliente = {
  id: 1,
  nome: 'Carlos Eduardo Lima',
  telefone: '13997654321',
  obs: null,
  cep: '11440000',
  logradouro: 'Avenida Dom Pedro I',
  numero: '350',
  complemento: 'Apto 42',
  bairro: 'Enseada',
  cidade: 'Guarujá',
  uf: 'SP',
  createdAt: new Date('2026-09-01'),
};

describe('listClientes service', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('should return a paginated list of clientes', async () => {
    vi.mocked(listClientesRepository).mockResolvedValue({ data: [fakeCliente], total: 1 });

    const result = await listClientes({ page: 1, pageSize: 20 });

    expect(result.data).toEqual([fakeCliente]);
    expect(result.meta.total).toBe(1);
    expect(result.meta.totalPages).toBe(1);
    expect(result.meta.hasNextPage).toBe(false);
    expect(result.meta.hasPreviousPage).toBe(false);
  });

  it('should return an empty list when there are no clientes', async () => {
    vi.mocked(listClientesRepository).mockResolvedValue({ data: [], total: 0 });

    const result = await listClientes({ page: 1, pageSize: 20 });

    expect(result.data).toHaveLength(0);
    expect(result.meta.total).toBe(0);
  });

  it('should pass search to the repository', async () => {
    vi.mocked(listClientesRepository).mockResolvedValue({ data: [fakeCliente], total: 1 });

    await listClientes({ page: 1, pageSize: 20, search: 'carlos' });

    expect(listClientesRepository).toHaveBeenCalledWith({ page: 1, pageSize: 20, search: 'carlos' });
  });

  it('should set hasNextPage and hasPreviousPage according to the page', async () => {
    vi.mocked(listClientesRepository).mockResolvedValue({ data: [], total: 45 });

    const result = await listClientes({ page: 2, pageSize: 20 });

    expect(result.meta.totalPages).toBe(3);
    expect(result.meta.hasNextPage).toBe(true);
    expect(result.meta.hasPreviousPage).toBe(true);
  });
});
