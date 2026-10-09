# Refatoração de Publicar

## Fase 848 — modo desktop

- Extraiu o lifecycle responsivo de `isDesktop` para `usePublicarDesktopMode`, preservando timer, listeners e consumidores.

## Fase 849 — CSS global da página

- Extraiu `publicarPageCss` para `app/publicar/lib/publicar-page-css.ts`, preservando literalmente seu conteúdo e a ordem dos dois consumidores de estilo.
