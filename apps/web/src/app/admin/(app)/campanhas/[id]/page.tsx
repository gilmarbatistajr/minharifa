'use client';

import { ChangeEvent, FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from '../../../../../components/ui/PageHeader';
import { Card } from '../../../../../components/ui/Card';
import { Button } from '../../../../../components/ui/Button';
import { Alert } from '../../../../../components/ui/Alert';
import { Badge } from '../../../../../components/ui/Badge';
import { Spinner } from '../../../../../components/ui/Spinner';
import { TextField, TextAreaField, SelectField, CheckboxField } from '../../../../../components/ui/Field';
import { EmptyState } from '../../../../../components/ui/EmptyState';
import { IconArrowLeft, IconGift } from '../../../../../components/ui/icons';
import {
  campanhasApi,
  gruposApi,
  premiosApi,
  urlArquivoApi,
  ApiError,
  type Campanha,
  type Grupo,
  type Premio,
  type FormaVendaCotas,
} from '../../../../../lib/api';
import { formatarData, formatarMoeda, formatarStatusCampanha, formatarStatusVendasCampanha, formatarTelefone } from '../../../../../lib/format';
import { useSessaoAdministrador } from '../../../../../lib/auth';

const OPCOES_EXPIRACAO_RESERVA: { valor: string; label: string }[] = [
  { valor: 'SEM_EXPIRACAO', label: 'Sem expiração automática' },
  { valor: '5', label: '5 minutos' },
  { valor: '10', label: '10 minutos' },
  { valor: '30', label: '30 minutos' },
  { valor: '60', label: '1 hora' },
  { valor: '120', label: '2 horas' },
];

const TOM_STATUS: Record<string, 'accent' | 'neutral' | 'warning' | 'danger'> = {
  NOVO: 'neutral',
  AGUARDANDO_LIBERACAO: 'warning',
  LIBERADA: 'accent',
  LIBERADA_PARA_SORTEIO: 'warning',
  FINALIZADA: 'neutral',
};

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

function daquiA(dias: number): string {
  const data = new Date();
  data.setDate(data.getDate() + dias);
  return data.toISOString().slice(0, 10);
}

export default function DetalheCampanhaPage() {
  const { id } = useParams<{ id: string }>();
  const { sessao } = useSessaoAdministrador();
  const router = useRouter();
  const inputFotoRef = useRef<HTMLInputElement>(null);

  const [campanha, setCampanha] = useState<Campanha | null>(null);
  const [premios, setPremios] = useState<Premio[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [enviandoFoto, setEnviandoFoto] = useState(false);

  const recarregar = useCallback(() => {
    if (!sessao) return;
    campanhasApi.buscar(sessao.token, id).then(setCampanha);
    premiosApi.listar(sessao.token).then(setPremios);
  }, [sessao, id]);

  useEffect(() => {
    recarregar();
  }, [recarregar]);

  // Campanha liberada (ou já liberada para sorteio), e não removida, não tem mais nada
  // para editar aqui: as únicas ações desses estágios (confirmar pagamento, liberar
  // cotas, finalizar) vivem na tela de sorteio.
  useEffect(() => {
    if (
      campanha &&
      (campanha.status === 'LIBERADA' || campanha.status === 'LIBERADA_PARA_SORTEIO') &&
      !campanha.removidaEm
    ) {
      router.replace(`/admin/campanhas/${id}/sorteio`);
    }
  }, [campanha, id, router]);

  async function remover() {
    if (!sessao) return;
    if (
      !window.confirm(
        'Remover esta campanha? Ela some das ações do dia a dia, mas continua visível na lista de campanhas — você pode restaurá-la depois.',
      )
    ) {
      return;
    }
    setErro(null);
    setCarregando(true);
    try {
      await campanhasApi.remover(sessao.token, id);
      recarregar();
    } catch (excecao) {
      setErro(excecao instanceof ApiError ? excecao.message : 'Não foi possível remover a campanha.');
    } finally {
      setCarregando(false);
    }
  }

  async function restaurar() {
    if (!sessao) return;
    setErro(null);
    setCarregando(true);
    try {
      await campanhasApi.restaurar(sessao.token, id);
      recarregar();
    } catch (excecao) {
      setErro(excecao instanceof ApiError ? excecao.message : 'Não foi possível restaurar a campanha.');
    } finally {
      setCarregando(false);
    }
  }

  async function aoSelecionarFoto(evento: ChangeEvent<HTMLInputElement>) {
    const arquivo = evento.target.files?.[0] ?? null;
    evento.target.value = '';
    if (!arquivo || !sessao) return;

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

    setEnviandoFoto(true);
    try {
      await campanhasApi.enviarFoto(sessao.token, id, arquivoCorrigido);
      recarregar();
    } catch (excecao) {
      setErro(excecao instanceof ApiError ? excecao.message : 'Não foi possível enviar a imagem.');
    } finally {
      setEnviandoFoto(false);
    }
  }

  if (
    !campanha ||
    ((campanha.status === 'LIBERADA' || campanha.status === 'LIBERADA_PARA_SORTEIO') && !campanha.removidaEm)
  ) {
    return (
      <div className="flex justify-center py-16 text-muted">
        <Spinner />
      </div>
    );
  }

  const premiosDaCampanha = premios?.filter((premio) => campanha.premioIds.includes(premio.id)) ?? [];
  const premioPrincipal = premiosDaCampanha[0] ?? null;

  return (
    <div className="flex flex-col gap-6">
      <button
        onClick={() => router.push('/admin/campanhas')}
        className="flex items-center gap-1.5 text-sm font-medium text-muted hover:text-night"
      >
        <IconArrowLeft className="h-4 w-4" /> Voltar para campanhas
      </button>

      <PageHeader
        eyebrow="Campanha"
        title={campanha.nome}
        description={
          <div className="flex flex-wrap gap-2">
            <Badge tone={TOM_STATUS[campanha.status] ?? 'neutral'}>{formatarStatusCampanha(campanha.status)}</Badge>
            {campanha.removidaEm && <Badge tone="danger">Removida</Badge>}
          </div>
        }
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => router.push(`/admin/campanhas/${id}/sorteio`)}>
              Ver sorteio
            </Button>
            {campanha.removidaEm ? (
              <Button variant="secondary" loading={carregando} onClick={restaurar}>
                Restaurar campanha
              </Button>
            ) : (
              // Uma campanha finalizada não pode mais ser removida (nem editada, ver acima).
              campanha.status !== 'FINALIZADA' && (
                <Button variant="danger" loading={carregando} onClick={remover}>
                  Remover campanha
                </Button>
              )
            )}
          </div>
        }
      />

      {erro && <Alert tone="error">{erro}</Alert>}

      {campanha.removidaEm && (
        <Alert tone="error">
          Esta campanha foi removida em {formatarData(campanha.removidaEm)}. Ela continua na lista de campanhas,
          mas as ações abaixo ficam bloqueadas até ser restaurada.
        </Alert>
      )}

      <Card className="flex flex-col gap-4 sm:flex-row">
        <div className="relative aspect-square w-full shrink-0 overflow-hidden rounded-xl bg-mist sm:w-32">
          {campanha.fotoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- imagem vem da própria API ou de host externo
            <img
              src={urlArquivoApi(campanha.fotoUrl)}
              alt={campanha.nome}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted">
              <IconGift className="h-8 w-8" />
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-2">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted">
            {premioPrincipal ? premioPrincipal.nome : 'Sem prêmio associado'}
          </p>
          <p className="text-xs text-muted">
            JPEG, PNG, SVG, WEBP, GIF ou HEIC, até 3MB — exibida como um quadrado.
          </p>
          <div>
            <input
              ref={inputFotoRef}
              type="file"
              accept="image/jpeg,image/png,image/svg+xml,image/webp,image/gif,image/heic,image/heif"
              className="hidden"
              onChange={aoSelecionarFoto}
            />
            <Button
              type="button"
              variant="secondary"
              loading={enviandoFoto}
              onClick={() => inputFotoRef.current?.click()}
            >
              {campanha.fotoUrl ? 'Trocar imagem' : 'Selecionar imagem'}
            </Button>
          </div>
        </div>
      </Card>

      {!campanha.removidaEm && campanha.status === 'NOVO' ? (
        <FormularioEditarCampanha
          campanha={campanha}
          premios={premios}
          token={sessao?.token}
          aoConcluir={recarregar}
          aoErro={setErro}
        />
      ) : (
        <Card className="flex flex-col gap-3">
          <p className="text-sm text-muted">{campanha.descricao}</p>
          <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
            <div>
              <p className="font-mono text-xs uppercase text-muted">Cotas</p>
              <p className="text-night">{campanha.quantidadeCotas}</p>
            </div>
            <div>
              <p className="font-mono text-xs uppercase text-muted">Valor da cota</p>
              <p className="text-night">{formatarMoeda(campanha.valorCota)}</p>
            </div>
            <div>
              <p className="font-mono text-xs uppercase text-muted">Forma de venda</p>
              <p className="text-night">
                {campanha.formaVenda === 'ESCOLHA_NUMERO' ? 'Escolha de números' : 'Lote fechado'}
              </p>
            </div>
          </div>

          {campanha.grupoId && (
            <div className="grid grid-cols-2 gap-4 border-t border-line pt-3 text-sm sm:grid-cols-3">
              <div>
                <p className="font-mono text-xs uppercase text-muted">Status de vendas</p>
                <p className="text-night">{formatarStatusVendasCampanha(campanha.statusVendas)}</p>
              </div>
              {campanha.dataAberturaVendas && (
                <div>
                  <p className="font-mono text-xs uppercase text-muted">Abertura das vendas</p>
                  <p className="text-night">{formatarData(campanha.dataAberturaVendas)}</p>
                </div>
              )}
              {campanha.dataRealizacao && (
                <div>
                  <p className="font-mono text-xs uppercase text-muted">Data do sorteio</p>
                  <p className="text-night">{formatarData(campanha.dataRealizacao)}</p>
                </div>
              )}
            </div>
          )}
        </Card>
      )}

      {!campanha.removidaEm && campanha.status === 'AGUARDANDO_LIBERACAO' && (
        <FormularioLancar
          campanhaId={id}
          token={sessao?.token}
          aoConcluir={recarregar}
          aoErro={setErro}
        />
      )}

      {campanha.status === 'FINALIZADA' && campanha.cotaVencedoraNumero !== null && (
        <Card className="flex flex-col gap-1">
          <p className="font-mono text-xs uppercase tracking-wide text-muted">Vencedor</p>
          <p className="text-sm text-night">
            {campanha.vencedorNome} · Cota nº {campanha.cotaVencedoraNumero}
          </p>
          {campanha.vencedorTelefone && (
            <p className="font-mono text-xs text-muted">{formatarTelefone(campanha.vencedorTelefone)}</p>
          )}
        </Card>
      )}
    </div>
  );
}

function FormularioLancar({
  campanhaId,
  token,
  aoConcluir,
  aoErro,
}: {
  campanhaId: string;
  token?: string;
  aoConcluir: () => void;
  aoErro: (mensagem: string) => void;
}) {
  const [grupos, setGrupos] = useState<Grupo[] | null>(null);
  const [grupoId, setGrupoId] = useState('');
  const [dataAberturaVendas, setDataAberturaVendas] = useState(daquiA(0));
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!token) return;
    gruposApi.listar(token).then((lista) => {
      setGrupos(lista);
      if (lista.length > 0) setGrupoId(lista[0].id);
    });
  }, [token]);

  async function lancar(evento: FormEvent) {
    evento.preventDefault();
    if (!token || !grupoId) return;
    setEnviando(true);
    try {
      await gruposApi.lancarCampanha(token, grupoId, campanhaId, {
        dataAberturaVendas: new Date(dataAberturaVendas).toISOString(),
      });
      aoConcluir();
    } catch (excecao) {
      aoErro(excecao instanceof ApiError ? excecao.message : 'Não foi possível lançar a campanha.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Card className="flex flex-col gap-4">
      <p className="text-sm font-medium text-night">Lançar campanha</p>
      <p className="text-xs text-muted">
        Escolha o grupo que vai receber esta campanha e a data de abertura das vendas.
      </p>

      {grupos === null && (
        <div className="flex justify-center py-6 text-muted">
          <Spinner size={18} />
        </div>
      )}

      {grupos?.length === 0 && (
        <Alert tone="error">Cadastre um grupo de WhatsApp antes de lançar uma campanha.</Alert>
      )}

      {grupos && grupos.length > 0 && (
        <form onSubmit={lancar} className="flex flex-col gap-4">
          <SelectField label="Grupo" value={grupoId} onChange={(e) => setGrupoId(e.target.value)}>
            {grupos.map((grupo) => (
              <option key={grupo.id} value={grupo.id}>
                {grupo.nome}
              </option>
            ))}
          </SelectField>

          <TextField
            label="Abertura das vendas"
            type="date"
            required
            value={dataAberturaVendas}
            onChange={(e) => setDataAberturaVendas(e.target.value)}
          />

          <Button type="submit" loading={enviando} className="self-start">
            Lançar campanha
          </Button>
        </form>
      )}
    </Card>
  );
}

function FormularioEditarCampanha({
  campanha,
  premios,
  token,
  aoConcluir,
  aoErro,
}: {
  campanha: Campanha;
  premios: Premio[] | null;
  token?: string;
  aoConcluir: () => void;
  aoErro: (mensagem: string) => void;
}) {
  const [nome, setNome] = useState(campanha.nome);
  const [telefoneSuporte, setTelefoneSuporte] = useState(campanha.telefoneSuporte);
  const [descricao, setDescricao] = useState(campanha.descricao);
  const [quantidadeCotas, setQuantidadeCotas] = useState(String(campanha.quantidadeCotas));
  const [valorCota, setValorCota] = useState(String(campanha.valorCota));
  const [formaVenda, setFormaVenda] = useState<FormaVendaCotas>(campanha.formaVenda);
  const [quantidadeMinimaPorCompra, setQuantidadeMinimaPorCompra] = useState(
    String(campanha.quantidadeMinimaPorCompra),
  );
  const [quantidadeMaximaPorCompra, setQuantidadeMaximaPorCompra] = useState(
    campanha.quantidadeMaximaPorCompra ? String(campanha.quantidadeMaximaPorCompra) : '',
  );
  const [expiracaoReservaMinutos, setExpiracaoReservaMinutos] = useState(
    campanha.expiracaoReservaMinutos === null ? 'SEM_EXPIRACAO' : String(campanha.expiracaoReservaMinutos),
  );
  const [reservaExigeEmail, setReservaExigeEmail] = useState(campanha.reservaExigeEmail);
  const [reservaExigeNome, setReservaExigeNome] = useState(campanha.reservaExigeNome);
  const [reservaExigeTelefone, setReservaExigeTelefone] = useState(campanha.reservaExigeTelefone);
  const [reservaExigeConfirmacaoTelefone, setReservaExigeConfirmacaoTelefone] = useState(
    campanha.reservaExigeConfirmacaoTelefone,
  );
  const [premioIds, setPremioIds] = useState<string[]>(campanha.premioIds);
  const [enviando, setEnviando] = useState(false);
  const [marcandoRevisada, setMarcandoRevisada] = useState(false);

  function alternarPremio(premioId: string) {
    setPremioIds((atual) =>
      atual.includes(premioId) ? atual.filter((idAtual) => idAtual !== premioId) : [...atual, premioId],
    );
  }

  async function salvar(evento: FormEvent) {
    evento.preventDefault();
    if (!token) return;
    setEnviando(true);
    try {
      await campanhasApi.editar(token, campanha.id, {
        nome,
        descricao,
        telefoneSuporte,
        premioIds,
        quantidadeCotas: Number(quantidadeCotas),
        valorCota: Number(valorCota),
        formaVenda,
        quantidadeMinimaPorCompra: Number(quantidadeMinimaPorCompra),
        quantidadeMaximaPorCompra: quantidadeMaximaPorCompra ? Number(quantidadeMaximaPorCompra) : null,
        expiracaoReservaMinutos:
          expiracaoReservaMinutos === 'SEM_EXPIRACAO' ? null : Number(expiracaoReservaMinutos),
        reservaExigeEmail,
        reservaExigeNome,
        reservaExigeTelefone,
        reservaExigeConfirmacaoTelefone,
      });
      aoConcluir();
    } catch (excecao) {
      aoErro(excecao instanceof ApiError ? excecao.message : 'Não foi possível salvar as alterações.');
    } finally {
      setEnviando(false);
    }
  }

  async function marcarComoRevisada() {
    if (!token) return;
    setMarcandoRevisada(true);
    try {
      await campanhasApi.marcarComoRevisada(token, campanha.id);
      aoConcluir();
    } catch (excecao) {
      aoErro(excecao instanceof ApiError ? excecao.message : 'Não foi possível marcar a campanha como revisada.');
    } finally {
      setMarcandoRevisada(false);
    }
  }

  return (
    <form onSubmit={salvar} className="flex flex-col gap-4">
      <Card className="flex flex-col gap-4">
        <p className="text-sm font-medium text-night">Informações básicas</p>

        <TextField label="Nome da campanha" required value={nome} onChange={(e) => setNome(e.target.value)} />
        <TextField
          label="Telefone para suporte"
          required
          inputMode="numeric"
          placeholder="(11) 91234-5678"
          value={telefoneSuporte}
          onChange={(e) => setTelefoneSuporte(formatarTelefone(e.target.value))}
        />
        <TextAreaField
          label="Descrição / Regulamento"
          required
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
        />
      </Card>

      <Card className="flex flex-col gap-4">
        <p className="text-sm font-medium text-night">Cotas</p>

        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Quantidade de cotas"
            type="number"
            min={1}
            required
            value={quantidadeCotas}
            onChange={(e) => setQuantidadeCotas(e.target.value)}
          />
          <TextField
            label="Valor de cada cota (R$)"
            type="number"
            min={0.01}
            step="0.01"
            required
            value={valorCota}
            onChange={(e) => setValorCota(e.target.value)}
            hint={valorCota ? formatarMoeda(Number(valorCota)) : undefined}
          />
        </div>
      </Card>

      <Card className="flex flex-col gap-4">
        <p className="text-sm font-medium text-night">Forma de venda das cotas</p>
        <p className="text-xs text-muted">Defina como o comprador vai escolher as cotas na tela de compra.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setFormaVenda('ESCOLHA_NUMERO')}
            className={`rounded-xl border px-4 py-3 text-left transition ${
              formaVenda === 'ESCOLHA_NUMERO'
                ? 'border-accent-ink bg-accent/20'
                : 'border-line bg-white hover:border-accent-ink/60'
            }`}
          >
            <p className="text-sm font-semibold text-night">O comprador escolhe os números</p>
            <p className="mt-1 text-xs text-muted">
              Mapa de números disponíveis; o comprador seleciona manualmente (mínimo 1).
            </p>
          </button>
          <button
            type="button"
            onClick={() => setFormaVenda('LOTE_FECHADO')}
            className={`rounded-xl border px-4 py-3 text-left transition ${
              formaVenda === 'LOTE_FECHADO'
                ? 'border-accent-ink bg-accent/20'
                : 'border-line bg-white hover:border-accent-ink/60'
            }`}
          >
            <p className="text-sm font-semibold text-night">Lotes fechados</p>
            <p className="mt-1 text-xs text-muted">
              O comprador escolhe apenas a quantidade; os números são sorteados pelo sistema.
            </p>
          </button>
        </div>

        <div className="h-px bg-line" />

        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Quantidade mínima de cotas por compra"
            type="number"
            min={1}
            required
            value={quantidadeMinimaPorCompra}
            onChange={(e) => setQuantidadeMinimaPorCompra(e.target.value)}
          />
          <TextField
            label="Quantidade máxima de cotas por compra"
            type="number"
            min={1}
            value={quantidadeMaximaPorCompra}
            onChange={(e) => setQuantidadeMaximaPorCompra(e.target.value)}
            hint="Deixe em branco para não limitar."
          />
        </div>

        <SelectField
          label="Expiração da reserva"
          value={expiracaoReservaMinutos}
          onChange={(e) => setExpiracaoReservaMinutos(e.target.value)}
          hint="Tempo que o comprador tem para pagar antes da cota voltar a ficar disponível."
        >
          {OPCOES_EXPIRACAO_RESERVA.map((opcao) => (
            <option key={opcao.valor} value={opcao.valor}>
              {opcao.label}
            </option>
          ))}
        </SelectField>

        <div className="h-px bg-line" />

        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium text-night">Dados obrigatórios para reserva</p>
          <p className="text-xs text-muted">
            Escolha quais informações o comprador precisa preencher para reservar uma cota.
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            <CheckboxField
              label="Email"
              checked={reservaExigeEmail}
              onChange={(e) => setReservaExigeEmail(e.target.checked)}
            />
            <CheckboxField
              label="Nome"
              checked={reservaExigeNome}
              onChange={(e) => setReservaExigeNome(e.target.checked)}
            />
            <CheckboxField
              label="Telefone"
              checked={reservaExigeTelefone}
              onChange={(e) => setReservaExigeTelefone(e.target.checked)}
            />
            <CheckboxField
              label="Confirmação do telefone"
              checked={reservaExigeConfirmacaoTelefone}
              onChange={(e) => setReservaExigeConfirmacaoTelefone(e.target.checked)}
            />
          </div>
        </div>
      </Card>

      <Card className="flex flex-col gap-3">
        <p className="text-sm font-medium text-night">Prêmios</p>
        <p className="text-xs text-muted">Selecione um ou mais prêmios já cadastrados que serão sorteados aqui.</p>

        {premios === null && (
          <div className="flex justify-center py-6 text-muted">
            <Spinner size={18} />
          </div>
        )}

        {premios?.length === 0 && (
          <EmptyState
            title="Nenhum prêmio cadastrado"
            description="Cadastre um prêmio em Prêmios antes de editar esta campanha."
          />
        )}

        <div className="flex flex-col gap-2">
          {premios?.map((premio) => (
            <div key={premio.id} className="flex items-center justify-between rounded-lg border border-line px-3 py-2.5">
              <CheckboxField
                label={premio.nome}
                checked={premioIds.includes(premio.id)}
                onChange={() => alternarPremio(premio.id)}
              />
              <span className="font-mono text-xs text-muted">{formatarMoeda(premio.valor)}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card className="flex flex-col gap-3">
        <p className="text-sm text-muted">
          Revise o conteúdo da campanha acima. Depois de marcada como revisada, ela fica pronta para ser
          lançada para um grupo.
        </p>
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            loading={marcandoRevisada}
            onClick={marcarComoRevisada}
          >
            Marcar como revisada
          </Button>
          <Button type="submit" loading={enviando} disabled={premioIds.length === 0}>
            Salvar alterações
          </Button>
        </div>
      </Card>
    </form>
  );
}

