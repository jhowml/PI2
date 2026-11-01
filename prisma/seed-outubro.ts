/**
 * Popula outubro/2026 com pedidos (e pagamentos) fictícios, usando os
 * clientes e itens de cardápio já cadastrados. Script independente do
 * `db:seed` principal — não é idempotente por padrão de dados, mas verifica
 * se outubro já foi populado para evitar duplicar ao rodar de novo.
 *
 * Uso: tsx prisma/seed-outubro.ts
 */
import 'dotenv/config';
import { FormaPagamento, Prisma, PrismaClient, StatusPedido, TipoEntrega } from '@prisma/client';
import { buildDatabaseUrl } from '../src/config/buildDatabaseUrl';
import { calculatePedidoTotal } from '../src/modules/pedidos/services/calculate-pedido-total/calculate-pedido-total';

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

const ANO = 2026;
const MES = 10; // outubro (1-indexado para exibição; Date usa 0-indexado)

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(items: T[]): T {
  return items[randomInt(0, items.length - 1)];
}

function pickWeighted<T>(entries: [T, number][]): T {
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
  let roll = Math.random() * total;
  for (const [value, weight] of entries) {
    if (roll < weight) return value;
    roll -= weight;
  }
  return entries[entries.length - 1][0];
}

function pedidosDoDia(diaSemana: number) {
  // 0 = domingo .. 6 = sábado
  if (diaSemana === 5 || diaSemana === 6) return randomInt(4, 7); // sexta/sábado
  if (diaSemana === 0) return randomInt(3, 5); // domingo
  return randomInt(2, 4); // segunda a quinta
}

function horarioAleatorio(dia: number) {
  const almoco = Math.random() < 0.5;
  const hora = almoco ? randomInt(11, 14) : randomInt(18, 22);
  const minuto = randomInt(0, 59);
  return new Date(ANO, MES - 1, dia, hora, minuto, randomInt(0, 59));
}

async function jaPopulado() {
  const inicio = new Date(ANO, MES - 1, 1);
  const fim = new Date(ANO, MES, 1);
  const total = await prisma.pedido.count({ where: { dataPedido: { gte: inicio, lt: fim } } });
  return total > 0;
}

async function main() {
  if (await jaPopulado()) {
    console.log('Já existem pedidos em outubro/2026 — nada a fazer. Apague-os antes de rodar de novo, se quiser regenerar.');
    return;
  }

  const clientes = await prisma.cliente.findMany();
  const itensCardapio = await prisma.cardapio.findMany({ where: { deletedAt: null, disponivel: true } });

  if (clientes.length === 0 || itensCardapio.length === 0) {
    throw new Error('Rode "npm run db:seed" primeiro para ter clientes e itens de cardápio cadastrados.');
  }

  const diasNoMes = new Date(ANO, MES, 0).getDate();
  let totalPedidos = 0;
  let totalPagos = 0;

  for (let dia = 1; dia <= diasNoMes; dia++) {
    const diaSemana = new Date(ANO, MES - 1, dia).getDay();
    const quantidadePedidos = pedidosDoDia(diaSemana);

    for (let i = 0; i < quantidadePedidos; i++) {
      const cliente = pick(clientes);
      const tipoEntrega = Math.random() < 0.7 ? TipoEntrega.ENTREGA : TipoEntrega.RETIRADA;
      const qtdItensDistintos = randomInt(1, 4);
      const itensEscolhidos = [...itensCardapio].sort(() => Math.random() - 0.5).slice(0, qtdItensDistintos);

      const itens = itensEscolhidos.map((item) => ({
        cardapioId: item.id,
        quantidade: randomInt(1, 3),
        precoUnitario: item.preco,
      }));

      const taxaEntrega = new Prisma.Decimal(tipoEntrega === TipoEntrega.ENTREGA ? pick([5, 6, 7, 8, 10, 12]) : 0);
      const desconto = new Prisma.Decimal(Math.random() < 0.1 ? pick([2, 3, 5]) : 0);
      const valorTotal = calculatePedidoTotal(itens, taxaEntrega, desconto);

      const status = Math.random() < 0.88 ? StatusPedido.ENTREGUE : StatusPedido.CANCELADO;
      const dataPedido = horarioAleatorio(dia);

      const pedido = await prisma.pedido.create({
        data: {
          clienteId: cliente.id,
          tipoEntrega,
          taxaEntrega,
          desconto,
          valorTotal,
          dataPedido,
          status,
          obs: Math.random() < 0.15 ? pick(['Sem cebola', 'Capricha no molho', 'Troco para 100', 'Deixar na portaria']) : undefined,
          itens: { create: itens },
        },
      });
      totalPedidos++;

      if (status === StatusPedido.ENTREGUE) {
        const forma = pickWeighted<FormaPagamento>([
          [FormaPagamento.PIX, 40],
          [FormaPagamento.DINHEIRO, 30],
          [FormaPagamento.CARTAO_CREDITO, 20],
          [FormaPagamento.CARTAO_DEBITO, 10],
        ]);

        await prisma.pagamento.create({
          data: {
            pedidoId: pedido.id,
            forma,
            valor: valorTotal,
            status: 'PAGO',
            dataPagamento: dataPedido,
          },
        });
        totalPagos++;
      }
    }
  }

  console.log(`Outubro/2026 populado: ${totalPedidos} pedidos (${totalPagos} com pagamento registrado).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
