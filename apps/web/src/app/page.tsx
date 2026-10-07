import type { Metadata } from 'next';
import Link from 'next/link';
import type { ComponentType } from 'react';
import { Logo } from '../components/ui/Logo';
import {
  IconBell,
  IconCheck,
  IconChevronDown,
  IconCopy,
  IconDashboard,
  IconGift,
  IconGroup,
  IconPix,
  IconShield,
  IconTicket,
  IconUser,
  IconWhatsapp,
} from '../components/ui/icons';

export const metadata: Metadata = {
  title: 'Minha Rifa — campanhas por cotas numeradas para grupos de WhatsApp',
  description:
    'Crie a página da sua campanha, compartilhe no grupo de WhatsApp e receba o Pix direto na sua chave. Compra sem cadastro, avisos automáticos e painel de gestão.',
};

type Icone = ComponentType<{ className?: string }>;

const CTA_PRIMARIO =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3.5 text-sm font-semibold text-ink transition hover:brightness-95';
const CTA_SECUNDARIO_ESCURO =
  'inline-flex items-center justify-center gap-2 rounded-xl border border-white/25 px-6 py-3.5 text-sm font-semibold text-white transition hover:border-white/50';

const NAVEGACAO = [
  { href: '#plataforma', label: 'Plataforma' },
  { href: '#como-funciona', label: 'Como funciona' },
  { href: '#recursos', label: 'Recursos' },
  { href: '#pix', label: 'Pix' },
  { href: '#transparencia', label: 'Transparência' },
  { href: '#duvidas', label: 'Dúvidas' },
];

const SELOS_CONFIANCA = [
  'Pix direto na sua chave',
  'Compra sem cadastro',
  'Avisos no WhatsApp',
  'Painel no celular',
];

const PASSOS = [
  {
    titulo: 'Crie e revise',
    texto: 'Cadastre prêmios, foto, número de cotas e valor. Revise tudo antes de abrir as vendas.',
  },
  {
    titulo: 'Lance para um grupo',
    texto: 'Escolha o grupo de WhatsApp e as datas. As cotas numeradas são geradas no lançamento.',
  },
  {
    titulo: 'Compartilhe o link',
    texto: 'Copie a descrição e a foto prontas e cole no grupo. Quem abrir o link já pode escolher as cotas.',
  },
  {
    titulo: 'Confirme e sorteie',
    texto: 'Confirme os pagamentos no painel e, ao realizar o sorteio, registre o vencedor — o resultado aparece no link.',
  },
];

const RECURSOS: { icone: Icone; titulo: string; texto: string }[] = [
  {
    icone: IconTicket,
    titulo: 'Link de vendas público',
    texto: 'Uma página por campanha, com foto, descrição e cotas. Abre no celular sem instalar nada.',
  },
  {
    icone: IconUser,
    titulo: 'Compra sem cadastro',
    texto: 'O participante informa só os dados que você marcou como obrigatórios (nome, e-mail, telefone).',
  },
  {
    icone: IconPix,
    titulo: 'Pix com QR Code',
    texto: 'QR Code e “copia e cola” gerados para a chave da campanha: CPF, CNPJ, celular, e-mail ou aleatória.',
  },
  {
    icone: IconGift,
    titulo: 'Duas formas de venda',
    texto: 'Escolha manual dos números ou lote fechado, em que o sistema sorteia as cotas na hora da compra.',
  },
  {
    icone: IconCheck,
    titulo: 'Reserva com prazo',
    texto: 'As cotas ficam reservadas enquanto o pagamento não chega. Você define por quanto tempo.',
  },
  {
    icone: IconBell,
    titulo: 'Alertas automáticos',
    texto: 'Avisos de nova campanha, 50%, 80% e 90% vendido e resultado do sorteio para o seu grupo.',
  },
  {
    icone: IconGroup,
    titulo: 'Equipe com permissões',
    texto: 'Operadores e administradores adicionais, cada um com acesso só ao que você liberar.',
  },
  {
    icone: IconDashboard,
    titulo: 'Painel e rankings',
    texto: 'Visão geral das campanhas, quem mais comprou e quem mais ganhou em cada grupo.',
  },
];

const DUVIDAS = [
  {
    pergunta: 'O que é a Minha Rifa?',
    resposta:
      'Uma plataforma para organizar campanhas por cotas numeradas em grupos de WhatsApp: você cria a campanha, compartilha o link, acompanha as cotas pagas e registra o resultado.',
  },
  {
    pergunta: 'O participante precisa ter conta?',
    resposta:
      'Não. Ao abrir o link de vendas, ele escolhe as cotas, informa apenas os dados exigidos pela campanha e paga via Pix. Quem tem conta no grupo também pode entrar e acompanhar suas compras.',
  },
  {
    pergunta: 'Para onde vai o dinheiro?',
    resposta:
      'O Pix é gerado para a chave cadastrada na campanha, ou seja, vai direto para você. A plataforma não recebe nem repassa o valor.',
  },
  {
    pergunta: 'Como sei que um pagamento foi feito?',
    resposta:
      'O participante pode enviar o comprovante pela própria página ou pelo WhatsApp. Você confere o recebimento na sua conta e confirma o pagamento no painel — só então as cotas passam a pagas.',
  },
  {
    pergunta: 'Quem realiza o sorteio?',
    resposta:
      'O organizador. Depois que todas as cotas estão pagas, você realiza o sorteio do seu jeito e registra no painel a cota vencedora; o resultado passa a aparecer no link da campanha.',
  },
  {
    pergunta: 'Posso ter ajudantes no painel?',
    resposta:
      'Sim. Você cadastra operadores e administradores adicionais e define, por seção do menu, o que cada um pode ver, criar, editar ou remover.',
  },
  {
    pergunta: 'Funciona no celular?',
    resposta:
      'Funciona direto no navegador, no celular ou no computador, tanto para quem participa quanto para quem organiza.',
  },
];

export default function HomePage() {
  return (
    <div className="min-h-dvh bg-mist text-night">
      <Cabecalho />
      <main>
        <Hero />
        <Plataforma />
        <ComoFunciona />
        <Recursos />
        <PixDireto />
        <Transparencia />
        <Duvidas />
        <ChamadaFinal />
      </main>
      <Rodape />
    </div>
  );
}

function Cabecalho() {
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-night/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3">
        <Link href="/" aria-label="Minha Rifa — início">
          <Logo tone="light" size="sm" />
        </Link>

        <nav aria-label="Seções da página" className="hidden items-center gap-6 lg:flex">
          {NAVEGACAO.map((item) => (
            <a key={item.href} href={item.href} className="text-sm text-white/70 hover:text-white">
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/entrar" className={`${CTA_SECUNDARIO_ESCURO} whitespace-nowrap !px-3 !py-2.5 sm:!px-4`}>
            Comprar cota
          </Link>
          <Link href="/admin/cadastro" className={`${CTA_PRIMARIO} whitespace-nowrap !px-3 !py-2.5 sm:!px-4`}>
            Criar campanha
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-night text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-accent/10 blur-3xl"
      />
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-16 pt-14 lg:grid-cols-[1.1fr_0.9fr] lg:pb-24 lg:pt-20">
        <div className="flex flex-col items-start gap-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-white/70">
            <IconWhatsapp className="h-3.5 w-3.5 text-accent" /> Para grupos de WhatsApp
          </span>

          <h1 className="font-display text-4xl leading-[1.02] sm:text-5xl lg:text-6xl">
            Cotas numeradas.
            <br />
            <span className="text-accent">Pix direto</span> na sua chave.
          </h1>

          <p className="max-w-xl text-balance text-base text-white/70 sm:text-lg">
            Monte a página da sua campanha, compartilhe o link no grupo e acompanhe cada cota pelo painel.
            Quem participa escolhe os números e paga via Pix, sem precisar criar conta.
          </p>

          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Link href="/admin/cadastro" className={CTA_PRIMARIO}>
              Criar minha campanha <span aria-hidden>→</span>
            </Link>
            <a href="#como-funciona" className={CTA_SECUNDARIO_ESCURO}>
              Ver como funciona
            </a>
          </div>

          <p className="text-sm text-white/55">
            Já tem conta?{' '}
            <Link href="/entrar" className="font-semibold text-white underline-offset-4 hover:underline">
              Sou comprador
            </Link>{' '}
            ·{' '}
            <Link href="/admin/entrar" className="font-semibold text-white underline-offset-4 hover:underline">
              Sou administrador
            </Link>
          </p>

          <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/60">
            {SELOS_CONFIANCA.map((selo) => (
              <li key={selo} className="flex items-center gap-1.5">
                <IconCheck className="h-4 w-4 text-accent" /> {selo}
              </li>
            ))}
          </ul>
        </div>

        <BilheteDemonstrativo />
      </div>
    </section>
  );
}

type EstadoCota = 'livre' | 'reservada' | 'paga';

const COTAS_DEMO: EstadoCota[] = [
  'paga', 'paga', 'livre', 'reservada', 'livre',
  'paga', 'livre', 'livre', 'paga', 'livre',
  'reservada', 'paga', 'livre', 'paga', 'livre',
  'livre', 'paga', 'livre', 'livre', 'reservada',
];

const CLASSE_COTA: Record<EstadoCota, string> = {
  livre: 'border border-line bg-white text-night',
  reservada: 'border border-amber-500 bg-amber-400 text-amber-950',
  paga: 'border border-accent-ink/30 bg-accent text-ink',
};

/** Miniatura ilustrativa do que o participante vê no link de vendas. */
function BilheteDemonstrativo() {
  return (
    <div className="relative mx-auto w-full max-w-md" aria-hidden>
      <div className="ticket-notch ticket-notch-night rounded-ticket bg-white p-6 text-night shadow-2xl shadow-black/30">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">Campanha de exemplo</p>
            <p className="mt-1 font-display text-xl leading-tight">Ação entre amigos</p>
          </div>
          <span className="rounded-full bg-night px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-white">
            Vendas abertas
          </span>
        </div>

        <div className="mt-5 grid grid-cols-5 gap-2">
          {COTAS_DEMO.map((estado, indice) => (
            <div
              key={indice}
              className={`flex aspect-square items-center justify-center rounded-lg font-mono text-xs font-medium ${CLASSE_COTA[estado]}`}
            >
              {String(indice + 1).padStart(2, '0')}
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded bg-accent" /> Paga
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded bg-amber-400" /> Reservada
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded border border-line bg-white" /> Disponível
          </span>
        </div>

        <div className="mt-5 flex items-center justify-between rounded-xl bg-night px-4 py-3 text-white">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/60">Valor total</p>
            <p className="font-display text-2xl">R$ 30,00</p>
          </div>
          <span className="flex items-center gap-2 rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-ink">
            <IconPix className="h-4 w-4" /> Pagar com Pix
          </span>
        </div>
      </div>
    </div>
  );
}

function CabecalhoSecao({
  eyebrow,
  titulo,
  texto,
  escuro = false,
}: {
  eyebrow: string;
  titulo: React.ReactNode;
  texto?: string;
  escuro?: boolean;
}) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-3 text-center">
      <span className="font-mono text-xs uppercase tracking-[0.22em] text-accent-ink">{eyebrow}</span>
      <h2 className={`font-display text-3xl leading-tight sm:text-4xl ${escuro ? 'text-white' : 'text-night'}`}>
        {titulo}
      </h2>
      {texto && <p className={`text-balance ${escuro ? 'text-white/70' : 'text-muted-strong'}`}>{texto}</p>}
    </div>
  );
}

function Plataforma() {
  return (
    <section id="plataforma" className="scroll-mt-20 px-5 py-20">
      <CabecalhoSecao
        eyebrow="Conheça a plataforma"
        titulo={
          <>
            Uma experiência para quem participa.
            <br className="hidden sm:block" /> Outra para quem organiza.
          </>
        }
        texto="As duas pontas conversam na mesma plataforma: o que você configura no painel é o que o participante vê no link."
      />

      <div className="mx-auto mt-12 grid max-w-5xl gap-5 md:grid-cols-2">
        <article className="rounded-ticket border border-line bg-white p-7">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-night text-white">
            <IconTicket className="h-5 w-5" />
          </span>
          <p className="mt-5 font-mono text-xs uppercase tracking-[0.18em] text-muted">Para quem participa</p>
          <h3 className="mt-1 font-display text-2xl">Abriu o link, escolheu, pagou.</h3>
          <ul className="mt-5 flex flex-col gap-3 text-sm text-muted-strong">
            <ItemLista>Foto, descrição e valor da cota logo na primeira tela.</ItemLista>
            <ItemLista>Escolhe os números ou deixa o sistema sortear um lote.</ItemLista>
            <ItemLista>Informa só os dados que a campanha pede, sem criar conta.</ItemLista>
            <ItemLista>Paga com QR Code ou “copia e cola” e envia o comprovante.</ItemLista>
          </ul>
        </article>

        <article className="rounded-ticket bg-night p-7 text-white">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-ink">
            <IconDashboard className="h-5 w-5" />
          </span>
          <p className="mt-5 font-mono text-xs uppercase tracking-[0.18em] text-white/50">Para quem organiza</p>
          <h3 className="mt-1 font-display text-2xl">Tudo da campanha num painel só.</h3>
          <ul className="mt-5 flex flex-col gap-3 text-sm text-white/75">
            <ItemLista claro>Cria, revisa e lança a campanha para um grupo.</ItemLista>
            <ItemLista claro>Vê cotas pagas e reservadas, com nome e telefone de quem comprou.</ItemLista>
            <ItemLista claro>Confirma pagamentos e libera reservas com um clique.</ItemLista>
            <ItemLista claro>Registra o vencedor e acompanha os rankings do grupo.</ItemLista>
          </ul>
        </article>
      </div>
    </section>
  );
}

function ItemLista({ children, claro = false }: { children: React.ReactNode; claro?: boolean }) {
  return (
    <li className="flex items-start gap-2.5">
      <IconCheck className={`mt-0.5 h-4 w-4 shrink-0 ${claro ? 'text-accent' : 'text-accent-ink'}`} />
      <span>{children}</span>
    </li>
  );
}

function ComoFunciona() {
  return (
    <section id="como-funciona" className="scroll-mt-20 border-y border-line bg-white px-5 py-20">
      <CabecalhoSecao
        eyebrow="Como funciona"
        titulo="Do primeiro rascunho ao resultado do sorteio."
        texto="Quatro passos, todos dentro da plataforma."
      />

      <ol className="mx-auto mt-14 grid max-w-6xl gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {PASSOS.map((passo, indice) => (
          <li key={passo.titulo} className="relative flex flex-col gap-3">
            <span className="font-display text-5xl leading-none text-accent">
              {String(indice + 1).padStart(2, '0')}
            </span>
            <span aria-hidden className="hidden h-px w-full bg-line lg:block" />
            <h3 className="font-display text-xl">{passo.titulo}</h3>
            <p className="text-sm text-muted-strong">{passo.texto}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Recursos() {
  return (
    <section id="recursos" className="scroll-mt-20 px-5 py-20">
      <CabecalhoSecao
        eyebrow="Recursos"
        titulo="Menos planilha. Menos mensagem solta."
        texto="Da divulgação ao resultado, as ferramentas da campanha trabalham juntas."
      />

      <div className="mx-auto mt-12 grid max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {RECURSOS.map(({ icone: Icone, titulo, texto }) => (
          <article key={titulo} className="rounded-2xl border border-line bg-white p-5 transition hover:border-night/25">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 text-accent-ink">
              <Icone className="h-5 w-5" />
            </span>
            <h3 className="mt-4 font-semibold text-night">{titulo}</h3>
            <p className="mt-1.5 text-sm text-muted-strong">{texto}</p>
          </article>
        ))}
      </div>

      <div className="mx-auto mt-6 flex max-w-6xl flex-col items-start gap-3 rounded-2xl border border-line bg-white p-5 sm:flex-row sm:items-center">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-night text-white">
          <IconCopy className="h-5 w-5" />
        </span>
        <p className="text-sm text-muted-strong">
          <strong className="text-night">Divulgação pronta:</strong> a descrição da campanha já nasce com um modelo de
          mensagem e a foto fica a um clique de ser copiada — é só colar no grupo.
        </p>
      </div>
    </section>
  );
}

function PixDireto() {
  const etapas: { icone: Icone; titulo: string; texto: string }[] = [
    { icone: IconUser, titulo: 'Participante', texto: 'Escolhe as cotas e abre o Pix.' },
    { icone: IconPix, titulo: 'Pix', texto: 'QR Code e copia e cola para a chave da campanha.' },
    { icone: IconShield, titulo: 'Sua conta', texto: 'O valor cai direto para você.' },
  ];

  return (
    <section id="pix" className="scroll-mt-20 bg-night px-5 py-20 text-white">
      <CabecalhoSecao
        escuro
        eyebrow="O dinheiro vai para você"
        titulo={
          <>
            Receba o Pix <span className="text-accent">direto</span> na sua chave.
          </>
        }
        texto="A Minha Rifa não recebe nem repassa o valor das cotas. Você acompanha os pedidos e confirma os recebimentos pelo painel."
      />

      <ol className="mx-auto mt-12 flex max-w-4xl flex-col items-stretch gap-3 md:flex-row">
        {etapas.map(({ icone: Icone, titulo, texto }, indice) => (
          <li key={titulo} className="flex flex-1 flex-col items-stretch gap-3 md:flex-row">
            <div className="flex flex-1 flex-col items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-ink">
                <Icone className="h-5 w-5" />
              </span>
              <p className="font-semibold">{titulo}</p>
              <p className="text-sm text-white/65">{texto}</p>
            </div>
            {indice < etapas.length - 1 && (
              <span aria-hidden className="self-center text-xl text-accent md:-mx-1">
                <span className="md:hidden">↓</span>
                <span className="hidden md:inline">→</span>
              </span>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}

function Transparencia() {
  const pilares = [
    {
      titulo: 'Nós cuidamos da tecnologia',
      texto: 'Hospedagem, página da campanha, geração do Pix e painel de gestão.',
    },
    {
      titulo: 'Você define as regras',
      texto: 'Prêmios, regulamento, prazos e valores são escolhas do organizador.',
    },
    {
      titulo: 'A campanha é sua',
      texto: 'O organizador responde pela campanha perante os participantes do seu grupo.',
    },
  ];

  return (
    <section id="transparencia" className="scroll-mt-20 px-5 py-20">
      <div className="mx-auto grid max-w-6xl items-start gap-10 lg:grid-cols-2">
        <div className="flex flex-col items-start gap-4">
          <span className="font-mono text-xs uppercase tracking-[0.22em] text-accent-ink">
            Transparência em primeiro lugar
          </span>
          <h2 className="font-display text-3xl leading-tight sm:text-4xl">
            Somos a ferramenta.
            <br />
            A campanha é sua.
          </h2>
          <p className="text-muted-strong">
            A Minha Rifa é um software de gestão: oferece as ferramentas para que cada organizador crie, divulgue e
            administre as próprias campanhas.
          </p>
          <p className="text-muted-strong">
            Não somos parte da campanha e não recebemos o dinheiro das cotas — o Pix vai para a chave que você
            cadastrar. Cada organizador é responsável pelo regulamento e pelo cumprimento da legislação aplicável.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {pilares.map((pilar) => (
            <article key={pilar.titulo} className="flex items-start gap-4 rounded-2xl border border-line bg-white p-5">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent-ink">
                <IconShield className="h-4 w-4" />
              </span>
              <div>
                <h3 className="font-semibold">{pilar.titulo}</h3>
                <p className="mt-1 text-sm text-muted-strong">{pilar.texto}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Duvidas() {
  return (
    <section id="duvidas" className="scroll-mt-20 border-t border-line bg-white px-5 py-20">
      <CabecalhoSecao eyebrow="Tire suas dúvidas" titulo="Antes de começar, vamos esclarecer." />

      <div className="mx-auto mt-10 flex max-w-3xl flex-col gap-3">
        {DUVIDAS.map((item) => (
          <details key={item.pergunta} className="group rounded-2xl border border-line bg-mist px-5 py-4 open:bg-white">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-night [&::-webkit-details-marker]:hidden">
              {item.pergunta}
              <IconChevronDown className="h-4 w-4 shrink-0 text-muted transition group-open:rotate-180" />
            </summary>
            <p className="mt-3 text-sm text-muted-strong">{item.resposta}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

function ChamadaFinal() {
  return (
    <section className="px-5 py-20">
      <div className="ticket-notch mx-auto flex max-w-4xl flex-col items-center gap-6 rounded-ticket bg-accent px-6 py-14 text-center text-ink">
        <h2 className="font-display text-3xl leading-tight sm:text-4xl">
          Sua próxima campanha,
          <br />
          bem organizada.
        </h2>
        <p className="max-w-md text-balance text-ink/80">
          Crie sua conta de administrador, cadastre o grupo e lance a primeira campanha.
        </p>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <Link
            href="/admin/cadastro"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-night px-6 py-3.5 text-sm font-semibold text-white transition hover:brightness-110"
          >
            Criar minha campanha <span aria-hidden>→</span>
          </Link>
          <Link
            href="/entrar"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-ink/25 px-6 py-3.5 text-sm font-semibold text-ink transition hover:border-ink/50"
          >
            Sou comprador
          </Link>
        </div>
      </div>
    </section>
  );
}

function Rodape() {
  return (
    <footer className="bg-night px-5 py-12 text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 md:flex-row md:items-start md:justify-between">
        <div className="flex max-w-xs flex-col gap-3">
          <Logo tone="light" size="sm" />
          <p className="text-sm text-white/55">
            Campanhas por cotas numeradas para grupos de WhatsApp — cadastro, cobrança e resultado em um só lugar.
          </p>
        </div>

        <nav aria-label="Acesso" className="grid grid-cols-2 gap-x-12 gap-y-2 text-sm">
          <Link href="/entrar" className="text-white/70 hover:text-white">
            Sou comprador
          </Link>
          <a href="#plataforma" className="text-white/70 hover:text-white">
            Plataforma
          </a>
          <Link href="/admin/entrar" className="text-white/70 hover:text-white">
            Sou administrador
          </Link>
          <a href="#recursos" className="text-white/70 hover:text-white">
            Recursos
          </a>
          <Link href="/admin/cadastro" className="text-white/70 hover:text-white">
            Criar conta de administrador
          </Link>
          <a href="#duvidas" className="text-white/70 hover:text-white">
            Dúvidas
          </a>
        </nav>
      </div>

      <p className="mx-auto mt-10 max-w-6xl border-t border-white/10 pt-6 text-xs text-white/40">
        Recebeu um link de convite de um grupo pelo WhatsApp? Abra-o diretamente para ir ao cadastro de comprador.
      </p>
    </footer>
  );
}
