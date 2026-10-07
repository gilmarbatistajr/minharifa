'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from '../../../../components/ui/PageHeader';
import { Card, TicketCard } from '../../../../components/ui/Card';
import { Badge } from '../../../../components/ui/Badge';
import { Button } from '../../../../components/ui/Button';
import { Alert } from '../../../../components/ui/Alert';
import { Spinner } from '../../../../components/ui/Spinner';
import { TextField, PhoneField } from '../../../../components/ui/Field';
import { IconGift, IconWhatsapp } from '../../../../components/ui/icons';
import {
  campanhasApi,
  urlArquivoApi,
  ApiError,
  type CotaResumo,
  type Campanha,
  type CampanhaPublica,
} from '../../../../lib/api';
import { formatarCpf, formatarMoeda, formatarTelefone } from '../../../../lib/format';
import { validarEmail, validarCelular, validarCpf } from '../../../../lib/validacoes-chave-pix';
import { useSessaoCompradorOpcional } from '../../../../lib/auth';

const LOTES_PRESET = [1, 5, 10, 15, 20, 25, 30];
const QUANTIDADE_LOTE_PADRAO = 5;

/** A página funciona tanto logado (dados completos) quanto pelo Link de
 * Vendas sem conta (dados públicos) — só os campos usados aqui importam. */
type CampanhaExibicao = Campanha | CampanhaPublica;

export default function DetalheCampanhaPage() {
  const { id } = useParams<{ id: string }>();
  const { sessao, pronto } = useSessaoCompradorOpcional();
  const router = useRouter();

  const [campanha, setCampanha] = useState<CampanhaExibicao | null>(null);
  const [cotas, setCotas] = useState<CotaResumo[] | null>(null);
  const [carregandoDados, setCarregandoDados] = useState(true);

  const [selecionados, setSelecionados] = useState<Set<number>>(new Set());
  const [quantidadeLote, setQuantidadeLote] = useState(QUANTIDADE_LOTE_PADRAO);

  const [erro, setErro] = useState<string | null>(null);
  const [reservando, setReservando] = useState(false);
  const [cancelando, setCancelando] = useState(false);

  // Checkout sem login: em vez de mandar pro /entrar, "Confirmar cotas" abre
  // este formulário pedindo só os dados marcados como obrigatórios na
  // campanha (reservaExige*) — ver reservarComoConvidado.
  const [mostrarFormularioConvidado, setMostrarFormularioConvidado] = useState(false);
  const [nomeConvidado, setNomeConvidado] = useState('');
  const [emailConvidado, setEmailConvidado] = useState('');
  const [telefoneConvidado, setTelefoneConvidado] = useState('');
  const [confirmacaoTelefoneConvidado, setConfirmacaoTelefoneConvidado] = useState('');
  const [cpfConvidado, setCpfConvidado] = useState('');

  // Mesma máscara/validação de formato usada na chave Pix (celular/e-mail) —
  // só acende depois que o campo já tem conteúdo, pra não gritar "inválido"
  // com o campo ainda vazio.
  const erroEmailConvidado =
    emailConvidado.trim() && !validarEmail(emailConvidado) ? 'Informe um e-mail válido.' : undefined;
  const erroTelefoneConvidado =
    telefoneConvidado.trim() && !validarCelular(telefoneConvidado)
      ? 'Informe um celular válido, com DDD — (11) 91234-5678.'
      : undefined;
  const erroCpfConvidado =
    cpfConvidado.trim() && !validarCpf(cpfConvidado) ? 'Esse CPF não é válido.' : undefined;
  const erroConfirmacaoTelefoneConvidado =
    confirmacaoTelefoneConvidado.trim() && confirmacaoTelefoneConvidado !== telefoneConvidado
      ? 'A confirmação não confere com o telefone informado.'
      : undefined;

  const formaVenda = campanha?.formaVenda ?? 'ESCOLHA_NUMERO';
  const mapaInterativo = formaVenda === 'ESCOLHA_NUMERO';
  const vendasEncerradas = campanha?.status === 'LIBERADA_PARA_SORTEIO';
  const finalizada = campanha?.status === 'FINALIZADA';
  // Sem um máximo configurado na campanha, o teto de cotas por compra é o
  // total de cotas dela — nunca é permitido comprar mais do que isso.
  const quantidadeMaximaPorCompra = campanha
    ? campanha.quantidadeMaximaPorCompra ?? campanha.quantidadeCotas
    : null;

  async function carregar() {
    if (sessao) {
      const [campanhas, mapaCotas] = await Promise.all([
        campanhasApi.visiveis(sessao.token),
        campanhasApi.listarCotas(sessao.token, id),
      ]);
      const campanhaAtual = campanhas.find((c) => c.id === id) ?? null;
      setCampanha(campanhaAtual);
      setCotas(mapaCotas);
      return { campanha: campanhaAtual, cotas: mapaCotas };
    }

    // Sem sessão: é o Link de Vendas aberto sem conta — mesmo mapa de cotas,
    // só que sem "minha cota"/reserva (ainda não existe uma identidade de
    // comprador aqui).
    try {
      const [campanhaPublica, mapaCotasPublico] = await Promise.all([
        campanhasApi.buscarPublica(id),
        campanhasApi.listarCotasPublicas(id),
      ]);
      const mapaCotas: CotaResumo[] = mapaCotasPublico.map((cota) => ({
        ...cota,
        minhaCota: false,
        reservaExpiraEm: null,
      }));
      setCampanha(campanhaPublica);
      setCotas(mapaCotas);
      return { campanha: campanhaPublica as CampanhaExibicao, cotas: mapaCotas };
    } catch {
      setCampanha(null);
      setCotas(null);
      return null;
    }
  }

  function irParaPagamentoComCotas(
    campanhaAtual: CampanhaExibicao,
    numeros: number[],
    reservaExpiraEm: string | null,
    opcoes: { metodo?: 'push' | 'replace'; tokenConvidado?: string } = {},
  ) {
    const { metodo = 'push', tokenConvidado } = opcoes;
    const parametros = new URLSearchParams({
      numeros: numeros.slice().sort((a, b) => a - b).join(','),
      telefoneSuporte: campanhaAtual.telefoneSuporte,
      nomeCampanha: campanhaAtual.nome,
    });
    if (reservaExpiraEm) parametros.set('expira', reservaExpiraEm);
    if (tokenConvidado) parametros.set('tokenConvidado', tokenConvidado);
    router[metodo](`/campanhas/${id}/pagamento?${parametros.toString()}`);
  }

  useEffect(() => {
    if (!pronto) return;
    let cancelado = false;
    async function iniciar() {
      const resultado = await carregar();
      if (cancelado || !resultado) {
        setCarregandoDados(false);
        return;
      }
      // Vendas encerradas (todas as cotas já pagas, aguardando o sorteio):
      // pra quem já está logado não há mais nada a fazer aqui, então volta
      // pra lista. Anônimo não tem lista pra voltar — fica na própria
      // página, que mostra o aviso de vendas encerradas.
      if (sessao && resultado.campanha?.status === 'LIBERADA_PARA_SORTEIO') {
        router.replace('/campanhas');
        return;
      }
      setCarregandoDados(false);
    }
    iniciar();
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessao, pronto, id]);

  const minhasCotasReservadas = useMemo(
    () => cotas?.filter((cota) => cota.minhaCota && cota.status === 'RESERVADA').map((cota) => cota.numero) ?? [],
    [cotas],
  );

  const minhasCotasPagas = useMemo(
    () => cotas?.filter((cota) => cota.minhaCota && cota.status === 'PAGA').map((cota) => cota.numero) ?? [],
    [cotas],
  );

  // Com uma reserva ativa aguardando confirmação de pagamento, não faz
  // sentido oferecer a compra de mais cotas — o comprador só tem duas ações
  // possíveis: ir pagar a reserva atual ou cancelá-la. Vendas encerradas
  // (só é possível saber isso sem sessão, já que logado é redirecionado)
  // ou campanha já finalizada (com vencedor definido) também bloqueiam
  // novas seleções.
  const podeComprarMais = minhasCotasReservadas.length === 0 && !vendasEncerradas && !finalizada;

  // Quantidade prestes a ser reservada: no modo manual é o que já foi tocado
  // no mapa, no modo lote é o valor configurado no seletor (é exatamente o
  // que "Confirmar cotas" reserva ao ser clicado).
  const quantidadeSelecionada = podeComprarMais
    ? formaVenda === 'ESCOLHA_NUMERO'
      ? selecionados.size
      : quantidadeLote
    : 0;
  const valorTotalSelecionado = campanha ? quantidadeSelecionada * campanha.valorCota : 0;

  function alternarSelecao(numero: number) {
    setSelecionados((atual) => {
      const proximo = new Set(atual);
      if (proximo.has(numero)) {
        proximo.delete(numero);
        return proximo;
      }
      if (quantidadeMaximaPorCompra !== null && proximo.size >= quantidadeMaximaPorCompra) {
        setErro(`A compra máxima nesta campanha é de ${quantidadeMaximaPorCompra} cota(s).`);
        return proximo;
      }
      proximo.add(numero);
      return proximo;
    });
  }

  function escolherQuantidadeLote(quantidade: number) {
    const limite = quantidadeMaximaPorCompra ?? quantidade;
    setQuantidadeLote(Math.min(quantidade, limite));
  }

  function ajustarQuantidadeLote(delta: number) {
    setQuantidadeLote((atual) => {
      const limite = quantidadeMaximaPorCompra ?? Infinity;
      return Math.min(limite, Math.max(1, atual + delta));
    });
  }

  // Ação única do botão "Confirmar cotas": sorteia (no modo lote) e já
  // reserva de uma vez — nada é salvo antes de clicar aqui. Sem sessão, abre
  // o formulário de convidado em vez de reservar direto — ver
  // reservarComoConvidado.
  async function confirmarCotas() {
    const modoManual = formaVenda === 'ESCOLHA_NUMERO';

    if (modoManual && selecionados.size === 0) {
      setErro('Selecione pelo menos um número disponível.');
      return;
    }

    if (!sessao) {
      setErro(null);
      setMostrarFormularioConvidado(true);
      return;
    }

    setErro(null);
    setReservando(true);
    try {
      const escolha = modoManual
        ? { numeros: Array.from(selecionados) }
        : { quantidadeAleatoria: quantidadeLote };
      const reserva = await campanhasApi.reservarLote(sessao.token, id, escolha);
      setSelecionados(new Set());
      if (campanha) {
        irParaPagamentoComCotas(campanha, reserva.numeros, reserva.reservaExpiraEm);
        return;
      }
      await carregar();
    } catch (excecao) {
      setErro(excecao instanceof ApiError ? excecao.message : 'Não foi possível reservar as cotas.');
    } finally {
      setReservando(false);
    }
  }

  // Conclui o checkout sem login: reserva as cotas guardando o contato
  // informado direto nelas (sem criar conta) e já segue pro pagamento com o
  // token da reserva — ver ReservarLoteCotasConvidadoUseCase no backend.
  async function reservarComoConvidado() {
    if (!campanha) return;
    const modoManual = formaVenda === 'ESCOLHA_NUMERO';

    if (campanha.reservaExigeNome && !nomeConvidado.trim()) {
      setErro('Informe seu nome para reservar.');
      return;
    }
    if (campanha.reservaExigeEmail) {
      if (!emailConvidado.trim()) {
        setErro('Informe seu e-mail para reservar.');
        return;
      }
      if (erroEmailConvidado) {
        setErro(erroEmailConvidado);
        return;
      }
    }
    if (campanha.reservaExigeTelefone) {
      if (!telefoneConvidado.trim()) {
        setErro('Informe seu telefone para reservar.');
        return;
      }
      if (erroTelefoneConvidado) {
        setErro(erroTelefoneConvidado);
        return;
      }
    }
    if (campanha.reservaExigeConfirmacaoTelefone) {
      if (!confirmacaoTelefoneConvidado.trim()) {
        setErro('Confirme seu telefone para reservar.');
        return;
      }
      if (erroConfirmacaoTelefoneConvidado) {
        setErro(erroConfirmacaoTelefoneConvidado);
        return;
      }
    }

    if (campanha.reservaExigeCpf) {
      if (!cpfConvidado.trim()) {
        setErro('Informe seu CPF para reservar.');
        return;
      }
      if (erroCpfConvidado) {
        setErro(erroCpfConvidado);
        return;
      }
    }

    setErro(null);
    setReservando(true);
    try {
      const resultado = await campanhasApi.reservarLoteConvidado(id, {
        ...(modoManual ? { numeros: Array.from(selecionados) } : { quantidadeAleatoria: quantidadeLote }),
        nome: nomeConvidado || undefined,
        email: emailConvidado || undefined,
        telefone: telefoneConvidado || undefined,
        confirmacaoTelefone: confirmacaoTelefoneConvidado || undefined,
        cpf: cpfConvidado || undefined,
      });
      setSelecionados(new Set());
      setMostrarFormularioConvidado(false);
      irParaPagamentoComCotas(campanha, resultado.numeros, resultado.reservaExpiraEm, {
        tokenConvidado: resultado.tokenReservaConvidado,
      });
    } catch (excecao) {
      setErro(excecao instanceof ApiError ? excecao.message : 'Não foi possível reservar as cotas.');
    } finally {
      setReservando(false);
    }
  }

  async function cancelarReserva() {
    if (!sessao) return;
    if (!window.confirm('Tem certeza que deseja cancelar sua reserva? Os números voltam a ficar disponíveis.')) {
      return;
    }
    setErro(null);
    setCancelando(true);
    try {
      await campanhasApi.cancelarMinhaReserva(sessao.token, id);
      await carregar();
    } catch (excecao) {
      setErro(excecao instanceof ApiError ? excecao.message : 'Não foi possível cancelar a reserva.');
    } finally {
      setCancelando(false);
    }
  }

  function irParaPagamento() {
    if (!sessao || !campanha || !cotas) return;
    const reservasAtivas = cotas.filter((cota) => cota.minhaCota && cota.status === 'RESERVADA');
    const numeros = reservasAtivas.map((cota) => cota.numero);
    const reservaExpiraEm = reservasAtivas.find((cota) => cota.reservaExpiraEm)?.reservaExpiraEm ?? null;
    irParaPagamentoComCotas(campanha, numeros, reservaExpiraEm);
  }

  if (carregandoDados) {
    return (
      <div className="flex justify-center py-16 text-muted">
        <Spinner />
      </div>
    );
  }

  if (!campanha) {
    return (
      <div className="flex flex-col items-center gap-2 py-16 text-center text-muted">
        <p>Não foi possível encontrar essa campanha.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow={finalizada ? 'Campanha finalizada' : 'Escolha sua cota'}
        title={campanha.nome}
        action={finalizada && <Badge tone="night">Campanha finalizada</Badge>}
      />

      <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-mist">
        {campanha.fotoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- imagem da campanha, vem da API
          <img
            src={urlArquivoApi(campanha.fotoUrl)}
            alt={campanha.nome}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted">
            <IconGift className="h-10 w-10" />
          </div>
        )}
      </div>

      <TicketCard tone="night">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-white/60">Valor da cota</p>
            <p className="mt-1 font-display text-3xl text-white">{formatarMoeda(campanha.valorCota)}</p>
          </div>
          {quantidadeSelecionada > 0 && (
            <div className="text-right">
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-white/60">Valor total</p>
              <p className="mt-1 font-display text-3xl text-white">{formatarMoeda(valorTotalSelecionado)}</p>
            </div>
          )}
        </div>
        <p className="mt-2 text-sm text-white/70">{campanha.quantidadeCotas} números disponíveis no total.</p>
      </TicketCard>

      {erro && <Alert tone="error">{erro}</Alert>}

      {vendasEncerradas && (
        <Alert tone="info">Vendas encerradas para esta campanha — aguardando a realização do sorteio.</Alert>
      )}

      {finalizada && campanha.cotaVencedoraNumero !== null && (
        <Card className="flex flex-col gap-1 border-accent-ink/40">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted">Resultado do sorteio</p>
          <p className="text-sm font-medium text-night">
            {campanha.vencedorNome} · Cota nº {campanha.cotaVencedoraNumero}
          </p>
          {campanha.vencedorTelefone && (
            <p className="font-mono text-xs text-muted">{formatarTelefone(campanha.vencedorTelefone)}</p>
          )}
        </Card>
      )}

      {minhasCotasPagas.length > 0 && (
        <TicketCard tone="night" className="flex flex-col gap-1">
          <p className="text-sm font-medium">
            Você já tem {minhasCotasPagas.length} {minhasCotasPagas.length === 1 ? 'cota paga' : 'cotas pagas'}
          </p>
          <p className="font-mono text-xs text-white/70">
            Nº {minhasCotasPagas.slice().sort((a, b) => a - b).join(', ')}
          </p>
        </TicketCard>
      )}

      {minhasCotasReservadas.length > 0 && (
        <Card className="flex flex-col gap-4 border-accent-ink/40">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-night">
                Você reservou {minhasCotasReservadas.length}{' '}
                {minhasCotasReservadas.length === 1 ? 'cota' : 'cotas'}
              </p>
              <p className="font-mono text-xs text-muted">
                Nº {minhasCotasReservadas.slice().sort((a, b) => a - b).join(', ')}
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={irParaPagamento}>Ir para pagamento</Button>
              <Button variant="danger" onClick={cancelarReserva} loading={cancelando}>
                Cancelar reserva
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-2 border-t border-line pt-3">
            <p className="text-xs text-muted">
              Cotas reservadas aguardando confirmação de pagamento pelo administrador da campanha, entre em contato
              com o suporte.
            </p>
            <LinkWhatsappSuporte campanha={campanha} numeros={minhasCotasReservadas} />
          </div>
        </Card>
      )}

      {podeComprarMais && mostrarFormularioConvidado && (
        <FormularioConvidado
          campanha={campanha}
          nome={nomeConvidado}
          email={emailConvidado}
          telefone={telefoneConvidado}
          confirmacaoTelefone={confirmacaoTelefoneConvidado}
          cpf={cpfConvidado}
          erroCpf={erroCpfConvidado}
          onCpfChange={setCpfConvidado}
          erroEmail={erroEmailConvidado}
          erroTelefone={erroTelefoneConvidado}
          erroConfirmacaoTelefone={erroConfirmacaoTelefoneConvidado}
          onNomeChange={setNomeConvidado}
          onEmailChange={setEmailConvidado}
          onTelefoneChange={setTelefoneConvidado}
          onConfirmacaoTelefoneChange={setConfirmacaoTelefoneConvidado}
          onConfirmar={reservarComoConvidado}
          onVoltar={() => setMostrarFormularioConvidado(false)}
          carregando={reservando}
        />
      )}

      {podeComprarMais && !mostrarFormularioConvidado && (formaVenda === 'ESCOLHA_NUMERO' ? (
        <Card className="flex flex-col gap-4">
          <p className="text-xs text-muted">
            Toque nos números disponíveis para selecionar {selecionados.size > 0 && `(${selecionados.size} selecionado${selecionados.size > 1 ? 's' : ''})`}.
            A reserva só é salva ao confirmar.
            {quantidadeMaximaPorCompra !== null && ` Máximo de ${quantidadeMaximaPorCompra} cota(s) por compra.`}
            {!sessao && ' Vamos pedir alguns dados de contato para confirmar — sem precisar criar conta.'}
          </p>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button onClick={confirmarCotas} loading={reservando} disabled={selecionados.size === 0} fullWidth>
              Confirmar cotas
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="flex flex-col gap-4">
          <p className="text-sm font-medium text-night">Escolha a quantidade do lote</p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {LOTES_PRESET.map((quantidade) => {
              const excedeLimite = quantidadeMaximaPorCompra !== null && quantidade > quantidadeMaximaPorCompra;
              return (
                <button
                  key={quantidade}
                  type="button"
                  disabled={excedeLimite}
                  onClick={() => escolherQuantidadeLote(quantidade)}
                  className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
                    excedeLimite
                      ? 'cursor-not-allowed border-line bg-mist text-muted'
                      : quantidadeLote === quantidade
                        ? 'border-accent-ink bg-accent text-ink'
                        : 'border-line bg-white text-night hover:border-accent-ink'
                  }`}
                >
                  {quantidade}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => ajustarQuantidadeLote(-1)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-line text-lg font-semibold text-night hover:border-accent-ink"
              aria-label="Diminuir 1 cota"
            >
              −
            </button>
            <p className="font-mono text-2xl font-semibold text-night">{quantidadeLote}</p>
            <button
              type="button"
              onClick={() => ajustarQuantidadeLote(1)}
              disabled={quantidadeMaximaPorCompra !== null && quantidadeLote >= quantidadeMaximaPorCompra}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-line text-lg font-semibold text-night hover:border-accent-ink disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Aumentar 1 cota"
            >
              +
            </button>
          </div>
          <p className="text-center text-xs text-muted">
            Ao confirmar, escolhemos {quantidadeLote} número{quantidadeLote === 1 ? '' : 's'} aleatório
            {quantidadeLote === 1 ? '' : 's'} entre os disponíveis e já reservamos pra você.
            {quantidadeMaximaPorCompra !== null && ` Máximo de ${quantidadeMaximaPorCompra} cota(s) por compra.`}
            {!sessao && ' Vamos pedir alguns dados de contato para confirmar — sem precisar criar conta.'}
          </p>

          <Button onClick={confirmarCotas} loading={reservando} fullWidth>
            Confirmar cotas
          </Button>
        </Card>
      ))}

      {!sessao && podeComprarMais && !mostrarFormularioConvidado && (
        <div className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-strong">Já tem cadastro? Entre para acompanhar suas campanhas.</p>
          <Link
            href={`/entrar?redirect=${encodeURIComponent(`/campanhas/${id}`)}`}
            className="inline-flex shrink-0 items-center justify-center rounded-xl border border-line bg-white px-5 py-2.5 text-sm font-semibold text-night transition hover:border-night/30"
          >
            Entre na sua conta
          </Link>
        </div>
      )}

      {/* Modo lote fechado: os números são sorteados pelo sistema ao confirmar,
          então o mapa completo de todas as cotas é só informativo demais — o
          comprador já vê os números dele nos cards de reserva/pagamento acima. */}
      {mapaInterativo && (
        <Card>
          <div className="mb-3 flex flex-wrap gap-3 text-xs text-muted">
            {podeComprarMais && <LegendaItem cor="bg-white border border-line" label="Disponível" />}
            {podeComprarMais && <LegendaItem cor="bg-accent" label="Selecionada" />}
            <LegendaItem cor="bg-accent-ink/15" label="Sua reserva" />
            <LegendaItem cor="bg-mist" label="Indisponível" />
          </div>
          <div className="grid grid-cols-6 gap-2 sm:grid-cols-8 md:grid-cols-10">
            {cotas?.map((cota) => (
              <BotaoCota
                key={cota.numero}
                cota={cota}
                selecionada={selecionados.has(cota.numero)}
                interativo={podeComprarMais}
                onClick={() => podeComprarMais && cota.status === 'DISPONIVEL' && alternarSelecao(cota.numero)}
              />
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

/** Checkout sem login: pede só os campos marcados como obrigatórios na
 *  campanha (reservaExige*) antes de reservar como convidado. */
function FormularioConvidado({
  campanha,
  nome,
  email,
  telefone,
  confirmacaoTelefone,
  cpf,
  erroCpf,
  onCpfChange,
  erroEmail,
  erroTelefone,
  erroConfirmacaoTelefone,
  onNomeChange,
  onEmailChange,
  onTelefoneChange,
  onConfirmacaoTelefoneChange,
  onConfirmar,
  onVoltar,
  carregando,
}: {
  campanha: CampanhaExibicao;
  nome: string;
  email: string;
  telefone: string;
  confirmacaoTelefone: string;
  cpf: string;
  erroCpf?: string;
  onCpfChange: (valor: string) => void;
  erroEmail?: string;
  erroTelefone?: string;
  erroConfirmacaoTelefone?: string;
  onNomeChange: (valor: string) => void;
  onEmailChange: (valor: string) => void;
  onTelefoneChange: (valor: string) => void;
  onConfirmacaoTelefoneChange: (valor: string) => void;
  onConfirmar: () => void;
  onVoltar: () => void;
  carregando: boolean;
}) {
  return (
    <Card className="flex flex-col gap-4 border-accent-ink/40">
      <div>
        <p className="text-sm font-medium text-night">Só mais um passo</p>
        <p className="text-xs text-muted">
          Informe seus dados para reservar — não é preciso criar conta nem fazer login.
        </p>
      </div>

      {campanha.reservaExigeNome && (
        <TextField label="Nome completo" required value={nome} onChange={(e) => onNomeChange(e.target.value)} />
      )}
      {campanha.reservaExigeCpf && (
        <TextField
          label="CPF"
          required
          inputMode="numeric"
          placeholder="000.000.000-00"
          value={cpf}
          error={erroCpf}
          onChange={(e) => onCpfChange(formatarCpf(e.target.value))}
        />
      )}
      {campanha.reservaExigeEmail && (
        <TextField
          label="E-mail"
          type="email"
          required
          value={email}
          error={erroEmail}
          onChange={(e) => onEmailChange(e.target.value)}
        />
      )}
      {campanha.reservaExigeTelefone && (
        <PhoneField
          label="Telefone"
          required
          placeholder="(11) 91234-5678"
          value={telefone}
          error={erroTelefone}
          onChange={(e) => onTelefoneChange(formatarTelefone(e.target.value))}
        />
      )}
      {campanha.reservaExigeConfirmacaoTelefone && (
        <PhoneField
          label="Confirme o telefone"
          required
          placeholder="(11) 91234-5678"
          value={confirmacaoTelefone}
          error={erroConfirmacaoTelefone}
          onChange={(e) => onConfirmacaoTelefoneChange(formatarTelefone(e.target.value))}
        />
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button onClick={onConfirmar} loading={carregando} fullWidth>
          Confirmar reserva
        </Button>
        <Button variant="secondary" onClick={onVoltar} disabled={carregando}>
          Voltar
        </Button>
      </div>
    </Card>
  );
}

function LinkWhatsappSuporte({ campanha, numeros }: { campanha: CampanhaExibicao; numeros: number[] }) {
  const numerosOrdenados = numeros.slice().sort((a, b) => a - b);
  const mensagem =
    `Olá! Tenho a(s) cota(s) nº ${numerosOrdenados.join(', ')} reservada(s)` +
    ` na campanha "${campanha.nome}", aguardando confirmação de pagamento.`;
  const telefone = campanha.telefoneSuporte.replace(/\D/g, '');
  const link = telefone ? `https://wa.me/55${telefone}?text=${encodeURIComponent(mensagem)}` : null;

  return (
    <a
      href={link ?? undefined}
      target="_blank"
      rel="noopener noreferrer"
      aria-disabled={!link}
      onClick={(evento) => {
        if (!link) evento.preventDefault();
      }}
      className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
        link
          ? 'border-line bg-white text-night hover:border-night/30'
          : 'cursor-not-allowed border-line bg-mist text-muted'
      }`}
    >
      <IconWhatsapp className="h-4 w-4" /> Falar com o suporte no WhatsApp
    </a>
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

function BotaoCota({
  cota,
  selecionada,
  interativo,
  onClick,
}: {
  cota: CotaResumo;
  selecionada: boolean;
  interativo: boolean;
  onClick: () => void;
}) {
  const disponivel = interativo && cota.status === 'DISPONIVEL';

  let classe = 'bg-mist text-muted cursor-not-allowed';
  if (cota.minhaCota && cota.status === 'RESERVADA') {
    classe = 'bg-accent-ink/15 text-accent-ink border border-accent-ink/40 cursor-default';
  } else if (cota.minhaCota && cota.status === 'PAGA') {
    classe = 'bg-night text-white cursor-default';
  } else if (disponivel && selecionada) {
    classe = 'bg-accent text-ink border border-accent-ink';
  } else if (disponivel) {
    classe = 'bg-white text-night border border-line hover:border-accent-ink cursor-pointer';
  } else if (!interativo && cota.status === 'DISPONIVEL') {
    classe = 'bg-white text-night border border-line cursor-default';
  }

  return (
    <button
      type="button"
      disabled={!disponivel}
      onClick={onClick}
      className={`flex aspect-square items-center justify-center rounded-lg font-mono text-xs font-medium transition ${classe}`}
      title={cota.minhaCota ? 'Sua cota' : undefined}
    >
      {cota.numero}
    </button>
  );
}
