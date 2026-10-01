-- CreateEnum
CREATE TYPE "RecursoMenuOperador" AS ENUM ('CAMPANHAS', 'GRUPOS', 'PREMIOS', 'ALERTAS_AUTOMATICOS');

-- CreateTable
CREATE TABLE "permissoes_operador" (
    "id" TEXT NOT NULL,
    "operadorId" TEXT NOT NULL,
    "recurso" "RecursoMenuOperador" NOT NULL,
    "podeCriar" BOOLEAN NOT NULL DEFAULT false,
    "podeEditar" BOOLEAN NOT NULL DEFAULT false,
    "podeRemover" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "permissoes_operador_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "permissoes_operador_operadorId_recurso_key" ON "permissoes_operador"("operadorId", "recurso");

-- AddForeignKey
ALTER TABLE "permissoes_operador" ADD CONSTRAINT "permissoes_operador_operadorId_fkey" FOREIGN KEY ("operadorId") REFERENCES "operadores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

