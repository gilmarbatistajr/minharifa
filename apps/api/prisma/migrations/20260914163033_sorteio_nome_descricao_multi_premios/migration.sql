-- DropForeignKey
ALTER TABLE "sorteios" DROP CONSTRAINT "sorteios_premioId_fkey";

-- DropIndex
DROP INDEX "sorteios_premioId_key";

-- AlterTable
ALTER TABLE "sorteios" DROP COLUMN "premioId",
ADD COLUMN     "descricao" TEXT NOT NULL,
ADD COLUMN     "nome" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "_PremioToSorteio" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_PremioToSorteio_AB_unique" ON "_PremioToSorteio"("A", "B");

-- CreateIndex
CREATE INDEX "_PremioToSorteio_B_index" ON "_PremioToSorteio"("B");

-- AddForeignKey
ALTER TABLE "_PremioToSorteio" ADD CONSTRAINT "_PremioToSorteio_A_fkey" FOREIGN KEY ("A") REFERENCES "premios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PremioToSorteio" ADD CONSTRAINT "_PremioToSorteio_B_fkey" FOREIGN KEY ("B") REFERENCES "sorteios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

