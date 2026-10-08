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

## Fase 811 — CSS global da Home

- Extraiu `themePageCss` para `app/lib/home-page-css.ts` sem alterar seu conteúdo.
- Manteve na Home os dois consumidores e a ordem de precedência `themePageCss` → `historietasThemeCss`.

## Fase 812 — Bridge de tradução dinâmica da Home

- Extraiu `useHomePageTranslations` para `app/hooks/use-home-page-translations.ts` com tabela, `WeakMap`s e traversal do DOM.
- Preservou a execução do efeito após cada render, o `MutationObserver`, os atributos traduzíveis e o cleanup somente por `disconnect()`.
- Manteve na Home a ref raiz, o idioma, as traduções semânticas de cards e todos os consumidores visuais.

## Fase 813 — Indicadores do carrossel do hero

- Extraiu `HomeHeroCarouselDots` para `components/HomeHeroCarouselDots.tsx`.
- Preservou os dois consumidores desktop/mobile, labels, chaves, callback por índice e todos os estilos dos indicadores.
- Manteve na Home o estado, a rotação automática, dados, métricas, favoritos e a composição do hero.

## Fase 814 — Lifecycle do carrossel do hero

- Extraiu `useHomeHeroCarousel` para `app/hooks/use-home-hero-carousel.ts`.
- Preservou o estado inicial, os timers de 0 ms para reset e ajuste, e a rotação por intervalo de 9 segundos.
- Manteve na Home a busca, derivação de obras, dados, métricas, favoritos e a composição do hero.
