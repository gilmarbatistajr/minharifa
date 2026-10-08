# Módulo: grupos

Implementado seguindo o padrão do módulo `sorteios`.

## Cobertura por feature

- `meus-grupos.feature`: cadastrar grupo, criar/desativar agente chatbot, configurar avisos, listar
  compradores do grupo, contar sorteios finalizados/em andamento. Todas as ações administrativas
  verificam `grupo.pertenceAoAdministrador(administradorId)` — rejeitam com "Grupo não encontrado"
  (não vaza que o grupo existe mas pertence a outro admin).
- `acesso-via-convite.feature`: gerar/validar/revogar link de convite. O isolamento multi-tenant
  ("comprador não enxerga sorteio de outro grupo") é garantido por construção em
  `ListarSorteiosVisiveisParaCompradorUseCase`, que sempre filtra pelo `grupoId` do JWT do
  comprador autenticado — nunca por um `grupoId` arbitrário vindo do cliente.

## Dependência cross-module

`ContarSorteiosDoGrupoUseCase` e `ListarSorteiosVisiveisParaCompradorUseCase` usam
`SORTEIO_REPOSITORY` do módulo `sorteios` (via import do `SorteiosModule`), já que "sorteio" é uma
entidade que pertence a esse módulo, não a `grupos`.
