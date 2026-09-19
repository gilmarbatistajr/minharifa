-- CreateEnum
CREATE TYPE "FormaVendaCotas" AS ENUM ('ESCOLHA_NUMERO', 'LOTE_FECHADO');

-- AlterTable
ALTER TABLE "sorteios" ADD COLUMN     "formaVenda" "FormaVendaCotas" NOT NULL DEFAULT 'ESCOLHA_NUMERO';
