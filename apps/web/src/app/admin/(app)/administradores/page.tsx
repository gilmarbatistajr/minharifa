'use client';

import { FormEvent, useEffect, useState } from 'react';
import { PageHeader } from '../../../../components/ui/PageHeader';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { Alert } from '../../../../components/ui/Alert';
import { Badge } from '../../../../components/ui/Badge';
import { TextField } from '../../../../components/ui/Field';
import { EmptyState } from '../../../../components/ui/EmptyState';
import { Spinner } from '../../../../components/ui/Spinner';
import { IconShield, IconPlus, IconPencil, IconTrash } from '../../../../components/ui/icons';
import {
  administradoresMembrosApi,
  ApiError,
  type AdministradorMembro,
  type PermissaoRecurso,
  type RecursoMenuAdmin,
} from '../../../../lib/api';
import { formatarCpf, formatarTelefone } from '../../../../lib/format';
import { useSessaoAdministrador } from '../../../../lib/auth';

const RECURSOS: { valor: RecursoMenuAdmin; label: string }[] = [
  { valor: 'CAMPANHAS', label: 'Campanhas' },
  { valor: 'GRUPOS', label: 'Grupos' },
  { valor: 'PREMIOS', label: 'Prêmios' },
  { valor: 'OPERADORES', label: 'Operadores' },
  { valor: 'ALERTAS_AUTOMATICOS', label: 'Alertas automáticos' },
  { valor: 'ADMINISTRADORES', label: 'Administradores' },
];

function permissoesVazias(): PermissaoRecurso[] {
  return RECURSOS.map((recurso) => ({
    recurso: recurso.valor,
    podeCriar: false,
    podeEditar: false,
    podeRemover: false,
  }));
}

export default function ListaAdministradoresPage() {
  const { sessao } = useSessaoAdministrador();
  const [membros, setMembros] = useState<AdministradorMembro[] | null>(null);
  const [membroEmEdicao, setMembroEmEdicao] = useState<AdministradorMembro | null>(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  function recarregar() {
    if (!sessao) return;
    administradoresMembrosApi.listar(sessao.token).then(setMembros);
  }

  useEffect(recarregar, [sessao]);

  const editando = mostrarFormulario || membroEmEdicao !== null;

  async function excluir(membro: AdministradorMembro) {
    if (!sessao) return;
    if (!window.confirm(`Excluir o administrador "${membro.nome}"? Essa ação não pode ser desfeita.`)) {
      return;
    }
    setErro(null);
    try {
      await administradoresMembrosApi.excluir(sessao.token, membro.id);
      recarregar();
    } catch (excecao) {
      setErro(excecao instanceof ApiError ? excecao.message : 'Não foi possível excluir o administrador.');
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Equipe"
        title="Administradores"
        description="Cadastre outros administradores da sua conta e defina o que cada um pode criar, editar ou remover em cada seção do menu."
        action={
          !editando && (
            <Button onClick={() => setMostrarFormulario(true)}>
              <IconPlus className="h-4 w-4" /> Novo administrador
            </Button>
          )
        }
      />

      {erro && <Alert tone="error">{erro}</Alert>}

      {editando && (
        <FormularioAdministrador
          token={sessao?.token}
          membro={membroEmEdicao}
          aoConcluir={() => {
            setMostrarFormulario(false);
            setMembroEmEdicao(null);
            recarregar();
          }}
          aoCancelar={() => {
            setMostrarFormulario(false);
            setMembroEmEdicao(null);
          }}
        />
      )}

      {membros === null && (
        <div className="flex justify-center py-16 text-muted">
          <Spinner />
        </div>
      )}

      {membros?.length === 0 && !editando && (
        <EmptyState
          title="Nenhum administrador adicional cadastrado"
          description="Cadastre outros administradores para dividir a gestão da conta, com permissões específicas por seção."
          action={
            <Button className="mt-2" onClick={() => setMostrarFormulario(true)}>
              <IconPlus className="h-4 w-4" /> Cadastrar administrador
            </Button>
          }
        />
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {membros?.map((membro) => {
          const recursosComAcesso = membro.permissoes.filter((p) => p.podeCriar || p.podeEditar || p.podeRemover);

          return (
            <Card key={membro.id} className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-night">{membro.nome}</p>
                  <p className="text-xs text-muted">{membro.email}</p>
                </div>
                <IconShield className="h-5 w-5 shrink-0 text-muted" />
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="font-mono uppercase text-muted">CPF</p>
                  <p className="text-night">{membro.cpf ? formatarCpf(membro.cpf) : '—'}</p>
                </div>
                <div>
                  <p className="font-mono uppercase text-muted">RG</p>
                  <p className="text-night">{membro.rg ?? '—'}</p>
                </div>
                <div className="col-span-2">
                  <p className="font-mono uppercase text-muted">Telefone</p>
                  <p className="text-night">{membro.telefone ? formatarTelefone(membro.telefone) : '—'}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {recursosComAcesso.length === 0 && <Badge tone="neutral">Sem permissões</Badge>}
                {recursosComAcesso.map((permissao) => (
                  <Badge key={permissao.recurso} tone="accent">
                    {RECURSOS.find((r) => r.valor === permissao.recurso)?.label ?? permissao.recurso}
                  </Badge>
                ))}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  className="flex-1"
                  aria-label="Editar"
                  title="Editar"
                  onClick={() => setMembroEmEdicao(membro)}
                >
                  <IconPencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="danger"
                  className="flex-1"
                  aria-label="Excluir"
                  title="Excluir"
                  onClick={() => excluir(membro)}
                >
                  <IconTrash className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function FormularioAdministrador({
  token,
  membro,
  aoConcluir,
  aoCancelar,
}: {
  token?: string;
  membro: AdministradorMembro | null;
  aoConcluir: () => void;
  aoCancelar: () => void;
}) {
  const [nome, setNome] = useState(membro?.nome ?? '');
  const [email, setEmail] = useState(membro?.email ?? '');
  const [telefone, setTelefone] = useState(membro?.telefone ? formatarTelefone(membro.telefone) : '');
  const [cpf, setCpf] = useState(membro?.cpf ? formatarCpf(membro.cpf) : '');
  const [rg, setRg] = useState(membro?.rg ?? '');
  const [senha, setSenha] = useState('');
  const [permissoes, setPermissoes] = useState<PermissaoRecurso[]>(membro?.permissoes ?? permissoesVazias());
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  function alternarPermissao(recurso: RecursoMenuAdmin, campo: 'podeCriar' | 'podeEditar' | 'podeRemover') {
    setPermissoes((atual) =>
      atual.map((permissao) =>
        permissao.recurso === recurso ? { ...permissao, [campo]: !permissao[campo] } : permissao,
      ),
    );
  }

  async function aoEnviar(evento: FormEvent) {
    evento.preventDefault();
    if (!token) return;

    setErro(null);
    setCarregando(true);
    try {
      if (membro) {
        await administradoresMembrosApi.editar(token, membro.id, { nome, email, telefone, rg, permissoes });
      } else {
        await administradoresMembrosApi.cadastrar(token, { nome, email, telefone, cpf, rg, senha, permissoes });
      }
      aoConcluir();
    } catch (excecao) {
      setErro(excecao instanceof ApiError ? excecao.message : 'Não foi possível salvar o administrador.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <Card>
      <form onSubmit={aoEnviar} className="flex flex-col gap-4">
        {erro && <Alert tone="error">{erro}</Alert>}

        <TextField label="Nome completo" required value={nome} onChange={(e) => setNome(e.target.value)} />
        <TextField
          label="Email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Número de telefone"
            required
            inputMode="numeric"
            placeholder="(11) 91234-5678"
            value={telefone}
            onChange={(e) => setTelefone(formatarTelefone(e.target.value))}
          />
          <TextField
            label="CPF"
            required
            inputMode="numeric"
            placeholder="000.000.000-00"
            value={cpf}
            disabled={!!membro}
            hint={membro ? 'O CPF não pode ser alterado depois do cadastro.' : undefined}
            onChange={(e) => setCpf(formatarCpf(e.target.value))}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="RG" required value={rg} onChange={(e) => setRg(e.target.value)} />
          <TextField
            label="Senha"
            type="password"
            required={!membro}
            minLength={6}
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            hint={membro ? 'A troca de senha ainda não está disponível por aqui.' : 'Mínimo de 6 caracteres.'}
            disabled={!!membro}
          />
        </div>

        <div className="h-px bg-line" />

        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium text-night">Permissões por seção do menu</p>
          <p className="text-xs text-muted">
            Defina o que este administrador pode criar, editar ou remover em cada seção.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                  <th className="py-2 pr-4 font-mono font-medium">Seção</th>
                  <th className="py-2 pr-4 font-mono font-medium">Criar</th>
                  <th className="py-2 pr-4 font-mono font-medium">Editar</th>
                  <th className="py-2 pr-4 font-mono font-medium">Remover</th>
                </tr>
              </thead>
              <tbody>
                {RECURSOS.map((recurso) => {
                  const permissao = permissoes.find((p) => p.recurso === recurso.valor);
                  return (
                    <tr key={recurso.valor} className="border-b border-line last:border-0">
                      <td className="py-2.5 pr-4 text-night">{recurso.label}</td>
                      {(['podeCriar', 'podeEditar', 'podeRemover'] as const).map((campo) => (
                        <td key={campo} className="py-2.5 pr-4">
                          <input
                            type="checkbox"
                            className="h-5 w-5 rounded border-line text-accent-ink accent-accent-ink"
                            checked={permissao?.[campo] ?? false}
                            onChange={() => alternarPermissao(recurso.valor, campo)}
                          />
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex gap-2">
          <Button type="submit" loading={carregando}>
            {membro ? 'Salvar alterações' : 'Cadastrar administrador'}
          </Button>
          <Button type="button" variant="ghost" onClick={aoCancelar}>
            Cancelar
          </Button>
        </div>
      </form>
    </Card>
  );
}
