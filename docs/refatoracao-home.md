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

## Fase 815 — Avaliações dos autores da Home

- Extraiu `useHomeAuthorRatings` para `app/hooks/use-home-author-ratings.ts`.
- Preservou a extração, normalização, validação e deduplicação dos IDs de autores, o lifecycle assíncrono e os resets do mapa de avaliações.
- Manteve na Home a lista de autores, sua ordenação, a apresentação dos cards e o restante do carregamento de dados.

## Fase 816 — Utilitários de rotas da Home

- Extraiu `criarLoginHrefHome`, `criarHrefLeituraCapituloHome`, `criarHrefObraCatalogoHome` e `criarHrefPerfilAutorHome` para `app/lib/home-route-utils.ts`.
- Preservou os slugs, query strings, encoding, fallbacks e todas as rotas consumidas pela Home.
- Manteve na Home somente os consumidores dos quatro helpers.

## Fase 817 — Metadados e tradução da Home

- Extraiu a formatação de gêneros, as tabelas de tradução e os helpers de gênero, formato, classificação e bio do autor para `app/lib/home-metadata-utils.ts`.
- Preservou textos, acentos, regexes, normalizações, `toLocaleLowerCase` e todos os fallbacks da Home.
- Manteve na Home somente os consumidores dos helpers de metadados.

## Fase 818 — Formatação numérica e locale da Home

- Extraiu a normalização numérica, a resolução de locale, a compactação e a formatação de avaliações de autores para `app/lib/home-format-utils.ts`.
- Preservou `Math.max`, `Math.round`, `Number.isFinite`, a leitura de `document.documentElement.lang`, os locales e os sufixos de compactação da Home.
- Manteve na Home somente os consumidores dos helpers de formatação.

## Fase 819 — Coleções e identificadores da Home

- Extraiu os identificadores, normalização, comparação e remoção de coleções para `app/lib/home-collection-utils.ts`.
- Preservou a prioridade de IDs, slugs e slugs derivados, `trim()`, `Set`, normalização textual e os retornos booleanos.
- Manteve na Home a persistência de `localStorage` e seus consumidores do normalizador.

## Fase 820 — Persistência localStorage da Home

- Extraiu as chaves, leitura, escrita e listas isoladas por usuário para `app/lib/home-storage-utils.ts`.
- Preservou os guards de SSR, `try/catch`, serialização JSON, filtros, fallbacks e normalização das listas.
- Manteve na Home as constantes de storage e todos os consumidores dos helpers.

## Fase 821 — Busca e recomendação da Home

- Extraiu os helpers puros de busca local, busca de catálogo e temas de recomendação para `app/lib/home-discovery-utils.ts`.
- Preservou a ordem dos campos pesquisados, normalização, deduplicação, filtros literais e comparações de temas.
- Manteve na Home os `useMemo`, ranking, ordenação, limites e todos os consumidores dos helpers.

## Fase 822 — Progresso e continuidade de leitura da Home

- Extraiu o cálculo de progresso, a resolução do próximo capítulo e os tempos de leitura para `app/lib/home-reading-utils.ts`.
- Preservou a ordem dos fallbacks, `Math.round`, `Math.max`, o tratamento de datas inválidas e todos os retornos.
- Manteve na Home os `useMemo`, a ordenação e todos os consumidores dos helpers.
