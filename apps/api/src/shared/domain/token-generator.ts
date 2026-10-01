/**
 * Porta do domínio para geração de tokens opacos de uso único (confirmação
 * de e-mail, recuperação de senha). Implementação concreta usa `crypto`
 * na camada de infrastructure.
 */
export interface TokenGenerator {
  gerar(): string;
}

export const TOKEN_GENERATOR = Symbol('TOKEN_GENERATOR');
