# Refatoração de Em Alta

## Fase 845 — modo desktop

- Extraiu o lifecycle responsivo de `isDesktop` para `useEmAltaDesktopMode`.
- Preservou o timer inicial de `0ms`, os listeners moderno e legado, os consumidores responsivos e todos os fluxos de ranking na página.

## Fase 846 — CSS global da página

- Extraiu literalmente `emAltaPageCss` para um módulo local, preservando os dois consumidores e a ordem com `historietasThemeCss`.

## Fase 847 — LoadingSpinner

- Extraiu o spinner de carregamento e seus estilos exclusivos, preservando o único consumidor no branch de ranking.
