# Refatoração de Em Alta

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
