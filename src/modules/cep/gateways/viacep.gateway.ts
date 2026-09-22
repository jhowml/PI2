import { z } from 'zod';
import { BadGatewayError, ServiceUnavailableError } from '@/shared/errors/AppError';

const VIACEP_BASE_URL = 'https://viacep.com.br/ws';
const VIACEP_TIMEOUT_MS = 5000;

const viaCepNotFoundSchema = z.object({
  erro: z.union([z.literal(true), z.literal('true')]),
});

const viaCepEnderecoSchema = z.object({
  cep: z.string(),
  logradouro: z.string(),
  bairro: z.string(),
  localidade: z.string(),
  uf: z.string(),
});

export type ViaCepEndereco = z.infer<typeof viaCepEnderecoSchema>;

function isTimeout(err: unknown) {
  return err instanceof Error && (err.name === 'TimeoutError' || err.name === 'AbortError');
}

export async function fetchEnderecoByCep(cep: string): Promise<ViaCepEndereco | null> {
  let response: Response;

  try {
    response = await fetch(`${VIACEP_BASE_URL}/${cep}/json/`, {
      signal: AbortSignal.timeout(VIACEP_TIMEOUT_MS),
    });
  } catch {
    throw new ServiceUnavailableError('Serviço de consulta de CEP indisponível.');
  }

  if (!response.ok) {
    throw new BadGatewayError('Resposta inválida do serviço de consulta de CEP.');
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch (err) {
    if (isTimeout(err)) throw new ServiceUnavailableError('Serviço de consulta de CEP indisponível.');
    throw new BadGatewayError('Resposta inválida do serviço de consulta de CEP.');
  }

  if (viaCepNotFoundSchema.safeParse(body).success) return null;

  const endereco = viaCepEnderecoSchema.safeParse(body);
  if (!endereco.success) {
    throw new BadGatewayError('Resposta inválida do serviço de consulta de CEP.');
  }

  return endereco.data;
}
