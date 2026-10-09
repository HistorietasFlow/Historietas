# Refatoração de Publicar

## Fase 848 — modo desktop

- Extraiu o lifecycle responsivo de `isDesktop` para `usePublicarDesktopMode`, preservando timer, listeners e consumidores.

## Fase 849 — CSS global da página

- Extraiu `publicarPageCss` para `app/publicar/lib/publicar-page-css.ts`, preservando literalmente seu conteúdo e a ordem dos dois consumidores de estilo.

## Fase 850 — helpers puros de texto e formulário

- Extraiu os helpers puros de validação, sanitização, contagem e formatação de texto para `app/publicar/lib/publicar-text-utils.ts`, preservando consumidores e regras do formulário.
