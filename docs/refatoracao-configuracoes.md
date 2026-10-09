# Refatoração de Configurações

## Fase 840 — CSS global

- Extraiu `configuracoesPageCss` para um módulo dedicado.
- Preservou os dois consumidores e a ordem de precedência com `historietasThemeCss`.

## Fase 841 — LoadingSpinner

- Extraiu o `LoadingSpinner` e seus estilos exclusivos para um componente dedicado.
- Preservou os cinco consumidores, seus labels traduzidos e as condições da página.
