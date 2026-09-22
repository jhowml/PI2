-- CreateEnum
CREATE TYPE "StatusPedido" AS ENUM ('PENDENTE', 'CONFIRMADO', 'PREPARANDO', 'ENTREGUE', 'CANCELADO');

-- CreateEnum
CREATE TYPE "FormaPagamento" AS ENUM ('DINHEIRO', 'PIX', 'CARTAO_CREDITO', 'CARTAO_DEBITO');

-- CreateEnum
CREATE TYPE "StatusPagamento" AS ENUM ('PENDENTE', 'PAGO', 'ESTORNADO');

-- CreateTable
CREATE TABLE "clientes" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "telefone" VARCHAR(11) NOT NULL,
    "obs" VARCHAR(255),
    "cep" CHAR(8),
    "logradouro" VARCHAR(150),
    "numero" VARCHAR(10),
    "complemento" VARCHAR(60),
    "bairro" VARCHAR(80),
    "cidade" VARCHAR(80),
    "uf" CHAR(2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cardapio" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "descricao" VARCHAR(255),
    "preco" DECIMAL(10,2) NOT NULL,
    "categoria" VARCHAR(50) NOT NULL,
    "disponivel" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "cardapio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pedidos" (
    "id" SERIAL NOT NULL,
    "data_pedido" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "StatusPedido" NOT NULL DEFAULT 'PENDENTE',
    "valor_total" DECIMAL(10,2) NOT NULL,
    "obs" VARCHAR(255),
    "cliente_id" INTEGER NOT NULL,

    CONSTRAINT "pedidos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itens_pedido" (
    "id" SERIAL NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "preco_unitario" DECIMAL(10,2) NOT NULL,
    "pedido_id" INTEGER NOT NULL,
    "cardapio_id" INTEGER NOT NULL,

    CONSTRAINT "itens_pedido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagamentos" (
    "id" SERIAL NOT NULL,
    "forma" "FormaPagamento" NOT NULL,
    "status" "StatusPagamento" NOT NULL DEFAULT 'PENDENTE',
    "valor" DECIMAL(10,2) NOT NULL,
    "data_pagamento" TIMESTAMP(3),
    "pedido_id" INTEGER NOT NULL,

    CONSTRAINT "pagamentos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pedidos_cliente_id_idx" ON "pedidos"("cliente_id");

-- CreateIndex
CREATE INDEX "pedidos_status_idx" ON "pedidos"("status");

-- CreateIndex
CREATE INDEX "itens_pedido_pedido_id_idx" ON "itens_pedido"("pedido_id");

-- CreateIndex
CREATE INDEX "itens_pedido_cardapio_id_idx" ON "itens_pedido"("cardapio_id");

-- CreateIndex
CREATE UNIQUE INDEX "pagamentos_pedido_id_key" ON "pagamentos"("pedido_id");

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_pedido" ADD CONSTRAINT "itens_pedido_pedido_id_fkey" FOREIGN KEY ("pedido_id") REFERENCES "pedidos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_pedido" ADD CONSTRAINT "itens_pedido_cardapio_id_fkey" FOREIGN KEY ("cardapio_id") REFERENCES "cardapio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagamentos" ADD CONSTRAINT "pagamentos_pedido_id_fkey" FOREIGN KEY ("pedido_id") REFERENCES "pedidos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

