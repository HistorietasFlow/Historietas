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
