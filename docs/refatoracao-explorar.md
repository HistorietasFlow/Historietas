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
