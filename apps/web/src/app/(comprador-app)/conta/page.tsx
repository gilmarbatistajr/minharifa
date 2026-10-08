'use client';

import { PageHeader } from '../../../components/ui/PageHeader';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { IconUser } from '../../../components/ui/icons';
import { useAuth, useSessaoComprador } from '../../../lib/auth';

export default function ContaCompradorPage() {
  const { sessao } = useSessaoComprador();
  const { sair } = useAuth();

  if (!sessao) return null;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader eyebrow="Sua conta" title={sessao.nome} />

      <Card className="flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-mist text-muted">
          <IconUser className="h-7 w-7" />
        </div>
        <div>
          <p className="font-medium text-night">{sessao.nome}</p>
          <p className="font-mono text-xs text-muted">ID {sessao.compradorId.slice(0, 8)}</p>
        </div>
      </Card>

      <Card>
        <Button variant="danger" onClick={sair}>
          Encerrar sessão
        </Button>
      </Card>
    </div>
  );
}
