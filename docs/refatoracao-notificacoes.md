# Refatoração incremental — Notificações

## Fase 799 — Consulta de notificações filtradas

- Extraiu a consulta pura de filtro, busca, bloqueio de conteúdo 18+ e ordenação para `app/notificacoes/lib/notificacoes-filter-utils.ts`.
- Preservou o `useMemo` e todos os estados, carregadores, mutações, cache, Supabase, JSX, overlays e estilos em `app/notificacoes/page.tsx`.
- Moveu apenas os helpers compartilhados de classificação por capítulo/comunidade e data para evitar duplicação entre a página e a nova consulta.

## Fase 800 — Ponte de idioma das notificações

- Extraiu `NotificacoesLanguageBridge` para `app/notificacoes/components/notificacoes-language-bridge.tsx`.
- Preservou a tabela de traduções, padrões dinâmicos, escopos do DOM, atributos traduzíveis, observador e restauração condicional do conteúdo original.
- Manteve em `app/notificacoes/page.tsx` os dois pontos de montagem da ponte e toda a lógica de dados, autenticação, filtros, paginação e overlays.

## Fase 801 — Portal dos overlays de notificações

- Extraiu `NotificacoesOverlayPortal` para `app/notificacoes/components/notificacoes-overlay-portal.tsx`.
- Preservou a montagem adiada de `0ms`, o cleanup e o guard de DOM antes de criar o portal em `document.body`.
- Manteve na página os dois conteúdos dos overlays, seus estados, handlers, estilos e o lifecycle de overflow.

## Fase 802 — Utilitários de texto das notificações

- Extraiu `corrigirTextoQuebrado` e `limparTextoExibicao` para `app/notificacoes/lib/notificacoes-text-utils.ts`.
- Preservou literalmente as duas tentativas de correção, o fallback em erro e a remoção de espaços por `replace(/ /g, "")`.
- Manteve na página todos os consumidores de normalização de capítulos, obras, notificações, perfis, tags e dados do Supabase.

## Fase 803 — Modo desktop das notificações

- Extraiu `useNotificacoesDesktopMode` para `app/notificacoes/hooks/use-notificacoes-desktop-mode.ts`.
- Preservou a atualização inicial imediata por `matchMedia`, o listener moderno e o fallback legado.
- Manteve na página todos os consumidores visuais de `isDesktop`, estilos, overlays e dados.

## Fase 804 — CSS estático das notificações

- Moveu `notificacoesPageCss` para `app/notificacoes/lib/notificacoes-page-css.ts` sem alterar o conteúdo do template literal.
- Manteve os dois consumidores `<style>` e `historietasThemeCss` na página.

## Fase 805 — Helpers de navegação das notificações

- Moveu os helpers puros de links de leitura, perfil, diário e notificação para `app/notificacoes/lib/notificacoes-navigation-utils.ts`.
- Preservou a ordem de fallbacks, a validação de links internos e os encodings de parâmetros de rota.
- Manteve em `app/notificacoes/page.tsx` router, JSX, handlers, dados resolvidos, autenticação, loaders, estados e Supabase.

## Fase 806 — Helpers de apresentação semântica das notificações

- Moveu os helpers puros de rótulos, ícones, autores e cartões sociais para `app/notificacoes/lib/notificacoes-display-utils.ts`.
- Preservou as heurísticas de comunidade, as prioridades visuais e todos os textos de apresentação.
- Manteve na página a normalização, o avatar, JSX, estados, filtros, autenticação, carregadores e mutações Supabase.
