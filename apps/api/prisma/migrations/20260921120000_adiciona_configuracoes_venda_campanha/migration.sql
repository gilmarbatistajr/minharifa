-- AlterTable
ALTER TABLE "campanhas" ADD COLUMN     "expiracaoReservaMinutos" INTEGER DEFAULT 2,
ADD COLUMN     "quantidadeMaximaPorCompra" INTEGER,
ADD COLUMN     "quantidadeMinimaPorCompra" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "reservaExigeConfirmacaoTelefone" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "reservaExigeEmail" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "reservaExigeNome" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "reservaExigeTelefone" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "telefoneSuporte" TEXT NOT NULL DEFAULT '';

