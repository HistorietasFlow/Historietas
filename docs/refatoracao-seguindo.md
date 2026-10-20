# Refatoração de Seguindo

## Fase 981 — composição de estados e contexto da página

- Reuniu os grupos de dados, social e descoberta em `useSeguindoPageState`.
- Reuniu modo desktop, contexto de acesso e apresentação em `useSeguindoPageContext`, preservando a ordem original dos hooks.
- Não houve alteração intencional de dados, autenticação, rotas, comportamento visual ou regras de negócio.

## Fase 979 — apresentação e carregamento da página

- Agrupou a composição de tema e bloqueio do painel de ordenação em um hook visual dedicado.
- Moveu a apresentação do estado inicial de carregamento para um componente dedicado, preservando frame, spinner, label e variantes responsivas.

## Fase 980 — apresentação carregada e interações de conteúdo

- Extraiu a apresentação carregada para `SeguindoPageLoadedState`, preservando frame, container, controles e conteúdo.
- Agrupou a composição de navegação por abas e sincronização de busca em `useSeguindoPageContentInteractions`.
- Preservou ordem de hooks, callbacks, estados, busca, rotas, acessibilidade e comportamento visual.

## Fase 978 — sincronização inicial da página

- Agrupou a composição dos lifecycles adjacentes de acesso e carregamento inicial de dados.
- Preservou a ordem de execução, argumentos, autenticação, timers, cancelamentos e carregamento remoto existentes.

## Fase 977 — grupos de dados e contexto de acesso

- Agrupou os estados de obras/leitura/carregamento e de acesso/aba/perfil em dois hooks de composição.
- Preservou a ordem dos hooks, valores iniciais, setters e consumidores existentes, sem alterar lifecycles ou regras de negócio.

## Fase 976 — grupos de estado de interface e social

- Agrupou estados locais de listas/ações sociais e de busca/filtros/abas/ordenação em dois hooks de composição.
- Preservou a ordem dos hooks, valores iniciais, setters e consumidores existentes, sem alterar lifecycles ou regras de negócio.

## Fase 974 — orquestração de ações

- Agrupou a ligação dos hooks de ações de seguidores, usuários e obras/autores em `useSeguindoPageActions`.
- Preservou a ordem dos hooks, parâmetros, callbacks e responsabilidades de mutação existentes.

## Fase 973 — grupos de estado da página

- Dividiu o estado bruto em hooks coesos de obras/seguimentos, listas sociais e carregamento/atividades.
- Preservou valores iniciais e setters usados pelos carregamentos e ações, sem mudança intencional de comportamento.

## Fase 972 — estado de dados

- Moveu o estado bruto de obras, relações sociais, solicitações, atividades e carregamento para `useSeguindoDataState`.
- Preservou os defaults e setters consumidos pelos hooks de carregamento e ações, sem mudança intencional de comportamento.

## Fase 971 — dados derivados

- Agrupou a composição de contexto social, filtros, totais e opções de ordenação no hook `useSeguindoDerivedContent`.
- Preservou os hooks de efeitos, carregamento, ações e navegação no orquestrador da página, sem mudança intencional de comportamento.

## Fase 970 — composição do conteúdo

- Extraiu a composição condicional dos estados vazios e das seções de obras e pessoas para `SeguindoPageContent`.
- Preservou na página a orquestração de dados, estados, hooks e callbacks, sem mudança de comportamento visual ou funcional.

## Fase 969 — frame, controles e estado vazio

- Extraiu o frame visual comum, a composição de cabeçalho/controles e a mensagem pura de estado vazio para fronteiras dedicadas.
- Preservou tema, bridge de idioma, fades, condições, contagens, callbacks, textos e lifecycles na página.

## Fase 968 — seções de conteúdo

- Extraiu a composição visual das seções de obras e pessoas seguidas para componentes dedicados.
- Preservou condições, textos, variantes desktop/mobile, grids, ações e estados de carregamento, mantendo dados e callbacks na página.

## Fase 967 — cards de obras e autores seguidos

- Extraiu os cards visuais de obras e autores seguidos.
- Preservou rotas, variantes desktop/mobile, ações e regras de visibilidade na página.

## Fase 966 — cards sociais

- Extraiu os cards visuais de solicitações, perfis da lista social e sugestões de perfil.
- Preservou rotas, acessibilidade, ações, estados de carregamento e variantes desktop/mobile na página.

## Fase 965 — primitives de seção

- Extraiu os estados vazios e os cabeçalhos visuais de seção para componentes pequenos e sem estado.
- Preservou textos, contagens, variantes desktop/mobile e condições de exibição na página.

## Fase 964 — barra social

- Extraiu somente a composição visual das abas sociais para `SeguindoSocialToolbar`.
- Preservou contagens, callbacks, variantes desktop/mobile e a condição de exibição na página.

## Fase 963 — cabeçalho de busca e ordenação

- Extraiu somente a composição visual do cabeçalho desktop/mobile para `SeguindoHeader`.
- Preservou busca, acessibilidade, variantes responsivas e o gatilho do painel, mantendo estados e callbacks na página.

## Fase 962 — painel de ordenação

- Extraiu somente a composição visual do painel de ordenação para `SeguindoSortingPanel`, preservando as opções, estilos, fechamento e ordem dos callbacks.
- A página continua responsável pelo estado, pelo lifecycle de bloqueio da rolagem e pela condição de exibição.

## Fase 828 — modo desktop

- Extraiu o estado e o lifecycle responsivo para `useSeguindoDesktopMode`.
- Preservou o estado inicial, breakpoint, timer inicial de 0 ms e os listeners moderno e legado.

## Fase 829 — CSS global

- Extraiu `seguindoPageCss` para um módulo dedicado.
- Preservou literalmente o CSS e os dois consumidores com a ordem `historietasThemeCss` seguida de `seguindoPageCss`.

## Fase 830 — LoadingSpinner

- Extraiu o componente visual de carregamento e seus quatro estilos exclusivos.
- Preservou os dois consumidores, os modos normal e compacto e os keyframes no CSS global de Seguindo.

## Fase 831 — SeguindoLanguageBridge

- Extraiu o bridge de traduções dinâmicas, incluindo tabela, helpers e lifecycle do MutationObserver.
- Preservou os dois mounts, a raiz exclusiva de Seguindo e os guards/restaurações do DOM.

## Fase 832 — lock do painel de ordenação

- Extraiu o lifecycle de lock/restauração do `document.body` para `useSeguindoSortingSheetBodyLock`.
- Preservou guard, valores anteriores, ordem de lock/restauração e dependência do painel de ordenação.

## Fase 857 — storage por usuário

- Extraiu `criarStorageKeyUsuarioSeguindo`, `lerJsonStorageUsuarioSeguindo` e `salvarJsonStorageUsuarioSeguindo` para `app/seguindo/lib/seguindo-storage-utils.ts`.
- Preservou trim do usuário, chaves, serialização JSON, fallbacks e tolerância silenciosa a falhas de `localStorage`.
- Adicionou cobertura focada e manteve os consumidores da página sem alterar fluxo de carregamento ou persistência.
- Sem alterações de UI, autenticação, Supabase, schema ou RLS.

## Fase 858 — rotas e identidade

- Extraiu `criarLoginHrefSeguindo`, `obterParametrosSociaisSeguindoUrl`, `criarHrefPerfilAutorSeguindo`, `criarHrefPerfilUsuarioSeguindo` e `idUsuarioSupabaseValido` para `app/seguindo/lib/seguindo-route-utils.ts`.
- Preservou parsing dos parâmetros sociais, fallbacks de abas/conteúdo, validação UUID e construção das rotas de login e perfil.
- Adicionou cobertura focada e manteve os consumidores da página sem alterar navegação ou fluxo de autenticação.
- Sem alterações de UI, Supabase, schema ou RLS.

## Fase 859 — normalização e formatação

- Extraiu `normalizarNomeAutor`, `formatarGeneroSeguindo`, `normalizarListaTexto` e `normalizarNumeroSeguindo` para `app/seguindo/lib/seguindo-format-utils.ts`.
- Preservou aliases de gênero, normalização de nomes/listas, parsing numérico, arredondamento, piso zero e fallbacks.
- Adicionou cobertura focada e manteve todos os consumidores existentes da página.
- Sem alterações de UI, autenticação, Supabase, schema ou RLS.

## Fase 860 — coleções de obras

- Extraiu `criarChavesObra`, `obraEstaNaLista` e `removerObraDaLista` para `app/seguindo/lib/seguindo-work-collection-utils.ts`.
- Preservou IDs, slug, slug derivado do título, título normalizado, link, deduplicação e remoção por equivalência.
- Adicionou cobertura focada e manteve todos os consumidores existentes da página.
- Sem alterações de UI, autenticação, Supabase, schema ou RLS.
## Fase 975 — composição do carregamento da página

- Agrupou a composição de `useSeguindoDataLoader` e `useSeguindoDataLoadTrigger` em `useSeguindoPageDataLoading`.
- Preservou o loader, o gatilho, a ordem de chamada, os parâmetros, os estados e os contratos de carregamento existentes.
- Sem alterações de UI, autenticação, Supabase, schema, RLS ou regras de negócio.
