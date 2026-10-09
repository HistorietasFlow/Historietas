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

## Fase 858 — body lock do action sheet de obra

- Extraído `usePainelAutorWorkActionsBodyLock`, preservando o guard de documento e a restauração de propriedades do viewport.

## Fase 859 — traduções de interface

- Extraídos `PainelAutorTranslationEntry`, `PAINEL_AUTOR_UI_TRANSLATIONS` e `traduzirTextoPainelAutor` para módulo puro, mantendo o bridge, observer e consumidores na página.

## Fase 860 — bridge de idioma

- Extraído `PainelAutorLanguageBridge`, preservando observer, tradução de textos e atributos, e restauração no cleanup.

## Fase 861 — helpers de navegação

- Extraídos `criarLoginHrefPainelAutor` e `criarPerfilAutorHref` para módulo puro, preservando URLs, parâmetros, encoding e fallbacks.

## Fase 862 — helpers de formatação

- Extraídos `formatarGeneroPainelAutor` e `obterTimestamp`, preservando normalização, fallbacks e consumidores.

## Fase 863 — opções de filtros e ordenação

- Extraídos `FiltroPainel`, `OrdenacaoPainel`, `FILTROS_PAINEL` e `ORDENACOES_PAINEL`, preservando tipos, valores, rótulos, ordem e consumidores.

## Fase 864 — helpers de armazenamento

- Extraídos `normalizarListaIds` e `criarStorageKeyUsuarioPainel`, preservando normalização, deduplicação, fallbacks, chaves e consumidores.

## Fase 865 — leitura e gravação de armazenamento

- Extraídos `lerStorageUsuarioPainel` e `salvarJsonStorageUsuarioPainel`, preservando guardas, trim, chaves, JSON, tratamento de erros e consumidores.

## Fase 866 — helpers de listas do storage

- Extraídos `carregarListaIdsPainel` e `salvarListaIdsUsuarioPainel`, preservando JSON, normalização, fallbacks, erros e consumidores.

## Fase 867 — helpers de coleção do storage

- Extraídos `lerListaIdsStoragePainel` e `salvarColecaoAposExcluirPainel`, preservando parâmetro padrão, JSON, normalização, erros e consumidores.

## Fase 868 — identificação de obras e coleções

- Extraídos `obterIdentificadoresObraPainel`, `colecaoTemObraPainel` e `removerObraDaColecaoPainel`, preservando normalização, deduplicação e consumidores.

## Fase 869 — métricas de capítulos

- Extraídos `calcularCurtidas`, `calcularComentarios` e `calcularSalvos`, preservando contagens, tratamento de comentários e consumidores.

## Fase 870 — progresso de leitura

- Extraídos `obterCapitulosPublicadosPainel` e `calcularProgressoLeitura`, preservando o filtro de publicação, identidades, contagem de lidos, arredondamento e fallback zero.

## Fase 871 — continuar leitura

- Extraído `encontrarCapituloParaContinuar`, preservando seleção de capítulos publicados, avanço após o último lido, fallbacks, retornos nulos e identidade dos capítulos.

## Contrato de preservação

- Estado inicial `false`, atualização síncrona por `window.innerWidth >= 1024`, listener `resize` e cleanup permanecem equivalentes.
- Não alterar autenticação, Supabase, loaders, métricas, localStorage, filtros, ordenação, bridge de idioma ou cards fora de uma fase dedicada.
