import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { buildDatabaseUrl } from '../src/config/buildDatabaseUrl';

function resolveDatabaseUrl(): string {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

  const host = process.env.DB_HOST;
  const user = process.env.DB_USER;
  const database = process.env.DB_NAME;

  if (!host || !user || !database) {
    throw new Error('Defina DATABASE_URL ou DB_HOST, DB_USER, DB_PASSWORD e DB_NAME no .env para rodar o seed.');
  }

  return buildDatabaseUrl({
    host,
    port: Number(process.env.DB_PORT ?? 5432),
    user,
    password: process.env.DB_PASSWORD ?? '',
    database,
  });
}

const prisma = new PrismaClient({ datasources: { db: { url: resolveDatabaseUrl() } } });

async function seedCardapio() {
  if ((await prisma.cardapio.count()) > 0) return;

  await prisma.cardapio.createMany({
    data: [
      { nome: 'Picanha na chapa', descricao: 'Picanha fatiada com arroz, farofa e vinagrete', preco: 69.9, categoria: 'Pratos' },
      { nome: 'Frango grelhado', descricao: 'Filé de frango com arroz, feijão e salada', preco: 34.9, categoria: 'Pratos' },
      { nome: 'Isca de peixe', descricao: 'Porção de isca de peixe empanada com limão', preco: 48, categoria: 'Porções' },
      { nome: 'Refrigerante lata', descricao: '350 ml', preco: 6.5, categoria: 'Bebidas' },
      { nome: 'Suco natural de laranja', descricao: '500 ml', preco: 12, categoria: 'Bebidas' },
      { nome: 'Pudim de leite', preco: 14, categoria: 'Sobremesas', disponivel: false },
    ],
  });
}

async function seedClientes() {
  if ((await prisma.cliente.count()) > 0) return;

  // Endereços fictícios, apenas para desenvolvimento.
  await prisma.cliente.createMany({
    data: [
      {
        nome: 'Maria Aparecida Santos',
        telefone: '13991234567',
        cep: '11450000',
        logradouro: 'Avenida Thiago Ferreira',
        numero: '1200',
        bairro: 'Vicente de Carvalho',
        cidade: 'Guarujá',
        uf: 'SP',
      },
      {
        nome: 'Carlos Eduardo Lima',
        telefone: '13997654321',
        obs: 'Interfone quebrado, ligar ao chegar',
        cep: '11440000',
        logradouro: 'Avenida Dom Pedro I',
        numero: '350',
        complemento: 'Apto 42',
        bairro: 'Enseada',
        cidade: 'Guarujá',
        uf: 'SP',
      },
      {
        nome: 'Ana Paula Ferreira',
        telefone: '1333551020',
        cep: '11410000',
        logradouro: 'Avenida Marechal Deodoro da Fonseca',
        numero: '88',
        bairro: 'Pitangueiras',
        cidade: 'Guarujá',
        uf: 'SP',
      },
      {
        nome: 'João Retirada Balcão',
        telefone: '13988887777',
        obs: 'Cliente de retirada no balcão, sem endereço',
      },
    ],
  });
}

async function main() {
  await seedCardapio();
  await seedClientes();
  console.log('Seed concluído.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
