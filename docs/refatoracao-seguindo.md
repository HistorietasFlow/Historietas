# Refatoração de Seguindo

## Fase 828 — modo desktop

- Extraiu o estado e o lifecycle responsivo para `useSeguindoDesktopMode`.
- Preservou o estado inicial, breakpoint, timer inicial de 0 ms e os listeners moderno e legado.

## Fase 829 — CSS global

- Extraiu `seguindoPageCss` para um módulo dedicado.
- Preservou literalmente o CSS e os dois consumidores com a ordem `historietasThemeCss` seguida de `seguindoPageCss`.
