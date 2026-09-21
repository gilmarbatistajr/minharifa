'use client';

import { FormEvent, useEffect, useState } from 'react';
import { PageHeader } from '../../../../components/ui/PageHeader';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { Alert } from '../../../../components/ui/Alert';
import { Badge } from '../../../../components/ui/Badge';
import { TextField, CheckboxField } from '../../../../components/ui/Field';
import { EmptyState } from '../../../../components/ui/EmptyState';
import { Spinner } from '../../../../components/ui/Spinner';
import { IconHeadset, IconPlus, IconPencil, IconTrash } from '../../../../components/ui/icons';
import {
  operadoresApi,
  gruposApi,
  ApiError,
  type Operador,
  type Grupo,
  type PermissaoRecursoOperador,
  type RecursoMenuOperador,
} from '../../../../lib/api';
import { formatarCpf, formatarTelefone } from '../../../../lib/format';
import { useSessaoAdministrador } from '../../../../lib/auth';

const RECURSOS_OPERADOR: { valor: RecursoMenuOperador; label: string }[] = [
  { valor: 'CAMPANHAS', label: 'Campanhas' },
  { valor: 'GRUPOS', label: 'Grupos' },
  { valor: 'PREMIOS', label: 'Prêmios' },
  { valor: 'ALERTAS_AUTOMATICOS', label: 'Alertas automáticos' },
];

function permissoesVaziasOperador(): PermissaoRecursoOperador[] {
  return RECURSOS_OPERADOR.map((recurso) => ({
    recurso: recurso.valor,
    podeCriar: false,
    podeEditar: false,
    podeRemover: false,
  }));
}

export default function ListaOperadoresPage() {
  const { sessao } = useSessaoAdministrador();
  const [operadores, setOperadores] = useState<Operador[] | null>(null);
  const [grupos, setGrupos] = useState<Grupo[] | null>(null);
  const [operadorEmEdicao, setOperadorEmEdicao] = useState<Operador | null>(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  function recarregar() {
    if (!sessao) return;
    operadoresApi.listar(sessao.token).then(setOperadores);
    gruposApi.listar(sessao.token).then(setGrupos);
  }

  useEffect(recarregar, [sessao]);

  const editando = mostrarFormulario || operadorEmEdicao !== null;

  const nomesPorGrupoId = new Map((grupos ?? []).map((grupo) => [grupo.id, grupo.nome]));

  async function excluir(operador: Operador) {
    if (!sessao) return;
    if (!window.confirm(`Excluir o operador "${operador.nomeCompleto}"? Essa ação não pode ser desfeita.`)) {
      return;
    }
    setErro(null);
    try {
      await operadoresApi.excluir(sessao.token, operador.id);
      recarregar();
    } catch (excecao) {
      setErro(excecao instanceof ApiError ? excecao.message : 'Não foi possível excluir o operador.');
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Equipe"
        title="Operadores"
        description="Cadastre as pessoas que vão confirmar pagamentos e liberar cotas, e associe cada uma aos grupos que ela pode operar."
        action={
          !editando && (
            <Button onClick={() => setMostrarFormulario(true)}>
              <IconPlus className="h-4 w-4" /> Novo operador
            </Button>
          )
        }
      />

      {erro && <Alert tone="error">{erro}</Alert>}

      {editando && (
        <FormularioOperador
          token={sessao?.token}
          operador={operadorEmEdicao}
          gruposDisponiveis={grupos}
          aoConcluir={() => {
            setMostrarFormulario(false);
            setOperadorEmEdicao(null);
            recarregar();
          }}
          aoCancelar={() => {
            setMostrarFormulario(false);
            setOperadorEmEdicao(null);
          }}
        />
      )}

      {operadores === null && (
        <div className="flex justify-center py-16 text-muted">
          <Spinner />
        </div>
      )}

      {operadores?.length === 0 && !editando && (
        <EmptyState
          title="Nenhum operador cadastrado"
          description="Cadastre operadores para dividir a confirmação de pagamentos e a liberação de cotas por grupo."
          action={
            <Button className="mt-2" onClick={() => setMostrarFormulario(true)}>
              <IconPlus className="h-4 w-4" /> Cadastrar operador
            </Button>
          }
        />
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {operadores?.map((operador) => (
          <Card key={operador.id} className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium text-night">{operador.nomeCompleto}</p>
                <p className="text-xs text-muted">{operador.login}</p>
              </div>
              <IconHeadset className="h-5 w-5 shrink-0 text-muted" />
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="font-mono uppercase text-muted">CPF</p>
                <p className="text-night">{formatarCpf(operador.cpf)}</p>
              </div>
              <div>
                <p className="font-mono uppercase text-muted">RG</p>
                <p className="text-night">{operador.rg}</p>
              </div>
              <div>
                <p className="font-mono uppercase text-muted">Telefone</p>
                <p className="text-night">{formatarTelefone(operador.telefone)}</p>
              </div>
              <div>
                <p className="font-mono uppercase text-muted">Endereço</p>
                <p className="line-clamp-2 text-night">{operador.endereco}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {operador.grupoIds.map((grupoId) => (
                <Badge key={grupoId} tone="accent">
                  {nomesPorGrupoId.get(grupoId) ?? 'Grupo removido'}
                </Badge>
              ))}
            </div>

            <div className="flex flex-wrap gap-1.5">
              {operador.permissoes.filter((p) => p.podeCriar || p.podeEditar || p.podeRemover).length === 0 && (
                <Badge tone="neutral">Sem permissões</Badge>
              )}
              {operador.permissoes
                .filter((p) => p.podeCriar || p.podeEditar || p.podeRemover)
                .map((permissao) => (
                  <Badge key={permissao.recurso} tone="warning">
                    {RECURSOS_OPERADOR.find((r) => r.valor === permissao.recurso)?.label ?? permissao.recurso}
                  </Badge>
                ))}
            </div>

            <div className="flex gap-2">
              <Button
                variant="secondary"
                className="flex-1"
                aria-label="Editar"
                title="Editar"
                onClick={() => setOperadorEmEdicao(operador)}
              >
                <IconPencil className="h-4 w-4" />
              </Button>
              <Button
                variant="danger"
                className="flex-1"
                aria-label="Excluir"
                title="Excluir"
                onClick={() => excluir(operador)}
              >
                <IconTrash className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function FormularioOperador({
  token,
  operador,
  gruposDisponiveis,
  aoConcluir,
  aoCancelar,
}: {
  token?: string;
  operador: Operador | null;
  gruposDisponiveis: Grupo[] | null;
  aoConcluir: () => void;
  aoCancelar: () => void;
}) {
  const [nomeCompleto, setNomeCompleto] = useState(operador?.nomeCompleto ?? '');
  const [endereco, setEndereco] = useState(operador?.endereco ?? '');
  const [cpf, setCpf] = useState(operador ? formatarCpf(operador.cpf) : '');
  const [rg, setRg] = useState(operador?.rg ?? '');
  const [telefone, setTelefone] = useState(operador ? formatarTelefone(operador.telefone) : '');
  const [login, setLogin] = useState(operador?.login ?? '');
  const [senha, setSenha] = useState('');
  const [grupoIds, setGrupoIds] = useState<string[]>(operador?.grupoIds ?? []);
  const [permissoes, setPermissoes] = useState<PermissaoRecursoOperador[]>(
    operador?.permissoes ?? permissoesVaziasOperador(),
  );
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  function alternarGrupo(grupoId: string) {
    setGrupoIds((atual) => (atual.includes(grupoId) ? atual.filter((id) => id !== grupoId) : [...atual, grupoId]));
  }

  const todasPermissoesMarcadas = permissoes.every(
    (permissao) => permissao.podeCriar && permissao.podeEditar && permissao.podeRemover,
  );

  function alternarTodasPermissoes() {
    const novoValor = !todasPermissoesMarcadas;
    setPermissoes((atual) =>
      atual.map((permissao) => ({
        ...permissao,
        podeCriar: novoValor,
        podeEditar: novoValor,
        podeRemover: novoValor,
      })),
    );
  }

  function alternarPermissao(recurso: RecursoMenuOperador, campo: 'podeCriar' | 'podeEditar' | 'podeRemover') {
    setPermissoes((atual) =>
      atual.map((permissao) =>
        permissao.recurso === recurso ? { ...permissao, [campo]: !permissao[campo] } : permissao,
      ),
    );
  }

  async function aoEnviar(evento: FormEvent) {
    evento.preventDefault();
    if (!token) return;
    if (grupoIds.length === 0) {
      setErro('Selecione ao menos um grupo para o operador.');
      return;
    }

    setErro(null);
    setCarregando(true);
    try {
      if (operador) {
        await operadoresApi.editar(token, operador.id, {
          nomeCompleto,
          endereco,
          rg,
          telefone,
          login,
          senha: senha.trim() ? senha : undefined,
          grupoIds,
          permissoes,
        });
      } else {
        await operadoresApi.cadastrar(token, {
          nomeCompleto,
          endereco,
          cpf,
          rg,
          telefone,
          login,
          senha,
          grupoIds,
          permissoes,
        });
      }
      aoConcluir();
    } catch (excecao) {
      setErro(excecao instanceof ApiError ? excecao.message : 'Não foi possível salvar o operador.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <Card>
      <form onSubmit={aoEnviar} className="flex flex-col gap-4">
        {erro && <Alert tone="error">{erro}</Alert>}

        <TextField
          label="Nome completo"
          required
          value={nomeCompleto}
          onChange={(e) => setNomeCompleto(e.target.value)}
        />
        <TextField label="Endereço" required value={endereco} onChange={(e) => setEndereco(e.target.value)} />

        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="CPF"
            required
            inputMode="numeric"
            placeholder="000.000.000-00"
            value={cpf}
            disabled={!!operador}
            hint={operador ? 'O CPF não pode ser alterado depois do cadastro.' : undefined}
            onChange={(e) => setCpf(formatarCpf(e.target.value))}
          />
          <TextField label="RG" required value={rg} onChange={(e) => setRg(e.target.value)} />
        </div>

        <TextField
          label="Número de telefone"
          required
          inputMode="numeric"
          placeholder="(11) 91234-5678"
          value={telefone}
          onChange={(e) => setTelefone(formatarTelefone(e.target.value))}
        />

        <div className="h-px bg-line" />

        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Login" required value={login} onChange={(e) => setLogin(e.target.value)} />
          <TextField
            label="Senha"
            type="password"
            required={!operador}
            minLength={6}
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            hint={operador ? 'Deixe em branco para manter a senha atual.' : 'Mínimo de 6 caracteres.'}
          />
        </div>

        <div className="h-px bg-line" />

        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium text-night">Grupos</p>
          <p className="text-xs text-muted">
            Selecione um ou mais grupos que esse operador poderá gerenciar.
          </p>

          {gruposDisponiveis === null && (
            <div className="flex justify-center py-6 text-muted">
              <Spinner size={18} />
            </div>
          )}

          {gruposDisponiveis?.length === 0 && (
            <Alert tone="error">Cadastre um grupo de WhatsApp antes de cadastrar um operador.</Alert>
          )}

          <div className="flex flex-col gap-2">
            {gruposDisponiveis?.map((grupo) => (
              <div
                key={grupo.id}
                className="flex items-center justify-between rounded-lg border border-line px-3 py-2.5"
              >
                <CheckboxField
                  label={grupo.nome}
                  checked={grupoIds.includes(grupo.id)}
                  onChange={() => alternarGrupo(grupo.id)}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="h-px bg-line" />

        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-medium text-night">Permissões por seção do menu</p>
              <p className="text-xs text-muted">
                Defina o que este operador pode criar, editar ou remover em cada seção.
              </p>
            </div>
            <CheckboxField
              label="Marcar todos"
              checked={todasPermissoesMarcadas}
              onChange={alternarTodasPermissoes}
            />
          </div>

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
                {RECURSOS_OPERADOR.map((recurso) => {
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
            {operador ? 'Salvar alterações' : 'Cadastrar operador'}
          </Button>
          <Button type="button" variant="ghost" onClick={aoCancelar}>
            Cancelar
          </Button>
        </div>
      </form>
    </Card>
  );
}
