# Refatoração incremental — Listas

## Fase 816 — Modo desktop de Listas

- Extraiu `useListasDesktopMode` para `app/listas/hooks/use-listas-desktop-mode.ts`.
- Preservou o estado inicial `false`, o breakpoint de 1024 px, o timer inicial de 0 ms e os listeners moderno e legado.
- Manteve na página todos os 11 consumidores visuais de `isDesktop`, incluindo o sheet de comentários, drag, tabs e estilos responsivos.

## Fase 817 — CSS global de Listas

- Extraiu `listasPageCss` para `app/listas/lib/listas-page-css.ts` sem alterar o conteúdo do template.
- Manteve na página o único consumidor e a ordem de precedência `historietasThemeCss` → `listasPageCss`.

## Fase 818 — Formatação de Listas

- Extraiu os helpers puros de data, número e nota para `app/listas/lib/listas-format-utils.ts`.
- Manteve todos os consumidores, ordenações, agrupamentos e JSX em `app/listas/page.tsx`.

## Fase 819 — Parâmetros de rota de Listas

- Extraiu os normalizadores puros de modo, origem, categoria e ordenação para `app/listas/lib/listas-route-utils.ts`.
- Manteve os tipos locais, `useSearchParams`, consumidores e todos os fluxos da página em `app/listas/page.tsx`.

## Fase 820 — Detalhe de avaliação de Listas

- Extraiu o detalhe visual de estrelas, nota e data para `app/listas/components/listas-rating-detail.tsx`.
- Manteve na página a decisão de exibir avaliação, os dados do item e todos os fluxos persistidos.

## Fase 821 — Mídia das linhas de Listas

- Extraiu os helpers puros de estilo para capa de obra e avatar de autor para `app/listas/lib/listas-row-media-utils.ts`.
- Manteve na página o JSX, as iniciais, os links e os avatares específicos do Diário e dos comentários.

## Fase 822 — Mensagem de ação de Listas

- Extraiu `useListasActionMessage` para `app/listas/hooks/use-listas-action-message.ts`.
- Preservou o estado inicial vazio, o timer de 2600 ms, o cleanup e o setter real; mensagens, handlers e o status visual permanecem na página.

## Fase 1102 — Composições apresentacionais de Listas

- Extraiu o cabeçalho normal e o cabeçalho do Diário, incluindo avatar, resumo e avaliação, para `ListasPageHeader`.
- Extraiu os controles de categorias do perfil para `ListasProfileCategoryControls`, mantendo categorias, contagens e navegação na página.
- Extraiu os estados e a lista principal de resultados para `ListasResultsSection`, preservando loading, privacidade, erro, vazio, agrupamento mensal, renderizadores e paginação na página.

## Fase 1103 — Overlays e ações de obra de Listas

- Extraiu `ListasWorkActionSheet` e `ListasAnnotationEditor`, mantendo na página estados, cálculos, callbacks e mutações de obra e anotação.
- Extraiu `ListasDiaryReportModal`, preservando o alvo, o fechamento e a mensagem de sucesso controlados pela página.

## Fase 1104 — Sheet de comentários do Diário

- Extraiu a apresentação do comentário, da thread e do sheet de comentários para componentes dedicados.
- Manteve na página ordenação, permissões, estados de arraste e expansão, cálculos de respostas, refs, callbacks, mutações e toda interação com Supabase.

## Fase 1106 — Utilitários locais de Listas

- Extraiu parsing, validação, localStorage, coleções locais e normalizadores do Diário para módulos puros.
- Manteve na página estados, hooks, carregadores e toda consulta ou mutação Supabase.

## Fase 1107 — Domínio puro do Diário de Listas

- Extraiu anotações locais, cálculos de avaliação e ordenação de comentários para utilitários puros.
- Manteve na página carregadores, estados, hooks, permissões, callbacks, mutações e toda interação com Supabase.

## Fase 1105 — Linhas de obras e autores de Listas

- Extraiu as linhas de obra do perfil, obra pública e autor, preservando na página cálculos, hrefs, estados e callbacks.
- Extraiu o card expandido de anotação, mantendo na página permissões, interações, mutações de curtida, comentários e estado de spoiler.
