/**
 * Porta do domínio para hashing de senhas. Implementação concreta (bcrypt)
 * fica na camada de infrastructure — casos de uso nunca dependem da lib.
 */
export interface PasswordHasher {
  hash(senha: string): Promise<string>;
  comparar(senha: string, hash: string): Promise<boolean>;
}

export const PASSWORD_HASHER = Symbol('PASSWORD_HASHER');
