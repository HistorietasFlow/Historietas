# Refatoração de Seguindo

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
