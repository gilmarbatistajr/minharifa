-- Renomeia o alerta "cotas restantes" para "50% das cotas vendidas" (preserva os dados existentes)
ALTER TABLE "agentes_chatbot" RENAME COLUMN "avisaCotasRestantes" TO "avisa50PorCentoVendido";
ALTER TABLE "agentes_chatbot" RENAME COLUMN "mensagemCotasRestantes" TO "mensagem50PorCentoVendido";

-- Novos alertas: 80% e 90% das cotas vendidas
ALTER TABLE "agentes_chatbot" ADD COLUMN "avisa80PorCentoVendido" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "agentes_chatbot" ADD COLUMN "avisa90PorCentoVendido" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "agentes_chatbot" ADD COLUMN "mensagem80PorCentoVendido" TEXT;
ALTER TABLE "agentes_chatbot" ADD COLUMN "mensagem90PorCentoVendido" TEXT;
