# Refatoração de Configurações

## Fase 840 — CSS global

- Extraiu `configuracoesPageCss` para um módulo dedicado.
- Preservou os dois consumidores e a ordem de precedência com `historietasThemeCss`.

## Fase 841 — LoadingSpinner

- Extraiu o `LoadingSpinner` e seus estilos exclusivos para um componente dedicado.
- Preservou os cinco consumidores, seus labels traduzidos e as condições da página.

## Fase 842 — mensagem de ação

- Extraiu estado, geração de ID e expiração segura da mensagem de ação para um hook dedicado.
- Preservou os handlers, limpezas manuais e toast na página.

## Fase 843 — ícones SVG

- Extraiu o renderer `SvgIcon`, a união `IconName` e o mapa literal de paths para componente visual dedicado.
- Preservou as primitives, consumidores, estilos e fluxos de Configurações na página.
