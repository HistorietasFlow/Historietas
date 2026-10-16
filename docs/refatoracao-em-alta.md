# Refatoração de Em Alta

## Fase 863 — estilos visuais do ranking

- Bases de capa mobile/desktop foram extraídas.
- Estilo dinâmico da capa e decoração da página foram isolados.
- Valores CSS e comportamento visual foram preservados; nenhuma lógica de ranking, estado ou dados foi alterada.

## Fase 862 — continuação de leitura

- Moveu a seleção do próximo capítulo para os helpers de dados do ranking.
- A prioridade após `ultimoCapituloLidoId` e o fallback global foram preservados.
- Nenhuma navegação ou comportamento foi alterado.

## Fase 861 — loader de obras publicadas

- Isolou a leitura do catálogo, obras, capítulos, métricas e profiles.
- Paginação, fallbacks, warnings e filtros foram preservados; a conversão continua delegada ao normalizador da Fase 860.
- Nenhuma escrita Supabase, schema ou RLS foi alterado.

## Fase 860 — normalização de obras Supabase

- Isolou tipo de arquivo e conversão Supabase → `ObraLocal`.
- Progresso, autor/avatar, fallbacks, arquivo e métricas foram preservados; nenhuma query Supabase foi movida ou teve comportamento alterado.

## Fase 859 — loader de profiles dos autores

- Isolou as duas leituras de `profiles` dos autores do ranking.
- As consultas por `user_id` e `id`, ordem, limite e warnings foram preservados; nenhuma escrita Supabase ou comportamento foi alterado.

## Fase 858 — helpers de perfil dos autores

- Extraiu leitura de nome/avatar e indexação dos profiles para helpers puros.
- A normalização e as chaves `user_id`/`id` foram preservadas; o loader Supabase permaneceu na página, sem alteração de query ou comportamento.

## Fase 857 — rotas e navegação

- Extraiu login redirect, leitura de capítulo e perfil de autor para helpers puros.
- Encoding, validações e fallbacks foram preservados, sem alteração intencional de navegação ou comportamento.

## Fase 856 — métricas e formatação

- Extraiu normalizadores de views e avaliações, formatação de números/data/gênero e cálculo de progresso de leitura.
- As funções permanecem puras, sem alteração intencional de comportamento.

## Fase 855 — registro das coleções no Diário

- Isolou o registro de favorito/conclusão no Diário.
- Preservou payload, autenticação, visibilidade e fallback.
- O erro continua não bloqueando o ranking; não houve mudança de schema/RLS ou comportamento.

## Fase 854 — sincronização Supabase das coleções

- Isolou a escrita de favoritos e concluídas, preservando autenticação e a ordem delete/insert.
- Preservou o fallback de insert sem `visibilidade`.
- Não houve alteração de schema/RLS ou comportamento; o Diário permaneceu fora da fase.

## Fase 853 — loader Supabase das coleções

- Moveu a leitura paginada de IDs de favoritos e concluídas para `app/em-alta/lib/em-alta-collection-supabase-loader.ts`.
- Preservou query, ordenação, paginação, validação defensiva e fallback.
- Nenhuma escrita Supabase ou autenticação foi movida.

## Fase 852 — storage local

- Moveu as chaves e os helpers de persistência local para `app/em-alta/lib/em-alta-local-storage-utils.ts`.
- Preservou fallbacks, serialização e normalização de IDs e avatares.
- Não houve alteração de Supabase nem de comportamento.

## Fase 851 — helpers puros de listas e ranking

- Moveu a identificação e normalização de obras de ranking para `app/em-alta/lib/em-alta-ranking-list-utils.ts`.
- Moveu a ordenação, o top 5 e a detecção de interação real para a mesma fronteira pura.
- Preservou o comportamento e deixou storage, Supabase e runtime da página inalterados.

## Fase 850 — language bridge

- Moveu o bridge de tradução dinâmica para componente dedicado.
- Preservou literalmente o `MutationObserver` e seu cleanup.
- Manteve os dois consumidores na página.
- Nenhuma mudança intencional de comportamento foi introduzida.

## Fase 849 — traduções puras

- Extraiu o mapa e os helpers puros de tradução para `app/em-alta/lib/em-alta-translations.ts`.
- Manteve `EmAltaLanguageBridge` na página.
- Nenhuma tradução ou comportamento foi alterado intencionalmente.

## Fase 848 — modelos e contratos de dados

- Moveu os modelos locais para `app/em-alta/lib/em-alta-models.ts`.
- Preservou literalmente os contratos de dados locais e Supabase.
- Não houve mudança de runtime ou comportamento.

## Fase 845 — modo desktop

- Extraiu o lifecycle responsivo de `isDesktop` para `useEmAltaDesktopMode`.
- Preservou o timer inicial de `0ms`, os listeners moderno e legado, os consumidores responsivos e todos os fluxos de ranking na página.

## Fase 846 — CSS global da página

- Extraiu literalmente `emAltaPageCss` para um módulo local, preservando os dois consumidores e a ordem com `historietasThemeCss`.

## Fase 847 — LoadingSpinner

- Extraiu o spinner de carregamento e seus estilos exclusivos, preservando o único consumidor no branch de ranking.
