-- CreateEnum
CREATE TYPE "RecursoMenuAdmin" AS ENUM ('CAMPANHAS', 'GRUPOS', 'PREMIOS', 'OPERADORES', 'ALERTAS_AUTOMATICOS', 'ADMINISTRADORES');

-- AlterTable
ALTER TABLE "administradores" ADD COLUMN     "administradorProprietarioId" TEXT,
ADD COLUMN     "cpf" TEXT,
ADD COLUMN     "rg" TEXT,
ADD COLUMN     "telefone" TEXT;

-- CreateTable
CREATE TABLE "permissoes_administrador" (
    "id" TEXT NOT NULL,
    "administradorId" TEXT NOT NULL,
    "recurso" "RecursoMenuAdmin" NOT NULL,
    "podeCriar" BOOLEAN NOT NULL DEFAULT false,
    "podeEditar" BOOLEAN NOT NULL DEFAULT false,
    "podeRemover" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "permissoes_administrador_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "permissoes_administrador_administradorId_recurso_key" ON "permissoes_administrador"("administradorId", "recurso");

-- CreateIndex
CREATE UNIQUE INDEX "administradores_cpf_key" ON "administradores"("cpf");

-- AddForeignKey
ALTER TABLE "administradores" ADD CONSTRAINT "administradores_administradorProprietarioId_fkey" FOREIGN KEY ("administradorProprietarioId") REFERENCES "administradores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permissoes_administrador" ADD CONSTRAINT "permissoes_administrador_administradorId_fkey" FOREIGN KEY ("administradorId") REFERENCES "administradores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

