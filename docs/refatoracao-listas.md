# Refatoração incremental — Listas

## Fase 816 — Modo desktop de Listas

- Extraiu `useListasDesktopMode` para `app/listas/hooks/use-listas-desktop-mode.ts`.
- Preservou o estado inicial `false`, o breakpoint de 1024 px, o timer inicial de 0 ms e os listeners moderno e legado.
- Manteve na página todos os 11 consumidores visuais de `isDesktop`, incluindo o sheet de comentários, drag, tabs e estilos responsivos.

## Fase 817 — CSS global de Listas

- Extraiu `listasPageCss` para `app/listas/lib/listas-page-css.ts` sem alterar o conteúdo do template.
- Manteve na página o único consumidor e a ordem de precedência `historietasThemeCss` → `listasPageCss`.

## Fase 818 — Formatação de Listas

- Extraiu os helpers puros de data, número e nota para `app/listas/lib/listas-format-utils.ts`.
- Manteve todos os consumidores, ordenações, agrupamentos e JSX em `app/listas/page.tsx`.

## Fase 819 — Parâmetros de rota de Listas

- Extraiu os normalizadores puros de modo, origem, categoria e ordenação para `app/listas/lib/listas-route-utils.ts`.
- Manteve os tipos locais, `useSearchParams`, consumidores e todos os fluxos da página em `app/listas/page.tsx`.

## Fase 820 — Detalhe de avaliação de Listas

- Extraiu o detalhe visual de estrelas, nota e data para `app/listas/components/listas-rating-detail.tsx`.
- Manteve na página a decisão de exibir avaliação, os dados do item e todos os fluxos persistidos.
