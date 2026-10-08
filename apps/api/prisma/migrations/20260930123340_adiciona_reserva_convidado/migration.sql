-- DropForeignKey
ALTER TABLE "pagamentos" DROP CONSTRAINT "pagamentos_compradorId_fkey";

-- AlterTable
ALTER TABLE "cotas" ADD COLUMN     "convidadoEmail" TEXT,
ADD COLUMN     "convidadoNome" TEXT,
ADD COLUMN     "convidadoTelefone" TEXT,
ADD COLUMN     "tokenReservaConvidado" TEXT;

-- AlterTable
ALTER TABLE "pagamentos" ALTER COLUMN "compradorId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "cotas_tokenReservaConvidado_idx" ON "cotas"("tokenReservaConvidado");

-- AddForeignKey
ALTER TABLE "pagamentos" ADD CONSTRAINT "pagamentos_compradorId_fkey" FOREIGN KEY ("compradorId") REFERENCES "compradores"("id") ON DELETE SET NULL ON UPDATE CASCADE;
