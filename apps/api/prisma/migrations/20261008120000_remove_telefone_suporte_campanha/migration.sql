-- O contato de suporte passa a ser o contato do grupo vinculado à campanha
-- (grupos.identificadorWhatsapp), então a coluna própria da campanha deixa de existir.
ALTER TABLE "campanhas" DROP COLUMN "telefoneSuporte";
