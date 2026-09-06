-- AlterTable
ALTER TABLE "pagamentos" ADD COLUMN     "compradorId" TEXT NOT NULL,
ADD COLUMN     "valorCashbackAplicado" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- AddForeignKey
ALTER TABLE "pagamentos" ADD CONSTRAINT "pagamentos_compradorId_fkey" FOREIGN KEY ("compradorId") REFERENCES "compradores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

