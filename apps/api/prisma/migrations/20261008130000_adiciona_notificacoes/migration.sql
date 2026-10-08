-- CreateEnum
CREATE TYPE "TipoNotificacao" AS ENUM ('NOVA_VENDA', 'COTAS_VENDIDAS_20', 'COTAS_VENDIDAS_50', 'COTAS_VENDIDAS_75', 'COTAS_VENDIDAS_90', 'COTAS_VENDIDAS_100');

-- CreateTable
CREATE TABLE "notificacoes" (
    "id" TEXT NOT NULL,
    "administradorId" TEXT NOT NULL,
    "campanhaId" TEXT,
    "grupoId" TEXT,
    "tipo" "TipoNotificacao" NOT NULL,
    "mensagem" TEXT NOT NULL,
    "lidaEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notificacoes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notificacoes_administradorId_criadoEm_idx" ON "notificacoes"("administradorId", "criadoEm");

-- CreateIndex
CREATE INDEX "notificacoes_campanhaId_tipo_idx" ON "notificacoes"("campanhaId", "tipo");

-- AddForeignKey
ALTER TABLE "notificacoes" ADD CONSTRAINT "notificacoes_administradorId_fkey" FOREIGN KEY ("administradorId") REFERENCES "administradores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
