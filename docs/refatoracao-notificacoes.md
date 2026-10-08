# Refatoração incremental — Notificações

## Fase 799 — Consulta de notificações filtradas

- Extraiu a consulta pura de filtro, busca, bloqueio de conteúdo 18+ e ordenação para `app/notificacoes/lib/notificacoes-filter-utils.ts`.
- Preservou o `useMemo` e todos os estados, carregadores, mutações, cache, Supabase, JSX, overlays e estilos em `app/notificacoes/page.tsx`.
- Moveu apenas os helpers compartilhados de classificação por capítulo/comunidade e data para evitar duplicação entre a página e a nova consulta.
