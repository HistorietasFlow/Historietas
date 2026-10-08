# Refatoração incremental — Home

## Fase 808 — Linha de carrossel da Home

- Extraiu `HomeCarouselRow` para `components/HomeCarouselRow.tsx`.
- Preservou a escolha de estilos por variante e viewport, o limiar de mais de três itens e os controles de rolagem desktop.
- Preservou o reset imediato, `requestAnimationFrame`, timer de 90 ms e cleanup do scroll.
- Manteve na Home os 18 consumidores, cards, seções, hero, recomendações, dados, autenticação, busca, favoritos e loaders.

## Fase 809 — Modo desktop da Home

- Extraiu `useHomeDesktopMode` para `app/hooks/use-home-desktop-mode.ts`.
- Preservou o estado inicial `false`, o breakpoint de 1024 px, o timer inicial de 0 ms e os listeners moderno e legado.
- Manteve na Home todos os consumidores visuais de `isDesktop`.

## Fase 810 — Cabeçalho de seção da Home

- Extraiu `HomeSectionHeader` para `components/HomeSectionHeader.tsx`.
- Preservou o contrato de `title` e `subtitle`, sem renderizar o subtítulo como já ocorria.
- Manteve na Home os 18 consumidores, as seções e os estilos tipográficos compartilhados.
