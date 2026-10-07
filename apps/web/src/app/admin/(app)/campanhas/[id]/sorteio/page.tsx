'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from '../../../../../../components/ui/PageHeader';
import { Card } from '../../../../../../components/ui/Card';
import { Button } from '../../../../../../components/ui/Button';
import { Alert } from '../../../../../../components/ui/Alert';
import { Badge } from '../../../../../../components/ui/Badge';
import { Spinner } from '../../../../../../components/ui/Spinner';
import { TextField } from '../../../../../../components/ui/Field';
import { EmptyState } from '../../../../../../components/ui/EmptyState';
import { IconArrowLeft, IconWhatsapp, IconGift, IconCheck, IconCopy } from '../../../../../../components/ui/icons';
import {
  campanhasApi,
  gruposApi,
  premiosApi,
  pagamentosApi,
  urlArquivoApi,
  ApiError,
  type Campanha,
  type DetalheGrupo,
  type Premio,
  type StatusCota,
  type CotaAdminResumo,
  type IdentificadorReserva,
  type PagamentoResumo,
} from '../../../../../../lib/api';
import {
  formatarExpiracaoReserva,
  formatarMoeda,
  formatarTelefone,
  formatarDataHora,
  formatarCpf,
} from '../../../../../../lib/format';
import { useSessaoAdministrador } from '../../../../../../lib/auth';

function linkWhatsapp(telefone: string): string {
  return `https://wa.me/55${telefone.replace(/\D/g, '')}`;
}

export default function SorteioCampanhaPage() {
  const { id } = useParams<{ id: string }>();
  const { sessao } = useSessaoAdministrador();
  const router = useRouter();

  const [campanha, setCampanha] = useState<Campanha | null>(null);
  const [grupo, setGrupo] = useState<DetalheGrupo | null>(null);
  const [premios, setPremios] = useState<Premio[] | null>(null);
  const [cotas, setCotas] = useState<CotaAdminResumo[] | null>(null);
  const [pagamentos, setPagamentos] = useState<PagamentoResumo[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [mostrarFinalizar, setMostrarFinalizar] = useState(false);
  const [processando, setProcessando] = useState<string | null>(null);
  const [linkCopiado, setLinkCopiado] = useState(false);
  const [descricaoCopiada, setDescricaoCopiada] = useState(false);
  const [fotoCopiada, setFotoCopiada] = useState(false);

  const recarregarCotas = useCallback(async () => {
    if (!sessao) return;
    const [cotasData, pagamentosData] = await Promise.all([
      campanhasApi.listarCotasAdmin(sessao.token, id),
      pagamentosApi.listarPagamentosCampanha(sessao.token, id),
    ]);
    setCotas(cotasData);
    setPagamentos(pagamentosData);
  }, [sessao, id]);

  const recarregar = useCallback(async () => {
    if (!sessao) return;
    const [campanhaData, premiosData] = await Promise.all([
      campanhasApi.buscar(sessao.token, id),
      premiosApi.listar(sessao.token),
    ]);
    setCampanha(campanhaData);
    setPremios(premiosData);
    if (campanhaData.grupoId) {
      setGrupo(await gruposApi.buscar(sessao.token, campanhaData.grupoId));
    }
    await recarregarCotas();
  }, [sessao, id, recarregarCotas]);

  useEffect(() => {
    recarregar();
  }, [recarregar]);

  const premiosDaCampanha = useMemo(
    () => premios?.filter((premio) => campanha?.premioIds.includes(premio.id)) ?? [],
    [premios, campanha],
  );
  const premioPrincipal = premiosDaCampanha[0] ?? null;

  const comprasPorComprador = useMemo(() => {
    if (!cotas) return [];
    const pagamentoPorNumero = new Map((pagamentos ?? []).map((pagamento) => [pagamento.numero, pagamento]));
    const mapa = new Map<string, Reserva>();
    for (const cota of cotas) {
      if (cota.status !== 'RESERVADA' && cota.status !== 'PAGA') continue;

      let chave: string;
      let identificador: IdentificadorReserva;
      let nome: string;
      let telefone: string;
      let ehConvidado = false;
      let cpf: string | null = null;

      if (cota.compradorId && cota.compradorNome && cota.compradorTelefone) {
        chave = `comprador:${cota.compradorId}`;
        identificador = { compradorId: cota.compradorId };
        nome = cota.compradorNome;
        telefone = cota.compradorTelefone;
      } else if (cota.tokenReservaConvidado) {
        // Reserva feita sem login (Link de Vendas): sem Comprador, o contato veio
        // direto na cota — ver ReservarLoteCotasConvidadoUseCase no backend.
        chave = `convidado:${cota.tokenReservaConvidado}`;
        identificador = { tokenReservaConvidado: cota.tokenReservaConvidado };
        nome = cota.convidadoNome ?? 'Convidado';
        telefone = cota.convidadoTelefone ?? '';
        ehConvidado = true;
        cpf = cota.convidadoCpf;
      } else {
        continue;
      }

      const existente = mapa.get(chave) ?? {
        chave,
        identificador,
        nome,
        telefone,
        ehConvidado,
        cpf,
        numerosReservados: [],
        numerosPagos: [],
        valorPago: 0,
        finalizadoPeloCompradorEm: null,
      };
      if (cota.status === 'RESERVADA') {
        existente.numerosReservados.push(cota.numero);
      } else {
        existente.numerosPagos.push(cota.numero);
      }
      const pagamento = pagamentoPorNumero.get(cota.numero);
      if (pagamento) {
        existente.valorPago += pagamento.valorPago;
        // Cotas de um mesmo lote são finalizadas juntas — qualquer uma serve.
        existente.finalizadoPeloCompradorEm ??= pagamento.finalizadoPeloCompradorEm;
      }
      mapa.set(chave, existente);
    }
    return Array.from(mapa.values()).sort((a, b) => a.nome.localeCompare(b.nome));
  }, [cotas, pagamentos]);

  async function confirmarPagamento(identificador: IdentificadorReserva, chave: string) {
    if (!sessao) return;
    setErro(null);
    setProcessando(chave);
    try {
      await campanhasApi.confirmarPagamentoManual(sessao.token, id, identificador);
      // Recarrega a campanha inteira (não só as cotas): confirmar o pagamento pode ser
      // a última cota em aberto, e o backend libera a campanha para sorteio automaticamente.
      await recarregar();
    } catch (excecao) {
      setErro(excecao instanceof ApiError ? excecao.message : 'Não foi possível confirmar o pagamento.');
    } finally {
      setProcessando(null);
    }
  }

  async function liberarCotasReservadas(identificador: IdentificadorReserva, chave: string) {
    if (!sessao) return;
    if (
      !window.confirm(
        'Liberar as cotas reservadas deste comprador? Elas voltam a ficar disponíveis para outros compradores.',
      )
    ) {
      return;
    }
    setErro(null);
    setProcessando(chave);
    try {
      // Liberar cotas nunca completa a campanha, então recarregar só as cotas já basta aqui.
      await campanhasApi.liberarCotasReservadas(sessao.token, id, identificador);
      await recarregarCotas();
    } catch (excecao) {
      setErro(excecao instanceof ApiError ? excecao.message : 'Não foi possível liberar as cotas.');
    } finally {
      setProcessando(null);
    }
  }

  if (!campanha || !cotas) {
    return (
      <div className="flex justify-center py-16 text-muted">
        <Spinner />
      </div>
    );
  }

  const totalCotas = campanha.quantidadeCotas;
  const totalPagas = cotas.filter((cota) => cota.status === 'PAGA').length;
  const totalReservadas = cotas.filter((cota) => cota.status === 'RESERVADA').length;
  const pctPagas = totalCotas ? (totalPagas / totalCotas) * 100 : 0;
  const pctReservadas = totalCotas ? (totalReservadas / totalCotas) * 100 : 0;

  // Campanha liberada (ou já liberada para sorteio) não tem mais uma tela de detalhe
  // própria (redireciona para cá); voltar deve ir para a lista. Os demais status ainda
  // têm a tela de detalhe.
  const emSorteio = campanha.status === 'LIBERADA' || campanha.status === 'LIBERADA_PARA_SORTEIO';
  const rotaVoltar = emSorteio && !campanha.removidaEm ? '/admin/campanhas' : `/admin/campanhas/${id}`;

  const linkVendas = `${window.location.origin}/campanhas/${campanha.id}`;

  function copiarLinkVendas() {
    navigator.clipboard?.writeText(linkVendas);
    setLinkCopiado(true);
  }

  const descricaoCampanha = campanha.descricao;
  const fotoCampanhaUrl = campanha.fotoUrl ?? premioPrincipal?.fotoUrl ?? null;

  function copiarDescricao() {
    navigator.clipboard?.writeText(descricaoCampanha);
    setDescricaoCopiada(true);
  }

  /**
   * Copia só a foto (sem o texto junto): apps como o WhatsApp, ao colar um
   * clipboard que tem imagem E texto ao mesmo tempo, descartam o texto e
   * anexam só a imagem — foi exatamente esse bug relatado. Por isso a foto e
   * a descrição viram duas ações separadas: cola a foto primeiro (abre o
   * anexo no WhatsApp), depois cola a descrição já copiada como legenda.
   * Precisa reconverter pra PNG: a Clipboard API só aceita esse formato pra
   * imagens de forma confiável entre navegadores, então uma foto enviada
   * como JPEG/WEBP/etc. precisa passar por um canvas antes.
   */
  async function copiarFoto() {
    if (!fotoCampanhaUrl) return;
    setErro(null);
    try {
      const resposta = await fetch(urlArquivoApi(fotoCampanhaUrl));
      if (!resposta.ok) throw new Error('Não foi possível carregar a imagem da campanha.');
      const bitmap = await createImageBitmap(await resposta.blob());

      const canvas = document.createElement('canvas');
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const contexto = canvas.getContext('2d');
      if (!contexto) throw new Error('Não foi possível preparar a imagem para copiar.');
      contexto.drawImage(bitmap, 0, 0);

      const blobPng = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (!blobPng) throw new Error('Não foi possível preparar a imagem para copiar.');

      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blobPng })]);
      setFotoCopiada(true);
    } catch {
      setErro('Seu navegador não permite copiar essa imagem. Baixe a foto da campanha e anexe manualmente.');
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <button
        onClick={() => router.push(rotaVoltar)}
        className="flex items-center gap-1.5 text-sm font-medium text-muted hover:text-night"
      >
        <IconArrowLeft className="h-4 w-4" />{' '}
        {rotaVoltar === '/admin/campanhas' ? 'Voltar para campanhas' : 'Voltar para a campanha'}
      </button>

      <PageHeader
        eyebrow="Sorteio"
        title={campanha.nome}
        action={
          campanha.status === 'LIBERADA_PARA_SORTEIO' &&
          !mostrarFinalizar && (
            <Button onClick={() => setMostrarFinalizar(true)}>Realizar Sorteio</Button>
          )
        }
      />

      {erro && <Alert tone="error">{erro}</Alert>}

      {/* Seção 1 — informações do sorteio */}
      <Card className="flex flex-col gap-4 sm:flex-row">
        <div className="relative h-40 w-full shrink-0 overflow-hidden rounded-xl bg-mist sm:h-32 sm:w-32">
          {campanha.fotoUrl || premioPrincipal?.fotoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- imagem da campanha ou do prêmio, vem da API ou de host externo
            <img
              src={urlArquivoApi(campanha.fotoUrl ?? premioPrincipal!.fotoUrl!)}
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
            {premioPrincipal ? premioPrincipal.nome : 'Prêmio'}
          </p>
          <p className="text-sm text-night">{premioPrincipal?.descricao ?? campanha.descricao}</p>
          {premiosDaCampanha.length > 1 && (
            <p className="text-xs text-muted">
              + {premiosDaCampanha.length - 1} prêmio{premiosDaCampanha.length - 1 > 1 ? 's' : ''} adicional
              {premiosDaCampanha.length - 1 > 1 ? 'is' : ''}
            </p>
          )}
          <div className="mt-1">
            {grupo ? (
              <Badge tone="accent">{grupo.nome}</Badge>
            ) : (
              <Badge tone="neutral">Sem grupo vinculado</Badge>
            )}
          </div>
        </div>
      </Card>

      {/* Seção 1b — dados da campanha, somente leitura (não editável nesta etapa) */}
      <Card className="flex flex-col gap-3">
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
            <p className="font-mono text-xs uppercase text-muted">Expiração da reserva</p>
            <p className="text-night">{formatarExpiracaoReserva(campanha.expiracaoReservaMinutos)}</p>
          </div>
        </div>

        <div className="border-t border-line pt-3">
          <p className="mb-2 font-mono text-xs uppercase text-muted">Prêmios</p>
          <div className="flex flex-col gap-2">
            {premiosDaCampanha.map((premio) => (
              <div
                key={premio.id}
                className="flex items-center justify-between rounded-lg border border-line px-3 py-2.5 text-sm"
              >
                <span className="text-night">{premio.nome}</span>
                <span className="font-mono text-xs text-muted">{formatarMoeda(premio.valor)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-line pt-3">
          <p className="mb-2 font-mono text-xs uppercase text-muted">Link de Vendas</p>
          <p className="mb-2 text-xs text-muted">
            Link exibido ao comprador para acessar e comprar cotas desta campanha.
          </p>
          <div className="flex items-center gap-2">
            <p className="flex-1 truncate rounded-lg border border-line bg-mist px-3 py-2.5 font-mono text-xs text-night">
              {linkVendas}
            </p>
            <button
              type="button"
              onClick={copiarLinkVendas}
              className="flex shrink-0 items-center gap-1.5 rounded-xl border border-line bg-white px-3 py-2.5 text-xs font-semibold text-night transition hover:border-night/30"
            >
              <IconCopy className="h-4 w-4" /> {linkCopiado ? 'Copiado!' : 'Copiar'}
            </button>
          </div>
        </div>

        <div className="border-t border-line pt-3">
          <p className="mb-2 font-mono text-xs uppercase text-muted">Descrição</p>
          <p className="mb-2 text-xs text-muted">
            {fotoCampanhaUrl
              ? 'No WhatsApp, colar foto e texto juntos faz o texto ser descartado — por isso são duas cópias separadas: cole a foto primeiro (abre o anexo) e depois cole a descrição como legenda.'
              : 'Texto exibido ao comprador na campanha — útil para reenviar a divulgação no grupo.'}
          </p>
          <div className="flex flex-col items-stretch gap-2">
            <p className="max-h-40 overflow-y-auto whitespace-pre-wrap rounded-lg border border-line bg-mist px-3 py-2.5 font-mono text-xs text-night">
              {campanha.descricao}
            </p>
            <div className="flex flex-wrap gap-2">
              {fotoCampanhaUrl && (
                <button
                  type="button"
                  onClick={copiarFoto}
                  className="flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-line bg-white px-3 py-2.5 text-xs font-semibold text-night transition hover:border-night/30"
                >
                  <IconCopy className="h-4 w-4" /> {fotoCopiada ? 'Foto copiada!' : '1. Copiar foto'}
                </button>
              )}
              <button
                type="button"
                onClick={copiarDescricao}
                className="flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-line bg-white px-3 py-2.5 text-xs font-semibold text-night transition hover:border-night/30"
              >
                <IconCopy className="h-4 w-4" />{' '}
                {descricaoCopiada ? 'Copiado!' : fotoCampanhaUrl ? '2. Copiar descrição' : 'Copiar descrição'}
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Seção 2 — progresso de cotas vendidas */}
      <Card className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <p className="text-sm font-medium text-night">Cotas vendidas</p>
          <p className="font-mono text-sm text-muted">
            {totalPagas} de {totalCotas} pagas
            {totalReservadas > 0 && ` · ${totalReservadas} aguardando confirmação`}
          </p>
        </div>
        <div className="flex h-3 w-full overflow-hidden rounded-full bg-mist">
          <div className="h-full bg-accent" style={{ width: `${pctPagas}%` }} />
          <div className="h-full bg-amber-400" style={{ width: `${pctReservadas}%` }} />
        </div>
        <div className="flex flex-wrap gap-4 text-xs text-muted">
          <LegendaItem cor="bg-accent" label="Pagas" />
          <LegendaItem cor="bg-amber-400" label="Reservadas" />
          <LegendaItem cor="bg-mist border border-line" label="Disponíveis" />
        </div>
      </Card>

      {/* Seção 3 — cotas compradas (reservadas aguardando confirmação e já pagas) */}
      <Card className="flex flex-col gap-4">
        <p className="text-sm font-medium text-night">Cotas compradas</p>

        {comprasPorComprador.length === 0 ? (
          <EmptyState
            title="Nenhuma cota comprada"
            description="Assim que compradores reservarem ou pagarem cotas, eles aparecem aqui."
          />
        ) : (
          <>
            {/* Mobile: lista de cards — uma tabela larga não cabe na tela e escondia os botões de ação */}
            <div className="flex flex-col gap-3 sm:hidden">
              {comprasPorComprador.map((reserva) => (
                <div key={reserva.chave} className="flex flex-col gap-3 rounded-xl border border-line p-4">
                  <div>
                    <p className="font-medium text-night">
                      {reserva.nome} {reserva.ehConvidado && <Badge tone="neutral">Sem conta</Badge>}
                    </p>
                    {reserva.telefone && (
                      <p className="font-mono text-xs text-muted">{formatarTelefone(reserva.telefone)}</p>
                    )}
                    {reserva.cpf && <p className="font-mono text-xs text-muted">CPF {formatarCpf(reserva.cpf)}</p>}
                  </div>
                  <NumerosComprados reservados={reserva.numerosReservados} pagos={reserva.numerosPagos} />
                  <InfoPagamento reserva={reserva} />
                  <AcoesReserva
                    reserva={reserva}
                    onConfirmar={confirmarPagamento}
                    onLiberar={liberarCotasReservadas}
                    carregando={processando === reserva.chave}
                    fullWidth
                  />
                </div>
              ))}
            </div>

            {/* Telas maiores: tabela */}
            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full min-w-[640px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                    <th className="py-2 pr-4 font-mono font-medium">Comprador</th>
                    <th className="py-2 pr-4 font-mono font-medium">Telefone</th>
                    <th className="py-2 pr-4 font-mono font-medium">Cotas</th>
                    <th className="py-2 pr-4 font-mono font-medium">Pagamento</th>
                    <th className="py-2 pr-4 font-mono font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {comprasPorComprador.map((reserva) => (
                    <tr key={reserva.chave} className="border-b border-line last:border-0">
                      <td className="py-3 pr-4 font-medium text-night">
                        {reserva.nome} {reserva.ehConvidado && <Badge tone="neutral">Sem conta</Badge>}
                        {reserva.cpf && (
                          <p className="font-mono text-xs font-normal text-muted">CPF {formatarCpf(reserva.cpf)}</p>
                        )}
                      </td>
                      <td className="py-3 pr-4 font-mono text-xs text-muted">
                        {reserva.telefone ? formatarTelefone(reserva.telefone) : '—'}
                      </td>
                      <td className="py-3 pr-4">
                        <NumerosComprados reservados={reserva.numerosReservados} pagos={reserva.numerosPagos} />
                      </td>
                      <td className="py-3 pr-4">
                        <InfoPagamento reserva={reserva} />
                      </td>
                      <td className="py-3 pr-4">
                        <AcoesReserva
                          reserva={reserva}
                          onConfirmar={confirmarPagamento}
                          onLiberar={liberarCotasReservadas}
                          carregando={processando === reserva.chave}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>

      {/* Mapa de cotas */}
      <Card className="flex flex-col gap-4">
        <p className="text-sm font-medium text-night">Mapa de cotas</p>
        <div className="flex flex-wrap gap-4 text-xs text-muted">
          <LegendaItem cor="bg-white border border-line" label="Disponível" />
          <LegendaItem cor="bg-amber-400" label="Reservada — aguardando confirmação" />
          <LegendaItem cor="bg-accent" label="Paga" />
        </div>
        <div className="grid grid-cols-8 gap-2 sm:grid-cols-10 md:grid-cols-12">
          {cotas.map((cota) => (
            <CelulaCota key={cota.numero} cota={cota} />
          ))}
        </div>
      </Card>

      {campanha.status === 'LIBERADA_PARA_SORTEIO' && mostrarFinalizar && (
        <FormularioFinalizar
          campanhaId={id}
          cotas={cotas}
          token={sessao?.token}
          aoConcluir={recarregar}
          aoErro={setErro}
        />
      )}
    </div>
  );
}

function FormularioFinalizar({
  campanhaId,
  cotas,
  token,
  aoConcluir,
  aoErro,
}: {
  campanhaId: string;
  cotas: CotaAdminResumo[];
  token?: string;
  aoConcluir: () => void;
  aoErro: (mensagem: string) => void;
}) {
  const [cotaVencedoraNumero, setCotaVencedoraNumero] = useState('');
  const [vencedorNome, setVencedorNome] = useState('');
  const [vencedorTelefone, setVencedorTelefone] = useState('');
  const [enviando, setEnviando] = useState(false);

  // Já que a cota vencedora precisa estar paga, o comprador dela já é conhecido —
  // pré-preenche nome/telefone a partir da cota informada, mas o admin pode corrigir.
  function aoMudarCotaVencedora(valor: string) {
    setCotaVencedoraNumero(valor);
    const cota = cotas.find((item) => item.numero === Number(valor) && item.status === 'PAGA');
    if (cota) {
      const nome = cota.compradorNome ?? cota.convidadoNome;
      const telefone = cota.compradorTelefone ?? cota.convidadoTelefone;
      setVencedorNome(nome ?? '');
      setVencedorTelefone(telefone ? formatarTelefone(telefone) : '');
    }
  }

  async function confirmar() {
    if (!token) return;
    const numero = Number(cotaVencedoraNumero);
    if (!numero || numero < 1) {
      aoErro('Informe o número da cota vencedora.');
      return;
    }
    if (!vencedorNome.trim()) {
      aoErro('Informe o nome do vencedor.');
      return;
    }
    if (!vencedorTelefone.trim()) {
      aoErro('Informe o telefone do vencedor.');
      return;
    }
    setEnviando(true);
    try {
      await campanhasApi.finalizar(token, campanhaId, {
        cotaVencedoraNumero: numero,
        vencedorNome,
        vencedorTelefone,
      });
      aoConcluir();
    } catch (excecao) {
      aoErro(excecao instanceof ApiError ? excecao.message : 'Não foi possível finalizar a campanha.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Card className="flex flex-col gap-3">
      <p className="text-sm font-medium text-night">Finalizar campanha</p>
      <p className="text-xs text-muted">
        Todas as cotas foram pagas. Informe o número da cota vencedora — o nome e o telefone
        são preenchidos automaticamente a partir do comprador dela e não podem ser editados.
      </p>
      <div className="grid gap-3 sm:grid-cols-3">
        <TextField
          label="Número da cota vencedora"
          type="number"
          min={1}
          value={cotaVencedoraNumero}
          onChange={(e) => aoMudarCotaVencedora(e.target.value)}
        />
        <TextField
          label="Nome do vencedor"
          value={vencedorNome}
          disabled
          hint="Preenchido automaticamente"
        />
        <TextField
          label="Telefone do vencedor"
          value={vencedorTelefone}
          disabled
          hint="Preenchido automaticamente"
        />
      </div>
      <Button loading={enviando} onClick={confirmar} className="self-start">
        Finalizar campanha
      </Button>
    </Card>
  );
}

interface Reserva {
  chave: string;
  identificador: IdentificadorReserva;
  nome: string;
  telefone: string;
  ehConvidado: boolean;
  cpf: string | null;
  numerosReservados: number[];
  numerosPagos: number[];
  valorPago: number;
  finalizadoPeloCompradorEm: string | null;
}

function ListaNumeros({ label, numeros }: { label: string; numeros: number[] }) {
  const numerosOrdenados = numeros.slice().sort((a, b) => a - b);
  const numerosExibidos = numerosOrdenados.slice(0, 6);
  const restante = numerosOrdenados.length - numerosExibidos.length;

  return (
    <div>
      <p className="text-xs text-muted">
        {label} · {numerosOrdenados.length} cota{numerosOrdenados.length > 1 ? 's' : ''}
      </p>
      <p className="font-mono text-xs text-night">
        Nº {numerosExibidos.join(', ')}
        {restante > 0 && ` +${restante}`}
      </p>
    </div>
  );
}

function NumerosComprados({ reservados, pagos }: { reservados: number[]; pagos: number[] }) {
  return (
    <div className="flex flex-col gap-2">
      {pagos.length > 0 && <ListaNumeros label="Pagas" numeros={pagos} />}
      {reservados.length > 0 && <ListaNumeros label="Reservadas" numeros={reservados} />}
    </div>
  );
}

/** Coluna "Pagamento": valor cobrado e quando o comprador clicou em "Finalizar compra" na tela dele. */
function InfoPagamento({ reserva }: { reserva: Reserva }) {
  if (reserva.valorPago <= 0) {
    return <span className="text-xs text-muted">Sem cobrança gerada</span>;
  }

  return (
    <div>
      <p className="font-mono text-xs text-night">{formatarMoeda(reserva.valorPago)}</p>
      <p className="text-xs text-muted">
        {reserva.finalizadoPeloCompradorEm
          ? formatarDataHora(reserva.finalizadoPeloCompradorEm)
          : 'Ainda não finalizada'}
      </p>
    </div>
  );
}

function AcoesReserva({
  reserva,
  onConfirmar,
  onLiberar,
  carregando = false,
  fullWidth = false,
}: {
  reserva: Reserva;
  onConfirmar: (identificador: IdentificadorReserva, chave: string) => void;
  onLiberar: (identificador: IdentificadorReserva, chave: string) => void;
  carregando?: boolean;
  fullWidth?: boolean;
}) {
  const semReservaPendente = reserva.numerosReservados.length === 0;

  return (
    <div className={`flex flex-wrap items-center gap-2 ${fullWidth ? 'flex-col items-stretch' : ''}`}>
      {semReservaPendente ? (
        <span className="inline-flex items-center gap-1.5 rounded-xl border border-accent/30 bg-accent/15 px-3 py-2 text-xs font-semibold text-accent-ink">
          <IconCheck className="h-4 w-4" />
          Pagamento confirmado
        </span>
      ) : (
        <>
          <Button
            className="px-3 py-2 text-xs"
            loading={carregando}
            onClick={() => onConfirmar(reserva.identificador, reserva.chave)}
          >
            Confirmar pagamento
          </Button>
          <Button
            variant="danger"
            className="px-3 py-2 text-xs"
            loading={carregando}
            onClick={() => onLiberar(reserva.identificador, reserva.chave)}
          >
            Liberar cotas reservadas
          </Button>
        </>
      )}
      {reserva.telefone && (
        <a
          href={linkWhatsapp(reserva.telefone)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-line bg-white px-3 py-2 text-xs font-semibold text-night transition hover:border-night/30"
        >
          <IconWhatsapp className="h-4 w-4" />
          WhatsApp
        </a>
      )}
    </div>
  );
}

function LegendaItem({ cor, label }: { cor: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-3 w-3 rounded ${cor}`} />
      {label}
    </span>
  );
}

function CelulaCota({ cota }: { cota: CotaAdminResumo }) {
  const CLASSES: Record<StatusCota, string> = {
    DISPONIVEL: 'bg-white text-night border border-line',
    RESERVADA: 'bg-amber-400 text-amber-950 border border-amber-500',
    PAGA: 'bg-accent text-ink border border-accent-ink/30',
    CANCELADA_REEMBOLSADA: 'bg-mist text-muted border border-line line-through',
  };

  return (
    <div
      className={`flex aspect-square items-center justify-center rounded-lg font-mono text-xs font-medium ${CLASSES[cota.status]}`}
      title={cota.compradorNome ?? cota.convidadoNome ?? undefined}
    >
      {cota.numero}
    </div>
  );
}
