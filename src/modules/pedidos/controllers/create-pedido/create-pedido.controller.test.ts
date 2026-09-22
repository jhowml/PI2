import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { createPedidoController } from './create-pedido.controller';

vi.mock('@/composition/pedido-creation', () => ({
  createPedido: vi.fn(),
}));

import { createPedido } from '@/composition/pedido-creation';

const validBody = {
  clienteId: 1,
  tipoEntrega: 'ENTREGA',
  taxaEntrega: 5,
  desconto: 2,
  itens: [
    { cardapioId: 2, quantidade: 3 },
    { cardapioId: 4, quantidade: 1 },
  ],
};

const fakePedido = { id: 1, status: 'PENDENTE', valorTotal: '111.20', clienteId: 1, itens: [] };

function makeMocks(body: unknown = validBody) {
  const req = { body } as unknown as Request;
  const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as unknown as Response;
  const next = vi.fn() as unknown as NextFunction;
  return { req, res, next };
}

describe('createPedidoController', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('should return 201 with the created pedido', async () => {
    vi.mocked(createPedido).mockResolvedValue(fakePedido as never);

    const { req, res, next } = makeMocks();
    await createPedidoController(req, res, next);

    expect(createPedido).toHaveBeenCalledWith(validBody);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(fakePedido);
    expect(next).not.toHaveBeenCalled();
  });

  it('should forward obs and ignore it when blank', async () => {
    vi.mocked(createPedido).mockResolvedValue(fakePedido as never);

    const { req, res, next } = makeMocks({ ...validBody, obs: '  ' });
    await createPedidoController(req, res, next);

    expect(createPedido).toHaveBeenCalledWith({ ...validBody, obs: undefined });
  });

  it('should default taxaEntrega and desconto to zero', async () => {
    vi.mocked(createPedido).mockResolvedValue(fakePedido as never);

    const { req, res, next } = makeMocks({ clienteId: 1, tipoEntrega: 'RETIRADA', itens: validBody.itens });
    await createPedidoController(req, res, next);

    expect(createPedido).toHaveBeenCalledWith({
      clienteId: 1,
      tipoEntrega: 'RETIRADA',
      taxaEntrega: 0,
      desconto: 0,
      itens: validBody.itens,
    });
  });

  it('should accept RETIRADA with taxaEntrega explicitly zero', async () => {
    vi.mocked(createPedido).mockResolvedValue(fakePedido as never);

    const { req, res, next } = makeMocks({ ...validBody, tipoEntrega: 'RETIRADA', taxaEntrega: 0 });
    await createPedidoController(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('should drop valorTotal from the body before calling the service', async () => {
    vi.mocked(createPedido).mockResolvedValue(fakePedido as never);

    const { req, res, next } = makeMocks({ ...validBody, valorTotal: 1 });
    await createPedidoController(req, res, next);

    expect(createPedido).toHaveBeenCalledWith(validBody);
    expect(vi.mocked(createPedido).mock.calls[0][0]).not.toHaveProperty('valorTotal');
  });

  it('should reject RETIRADA with taxaEntrega greater than zero, pointing to taxaEntrega', async () => {
    const { req, res, next } = makeMocks({ ...validBody, tipoEntrega: 'RETIRADA', taxaEntrega: 5 });
    await createPedidoController(req, res, next);

    const error = vi.mocked(next).mock.calls[0][0] as unknown as ZodError;
    expect(error).toBeInstanceOf(ZodError);
    expect(error.flatten().fieldErrors).toHaveProperty('taxaEntrega');
    expect(createPedido).not.toHaveBeenCalled();
  });

  it.each([
    ['sem tipoEntrega', { tipoEntrega: undefined }],
    ['tipoEntrega inválido', { tipoEntrega: 'DRONE' }],
    ['taxaEntrega negativa', { taxaEntrega: -1 }],
    ['desconto negativo', { desconto: -0.01 }],
    ['taxaEntrega com mais de 2 casas', { taxaEntrega: 1.234 }],
    ['sem itens', { itens: [] }],
    ['clienteId inválido', { clienteId: 0 }],
    ['quantidade zero', { itens: [{ cardapioId: 2, quantidade: 0 }] }],
    ['quantidade fracionada', { itens: [{ cardapioId: 2, quantidade: 1.5 }] }],
    ['item repetido', { itens: [{ cardapioId: 2, quantidade: 1 }, { cardapioId: 2, quantidade: 2 }] }],
    ['obs maior que a coluna', { obs: 'a'.repeat(256) }],
  ])('should call next with validation error for %s', async (_case, override) => {
    const { req, res, next } = makeMocks({ ...validBody, ...override });
    await createPedidoController(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(ZodError));
    expect(createPedido).not.toHaveBeenCalled();
  });

  it('should call next with error when service throws', async () => {
    const error = new Error('service failure');
    vi.mocked(createPedido).mockRejectedValue(error);

    const { req, res, next } = makeMocks();
    await createPedidoController(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
    expect(res.json).not.toHaveBeenCalled();
  });
});
