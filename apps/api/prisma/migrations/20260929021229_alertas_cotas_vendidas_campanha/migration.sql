-- AlterTable
ALTER TABLE "campanhas" ADD COLUMN     "alerta50PorCentoEnviado" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "alerta80PorCentoEnviado" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "alerta90PorCentoEnviado" BOOLEAN NOT NULL DEFAULT false;
