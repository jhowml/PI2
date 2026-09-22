import { describe, it, expect } from 'vitest';
import { Prisma } from '@prisma/client';
import { calculatePedidoTotal } from './calculate-pedido-total';
import { InvalidDescontoError } from '@/shared/errors/AppError';

describe('calculatePedidoTotal', () => {
  it('should return quantidade × precoUnitario for a single item', () => {
    const total = calculatePedidoTotal([{ quantidade: 2, precoUnitario: '15.00' }], 0, 0);

    expect(total.toFixed(2)).toBe('30.00');
  });

  it('should sum several items with different quantities', () => {
    const total = calculatePedidoTotal(
      [
        { quantidade: 3, precoUnitario: '34.90' },
        { quantidade: 2, precoUnitario: '6.50' },
        { quantidade: 1, precoUnitario: '12.00' },
      ],
      0,
      0,
    );

    expect(total.toFixed(2)).toBe('129.70');
  });

  it('should add the taxa de entrega', () => {
    const total = calculatePedidoTotal([{ quantidade: 1, precoUnitario: '20.00' }], '7.50', 0);

    expect(total.toFixed(2)).toBe('27.50');
  });

  it('should subtract the desconto', () => {
    const total = calculatePedidoTotal([{ quantidade: 1, precoUnitario: '20.00' }], 0, '4.25');

    expect(total.toFixed(2)).toBe('15.75');
  });

  it('should apply taxa de entrega and desconto together', () => {
    const total = calculatePedidoTotal(
      [
        { quantidade: 2, precoUnitario: '15.00' },
        { quantidade: 1, precoUnitario: '6.00' },
      ],
      '5.00',
      '2.00',
    );

    expect(total.toFixed(2)).toBe('39.00');
  });

  it('should keep decimal precision (0.1 + 0.2 = 0.3)', () => {
    const total = calculatePedidoTotal(
      [
        { quantidade: 1, precoUnitario: 0.1 },
        { quantidade: 1, precoUnitario: 0.2 },
      ],
      0,
      0,
    );

    expect(total.equals(new Prisma.Decimal('0.3'))).toBe(true);
  });

  it('should keep decimal precision with many repeated cents', () => {
    const total = calculatePedidoTotal([{ quantidade: 999, precoUnitario: '0.10' }], '0.20', '0.10');

    expect(total.toFixed(2)).toBe('100.00');
  });

  it('should accept Prisma.Decimal values as returned by the database', () => {
    const total = calculatePedidoTotal(
      [{ quantidade: 3, precoUnitario: new Prisma.Decimal('9.99') }],
      new Prisma.Decimal('5.00'),
      new Prisma.Decimal('0.97'),
    );

    expect(total.toFixed(2)).toBe('34.00');
  });

  it('should allow a desconto that brings the total exactly to zero', () => {
    const total = calculatePedidoTotal([{ quantidade: 1, precoUnitario: '10.00' }], '5.00', '15.00');

    expect(total.isZero()).toBe(true);
  });

  it('should throw InvalidDescontoError when the desconto makes the total negative', () => {
    expect(() =>
      calculatePedidoTotal([{ quantidade: 1, precoUnitario: '10.00' }], '5.00', '15.01'),
    ).toThrow(InvalidDescontoError);
  });
});
