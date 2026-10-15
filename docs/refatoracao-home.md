# Refatoração incremental — Home

## Fase 845 — Ação de favorito do Hero da Home

- Extraiu `alternarHeroFavoritoHome` para `app/lib/home-hero-favorite-action.ts`.
- Preservou na Home o adaptador, os valores derivados, os setters e os consumidores do Hero.
- Manteve guardas, autenticação, identificadores, storage, sincronização, atividade do Diário e mensagens de fallback.

## Fase 844 — Composição de recomendações da Home

- Extraiu os temas recomendados e as recomendações local/de catálogo para `app/lib/home-recommendation-list-utils.ts`.
- Preservou na Home os três `useMemo`, suas dependências e os consumidores de apresentação.
- Manteve exclusões, filtros, afinidade, desempates, fallback do catálogo, limites e ordem das listas.

## Fase 843 — Listas pessoais da Home

- Extraiu as listas de continuar lendo e Minha lista local/de catálogo para `app/lib/home-user-library-list-utils.ts`.
- Preservou na Home os três `useMemo`, suas dependências e os consumidores de apresentação.
- Manteve guards de sessão, filtros, ordenações, limites, datas inválidas e a ordem do catálogo.

## Fase 842 — Listas de busca da Home

- Extraiu a filtragem de obras publicadas e do catálogo para `app/lib/home-search-list-utils.ts`.
- Preservou na Home os dois `useMemo`, suas dependências e os consumidores de apresentação.
- Manteve busca, ordenação por data, datas inválidas, identidade do catálogo sem termo e ordem das correspondências.

## Fase 841 — Listas temáticas do catálogo da Home

- Extraiu as seis listas temáticas do catálogo para `app/lib/home-catalog-theme-list-utils.ts`.
- Preservou na Home os seis `useMemo`, suas dependências e todas as seções de apresentação.
- Manteve literalmente os termos, filtros e a ordem de `obrasFiltradas`, sem ordenação ou limite adicional.

## Fase 840 — Listas derivadas de obras locais da Home

- Extraiu as cinco listas derivadas de obras locais para `app/lib/home-local-work-list-utils.ts`.
- Preservou na Home os cinco `useMemo`, suas dependências e todos os consumidores de apresentação.
- Manteve filtros, ordenações, limites, busca e a ordem original da lista de arquivos anexados.

## Fase 839 — Lista “Autores para conhecer” da Home

- Extraiu a agregação, composição, ordenação e limite de autores para `app/lib/home-author-list-utils.ts`.
- Preservou o `useMemo` na Home, suas dependências, `useHomeAuthorRatings` e `MobileAutorCard`.
- Manteve a busca, totais, gêneros, perfis salvos e apresentação sem mudanças.

## Fase 838 — Lifecycle de autenticação e exigência de login da Home

- Extraiu o estado de autenticação, lifecycle de sessão e `exigirLoginHome` para `app/hooks/use-home-auth-session.ts`.
- Preservou `getUser`, `onAuthStateChange`, cancelamento, cleanup da subscription, mensagens e a rota de login.
- Manteve na Home os consumidores, demais chamadas de autenticação, loaders, favoritos e toda a apresentação.

## Fase 837 — Estados simples de UI da Home

- Extraiu `LoadingSpinner`, `HomeEmptyState` e `EmptySearch` para `components/HomeStatusStates.tsx`.
- Preservou semântica acessível, textos, markup e os estilos exclusivos de carregamento e estados vazios.
- Manteve na Home os três consumidores, a busca, o hero, os loaders e todos os demais fluxos de apresentação.

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

## Fase 823 — Utilitários do catálogo da Home

- Extraiu a imagem, o formato, a contagem de capítulos e a validação de arquivos do catálogo para `app/lib/home-catalog-utils.ts`.
- Preservou a prioridade de capas, os fallbacks e a validação de arquivos anexados.
- Manteve na Home os estilos, o hero e todos os consumidores dos helpers.

## Fase 824 — Métricas e conteúdo das obras locais da Home

- Extraiu as contagens de curtidas e comentários, os totais e a validação de conteúdo local para `app/lib/home-local-work-utils.ts`.
- Preservou `filter`, `trim()`, `Math.max`, os fallbacks dos totais e a validação do arquivo anexado.
- Manteve na Home os consumidores, o hero, os loaders e todas as derivações de apresentação.

## Fase 825 — Perfil e identidade dos autores da Home

- Extraiu a normalização, resolução de perfis, iniciais e bio padrão para `app/lib/home-author-profile-utils.ts`.
- Preservou chaves normalizadas, fallbacks, prioridades de perfil e textos da Home.
- Manteve na Home a persistência, as consultas Supabase, os loaders e a composição de autores.

## Fase 826 — Persistência e composição de autores da Home

- Extraiu a persistência local dos perfis de autores para `app/lib/home-author-storage-utils.ts`.
- Preservou as chaves, o isolamento por usuário, JSON, `try/catch`, normalização e fallbacks do storage.
- Extraiu a composição pura de autores para `app/lib/home-author-composition-utils.ts`.
- Preservou perfis salvos, gêneros, totais, bio, avatar, limites e hrefs, mantendo na Home o loader Supabase.

## Fase 827 — Loader Supabase de perfis de autores da Home

- Extraiu `carregarPerfisSupabaseHome` para `app/lib/home-author-profile-loader.ts`.
- Preservou as consultas separadas por `user_id` e `id`, selects, limites, aliases, warnings, normalização e persistência local dos perfis.
- Manteve na Home o consumidor do loader e todos os demais fluxos de obras, métricas e apresentação.

## Fase 828 — Normalizadores das obras locais da Home

- Extraiu a normalização de capítulos, obras e coleções salvas para `app/lib/home-local-work-normalizers.ts`.
- Preservou fallbacks, aliases de métricas, filtros de publicação e conteúdo, progresso e links das obras locais.
- Manteve na Home todos os consumidores, loaders, hooks e composição visual.

## Fase 829 — Normalizadores das obras Supabase da Home

- Extraiu a normalização de categorias, arquivos e obras Supabase para `app/lib/home-supabase-work-normalizers.ts`.
- Preservou os fallbacks, a ordenação dos capítulos, as interações locais, as métricas derivadas e os links.
- Manteve na Home os loaders, as consultas, o aplicador de progresso e todos os demais consumidores.

## Fase 830 — Progresso de leitura da Home

- Extraiu `aplicarProgressoLeituraHome` para `app/lib/home-reading-progress-utils.ts`.
- Preservou retorno sem progresso carregado, datas, desempate, capítulos, última leitura e recálculo do progresso.
- Manteve na Home o loader, as consultas e todos os demais consumidores.

## Fase 831 — Helpers Supabase das coleções da Home

- Extraiu o carregamento paginado e a sincronização das coleções para `app/lib/home-collection-supabase-utils.ts`.
- Preservou tabelas, queries, paginação, exclusão prévia, inserção com fallback de compatibilidade e tratamento de falhas.
- Manteve na Home os consumidores, o registro de atividades e todos os demais loaders.

## Fase 832 — Persistência de atividade do Diário da Home

- Extraiu `registrarAtividadeDiarioHome` para `app/lib/home-diary-activity-utils.ts`.
- Preservou guardas, tabela, payload, visibilidade, metadados e o `catch` silencioso da atividade.
- Manteve na Home o consumidor e todos os demais fluxos de hero, coleções e obras.

## Fase 833 — Dados puros do Hero da Home

- Extraiu a composição de obras locais do hero, sua resolução por identificadores e a sinopse mobile para `app/lib/home-hero-work-utils.ts`.
- Preservou campos, fallbacks, métricas, ordem dos identificadores, limites e reticências da sinopse.
- Manteve na Home os estilos, hooks, efeitos, loaders e todos os consumidores visuais do hero.

## Fase 834 — Estilos de capas e poster do Hero da Home

- Extraiu os estilos-base e helpers de capa mobile, miniatura e poster desktop para `app/lib/home-cover-hero-style-utils.ts`.
- Preservou propriedades CSS, spreads, gradientes, imagens, posições e fallbacks dos estilos existentes.
- Manteve na Home o `heroStyle`, as demais camadas do hero e todos os consumidores visuais.

## Fase 836 — Loader principal de obras Supabase da Home

- Extraiu o carregamento principal de obras publicadas e a seleção inicial do catálogo para `app/lib/home-supabase-works-loader.ts`.
- Preservou consultas, paginação de capítulos, métricas, perfis de autores, progresso, fallbacks, deduplicação e filtros de conteúdo publicado.
- Manteve na Home os consumidores, a busca, os hooks, o JSX e todos os demais fluxos de apresentação.

## Fase 835 — Estilos visuais restantes do Hero da Home

- Extraiu `heroStyle`, o fundo e a camada mobile, além da decoração, para `app/lib/home-hero-visual-style-utils.ts`.
- Preservou spreads, gradientes, posições, fallback visual e todos os valores CSS dos estilos existentes.
- Manteve na Home os estilos desktop, os demais estilos do Hero e todos os consumidores JSX.
