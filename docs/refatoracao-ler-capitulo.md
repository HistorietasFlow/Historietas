# Refatoração incremental — Ler capítulo

## Fase 823 — Modo desktop do leitor

- Extraiu `useLerCapituloDesktopMode` para `app/ler-capitulo/hooks/use-ler-capitulo-desktop-mode.ts`.
- Preservou o estado inicial `false`, o breakpoint de 1024 px, o timer inicial de 0 ms e os listeners moderno e legado.
- Manteve na página todos os consumidores de `isDesktop`, incluindo o sheet de comentários, estilos e JSX responsivo.

## Fase 824 — CSS global do leitor

- Extraiu `leitorPageCss` para `app/ler-capitulo/lib/ler-capitulo-page-css.ts` sem alterar o template CSS.
- Manteve na página os quatro consumidores, a ordem `historietasThemeCss` → `leitorPageCss` e `focusBottomNavigationCss` independente.

## Fase 825 — Bridge de idioma do leitor

- Extraiu `LerCapituloLanguageBridge`, a tabela de traduções e as regras dinâmicas para `app/ler-capitulo/components/ler-capitulo-language-bridge.tsx`.
- Preservou os três mounts, o idioma da página e o lifecycle de tradução/observação do DOM.
