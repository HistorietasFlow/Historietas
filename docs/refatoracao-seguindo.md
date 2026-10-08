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
