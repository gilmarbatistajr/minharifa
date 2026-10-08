'use client';

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from 'react';
import { PageHeader } from '../../../../components/ui/PageHeader';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { Alert } from '../../../../components/ui/Alert';
import { TextField, TextAreaField } from '../../../../components/ui/Field';
import { EmptyState } from '../../../../components/ui/EmptyState';
import { Spinner } from '../../../../components/ui/Spinner';
import { IconGift, IconPlus, IconPencil, IconTrash } from '../../../../components/ui/icons';
import { premiosApi, urlArquivoApi, ApiError, type Premio } from '../../../../lib/api';
import { formatarMoeda } from '../../../../lib/format';
import { useSessaoAdministrador } from '../../../../lib/auth';

const TIPOS_IMAGEM_PERMITIDOS = [
  'image/jpeg',
  'image/png',
  'image/svg+xml',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif',
];
const TAMANHO_MAXIMO_IMAGEM_BYTES = 3 * 1024 * 1024;

/** Alguns navegadores (principalmente com fotos HEIC do iPhone) deixam `File.type` vazio — cai para a extensão. */
function obterTipoArquivo(arquivo: File): string {
  if (arquivo.type) return arquivo.type;
  const extensao = arquivo.name.split('.').pop()?.toLowerCase();
  if (extensao === 'heic') return 'image/heic';
  if (extensao === 'heif') return 'image/heif';
  return '';
}

export default function ListaPremiosPage() {
  const { sessao } = useSessaoAdministrador();
  const [premios, setPremios] = useState<Premio[] | null>(null);
  const [premioEmEdicao, setPremioEmEdicao] = useState<Premio | null>(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  function recarregar() {
    if (!sessao) return;
    premiosApi.listar(sessao.token).then(setPremios);
  }

  useEffect(recarregar, [sessao]);

  const editando = mostrarFormulario || premioEmEdicao !== null;

  async function excluir(premio: Premio) {
    if (!sessao) return;
    if (
      !window.confirm(
        `Excluir o prêmio "${premio.nome}"? Essa remoção é definitiva e não pode ser desfeita.`,
      )
    ) {
      return;
    }
    setErro(null);
    try {
      await premiosApi.excluir(sessao.token, premio.id);
      recarregar();
    } catch (excecao) {
      setErro(excecao instanceof ApiError ? excecao.message : 'Não foi possível excluir o prêmio.');
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Catálogo"
        title="Prêmios"
        description="Cadastre os itens que serão vinculados às suas campanhas."
        action={
          !editando && (
            <Button onClick={() => setMostrarFormulario(true)}>
              <IconPlus className="h-4 w-4" /> Novo prêmio
            </Button>
          )
        }
      />

      {erro && <Alert tone="error">{erro}</Alert>}

      {editando && (
        <FormularioPremio
          token={sessao?.token}
          premio={premioEmEdicao}
          aoConcluir={() => {
            setMostrarFormulario(false);
            setPremioEmEdicao(null);
            recarregar();
          }}
          aoCancelar={() => {
            setMostrarFormulario(false);
            setPremioEmEdicao(null);
          }}
        />
      )}

      {premios === null && (
        <div className="flex justify-center py-16 text-muted">
          <Spinner />
        </div>
      )}

      {premios?.length === 0 && !editando && (
        <EmptyState
          title="Nenhum prêmio cadastrado"
          description="Cadastre o item que vai sortear para vincular a uma campanha."
          action={
            <Button className="mt-2" onClick={() => setMostrarFormulario(true)}>
              <IconPlus className="h-4 w-4" /> Cadastrar prêmio
            </Button>
          }
        />
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {premios?.map((premio) => (
          <Card key={premio.id} className="flex flex-col gap-3">
            <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-mist">
              {premio.fotoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- fotos de prêmio vêm da API ou de host externo
                <img src={urlArquivoApi(premio.fotoUrl)} alt={premio.nome} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-muted">
                  <IconGift className="h-8 w-8" />
                </div>
              )}
            </div>
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium text-night">{premio.nome}</p>
                <p className="line-clamp-2 text-xs text-muted">{premio.descricao}</p>
              </div>
              <IconGift className="h-5 w-5 shrink-0 text-muted" />
            </div>
            <p className="font-display text-xl text-night">{formatarMoeda(premio.valor)}</p>
            {premio.valorOpcaoDinheiro && (
              <p className="text-xs text-muted">
                Opção em dinheiro: {formatarMoeda(premio.valorOpcaoDinheiro)}
              </p>
            )}
            <div className="flex gap-2">
              <Button
                variant="secondary"
                className="flex-1"
                aria-label="Editar"
                title="Editar"
                onClick={() => setPremioEmEdicao(premio)}
              >
                <IconPencil className="h-4 w-4" />
              </Button>
              <Button
                variant="danger"
                className="flex-1"
                aria-label="Excluir"
                title="Excluir"
                onClick={() => excluir(premio)}
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

function FormularioPremio({
  token,
  premio,
  aoConcluir,
  aoCancelar,
}: {
  token?: string;
  premio: Premio | null;
  aoConcluir: () => void;
  aoCancelar: () => void;
}) {
  const inputFotoRef = useRef<HTMLInputElement>(null);
  const [nome, setNome] = useState(premio?.nome ?? '');
  const [descricao, setDescricao] = useState(premio?.descricao ?? '');
  const [valor, setValor] = useState(premio ? String(premio.valor) : '');
  const [valorOpcaoDinheiro, setValorOpcaoDinheiro] = useState(
    premio?.valorOpcaoDinheiro ? String(premio.valorOpcaoDinheiro) : '',
  );
  const [arquivoFoto, setArquivoFoto] = useState<File | null>(null);
  const [previewFoto, setPreviewFoto] = useState<string | null>(
    premio?.fotoUrl ? urlArquivoApi(premio.fotoUrl) : null,
  );
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  function aoSelecionarFoto(evento: ChangeEvent<HTMLInputElement>) {
    const arquivo = evento.target.files?.[0] ?? null;
    evento.target.value = '';
    if (!arquivo) return;

    setErro(null);

    const tipo = obterTipoArquivo(arquivo);
    if (!TIPOS_IMAGEM_PERMITIDOS.includes(tipo)) {
      setErro('A imagem deve estar em um dos formatos: JPEG, PNG, SVG, WEBP, GIF ou HEIC.');
      return;
    }
    if (arquivo.size > TAMANHO_MAXIMO_IMAGEM_BYTES) {
      setErro('A imagem deve ter no máximo 3MB.');
      return;
    }

    // Corrige o content-type quando o navegador não identifica HEIC/HEIF corretamente.
    const arquivoCorrigido = tipo !== arquivo.type ? new File([arquivo], arquivo.name, { type: tipo }) : arquivo;
    setArquivoFoto(arquivoCorrigido);
    setPreviewFoto(URL.createObjectURL(arquivoCorrigido));
  }

  async function aoEnviar(evento: FormEvent) {
    evento.preventDefault();
    if (!token) return;
    setErro(null);
    setCarregando(true);
    try {
      const dados = {
        nome,
        descricao,
        valor: Number(valor),
        valorOpcaoDinheiro: valorOpcaoDinheiro ? Number(valorOpcaoDinheiro) : undefined,
      };

      let premioId = premio?.id;
      if (premio) {
        await premiosApi.editar(token, premio.id, dados);
      } else {
        premioId = (await premiosApi.cadastrar(token, dados)).premioId;
      }

      if (arquivoFoto && premioId) {
        await premiosApi.enviarFoto(token, premioId, arquivoFoto);
      }

      aoConcluir();
    } catch (excecao) {
      setErro(excecao instanceof ApiError ? excecao.message : 'Não foi possível salvar o prêmio.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <Card>
      <form onSubmit={aoEnviar} className="flex flex-col gap-4">
        {erro && <Alert tone="error">{erro}</Alert>}

        <TextField label="Nome" required value={nome} onChange={(e) => setNome(e.target.value)} />
        <TextAreaField
          label="Descrição"
          required
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
        />

        <div>
          <p className="mb-1.5 text-sm font-medium text-night">Foto</p>
          <p className="mb-2 text-xs text-muted">
            JPEG, PNG, SVG, WEBP, GIF ou HEIC, até 3MB, qualquer dimensão — exibida como um quadrado (1080x1080).
            Prévia de HEIC pode não aparecer em alguns navegadores, mas o arquivo é enviado normalmente.
          </p>
          <div className="flex items-center gap-4">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-line bg-mist">
              {previewFoto ? (
                // eslint-disable-next-line @next/next/no-img-element -- prévia local ou foto já hospedada
                <img src={previewFoto} alt="Foto do prêmio" className="h-full w-full object-cover" />
              ) : (
                <IconGift className="h-8 w-8 text-muted" />
              )}
            </div>
            <div>
              <input
                ref={inputFotoRef}
                type="file"
                accept="image/jpeg,image/png,image/svg+xml,image/webp,image/gif,image/heic,image/heif"
                className="hidden"
                onChange={aoSelecionarFoto}
              />
              <Button type="button" variant="secondary" onClick={() => inputFotoRef.current?.click()}>
                {previewFoto ? 'Trocar foto' : 'Selecionar foto'}
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Valor (R$)"
            type="number"
            step="0.01"
            min="0.01"
            required
            value={valor}
            onChange={(e) => setValor(e.target.value)}
          />
          <TextField
            label="Opção em dinheiro (R$, opcional)"
            type="number"
            step="0.01"
            min="0"
            value={valorOpcaoDinheiro}
            onChange={(e) => setValorOpcaoDinheiro(e.target.value)}
            hint="Vencedor pode escolher receber esse valor via Pix em vez do prêmio físico."
          />
        </div>

        <div className="flex gap-2">
          <Button type="submit" loading={carregando}>
            {premio ? 'Salvar alterações' : 'Cadastrar prêmio'}
          </Button>
          <Button type="button" variant="ghost" onClick={aoCancelar}>
            Cancelar
          </Button>
        </div>
      </form>
    </Card>
  );
}
