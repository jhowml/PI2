import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { createClienteController } from './create-cliente.controller';

vi.mock('../../services/create-cliente/create-cliente.service', () => ({
  createCliente: vi.fn(),
}));

import { createCliente } from '../../services/create-cliente/create-cliente.service';

const validBody = {
  nome: 'Carlos Eduardo Lima',
  telefone: '13997654321',
  cep: '11440000',
  logradouro: 'Avenida Dom Pedro I',
  numero: '350',
  complemento: 'Apto 42',
  bairro: 'Enseada',
  cidade: 'Guarujá',
  uf: 'SP',
};

function makeMocks(body: unknown = validBody) {
  const req = { body } as unknown as Request;
  const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as unknown as Response;
  const next = vi.fn() as unknown as NextFunction;
  return { req, res, next };
}

describe('createClienteController', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('should return 201 with the created cliente', async () => {
    const fakeCliente = { id: 1, ...validBody };
    vi.mocked(createCliente).mockResolvedValue(fakeCliente as never);

    const { req, res, next } = makeMocks();
    await createClienteController(req, res, next);

    expect(createCliente).toHaveBeenCalledWith(validBody);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(fakeCliente);
    expect(next).not.toHaveBeenCalled();
  });

  it('should accept a cliente without endereco', async () => {
    vi.mocked(createCliente).mockResolvedValue({} as never);

    const { req, res, next } = makeMocks({ nome: 'Retirada', telefone: '13988887777' });
    await createClienteController(req, res, next);

    expect(createCliente).toHaveBeenCalledWith({ nome: 'Retirada', telefone: '13988887777' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should normalize telefone, cep and uf and drop empty optional fields', async () => {
    vi.mocked(createCliente).mockResolvedValue({} as never);

    const { req, res, next } = makeMocks({
      ...validBody,
      telefone: '(13) 99765-4321',
      cep: '11440-000',
      uf: 'sp',
      complemento: '',
      obs: '   ',
    });
    await createClienteController(req, res, next);

    expect(createCliente).toHaveBeenCalledWith({
      ...validBody,
      telefone: '13997654321',
      cep: '11440000',
      uf: 'SP',
      complemento: undefined,
      obs: undefined,
    });
  });

  it.each([
    ['nome vazio', { nome: '' }],
    ['telefone curto', { telefone: '123' }],
    ['cep inválido', { cep: '1144-0000' }],
    ['uf com 3 letras', { uf: 'SPX' }],
    ['numero maior que a coluna', { numero: '12345678901' }],
    ['logradouro maior que a coluna', { logradouro: 'a'.repeat(151) }],
    ['obs maior que a coluna', { obs: 'a'.repeat(256) }],
  ])('should call next with validation error for %s', async (_case, override) => {
    const { req, res, next } = makeMocks({ ...validBody, ...override });
    await createClienteController(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(ZodError));
    expect(createCliente).not.toHaveBeenCalled();
  });

  it('should call next with error when service throws', async () => {
    const error = new Error('service failure');
    vi.mocked(createCliente).mockRejectedValue(error);

    const { req, res, next } = makeMocks();
    await createClienteController(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
    expect(res.json).not.toHaveBeenCalled();
  });
});
