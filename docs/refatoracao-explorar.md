# Refatoração de Explorar

## Fase 833 — modo desktop

- Extraiu o estado e o lifecycle responsivo para `useExplorarDesktopMode`.
- Preservou o estado inicial, breakpoint, atualização síncrona e listeners moderno e legado.

## Fase 834 — CSS global da página

- Extraiu `themePageCss` para `app/explorar/lib/explorar-page-css.ts`.
- Manteve os dois consumidores e a ordem `themePageCss` → `historietasThemeCss`.

## Fase 835 — indicador de carregamento

- Extraiu `LoadingSpinner` e seus estilos exclusivos para `app/explorar/components/explorar-loading-spinner.tsx`.
- Manteve na página a condição de carregamento, o label traduzido e o CSS global da animação.

## Fase 836 — body lock dos filtros avançados

- Extraiu o lifecycle de lock e restauração de overflow para `useExplorarAdvancedFiltersBodyLock`.
- Manteve na página o estado, os handlers, o painel e todos os fluxos de dados.

## Fase 837 — CSS dos controles de busca

- Extraiu `explorarBuscaToggleCss` para `app/explorar/lib/explorar-search-toggle-css.ts`.
- Manteve na página o único consumidor, os controles de busca e todas as fronteiras de dados.
