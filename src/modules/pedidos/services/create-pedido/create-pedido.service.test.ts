import { describe, it, expect, vi } from 'vitest';
import { Prisma } from '@prisma/client';
import { createPedido } from './create-pedido.service';
import { ConflictError, NotFoundError } from '@/shared/errors/AppError';
import type { CreatePedidoPorts } from '@/composition/pedido-creation.ports';

const fakeCliente = {
  id: 1,
  nome: 'Maria Aparecida Santos',
  telefone: '13991234567',
  obs: null,
  cep: '11450000',
  logradouro: 'Avenida Thiago Ferreira',
  numero: '1200',
  complemento: null,
  bairro: 'Vicente de Carvalho',
  cidade: 'Guarujá',
  uf: 'SP',
  createdAt: new Date('2026-09-01'),
};

function makeItemCardapio(id: number, preco: string, overrides: Record<string, unknown> = {}) {
  return {
    id,
    nome: `Item ${id}`,
    descricao: null,
    preco: new Prisma.Decimal(preco),
    categoria: 'Pratos',
    disponivel: true,
    createdAt: new Date('2026-09-01'),
    deletedAt: null,
    ...overrides,
  };
}

function makePorts(overrides: Partial<CreatePedidoPorts> = {}): CreatePedidoPorts {
  return {
    findClienteById: vi.fn().mockResolvedValue(fakeCliente),
    findCardapioItensByIds: vi.fn().mockResolvedValue([]),
    insertPedido: vi.fn().mockResolvedValue({ id: 1 }),
    ...overrides,
  };
}

const validDto = {
  clienteId: 1,
  itens: [
    { cardapioId: 2, quantidade: 3 },
    { cardapioId: 4, quantidade: 2 },
  ],
};

describe('createPedido service', () => {
  it('should throw NotFoundError when the cliente does not exist', async () => {
    const ports = makePorts({ findClienteById: vi.fn().mockResolvedValue(null) });

    await expect(createPedido(validDto, ports)).rejects.toThrow(NotFoundError);
    expect(ports.findCardapioItensByIds).not.toHaveBeenCalled();
    expect(ports.insertPedido).not.toHaveBeenCalled();
  });

  it('should look up all cardapio items in a single call', async () => {
    const ports = makePorts({
      findCardapioItensByIds: vi.fn().mockResolvedValue([makeItemCardapio(2, '34.90'), makeItemCardapio(4, '6.50')]),
    });

    await createPedido(validDto, ports);

    expect(ports.findCardapioItensByIds).toHaveBeenCalledTimes(1);
    expect(ports.findCardapioItensByIds).toHaveBeenCalledWith([2, 4]);
  });

  it('should throw NotFoundError when a cardapio item does not exist or was deleted', async () => {
    const ports = makePorts({
      findCardapioItensByIds: vi.fn().mockResolvedValue([makeItemCardapio(2, '34.90')]),
    });

    await expect(createPedido(validDto, ports)).rejects.toThrow('Item do cardápio (id 4) não encontrado(a).');
    expect(ports.insertPedido).not.toHaveBeenCalled();
  });

  it('should throw ConflictError when a cardapio item is unavailable', async () => {
    const ports = makePorts({
      findCardapioItensByIds: vi.fn().mockResolvedValue([
        makeItemCardapio(2, '34.90'),
        makeItemCardapio(4, '6.50', { nome: 'Pudim de leite', disponivel: false }),
      ]),
    });

    const promise = createPedido(validDto, ports);

    await expect(promise).rejects.toThrow(ConflictError);
    await expect(promise).rejects.toThrow('"Pudim de leite"');
    expect(ports.insertPedido).not.toHaveBeenCalled();
  });

  it('should compute valorTotal from the current cardapio prices', async () => {
    const ports = makePorts({
      findCardapioItensByIds: vi.fn().mockResolvedValue([makeItemCardapio(2, '34.90'), makeItemCardapio(4, '6.50')]),
    });

    await createPedido(validDto, ports);

    const input = vi.mocked(ports.insertPedido).mock.calls[0][0];
    expect(input.valorTotal.toFixed(2)).toBe('117.70');
    expect(input.clienteId).toBe(1);
    expect(input.itens).toHaveLength(2);
    expect(input.itens[0]).toMatchObject({ cardapioId: 2, quantidade: 3 });
    expect(input.itens[0].precoUnitario.toFixed(2)).toBe('34.90');
    expect(input.itens[1]).toMatchObject({ cardapioId: 4, quantidade: 2 });
    expect(input.itens[1].precoUnitario.toFixed(2)).toBe('6.50');
  });

  it('should not suffer from floating point errors when summing prices', async () => {
    const ports = makePorts({
      findCardapioItensByIds: vi.fn().mockResolvedValue([makeItemCardapio(1, '0.10'), makeItemCardapio(2, '0.20')]),
    });

    await createPedido(
      { clienteId: 1, itens: [{ cardapioId: 1, quantidade: 1 }, { cardapioId: 2, quantidade: 1 }] },
      ports,
    );

    const input = vi.mocked(ports.insertPedido).mock.calls[0][0];
    expect(input.valorTotal.equals(new Prisma.Decimal('0.30'))).toBe(true);
  });

  it('should keep the order of the requested items regardless of lookup order', async () => {
    const ports = makePorts({
      findCardapioItensByIds: vi.fn().mockResolvedValue([makeItemCardapio(4, '6.50'), makeItemCardapio(2, '34.90')]),
    });

    await createPedido(validDto, ports);

    const input = vi.mocked(ports.insertPedido).mock.calls[0][0];
    expect(input.itens.map((item) => item.cardapioId)).toEqual([2, 4]);
  });

  it('should pass obs and return the created pedido', async () => {
    const ports = makePorts({
      findCardapioItensByIds: vi.fn().mockResolvedValue([makeItemCardapio(2, '34.90'), makeItemCardapio(4, '6.50')]),
      insertPedido: vi.fn().mockResolvedValue({ id: 10 }),
    });

    const result = await createPedido({ ...validDto, obs: 'Sem cebola' }, ports);

    expect(ports.insertPedido).toHaveBeenCalledWith(expect.objectContaining({ obs: 'Sem cebola' }));
    expect(result).toEqual({ id: 10 });
  });
});
