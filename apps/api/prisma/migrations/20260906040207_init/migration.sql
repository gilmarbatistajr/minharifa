-- CreateEnum
CREATE TYPE "StatusLinkConvite" AS ENUM ('ATIVO', 'REVOGADO');

-- CreateEnum
CREATE TYPE "StatusSorteio" AS ENUM ('AGUARDANDO_ABERTURA', 'VENDAS_ABERTAS', 'VENDAS_ENCERRADAS', 'COTAS_ESGOTADAS', 'FINALIZADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "StatusCota" AS ENUM ('DISPONIVEL', 'RESERVADA', 'PAGA', 'CANCELADA_REEMBOLSADA');

-- CreateEnum
CREATE TYPE "MetodoPagamento" AS ENUM ('PIX', 'CARTAO_CREDITO', 'CASHBACK');

-- CreateEnum
CREATE TYPE "StatusPagamento" AS ENUM ('PENDENTE', 'APROVADO', 'RECUSADO', 'ESTORNADO');

-- CreateTable
CREATE TABLE "administradores" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "emailConfirmado" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "administradores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grupos" (
    "id" TEXT NOT NULL,
    "administradorId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "identificadorWhatsapp" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "grupos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agentes_chatbot" (
    "id" TEXT NOT NULL,
    "grupoId" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT false,
    "avisaCotasRestantes" BOOLEAN NOT NULL DEFAULT true,
    "avisaNovoSorteio" BOOLEAN NOT NULL DEFAULT true,
    "avisaResultado" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "agentes_chatbot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "links_convite" (
    "id" TEXT NOT NULL,
    "grupoId" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "status" "StatusLinkConvite" NOT NULL DEFAULT 'ATIVO',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "links_convite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compradores" (
    "id" TEXT NOT NULL,
    "grupoId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "apelido" TEXT,
    "dataNascimento" TIMESTAMP(3) NOT NULL,
    "telefone" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "endereco" TEXT NOT NULL,
    "senhaHash" TEXT,
    "cashbackDisponivel" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "aceitouTermoEm" TIMESTAMP(3) NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "compradores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "premios" (
    "id" TEXT NOT NULL,
    "administradorId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "fotoUrl" TEXT NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "valorOpcaoDinheiro" DECIMAL(10,2),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "premios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sorteios" (
    "id" TEXT NOT NULL,
    "grupoId" TEXT NOT NULL,
    "premioId" TEXT NOT NULL,
    "dataAberturaVendas" TIMESTAMP(3) NOT NULL,
    "dataEncerramentoVendas" TIMESTAMP(3) NOT NULL,
    "dataRealizacao" TIMESTAMP(3) NOT NULL,
    "quantidadeCotas" INTEGER NOT NULL,
    "status" "StatusSorteio" NOT NULL DEFAULT 'AGUARDANDO_ABERTURA',
    "cotaVencedoraNumero" INTEGER,
    "vencedorOptouPorDinheiro" BOOLEAN,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sorteios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cotas" (
    "id" TEXT NOT NULL,
    "sorteioId" TEXT NOT NULL,
    "compradorId" TEXT,
    "numero" INTEGER NOT NULL,
    "status" "StatusCota" NOT NULL DEFAULT 'DISPONIVEL',
    "reservadaEm" TIMESTAMP(3),
    "reservaExpiraEm" TIMESTAMP(3),

    CONSTRAINT "cotas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagamentos" (
    "id" TEXT NOT NULL,
    "cotaId" TEXT NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "metodo" "MetodoPagamento" NOT NULL,
    "status" "StatusPagamento" NOT NULL DEFAULT 'PENDENTE',
    "idTransacaoGateway" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pagamentos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "administradores_email_key" ON "administradores"("email");

-- CreateIndex
CREATE UNIQUE INDEX "grupos_identificadorWhatsapp_key" ON "grupos"("identificadorWhatsapp");

-- CreateIndex
CREATE UNIQUE INDEX "agentes_chatbot_grupoId_key" ON "agentes_chatbot"("grupoId");

-- CreateIndex
CREATE UNIQUE INDEX "links_convite_codigo_key" ON "links_convite"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "compradores_cpf_key" ON "compradores"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "sorteios_premioId_key" ON "sorteios"("premioId");

-- CreateIndex
CREATE UNIQUE INDEX "cotas_sorteioId_numero_key" ON "cotas"("sorteioId", "numero");

-- CreateIndex
CREATE UNIQUE INDEX "pagamentos_cotaId_key" ON "pagamentos"("cotaId");

-- AddForeignKey
ALTER TABLE "grupos" ADD CONSTRAINT "grupos_administradorId_fkey" FOREIGN KEY ("administradorId") REFERENCES "administradores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agentes_chatbot" ADD CONSTRAINT "agentes_chatbot_grupoId_fkey" FOREIGN KEY ("grupoId") REFERENCES "grupos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "links_convite" ADD CONSTRAINT "links_convite_grupoId_fkey" FOREIGN KEY ("grupoId") REFERENCES "grupos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compradores" ADD CONSTRAINT "compradores_grupoId_fkey" FOREIGN KEY ("grupoId") REFERENCES "grupos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "premios" ADD CONSTRAINT "premios_administradorId_fkey" FOREIGN KEY ("administradorId") REFERENCES "administradores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sorteios" ADD CONSTRAINT "sorteios_grupoId_fkey" FOREIGN KEY ("grupoId") REFERENCES "grupos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sorteios" ADD CONSTRAINT "sorteios_premioId_fkey" FOREIGN KEY ("premioId") REFERENCES "premios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cotas" ADD CONSTRAINT "cotas_sorteioId_fkey" FOREIGN KEY ("sorteioId") REFERENCES "sorteios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cotas" ADD CONSTRAINT "cotas_compradorId_fkey" FOREIGN KEY ("compradorId") REFERENCES "compradores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagamentos" ADD CONSTRAINT "pagamentos_cotaId_fkey" FOREIGN KEY ("cotaId") REFERENCES "cotas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
