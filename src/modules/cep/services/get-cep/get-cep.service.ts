import { NotFoundError } from '@/shared/errors/AppError';
import { GetCepResult } from '@/modules/cep/dtos/get-cep/get-cep.types';
import { fetchEnderecoByCep } from '@/modules/cep/gateways/viacep.gateway';

export async function getCep(cep: string): Promise<GetCepResult> {
  const endereco = await fetchEnderecoByCep(cep);
  if (!endereco) throw new NotFoundError('CEP');

  return {
    cep: endereco.cep.replace('-', ''),
    logradouro: endereco.logradouro,
    bairro: endereco.bairro,
    cidade: endereco.localidade,
    uf: endereco.uf,
  };
}
