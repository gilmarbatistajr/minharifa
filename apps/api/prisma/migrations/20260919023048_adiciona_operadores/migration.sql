-- DropForeignKey
ALTER TABLE "campanhas" DROP CONSTRAINT "sorteios_grupoId_fkey";

-- CreateTable
CREATE TABLE "operadores" (
    "id" TEXT NOT NULL,
    "administradorId" TEXT NOT NULL,
    "nomeCompleto" TEXT NOT NULL,
    "endereco" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "rg" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "login" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "operadores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_OperadoresGrupos" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "operadores_cpf_key" ON "operadores"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "operadores_login_key" ON "operadores"("login");

-- CreateIndex
CREATE UNIQUE INDEX "_OperadoresGrupos_AB_unique" ON "_OperadoresGrupos"("A", "B");

-- CreateIndex
CREATE INDEX "_OperadoresGrupos_B_index" ON "_OperadoresGrupos"("B");

-- AddForeignKey
ALTER TABLE "operadores" ADD CONSTRAINT "operadores_administradorId_fkey" FOREIGN KEY ("administradorId") REFERENCES "administradores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campanhas" ADD CONSTRAINT "campanhas_grupoId_fkey" FOREIGN KEY ("grupoId") REFERENCES "grupos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OperadoresGrupos" ADD CONSTRAINT "_OperadoresGrupos_A_fkey" FOREIGN KEY ("A") REFERENCES "grupos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OperadoresGrupos" ADD CONSTRAINT "_OperadoresGrupos_B_fkey" FOREIGN KEY ("B") REFERENCES "operadores"("id") ON DELETE CASCADE ON UPDATE CASCADE;
