import { describe, it, expect } from 'vitest';
import { Prisma } from '@prisma/client';
import { resolveItensPedido } from './resolve-itens-pedido';
import { ConflictError, NotFoundError } from '@/shared/errors/AppError';

function makeItemCardapio(id: number, preco: string, overrides: Partial<{ nome: string; disponivel: boolean }> = {}) {
  return { id, nome: `Item ${id}`, preco: new Prisma.Decimal(preco), disponivel: true, ...overrides };
}

describe('resolveItensPedido', () => {
  it('should resolve precoUnitario from the cardapio, not trust the caller', () => {
    const result = resolveItensPedido(
      [{ cardapioId: 2, quantidade: 2 }],
      [makeItemCardapio(2, '15.00')],
    );

    expect(result).toEqual([{ cardapioId: 2, quantidade: 2, precoUnitario: new Prisma.Decimal('15.00') }]);
  });

  it('should throw NotFoundError when an item does not exist in the lookup', () => {
    expect(() => resolveItensPedido([{ cardapioId: 4, quantidade: 1 }], [])).toThrow(
      'Item do cardápio (id 4) não encontrado(a).',
    );
    expect(() => resolveItensPedido([{ cardapioId: 4, quantidade: 1 }], [])).toThrow(NotFoundError);
  });

  it('should throw ConflictError when an item is unavailable', () => {
    const itensCardapio = [makeItemCardapio(2, '6.00', { nome: 'Pudim de leite', disponivel: false })];

    expect(() => resolveItensPedido([{ cardapioId: 2, quantidade: 1 }], itensCardapio)).toThrow(ConflictError);
    expect(() => resolveItensPedido([{ cardapioId: 2, quantidade: 1 }], itensCardapio)).toThrow('"Pudim de leite"');
  });

  it('should preserve the order of the requested items regardless of lookup order', () => {
    const itensCardapio = [makeItemCardapio(4, '6.00'), makeItemCardapio(2, '15.00')];

    const result = resolveItensPedido(
      [{ cardapioId: 2, quantidade: 1 }, { cardapioId: 4, quantidade: 1 }],
      itensCardapio,
    );

    expect(result.map((item) => item.cardapioId)).toEqual([2, 4]);
  });
});
