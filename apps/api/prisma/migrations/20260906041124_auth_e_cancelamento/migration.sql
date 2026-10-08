-- CreateEnum
CREATE TYPE "StatusEscolhaPosCancelamento" AS ENUM ('PENDENTE', 'REEMBOLSO', 'CREDITO_PROXIMO_SORTEIO', 'CASHBACK');

-- AlterTable
ALTER TABLE "administradores" ADD COLUMN     "novoEmailPendente" TEXT,
ADD COLUMN     "tokenConfirmacaoEmail" TEXT,
ADD COLUMN     "tokenConfirmacaoEmailExpiraEm" TIMESTAMP(3),
ADD COLUMN     "tokenConfirmacaoNovoEmail" TEXT,
ADD COLUMN     "tokenConfirmacaoNovoEmailExpiraEm" TIMESTAMP(3),
ADD COLUMN     "tokenRecuperacaoSenha" TEXT,
ADD COLUMN     "tokenRecuperacaoSenhaExpiraEm" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "compradores" ADD COLUMN     "appleId" TEXT,
ADD COLUMN     "facebookId" TEXT,
ADD COLUMN     "googleId" TEXT,
ADD COLUMN     "tokenRecuperacaoSenha" TEXT,
ADD COLUMN     "tokenRecuperacaoSenhaExpiraEm" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "creditos_pendentes" (
    "id" TEXT NOT NULL,
    "compradorId" TEXT NOT NULL,
    "grupoId" TEXT NOT NULL,
    "sorteioOrigemId" TEXT NOT NULL,
    "quantidadeCotas" INTEGER NOT NULL,
    "valorTotal" DECIMAL(10,2) NOT NULL,
    "utilizado" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "creditos_pendentes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "escolhas_pos_cancelamento" (
    "id" TEXT NOT NULL,
    "sorteioId" TEXT NOT NULL,
    "compradorId" TEXT NOT NULL,
    "quantidadeCotas" INTEGER NOT NULL,
    "valorTotal" DECIMAL(10,2) NOT NULL,
    "status" "StatusEscolhaPosCancelamento" NOT NULL DEFAULT 'PENDENTE',
    "prazoExpiraEm" TIMESTAMP(3) NOT NULL,
    "decididoEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "escolhas_pos_cancelamento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "administradores_tokenConfirmacaoEmail_key" ON "administradores"("tokenConfirmacaoEmail");

-- CreateIndex
CREATE UNIQUE INDEX "administradores_tokenRecuperacaoSenha_key" ON "administradores"("tokenRecuperacaoSenha");

-- CreateIndex
CREATE UNIQUE INDEX "administradores_tokenConfirmacaoNovoEmail_key" ON "administradores"("tokenConfirmacaoNovoEmail");

-- CreateIndex
CREATE UNIQUE INDEX "compradores_googleId_key" ON "compradores"("googleId");

-- CreateIndex
CREATE UNIQUE INDEX "compradores_facebookId_key" ON "compradores"("facebookId");

-- CreateIndex
CREATE UNIQUE INDEX "compradores_appleId_key" ON "compradores"("appleId");

-- CreateIndex
CREATE UNIQUE INDEX "compradores_tokenRecuperacaoSenha_key" ON "compradores"("tokenRecuperacaoSenha");

-- AddForeignKey
ALTER TABLE "creditos_pendentes" ADD CONSTRAINT "creditos_pendentes_compradorId_fkey" FOREIGN KEY ("compradorId") REFERENCES "compradores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creditos_pendentes" ADD CONSTRAINT "creditos_pendentes_grupoId_fkey" FOREIGN KEY ("grupoId") REFERENCES "grupos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escolhas_pos_cancelamento" ADD CONSTRAINT "escolhas_pos_cancelamento_sorteioId_fkey" FOREIGN KEY ("sorteioId") REFERENCES "sorteios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escolhas_pos_cancelamento" ADD CONSTRAINT "escolhas_pos_cancelamento_compradorId_fkey" FOREIGN KEY ("compradorId") REFERENCES "compradores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

