-- Pedidos are always entered directly by staff (no customer-facing request
-- screen), so there is no "awaiting confirmation" state: a pedido is
-- CONFIRMADO the moment it's registered. Existing PENDENTE pedidos are
-- converted to CONFIRMADO before the enum value is dropped.
UPDATE "pedidos" SET "status" = 'CONFIRMADO' WHERE "status" = 'PENDENTE';

-- AlterEnum: drop PENDENTE from StatusPedido
CREATE TYPE "StatusPedido_new" AS ENUM ('CONFIRMADO', 'PREPARANDO', 'ENTREGUE', 'CANCELADO');
ALTER TABLE "pedidos" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "pedidos" ALTER COLUMN "status" TYPE "StatusPedido_new" USING ("status"::text::"StatusPedido_new");
ALTER TYPE "StatusPedido" RENAME TO "StatusPedido_old";
ALTER TYPE "StatusPedido_new" RENAME TO "StatusPedido";
DROP TYPE "StatusPedido_old";
ALTER TABLE "pedidos" ALTER COLUMN "status" SET DEFAULT 'CONFIRMADO';
