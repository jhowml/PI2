import { describe, it, expect, vi } from 'vitest';
import { Prisma } from '@prisma/client';
import { createPedido } from './create-pedido.service';
import { ConflictError, InvalidDescontoError, NotFoundError } from '@/shared/errors/AppError';
import type { CreatePedidoPorts } from '@/composition/pedido-creation.ports';
import type { CreatePedidoDTO } from '@/modules/pedidos/dtos/create-pedido/create-pedido.types';

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
    findCardapioItensByIds: vi.fn().mockResolvedValue([makeItemCardapio(2, '15.00'), makeItemCardapio(4, '6.00')]),
    insertPedido: vi.fn().mockResolvedValue({ id: 1 }),
    ...overrides,
  };
}

const validDto: CreatePedidoDTO = {
  clienteId: 1,
  tipoEntrega: 'ENTREGA',
  taxaEntrega: 5,
  desconto: 2,
  itens: [
    { cardapioId: 2, quantidade: 2 },
    { cardapioId: 4, quantidade: 1 },
  ],
};

function insertedInput(ports: CreatePedidoPorts) {
  return vi.mocked(ports.insertPedido).mock.calls[0][0];
}

describe('createPedido service', () => {
  it('should throw NotFoundError when the cliente does not exist', async () => {
    const ports = makePorts({ findClienteById: vi.fn().mockResolvedValue(null) });

    await expect(createPedido(validDto, ports)).rejects.toThrow(NotFoundError);
    expect(ports.findCardapioItensByIds).not.toHaveBeenCalled();
    expect(ports.insertPedido).not.toHaveBeenCalled();
  });

  it('should look up all cardapio items in a single call', async () => {
    const ports = makePorts();

    await createPedido(validDto, ports);

    expect(ports.findCardapioItensByIds).toHaveBeenCalledTimes(1);
    expect(ports.findCardapioItensByIds).toHaveBeenCalledWith([2, 4]);
  });

  it('should throw NotFoundError when a cardapio item does not exist or was deleted', async () => {
    const ports = makePorts({
      findCardapioItensByIds: vi.fn().mockResolvedValue([makeItemCardapio(2, '15.00')]),
    });

    await expect(createPedido(validDto, ports)).rejects.toThrow('Item do cardápio (id 4) não encontrado(a).');
    expect(ports.insertPedido).not.toHaveBeenCalled();
  });

  it('should throw ConflictError when a cardapio item is unavailable', async () => {
    const ports = makePorts({
      findCardapioItensByIds: vi.fn().mockResolvedValue([
        makeItemCardapio(2, '15.00'),
        makeItemCardapio(4, '6.00', { nome: 'Pudim de leite', disponivel: false }),
      ]),
    });

    const promise = createPedido(validDto, ports);

    await expect(promise).rejects.toThrow(ConflictError);
    await expect(promise).rejects.toThrow('"Pudim de leite"');
    expect(ports.insertPedido).not.toHaveBeenCalled();
  });

  it('should take precoUnitario from the cardapio, not from the request', async () => {
    const ports = makePorts();
    const dtoWithInjectedPrice = {
      ...validDto,
      itens: [
        { cardapioId: 2, quantidade: 2, precoUnitario: 0.01 },
        { cardapioId: 4, quantidade: 1, precoUnitario: 0.01 },
      ],
    } as CreatePedidoDTO;

    await createPedido(dtoWithInjectedPrice, ports);

    const input = insertedInput(ports);
    expect(input.itens[0].precoUnitario.toFixed(2)).toBe('15.00');
    expect(input.itens[1].precoUnitario.toFixed(2)).toBe('6.00');
  });

  it('should compute valorTotal = itens + taxaEntrega - desconto', async () => {
    const ports = makePorts();

    await createPedido(validDto, ports);

    const input = insertedInput(ports);
    expect(input.valorTotal.toFixed(2)).toBe('39.00');
    expect(input.taxaEntrega.toFixed(2)).toBe('5.00');
    expect(input.desconto.toFixed(2)).toBe('2.00');
    expect(input.tipoEntrega).toBe('ENTREGA');
    expect(input.clienteId).toBe(1);
  });

  it('should ignore a valorTotal sent by the client', async () => {
    const ports = makePorts();

    await createPedido({ ...validDto, valorTotal: 1 } as CreatePedidoDTO, ports);

    expect(insertedInput(ports).valorTotal.toFixed(2)).toBe('39.00');
  });

  it('should create a RETIRADA pedido without taxa de entrega', async () => {
    const ports = makePorts();

    await createPedido({ ...validDto, tipoEntrega: 'RETIRADA', taxaEntrega: 0, desconto: 0 }, ports);

    const input = insertedInput(ports);
    expect(input.tipoEntrega).toBe('RETIRADA');
    expect(input.taxaEntrega.isZero()).toBe(true);
    expect(input.valorTotal.toFixed(2)).toBe('36.00');
  });

  it('should throw InvalidDescontoError and not persist when the desconto exceeds the total', async () => {
    const ports = makePorts();

    await expect(createPedido({ ...validDto, desconto: 41.01 }, ports)).rejects.toThrow(InvalidDescontoError);
    expect(ports.insertPedido).not.toHaveBeenCalled();
  });

  it('should keep the order of the requested items regardless of lookup order', async () => {
    const ports = makePorts({
      findCardapioItensByIds: vi.fn().mockResolvedValue([makeItemCardapio(4, '6.00'), makeItemCardapio(2, '15.00')]),
    });

    await createPedido(validDto, ports);

    expect(insertedInput(ports).itens.map((item) => item.cardapioId)).toEqual([2, 4]);
  });

  it('should pass obs and return the created pedido', async () => {
    const ports = makePorts({ insertPedido: vi.fn().mockResolvedValue({ id: 10 }) });

    const result = await createPedido({ ...validDto, obs: 'Sem cebola' }, ports);

    expect(ports.insertPedido).toHaveBeenCalledWith(expect.objectContaining({ obs: 'Sem cebola' }));
    expect(result).toEqual({ id: 10 });
  });
});
