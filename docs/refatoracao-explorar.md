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

## Fase 845 — traduções do Explorar

- Extraiu os mapas e helpers de tradução para `app/explorar/lib/explorar-translations.ts`.
- Preservou textos, idiomas, normalização, traduções dinâmicas e fallbacks, sem alterar os consumidores ou o comportamento.

## Fase 846 — estilos de layout, busca e filtros

- Extraiu os estilos do shell, cabeçalho, busca, categorias, filtros e confirmação 18+ para `app/explorar/lib/explorar-layout-styles.ts`.
- Preservou objetos, spreads, variantes e helpers visuais; os estilos próprios dos cards permaneceram na página.

## Fase 847 — estilos de seções e cards

- Extraiu os estilos de seções, carrosséis, autores e obras para `app/explorar/lib/explorar-content-styles.ts`.
- Preservou literalmente os valores, spreads, variantes desktop/mobile e helpers visuais, sem alterar o JSX ou comportamento.

## Fase 848 — modelos e normalização de obras

- Extraiu os modelos e normalizadores de obras, capítulos, métricas e merge para `app/explorar/lib/explorar-work-normalizers.ts`.
- Preservou defaults, regras de 18+, identificadores e precedência; a recuperação de backup é injetada e as operações de storage permanecem na página.

## Fase 849 — persistência local e backups

- Extraiu os helpers de storage por usuário, coleções e backups de arquivos para `app/explorar/lib/explorar-local-storage.ts`.
- Preservou as chaves, a serialização, os fallbacks e a precedência do arquivo atual sobre o backup, reutilizando os normalizadores existentes.

## Fase 850 — perfis e apresentação de autores

- Extraiu os helpers de perfis públicos, nomes, bios, iniciais e avaliações para `app/explorar/lib/explorar-author-profile-utils.ts`.
- Preservou consultas, aliases, deduplicação, traduções, formatação e falhas complementares sem alterar o catálogo ou as métricas de obras.

## Fase 851 — carregamento remoto do Explorar

- Extraiu a leitura das coleções, catálogo, capítulos e métricas para `app/explorar/lib/explorar-remote-loader.ts`.
- Preservou consultas, paginação, limites, fallbacks, métricas privadas e persistência local, mantendo os efeitos na página.

## Fase 852 — dados derivados e seções do Explorar

- Extraiu filtros, ordenações, agregação de autores e composição das seções para `app/explorar/lib/explorar-derived-utils.ts`.
- Manteve os `useMemo` e suas dependências na página, preservando busca, coleções, regras 18+, pontuações, desempates, títulos e limites, sem mover efeitos, storage ou carregamento remoto.

## Fase 853 — carregamento inicial do Explorar

- Extraiu apenas o lifecycle inicial para `app/explorar/hooks/use-explorar-initial-load.ts`, mantendo estados e refs na página.
- Preservou a ordem da autenticação, leitura e persistência locais, coleções, catálogo remoto, cancelamento e finalização do carregamento. Os demais lifecycles permaneceram na página.

## Fase 854 — consultas personalizadas e paginação do catálogo

- Extraiu a construção das consultas, o debounce e a ação de carregar mais para `app/explorar/hooks/use-explorar-catalog-query.ts`, mantendo os estados na página.
- Preservou filtros, cursor, controle de respostas obsoletas, cancelamento, ordem dos setters e os demais lifecycles.

## Fase 855 — cards de autores e obras

- Extraiu `AutorExplorarCard` e `ObraPublicadaCard` para componentes dedicados, preservando JSX, traduções, acessibilidade e variantes responsivas.
- Isolou o helper compartilhado de rota de autor e moveu o estilo de capa para o módulo visual existente, sem alterar as regras ou valores.
