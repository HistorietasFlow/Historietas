# Refatoração de Explorar

## Fase 833 — modo desktop

- Extraiu o estado e o lifecycle responsivo para `useExplorarDesktopMode`.
- Preservou o estado inicial, breakpoint, atualização síncrona e listeners moderno e legado.

## Fase 834 — CSS global da página

- Extraiu `themePageCss` para `app/explorar/lib/explorar-page-css.ts`.
- Manteve os dois consumidores e a ordem `themePageCss` → `historietasThemeCss`.
