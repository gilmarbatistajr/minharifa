-- CreateEnum
CREATE TYPE "TipoChavePix" AS ENUM ('CPF', 'CNPJ', 'CELULAR', 'EMAIL', 'ALEATORIA');

-- AlterTable
ALTER TABLE "campanhas" ADD COLUMN     "chavePix" TEXT,
ADD COLUMN     "tipoChavePix" "TipoChavePix";
