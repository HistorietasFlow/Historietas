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

## Fase 826 — Spinner de carregamento do leitor

- Extraiu `LoadingSpinner` e seus quatro estilos exclusivos para `app/ler-capitulo/components/ler-capitulo-loading-spinner.tsx`.
- Manteve os quatro consumidores, a animação global e todos os fluxos de carregamento na página.

## Fase 827 — CSS de foco da navegação inferior

- Extraiu `focusBottomNavigationCss` para `app/ler-capitulo/lib/ler-capitulo-focus-bottom-navigation-css.ts` sem alterar o template CSS.
- Manteve o único consumidor na renderização normal, após `LerCapituloLanguageBridge`, e separado de `leitorPageCss`.

## Fase 828 — Estilos dos comentários do leitor

- Extraiu os 55 estilos do sheet de comentários e o primitivo de texto seguro para módulos visuais dedicados.
- Preservou literalmente os valores, spreads, consumidores e comportamento visual; o painel e suas interações permanecem na página.

## Fase 829 — Estilos de layout do leitor

- Extraiu os 77 estilos de layout, controles e navegação, junto ao helper visual de tamanho do título, para um módulo dedicado.
- Preservou literalmente os objetos, spreads e limites de tamanho; estados, JSX e lógica de leitura permanecem na página.

## Fase 830 — Sheet de comentários do leitor

- Extraiu `ComentariosCapituloSheet` e seus helpers exclusivos de apresentação para componente dedicado, preservando literalmente estados, efeitos, props, callbacks, JSX e estilos.
- A página continua responsável pelos dados, autenticação, carregamento e mutações de comentários, sem alteração dos contratos Supabase ou de storage.

## Fase 831 — Normalização e composição de obras do leitor

- Extraiu os modelos e as transformações puras de obras, capítulos, arquivos e progresso, incluindo a composição dos dados locais e remotos, para um módulo dedicado.
- Preservou os fallbacks e a ordem da implementação; consultas Supabase, autenticação, storage, efeitos e mutações continuam na página, sem mudança intencional de comportamento.

## Fase 832 — Composição visual principal do leitor

- Extraiu a composição do cabeçalho, ajustes, conteúdo do capítulo, ações e navegação para um componente dedicado, mantendo as 368 linhas de JSX literalmente iguais.
- Estados, callbacks, acesso, autenticação, storage, consultas e mutações permanecem na página; sem mudança intencional de comportamento ou apresentação.

## Fase 833 — Leitura de comentários e perfis do leitor

- Extraiu os helpers de perfil e o carregamento de comentários, perfis e curtidas para um módulo de leitura dedicado, preservando consultas, paginação, autenticação de apoio, ordenação e fallbacks.
- A página mantém os efeitos, estados, mutações e o armazenamento local; a aplicação das curtidas locais é fornecida explicitamente ao loader, sem mudança intencional de comportamento.
