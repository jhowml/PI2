import { describe, it, expect, vi } from 'vitest';

vi.mock('@/config/database', () => ({ prisma: {} }));

import { buildClienteSearchWhere } from './cliente.repository';

function orFieldsOf(where: ReturnType<typeof buildClienteSearchWhere>, termIndex: number) {
  const and = where.AND as { OR: Record<string, unknown>[] }[];
  return and[termIndex].OR.map((condition) => Object.keys(condition)[0]);
}

describe('buildClienteSearchWhere', () => {
  it('should return an empty filter when there is no search', () => {
    expect(buildClienteSearchWhere(undefined)).toEqual({});
    expect(buildClienteSearchWhere('   ')).toEqual({});
  });

  it('should require every term to match some field', () => {
    const where = buildClienteSearchWhere('dom pedro, 350');

    expect(where.AND).toHaveLength(3);
  });

  it('should search text terms in nome and address fields, case-insensitive', () => {
    const where = buildClienteSearchWhere('enseada');

    expect(orFieldsOf(where, 0)).toEqual(['nome', 'logradouro', 'numero', 'complemento', 'bairro', 'cidade']);
    expect((where.AND as { OR: unknown[] }[])[0].OR[0]).toEqual({ nome: { contains: 'enseada', mode: 'insensitive' } });
  });

  it('should also search telefone and cep by the digits of a term', () => {
    const where = buildClienteSearchWhere('99123-4567');
    const conditions = (where.AND as { OR: unknown[] }[])[0].OR;

    expect(conditions).toContainEqual({ telefone: { contains: '991234567' } });
    expect(conditions).toContainEqual({ cep: { contains: '991234567' } });
  });

  it('should match a formatted phone number split into terms', () => {
    const where = buildClienteSearchWhere('(13) 99123-4567');
    const conditions = (where.AND as { OR: unknown[] }[]).map((term) => term.OR);

    expect(conditions[0]).toContainEqual({ telefone: { contains: '13' } });
    expect(conditions[1]).toContainEqual({ telefone: { contains: '991234567' } });
  });
});
