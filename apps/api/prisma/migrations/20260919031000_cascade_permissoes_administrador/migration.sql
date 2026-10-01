-- DropForeignKey
ALTER TABLE "permissoes_administrador" DROP CONSTRAINT "permissoes_administrador_administradorId_fkey";

-- AddForeignKey
ALTER TABLE "permissoes_administrador" ADD CONSTRAINT "permissoes_administrador_administradorId_fkey" FOREIGN KEY ("administradorId") REFERENCES "administradores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

