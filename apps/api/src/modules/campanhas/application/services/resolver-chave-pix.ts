import { TipoChavePix } from '../../domain/entities/campanha.entity';
import {
  MENSAGENS_ERRO_CHAVE_PIX,
  normalizarChavePix,
  validarChavePix,
} from '../../domain/services/validacoes-chave-pix';

export interface ChavePixResolvida {
  tipoChavePix: TipoChavePix | null;
  chavePix: string | null;
}

/**
 * Tipo e chave Pix são preenchidos juntos ou nenhum dos dois — nunca só um.
 * Quando preenchidos, a chave precisa ser válida para o tipo escolhido (ver
 * `validarChavePix`) e é normalizada para o formato canônico do Pix, sem
 * máscara de digitação (ver `normalizarChavePix`), já que é esse valor que
 * vai direto para o BR Code gerado em `gerarPixCopiaECola`.
 */
export function resolverChavePix(
  tipoChavePixInformado: TipoChavePix | null | undefined,
  chavePixInformada: string | null | undefined,
): ChavePixResolvida {
  const tipo = tipoChavePixInformado ?? null;
  const chave = chavePixInformada?.trim() || null;

  if (!tipo && !chave) {
    return { tipoChavePix: null, chavePix: null };
  }

  if (!tipo || !chave) {
    throw new Error('Informe o tipo e o valor da chave Pix juntos.');
  }

  if (!validarChavePix(tipo, chave)) {
    throw new Error(MENSAGENS_ERRO_CHAVE_PIX[tipo]);
  }

  return { tipoChavePix: tipo, chavePix: normalizarChavePix(tipo, chave) };
}
