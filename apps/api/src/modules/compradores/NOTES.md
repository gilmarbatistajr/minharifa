# Módulo: compradores

Implementado seguindo o padrão do módulo `sorteios`.

## Cobertura por feature

- `cadastro-de-comprador.feature`: validações de CPF (algoritmo oficial de dígito verificador),
  telefone, idade mínima (`domain/services/validacoes-comprador.ts`), aceite obrigatório do termo,
  CPF/e-mail duplicado sugerindo login. "Reaproveita dados em nova compra" está em
  `BuscarCompradorPorCpfUseCase`.
- `login-cliente.feature`: login por e-mail/senha, recuperação e redefinição de senha.

## Decisão de schema: campo `email` em `Comprador`

O `cadastro-de-comprador.feature` não coleta e-mail, mas o `login-cliente.feature` exige login por
e-mail/senha — schema original não tinha esse campo. Foi adicionado `Comprador.email` (nullable,
único) via migration para viabilizar o login sem contradizer o fluxo de cadastro puro (que não exige
e-mail).

## Simplificação consciente: login social

`login-cliente.feature` tem um "Esquema do Cenário: Login social" cujo único critério de aceite é
"o sistema exibe a opção de logar com `<provedor>`" — é puramente uma verificação de UI, sem
comportamento de backend descrito. Por isso não há um caso de uso de login social: a entidade
`Comprador` já tem `googleId`/`facebookId`/`appleId` (nullable, únicos) e o método
`vincularContaSocial()` prontos no schema/domínio, mas o fluxo OAuth completo (endpoints,
estratégias Passport por provedor) fica como próximo passo quando houver um `.feature` descrevendo
o comportamento esperado do backend.
