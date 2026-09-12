-- AlterTable
ALTER TABLE "compradores" ADD COLUMN     "email" TEXT;

-- AlterTable
ALTER TABLE "sorteios" ADD COLUMN     "valorCota" DECIMAL(10,2) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "compradores_email_key" ON "compradores"("email");

