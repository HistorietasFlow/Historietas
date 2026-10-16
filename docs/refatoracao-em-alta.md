# Refatoração de Em Alta

## Fase 876 — card de obra do ranking

- `RankingCard` foi movido para componente dedicado.
- Navegação da obra e link do autor foram preservados.
- Metadata, status, métricas, destaque e tier permaneceram iguais.
- Nenhuma query, estado ou comportamento foi alterado.

## Fase 875 — card de autor do ranking

- `AutorRankingCard` foi movido para componente dedicado.
- Navegação por clique/teclado foi preservada.
- Avatar, fallback de inicial, métricas, tier e pontuação permaneceram iguais.
- Nenhum Supabase, estado global ou comportamento foi alterado.

## Fase 874 — métricas e estilos finais dos cards

- Métricas compartilhadas de obras/autores foram isoladas.
- Estilos finais específicos de autor foram movidos.
- Valores, ícones, tipografia e heranças foram preservados.
- `app/em-alta/page.tsx` não mantém mais constantes CSSProperties locais.
- Nenhum JSX ou comportamento foi alterado.

## Fase 873 — estrutura e metadata dos cards

- Estrutura interna, linhas de metadata, status e badges auxiliares foram isolados.
- Estilos mobile/desktop e tipografia foram preservados.
- Author link e estados visuais foram mantidos.
- Nenhuma métrica, JSX ou comportamento foi alterado.

## Fase 872 — shell e cabeçalho principal

- Isolou decoração, fundo, container e cabeçalho principal do ranking.
- Variantes mobile/desktop, gradientes, tipografia, dimensões e tema foram preservados.
- Nenhum JSX, estado ou comportamento foi alterado.

## Fase 871 — cabeçalhos das seções do ranking

- Isolou os estilos mobile/desktop das seções e cabeçalhos do ranking.
- Título, conteúdo, bloco de texto e ícone temático foram preservados.
- Os helpers continuam usando os temas da Fase 870; nenhum JSX ou comportamento foi alterado.

## Fase 870 — temas das categorias do ranking

- Isolou os temas de geral, lidas, curtidas, comentadas, salvas, recentes e fallback.
- Ícones, labels, cores, bordas, glow e backgrounds foram preservados literalmente.
- Consumidores e comportamento visual permaneceram iguais.

## Fase 869 — estilos dos carrosséis

- Isolou shell, setas, ícones e trilhos mobile/desktop dos carrosséis.
- Preservou dimensões, offsets, scroll snap e comportamento visual.
- Nenhuma lógica de rolagem ou JSX foi alterada.

## Fase 868 — badges visuais do ranking

- Moveu os estilos-base dos badges para a fronteira visual do ranking.
- Isolou os badges de ranking, tier de autor e pontos, preservando temas, tipografia, tamanhos e fallbacks.
- Nenhum comportamento ou JSX foi alterado.

## Fase 867 — base de texto e títulos dos cards

- Moveu `safeTextStyle` para a fronteira visual compartilhada do ranking.
- Isolou os títulos de obras e autores, preservando quebra de texto, clamp, tipografia e cores.
- Os demais consumidores de `safeTextStyle` permanecem na página sem alteração.

## Fase 866 — estilos-base dos cards do ranking

- Isolou as bases mobile/desktop dos cards no módulo visual do ranking.
- Preservou as variantes indisponíveis e a aplicação de temas por posição.
- Nenhum comportamento ou layout foi alterado.

## Fase 865 — avatar visual dos autores

- Moveu o estilo dinâmico do avatar para a fronteira visual do ranking.
- Temas, capa mobile/desktop e fallbacks visuais foram preservados sem alteração de comportamento.

## Fase 864 — temas de posição do ranking

- Isolou os temas Diamante, Rubi, Ouro, Prata e Bronze.
- Cores, gradientes, badges e sombras foram preservados literalmente.
- Consumidores e comportamento visual não foram alterados.

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

## Fase 877 — seções e carrosséis do ranking

- `RankingSection` e `AutoresEmAltaSection` foram movidos para componentes dedicados.
- Refs e rolagem suave foram preservados literalmente.
- Ordem invertida dos cards, setas e acessibilidade permaneceram iguais.
- Nenhuma lógica de dados, Supabase ou estado principal foi alterada.

## Fase 878 — cálculo do ranking de autores

- Agregação e pontuação de autores foram isoladas em helper puro.
- Agrupamento, média ponderada, pontuação e ordenação foram preservados.
- O `useMemo` e sua dependência `[ranking]` continuam na página.
- Nenhuma query, estado ou comportamento foi alterado.

## Fase 879 — cálculo do ranking de obras locais

- Transformação de `ObraLocal` para `ObraRanking` foi isolada.
- Filtros, métricas, progresso, continuação de leitura e pontuação foram preservados.
- O `useMemo` e suas três dependências continuam na página.
- Nenhuma query, mutação, estado ou JSX foi alterado.

## Fase 880 — visão derivada do ranking

- Isolou os tops por categoria, a detecção de atividade e o fallback do catálogo inicial em um helper puro.
- O `useMemo` da página continua dependente apenas de `ranking`.
- Nenhuma query, mutação, estado, JSX ou comportamento visual foi alterado.

## Fase 881 — composição das seções do ranking

- Moveu a composição de autores, categorias, catálogo inicial e estado vazio para um componente de apresentação dedicado.
- As props, a ordem das seções, textos, callbacks e estados visuais foram preservados literalmente.
- Supabase, autenticação, efeitos, estados e mutações permaneceram na página.

## Fase 882 — lifecycle de autenticação

- Moveu a leitura inicial e a revalidação de sessão para `useEmAltaAuthSession`.
- Timers, cleanup, fallbacks e atualização dos estados de autenticação foram preservados literalmente.
- Carregamento do ranking, coleções, mutações e JSX permaneceram na página.

## Fase 883 — cabeçalho de Em Alta

- Moveu a composição visual do cabeçalho para `app/em-alta/components/em-alta-header.tsx`.
- Preservou literalmente marca, rota da Home, acessibilidade e seleção responsiva dos estilos.
- Carregamento, autenticação, Supabase, estados e mutações permaneceram na página.
