# Módulo: premios

Implementado seguindo o padrão do módulo `sorteios`.

## Cobertura por feature

`cadastro-de-premio.feature`: cadastro (com/sem opção de troca por dinheiro), validação de valor
positivo, edição bloqueada enquanto o prêmio está vinculado a um sorteio "em andamento" (qualquer
status exceto `FINALIZADO`/`CANCELADO`).

## Dependência cross-module

`EditarPremioUseCase` usa `SORTEIO_REPOSITORY.buscarPorPremioId()` (adicionado ao módulo
`sorteios` especificamente para esta checagem) para saber se o prêmio está vinculado a um sorteio
e em qual status.
