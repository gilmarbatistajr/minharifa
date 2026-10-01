const GUI_PIX = 'br.gov.bcb.pix';
const MOEDA_BRL = '986';
const PAIS_BR = 'BR';
const CATEGORIA_COMERCIANTE_PADRAO = '0000';
const CIDADE_PADRAO = 'BRASIL';

export interface DadosPixCopiaECola {
  chave: string;
  nomeRecebedor: string;
  cidadeRecebedor?: string;
  valor: number;
  txid: string;
}

function campo(id: string, valor: string): string {
  return `${id}${valor.length.toString().padStart(2, '0')}${valor}`;
}

/** Maiúsculas, sem acento, só letras/dígitos/espaço — como o BR Code exige para nome e cidade. */
function normalizarTexto(valor: string, tamanhoMaximo: number): string {
  const semAcentos = valor.normalize('NFD').replace(/[̀-ͯ]/g, '');
  const somenteAsciiImprimivel = semAcentos.replace(/[^a-zA-Z0-9 ]/g, '');
  const normalizado = somenteAsciiImprimivel.toUpperCase().trim().slice(0, tamanhoMaximo);
  return normalizado || 'NA';
}

function normalizarTxid(valor: string): string {
  const alfanumerico = valor.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 25);
  return alfanumerico || '***';
}

/**
 * CRC-16/CCITT-FALSE (polinômio 0x1021, init 0xFFFF) — exatamente o checksum
 * exigido pelo Banco Central no campo final do BR Code do Pix.
 */
export function crc16Pix(payload: string): string {
  let crc = 0xffff;
  for (let indice = 0; indice < payload.length; indice += 1) {
    crc ^= payload.charCodeAt(indice) << 8;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc & 0x8000) !== 0 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/**
 * Monta o "Pix Copia e Cola" (BR Code, padrão EMV do Banco Central) apontando
 * direto para a chave Pix informada — sem passar por nenhum gateway/conta
 * intermediária. É a mesma string usada tanto para exibir/copiar quanto para
 * gerar o QR Code (os dois são o mesmo payload).
 */
export function gerarPixCopiaECola(dados: DadosPixCopiaECola): string {
  const chave = dados.chave.trim();
  const nome = normalizarTexto(dados.nomeRecebedor, 25);
  const cidade = normalizarTexto(dados.cidadeRecebedor ?? CIDADE_PADRAO, 15);
  const txid = normalizarTxid(dados.txid);
  const valorFormatado = dados.valor.toFixed(2);

  const informacoesContaComerciante = campo('00', GUI_PIX) + campo('01', chave);
  const dadosAdicionais = campo('05', txid);

  const payloadSemCrc =
    campo('00', '01') +
    campo('26', informacoesContaComerciante) +
    campo('52', CATEGORIA_COMERCIANTE_PADRAO) +
    campo('53', MOEDA_BRL) +
    campo('54', valorFormatado) +
    campo('58', PAIS_BR) +
    campo('59', nome) +
    campo('60', cidade) +
    campo('62', dadosAdicionais) +
    '6304';

  return payloadSemCrc + crc16Pix(payloadSemCrc);
}
