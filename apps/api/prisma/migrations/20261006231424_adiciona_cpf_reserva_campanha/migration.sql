-- AlterTable
ALTER TABLE "campanhas" ADD COLUMN     "reservaExigeCpf" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "cotas" ADD COLUMN     "convidadoCpf" TEXT;
