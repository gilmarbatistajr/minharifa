-- Renomeia o conceito de "sorteio" para "campanha" em todo o schema, desacopla
-- a campanha do grupo (grupoId e datas passam a ser opcionais até o
-- lançamento) e adiciona o novo ciclo de vida (status) separado do status de
-- vendas existente (statusVendas).

-- RenameTable
ALTER TABLE "sorteios" RENAME TO "campanhas";
ALTER TABLE "campanhas" RENAME CONSTRAINT "sorteios_pkey" TO "campanhas_pkey";

-- RenameEnum + CreateEnum
ALTER TYPE "StatusSorteio" RENAME TO "StatusVendasCampanha";
CREATE TYPE "StatusCampanha" AS ENUM ('NOVO', 'AGUARDANDO_LIBERACAO', 'LIBERADA', 'FINALIZADA');

-- RenameColumn (status de vendas) + AddColumn (novo status de ciclo de vida)
ALTER TABLE "campanhas" RENAME COLUMN "status" TO "statusVendas";
ALTER TABLE "campanhas" ADD COLUMN "status" "StatusCampanha" NOT NULL DEFAULT 'NOVO';

-- AddColumn administradorId (backfill a partir do grupo já vinculado, depois NOT NULL)
ALTER TABLE "campanhas" ADD COLUMN "administradorId" TEXT;
UPDATE "campanhas" c SET "administradorId" = g."administradorId"
  FROM "grupos" g WHERE c."grupoId" = g."id";
ALTER TABLE "campanhas" ALTER COLUMN "administradorId" SET NOT NULL;
ALTER TABLE "campanhas" ADD CONSTRAINT "campanhas_administradorId_fkey"
  FOREIGN KEY ("administradorId") REFERENCES "administradores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Backfill do novo status para campanhas que já existiam (todas já nasciam
-- vinculadas a um grupo, ou seja, já equivalem a "liberada"/"finalizada").
UPDATE "campanhas" SET "status" = 'LIBERADA' WHERE "grupoId" IS NOT NULL;
UPDATE "campanhas" SET "status" = 'FINALIZADA' WHERE "statusVendas" = 'FINALIZADO';

-- AlterColumn: grupoId e datas passam a ser opcionais (só existem após o lançamento)
ALTER TABLE "campanhas" ALTER COLUMN "grupoId" DROP NOT NULL;
ALTER TABLE "campanhas" ALTER COLUMN "dataAberturaVendas" DROP NOT NULL;
ALTER TABLE "campanhas" ALTER COLUMN "dataEncerramentoVendas" DROP NOT NULL;
ALTER TABLE "campanhas" ALTER COLUMN "dataRealizacao" DROP NOT NULL;

-- RenameColumn: Cota.sorteioId -> Cota.campanhaId
ALTER TABLE "cotas" DROP CONSTRAINT "cotas_sorteioId_fkey";
DROP INDEX "cotas_sorteioId_numero_key";
ALTER TABLE "cotas" RENAME COLUMN "sorteioId" TO "campanhaId";
ALTER TABLE "cotas" ADD CONSTRAINT "cotas_campanhaId_fkey"
  FOREIGN KEY ("campanhaId") REFERENCES "campanhas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE UNIQUE INDEX "cotas_campanhaId_numero_key" ON "cotas"("campanhaId", "numero");

-- RenameColumn: EscolhaPosCancelamento.sorteioId -> campanhaId
ALTER TABLE "escolhas_pos_cancelamento" DROP CONSTRAINT "escolhas_pos_cancelamento_sorteioId_fkey";
ALTER TABLE "escolhas_pos_cancelamento" RENAME COLUMN "sorteioId" TO "campanhaId";
ALTER TABLE "escolhas_pos_cancelamento" ADD CONSTRAINT "escolhas_pos_cancelamento_campanhaId_fkey"
  FOREIGN KEY ("campanhaId") REFERENCES "campanhas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- RenameColumn: CreditoPendente.sorteioOrigemId -> campanhaOrigemId (sem FK, como já era)
ALTER TABLE "creditos_pendentes" RENAME COLUMN "sorteioOrigemId" TO "campanhaOrigemId";

-- RenameEnumValue
ALTER TYPE "StatusEscolhaPosCancelamento" RENAME VALUE 'CREDITO_PROXIMO_SORTEIO' TO 'CREDITO_PROXIMA_CAMPANHA';

-- RenameColumn: AgenteChatbot.avisaNovoSorteio -> avisaNovaCampanha
ALTER TABLE "agentes_chatbot" RENAME COLUMN "avisaNovoSorteio" TO "avisaNovaCampanha";

-- Tabela implícita N:N Premio<->Campanha: o Prisma nomeia essas tabelas em
-- ordem alfabética dos modelos. Antes era "Sorteio" (S) depois de "Premio"
-- (P), então a coluna A era Premio e B era Sorteio. Agora "Campanha" (C) vem
-- antes de "Premio" (P), então a coluna A passa a ser Campanha e B Premio —
-- por isso as colunas são invertidas, não só renomeadas.
ALTER TABLE "_PremioToSorteio" RENAME TO "_CampanhaToPremio";
ALTER TABLE "_CampanhaToPremio" DROP CONSTRAINT "_PremioToSorteio_A_fkey";
ALTER TABLE "_CampanhaToPremio" DROP CONSTRAINT "_PremioToSorteio_B_fkey";
DROP INDEX "_PremioToSorteio_AB_unique";
DROP INDEX "_PremioToSorteio_B_index";
ALTER TABLE "_CampanhaToPremio" RENAME COLUMN "A" TO "A_tmp";
ALTER TABLE "_CampanhaToPremio" RENAME COLUMN "B" TO "A";
ALTER TABLE "_CampanhaToPremio" RENAME COLUMN "A_tmp" TO "B";
ALTER TABLE "_CampanhaToPremio" ADD CONSTRAINT "_CampanhaToPremio_A_fkey"
  FOREIGN KEY ("A") REFERENCES "campanhas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_CampanhaToPremio" ADD CONSTRAINT "_CampanhaToPremio_B_fkey"
  FOREIGN KEY ("B") REFERENCES "premios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE UNIQUE INDEX "_CampanhaToPremio_AB_unique" ON "_CampanhaToPremio"("A", "B");
CREATE INDEX "_CampanhaToPremio_B_index" ON "_CampanhaToPremio"("B");
