# Refatoração do Painel do Autor

## Fase 854 — modo desktop

- Extraído `usePainelAutorDesktopMode` para lifecycle responsivo próprio.
- A página mantém todos os consumidores visuais de `isDesktop` e as responsabilidades de autenticação, dados, storage e filtros.

## Fase 855 — CSS global

- Extraído `painelAutorPageCss` para módulo próprio, preservando os dois consumidores e a ordem `historietasThemeCss → painelAutorPageCss`.

## Fase 856 — loading visual

- Extraído `LoadingSpinner` com seus estilos exclusivos; keyframe e reduced-motion permanecem em `painelAutorPageCss`.

## Fase 857 — body lock do painel de filtros

- Extraído `usePainelAutorFiltersBodyLock`, preservando o lock e a restauração de `overflow` e `overscroll-behavior`.

## Contrato de preservação

- Estado inicial `false`, atualização síncrona por `window.innerWidth >= 1024`, listener `resize` e cleanup permanecem equivalentes.
- Não alterar autenticação, Supabase, loaders, métricas, localStorage, filtros, ordenação, bridge de idioma ou cards fora de uma fase dedicada.
