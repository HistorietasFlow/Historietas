# Refatoração de Explorar

## Fase 833 — modo desktop

- Extraiu o estado e o lifecycle responsivo para `useExplorarDesktopMode`.
- Preservou o estado inicial, breakpoint, atualização síncrona e listeners moderno e legado.

## Fase 834 — CSS global da página

- Extraiu `themePageCss` para `app/explorar/lib/explorar-page-css.ts`.
- Manteve os dois consumidores e a ordem `themePageCss` → `historietasThemeCss`.

## Fase 835 — indicador de carregamento

- Extraiu `LoadingSpinner` e seus estilos exclusivos para `app/explorar/components/explorar-loading-spinner.tsx`.
- Manteve na página a condição de carregamento, o label traduzido e o CSS global da animação.

## Fase 836 — body lock dos filtros avançados

- Extraiu o lifecycle de lock e restauração de overflow para `useExplorarAdvancedFiltersBodyLock`.
- Manteve na página o estado, os handlers, o painel e todos os fluxos de dados.

## Fase 837 — CSS dos controles de busca

- Extraiu `explorarBuscaToggleCss` para `app/explorar/lib/explorar-search-toggle-css.ts`.
- Manteve na página o único consumidor, os controles de busca e todas as fronteiras de dados.

## Fase 845 — traduções do Explorar

- Extraiu os mapas e helpers de tradução para `app/explorar/lib/explorar-translations.ts`.
- Preservou textos, idiomas, normalização, traduções dinâmicas e fallbacks, sem alterar os consumidores ou o comportamento.

## Fase 846 — estilos de layout, busca e filtros

- Extraiu os estilos do shell, cabeçalho, busca, categorias, filtros e confirmação 18+ para `app/explorar/lib/explorar-layout-styles.ts`.
- Preservou objetos, spreads, variantes e helpers visuais; os estilos próprios dos cards permaneceram na página.

## Fase 847 — estilos de seções e cards

- Extraiu os estilos de seções, carrosséis, autores e obras para `app/explorar/lib/explorar-content-styles.ts`.
- Preservou literalmente os valores, spreads, variantes desktop/mobile e helpers visuais, sem alterar o JSX ou comportamento.

## Fase 848 — modelos e normalização de obras

- Extraiu os modelos e normalizadores de obras, capítulos, métricas e merge para `app/explorar/lib/explorar-work-normalizers.ts`.
- Preservou defaults, regras de 18+, identificadores e precedência; a recuperação de backup é injetada e as operações de storage permanecem na página.
