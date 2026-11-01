import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Prisma } from '@prisma/client';
import { getDashboard } from './get-dashboard.service';

vi.mock('@/modules/dashboard/repositories/dashboard.repository', () => ({
  findPedidosFaturamento: vi.fn(),
  countPedidosPorStatus: vi.fn(),
  findItensMaisVendidos: vi.fn(),
  countPagamentosPorForma: vi.fn(),
}));

import {
  countPagamentosPorForma,
  countPedidosPorStatus,
  findItensMaisVendidos,
  findPedidosFaturamento,
} from '@/modules/dashboard/repositories/dashboard.repository';

const fakeItensMaisVendidos = [{ cardapioId: 2, nome: 'Marmita', quantidade: 10 }];

function mockEmptyRepositories() {
  vi.mocked(findPedidosFaturamento).mockResolvedValue([]);
  vi.mocked(countPedidosPorStatus).mockResolvedValue([]);
  vi.mocked(findItensMaisVendidos).mockResolvedValue([]);
  vi.mocked(countPagamentosPorForma).mockResolvedValue([]);
}

describe('getDashboard service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEmptyRepositories();
  });

  it('should group faturamento and count pedidos by day, sorted ascending', async () => {
    vi.mocked(findPedidosFaturamento).mockResolvedValue([
      { dataPedido: new Date('2026-10-02T10:00:00Z'), valorTotal: new Prisma.Decimal('20.00') },
      { dataPedido: new Date('2026-10-01T09:00:00Z'), valorTotal: new Prisma.Decimal('15.00') },
      { dataPedido: new Date('2026-10-01T18:00:00Z'), valorTotal: new Prisma.Decimal('5.00') },
    ] as never);
    vi.mocked(findItensMaisVendidos).mockResolvedValue(fakeItensMaisVendidos as never);

    const result = await getDashboard({});

    expect(result.faturamentoPorPeriodo).toEqual([
      { data: '2026-10-01', pedidos: 2, faturamento: new Prisma.Decimal('20.00') },
      { data: '2026-10-02', pedidos: 1, faturamento: new Prisma.Decimal('20.00') },
    ]);
  });

  it('should compute faturamentoTotal and ticketMedio across all pedidos', async () => {
    vi.mocked(findPedidosFaturamento).mockResolvedValue([
      { dataPedido: new Date('2026-10-01'), valorTotal: new Prisma.Decimal('30.00') },
      { dataPedido: new Date('2026-10-02'), valorTotal: new Prisma.Decimal('10.00') },
    ] as never);

    const result = await getDashboard({});

    expect(result.faturamentoTotal.toFixed(2)).toBe('40.00');
    expect(result.ticketMedio.toFixed(2)).toBe('20.00');
  });

  it('should return ticketMedio zero when there are no pedidos in range', async () => {
    const result = await getDashboard({});

    expect(result.ticketMedio.isZero()).toBe(true);
    expect(result.faturamentoTotal.isZero()).toBe(true);
    expect(result.faturamentoPorPeriodo).toEqual([]);
  });

  it('should fill all statuses with zero and overlay the counted ones', async () => {
    vi.mocked(countPedidosPorStatus).mockResolvedValue([
      { status: 'ENTREGUE', _count: { _all: 4 } },
      { status: 'CANCELADO', _count: { _all: 1 } },
    ] as never);

    const result = await getDashboard({});

    expect(result.pedidosPorStatus).toEqual({
      CONFIRMADO: 0,
      PREPARANDO: 0,
      ENTREGUE: 4,
      CANCELADO: 1,
    });
  });

  it('should group vendas by weekday, always returning all 7 in SEGUNDA..DOMINGO order, with ticketMedio', async () => {
    vi.mocked(findPedidosFaturamento).mockResolvedValue([
      { dataPedido: new Date('2026-10-01T12:00:00Z'), valorTotal: new Prisma.Decimal('10.00') }, // quinta
      { dataPedido: new Date('2026-10-04T12:00:00Z'), valorTotal: new Prisma.Decimal('30.00') }, // domingo
      { dataPedido: new Date('2026-10-04T18:00:00Z'), valorTotal: new Prisma.Decimal('10.00') }, // domingo
    ] as never);

    const result = await getDashboard({});

    expect(result.vendasPorDiaSemana.map((dia) => dia.diaSemana)).toEqual([
      'SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA', 'SABADO', 'DOMINGO',
    ]);
    expect(result.vendasPorDiaSemana.find((dia) => dia.diaSemana === 'QUINTA')).toEqual({
      diaSemana: 'QUINTA', pedidos: 1, faturamento: new Prisma.Decimal('10.00'), ticketMedio: new Prisma.Decimal('10.00'),
    });
    expect(result.vendasPorDiaSemana.find((dia) => dia.diaSemana === 'DOMINGO')).toEqual({
      diaSemana: 'DOMINGO', pedidos: 2, faturamento: new Prisma.Decimal('40.00'), ticketMedio: new Prisma.Decimal('20.00'),
    });
    expect(result.vendasPorDiaSemana.find((dia) => dia.diaSemana === 'SEGUNDA')).toEqual({
      diaSemana: 'SEGUNDA', pedidos: 0, faturamento: new Prisma.Decimal(0), ticketMedio: new Prisma.Decimal(0),
    });
  });

  it('should fill all 4 formas de pagamento with zero and overlay the counted ones', async () => {
    vi.mocked(countPagamentosPorForma).mockResolvedValue([
      { forma: 'PIX', _count: { _all: 3 }, _sum: { valor: new Prisma.Decimal('150.00') } },
    ] as never);

    const result = await getDashboard({});

    expect(result.pagamentosPorForma).toEqual([
      { forma: 'DINHEIRO', quantidade: 0, valor: new Prisma.Decimal(0) },
      { forma: 'PIX', quantidade: 3, valor: new Prisma.Decimal('150.00') },
      { forma: 'CARTAO_CREDITO', quantidade: 0, valor: new Prisma.Decimal(0) },
      { forma: 'CARTAO_DEBITO', quantidade: 0, valor: new Prisma.Decimal(0) },
    ]);
  });

  it('should pass the range through to the repositories and return itensMaisVendidos as-is', async () => {
    vi.mocked(findItensMaisVendidos).mockResolvedValue(fakeItensMaisVendidos as never);

    const range = { from: new Date('2026-10-01'), to: new Date('2026-10-31') };
    const result = await getDashboard(range);

    expect(findPedidosFaturamento).toHaveBeenCalledWith(range);
    expect(countPedidosPorStatus).toHaveBeenCalledWith(range);
    expect(findItensMaisVendidos).toHaveBeenCalledWith(range, 5);
    expect(countPagamentosPorForma).toHaveBeenCalledWith(range);
    expect(result.itensMaisVendidos).toEqual(fakeItensMaisVendidos);
  });
});
