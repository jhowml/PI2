import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updateCliente } from './update-cliente.service';
import { NotFoundError } from '@/shared/errors/AppError';

vi.mock('@/modules/clientes/repositories/cliente.repository', () => ({
  findClienteById: vi.fn(),
  updateCliente: vi.fn(),
}));

import {
  findClienteById,
  updateCliente as updateClienteRepository,
} from '@/modules/clientes/repositories/cliente.repository';

const validBody = { nome: 'Maria Souza', telefone: '13991234567' };

describe('updateCliente service', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('should throw NotFoundError when the cliente does not exist', async () => {
    vi.mocked(findClienteById).mockResolvedValue(null);

    await expect(updateCliente(999, validBody as never)).rejects.toThrow(NotFoundError);
    expect(updateClienteRepository).not.toHaveBeenCalled();
  });

  it('should update and return the cliente', async () => {
    vi.mocked(findClienteById).mockResolvedValue({ id: 1 } as never);
    vi.mocked(updateClienteRepository).mockResolvedValue({ id: 1, ...validBody } as never);

    const result = await updateCliente(1, validBody as never);

    expect(updateClienteRepository).toHaveBeenCalledWith(1, validBody);
    expect(result).toEqual({ id: 1, ...validBody });
  });
});
