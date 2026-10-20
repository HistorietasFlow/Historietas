# Refatoração de Seguindo

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
