# Refatoração da Comunidade

## Registro da Fase 1 — Configurações

- As regras puras de busca, aliases e idioma foram isoladas em configuracoes-search-utils; a limpeza de identidade, UUID, metadata administrativa e iniciais foi isolada em configuracoes-account-utils.
- Os fluxos de autenticação, Supabase, localStorage, estados, efeitos e apresentação permaneceram em app/configuracoes/page.tsx, sem mudança intencional de comportamento.

## Registro da Fase 30 — Notificações

- A estrutura atual de `app/notificacoes/page.tsx` foi revisada e mantida como orquestradora enxuta: estados locais, hooks, componentes visuais, mutações e carregamento já possuem fronteiras dedicadas.
- Não foram criadas abstrações adicionais para evitar fragmentar callbacks, composição de props e comportamento existente.

## Registro da Fase 29 — Notificações

- Os callbacks do painel de ordenação foram isolados em `notificacoes-sorting-action-callbacks`, preservando a execução de cada ação antes do fechamento visual do painel, sem alterar as mutações, o carregamento ou a autenticação.

## Registro da Fase 28 — Notificações

- O estado derivado da página foi isolado em `use-notificacoes-page-view-state`, preservando memos, filtros, totais, busca de obras/capítulos e bloqueio 18+; os callbacks de controles visuais foram concentrados em `use-notificacoes-page-controls` sem alterar o carregamento ou as mutações.

## Registro da Fase 27 — Notificações

- Os controles locais de busca, filtro, ordenação e menus foram isolados em `use-notificacoes-page-controls`; o atualizador local de notificações foi separado em `notificacoes-state-update-action`, preservando normalização, contagem de não lidas e persistência sem alterar o carregamento, os dados remotos ou as ações de negócio.

## Registro da Fase 26 — Notificações

- A orquestração das ações mutáveis de leitura, limpeza, remoção e resposta de solicitação foi isolada em `app/notificacoes/lib/notificacoes-mutation-actions.ts`, preservando transições locais, RPC, sincronização remota, fallbacks e persistência.

## Registro da Fase 25 — Notificações

- As transições locais das notificações e a identificação de solicitações de seguidor relacionadas foram isoladas em helpers puros, preservando a ordem de atualização local, sincronização e remoção remota.

## Registro da Fase 24 — Notificações

- As opções de filtro/ordenação e os dados derivados de visualização de Notificações foram isolados em helpers puros, preservando rótulos, contagens, buscas de obra/capítulo e estado do menu.

## Registro da Fase 23 — Notificações

- O lifecycle inicial de Notificações foi isolado em `use-notificacoes-initial-load`.
- Autenticação, carregamento local/remoto, composição, persistência, cancelamento, fallbacks e ordem dos estados foram preservados sem alterar o comportamento da página.

## Registro da Fase 22 — Notificações

- O carregador complementar de notificações da Comunidade foi isolado em `notificacoes-supabase-community-loader`.
- Consultas sociais, denúncias, capítulos, reviews, bloqueio 18+, perfis, links, fallbacks e ordenação foram preservados sem alterar o lifecycle ou o estado remoto da página.

## Registro da Fase 21 — Notificações

- O carregador complementar de interações e atividades do Diário foi isolado em `notificacoes-supabase-diary-loader`.
- Consultas de anotação, interações, perfis seguidos, obras, filtragem 18+, fallbacks e ordenação foram preservados sem alterar o lifecycle ou o estado remoto da página.

## Registro da Fase 20 — Notificações

- O carregador de notificações diretas foi isolado em `notificacoes-supabase-direct-loader`.
- Leitura, filtragem fechada de conteúdo 18+, consultas auxiliares de obras, normalização, complementação de perfis e ordenação foram preservadas sem alterar o estado remoto da página.

## Registro da Fase 19 — Notificações

- A leitura complementar de perfis e o carregador de atualizações de chamados técnicos foram isolados em loaders Supabase dedicados.
- Seleções de perfis, RPC, fallbacks, ordenação, estados de leitura e o lifecycle da página foram preservados sem mudança de comportamento.

## Registro da Fase 18 — Notificações

- Os loaders remotos de obras publicadas e de obras referenciadas por notificações diretas foram isolados em `notificacoes-supabase-work-loader`.
- Consultas, tentativas de seleção, normalização, fallbacks de obra/capítulo e progresso de leitura foram preservados sem alterar o lifecycle da página.

## Registro da Fase 17 — Notificações

- A leitura remota do estado de obras seguidas e notificações lidas foi isolada em `notificacoes-supabase-state-loader`, preservando autenticação, queries, limites, deduplicação e fallbacks.
- O carregador de notificações diretas permaneceu na página e é injetado na composição do estado para evitar dependência circular.

## Registro da Fase 16 — Notificações

- As mutações remotas de leitura e remoção foram isoladas em `notificacoes-supabase-sync`, preservando RPCs, fallbacks por tabela, escopo de usuário e falhas não bloqueantes.
- O estado local e todos os callbacks continuam sob responsabilidade da página.

## Registro da Fase 15 — Notificações

- A moldura visual compartilhada de Notificações foi isolada em `NotificacoesPageShell`, preservando tema, stylesheet, ponte de idioma, fades responsivos e os dois fluxos de renderização.
- Nenhum comportamento, dado, consulta ou callback da página foi alterado.

## Registro da Fase 14 — Notificações

- A lista e o cartão de notificações foram isolados em componentes visuais, preservando estados vazios, variantes desktop, acessibilidade, navegação e callbacks de interação na página.

## Registro da Fase 13 — Notificações

- Os controles superiores e o menu de ações por notificação foram isolados em componentes visuais, preservando busca, filtros, portal, navegação e callbacks de mutação na página.

## Registro da Fase 12 — Notificações

- O painel visual de ordenação e ações foi isolado em componente dedicado, preservando portal, opções, estados desabilitados e callbacks de mutação na página.

## Registro da Fase 11 — Notificações

- Os estilos estáticos do shell, controles e cards foram isolados em módulos visuais, preservando valores, spreads e variantes desktop sem alterar o JSX.

## Registro da Fase 10 — Notificações

- A normalização pura de registros remotos, o merge de obras e a leitura local de IDs foram isolados, preservando aliases, defaults, deduplicação e guards SSR.

## Registro da Fase 9 — Notificações

- A persistência local e a preparação de notificações foram isoladas, preservando isolamento por usuário, guards SSR, normalização, exclusões e o evento de atualização.

## Registro da Fase 8 — Notificações

- A composição pura de notificações de capítulos das obras seguidas foi isolada, preservando identificação, filtros de autoria, links, leitura e ordenação.

## Registro da Fase 7 — Notificações

- O fallback puro de obras e capítulos de notificações diretas foi extraído, preservando parsing, títulos, defaults, progresso e links locais.

## Registro da Fase 6 — Notificações

- Normalizadores puros de dados e perfis foram separados, preservando aliases Supabase, fallbacks, limites de apresentação e consumidores da página.

## Registro da Fase 5 — Notificações

- Os textos puros de status de denúncias, chamados técnicos e anotações do Diário foram isolados sem alterar consultas, estados ou mensagens apresentadas.

## Registro da Fase 4 — Notificações

- O estado vazio visual da lista foi isolado em componente dedicado, preservando prioridade das mensagens, textos e estilos sem alterar o fluxo da página.

## Registro da Fase 2 — Notificações

- A rota de login, o estilo de avatar e a deduplicação de notificações foram isolados em helpers puros, preservando a ordem de prioridade, os fallbacks e os consumidores existentes.

## Registro da Fase 1 — Notificações

- Modelos locais, persistência isolada por usuário e normalizadores puros foram movidos para módulos dedicados, preservando chaves, fallbacks e contratos de dados sem alterar o comportamento da página.

## Registro da Fase 982 — Seguindo

- A refatoração estrutural de Seguindo foi considerada concluída por enquanto: a página permanece como orquestrador enxuto, sem abstrações adicionais artificiais.

## Registro da Fase 981 — Seguindo

- Os grupos de estado e contexto da página foram compostos em hooks dedicados, preservando a ordem dos hooks e todas as responsabilidades existentes.

## Registro da Fase 979 — Seguindo

- A composição visual de tema e lock do painel e o estado de carregamento inicial foram isolados sem alterar autenticação, dados ou ações.

## Registro da Fase 980 — Seguindo

- A apresentação carregada e a composição das interações de conteúdo foram isoladas sem alterar dados, navegação, busca ou comportamento visual.

## Registro da Fase 978 — Seguindo

- A composição dos lifecycles de acesso e carregamento inicial foi isolada, mantendo autenticação, timers e carregamento remoto nas fronteiras existentes.

## Registro da Fase 977 — Seguindo

- Os estados locais de dados e de contexto de acesso foram agrupados em hooks de composição, sem alterar carregamento, autenticação ou ações.

## Registro da Fase 974 — Seguindo

- A orquestração dos hooks de ações sociais e de obras foi isolada, mantendo as mutações nos módulos existentes.

## Registro da Fase 973 — Seguindo

- Os grupos de estado de obras/seguimentos, listas sociais e carregamento/atividades foram isolados em hooks próprios, sem alterar carregamento ou ações.

## Registro da Fase 972 — Seguindo

- O estado bruto de dados de Seguindo foi isolado em hook próprio, mantendo carregamento e ações na página.

## Registro da Fase 971 — Seguindo

- Os dados derivados de Seguindo foram isolados em um hook de composição, mantendo efeitos, ações e estados na página.

## Registro da Fase 970 — Seguindo

- A composição visual condicional do conteúdo de Seguindo foi isolada, mantendo dados, estados e ações no orquestrador da página.

## Registro da Fase 969 — Seguindo

- O frame, os controles visuais e as mensagens de estado vazio de Seguindo foram isolados sem alterar dados, estados, ações ou comportamentos.

## Registro da Fase 968 — Seguindo

- As composições visuais das seções de obras e pessoas seguidas foram isoladas, mantendo dados, estados e ações na página.

## Registro da Fase 967 — Seguindo

- Os cards de obras e autores seguidos foram isolados, preservando dados e callbacks na página.

## Registro da Fase 966 — Seguindo

- Os três cards sociais de Seguindo foram isolados, mantendo a página como responsável por dados e ações.

## Registro da Fase 965 — Seguindo

- Os primitives visuais de estado vazio e cabeçalho de seção de Seguindo foram isolados sem alterar callbacks ou dados.

## Registro da Fase 964 — Seguindo

- A barra social visual de Seguindo foi extraída para componente dedicado, preservando abas, contagens e callbacks.

## Estado atual

- A Fase 297 extraiu somente `compartilharPublicacao` e foi concluída com o PR #419 mesclado.
- A Fase 298 extraiu somente `carregarPostsComunidade` e foi concluída com o PR #421 mesclado.
- A Fase 299 extraiu somente `carregarMaisPostsComunidade` e foi concluída com o PR #422 mesclado.
- A Fase 300 extraiu somente `selecionarObraRelacionada` e foi concluída com o PR #424 mesclado.
- A Fase 301 extraiu somente `fecharComentarios` e foi concluída com o PR #426 mesclado.
- A Fase 302 extraiu somente `abrirComentarios` e foi concluída com o PR #428 mesclado.
- A Fase 303 extraiu somente `exigirLogin` e foi concluída com o PR #430 mesclado.
- A Fase 304 extraiu somente `garantirAceiteAntesDePublicarComunidade` e foi concluída com o PR #432 mesclado.
- A Fase 305 extraiu somente `temFiltrosAtivosComunidade` a partir do cálculo de `filtrosAtivos` e foi concluída com o PR #434 mesclado.
- A Fase 306 extraiu somente `obterPostComentariosAbertoComunidade` a partir do cálculo de `postComentariosAberto` e foi concluída com o PR #436 mesclado.
- A Fase 307 extraiu somente `obterSugestoesObrasRelacionadasVisiveisComunidade` a partir do cálculo de `sugestoesObrasRelacionadasVisiveis` e foi concluída com o PR #438 mesclado.
- A Fase 308 extraiu somente `normalizarTermoBuscaComunidade` a partir do cálculo de `termoBuscaNormalizado` e foi concluída com o PR #440 mesclado.
- A Fase 309 extraiu somente `obterTituloDenunciaComunidade` a partir do cálculo de `alvoTitulo` em `denunciarConteudo` e foi concluída com o PR #442 mesclado.
- A Fase 310 extraiu somente `obterDataOrdenacaoPostComunidade` e `obterDataFixacaoOrdenacaoPostComunidade` a partir dos cálculos temporais da ordenação de `postsVisiveis` e foi concluída com o PR #444 mesclado.
- A Fase 311 extraiu somente `postCombinaTermoBuscaComunidade` a partir do trecho final da busca textual de `postsVisiveis` e foi concluída com o PR #445 mesclado.
- A Fase 312 extraiu somente `normalizarTermoBuscaUsuariosComunidade` a partir da normalização do termo da busca de usuários e foi concluída com o PR #446 mesclado.
- A Fase 313 extraiu somente `postCombinaCategoriaComunidade`, `postCombinaTipoPublicacaoComunidade` e `postCombinaObraRelacionadaComunidade` a partir dos filtros básicos de `postsVisiveis` e foi concluída com o PR #447 mesclado.
- A Fase 314 extraiu somente `postCombinaGrupoPublicacaoComunidade` e `postCombinaAbaFeedComunidade` a partir dos filtros de contexto do feed em `postsVisiveis` e foi concluída com o PR #448 mesclado.
- A Fase 315 extraiu somente `deveOcultarPostPorFiltroSalvosComunidade` a partir da condição do filtro de salvos em `postsVisiveis` e foi concluída com o PR #449 mesclado.
- A Fase 316 extraiu somente `obterPrioridadeAutorSeguidoComunidade` a partir do cálculo de prioridade de autores seguidos na ordenação de `postsVisiveis` e foi concluída com o PR #450 mesclado.
- A Fase 317 extraiu somente `compararPostsPorPontuacaoComunidade` e `compararPostsPorComentariosComunidade` a partir dos respectivos ramos da ordenação de `postsVisiveis` e foi concluída com o PR #451 mesclado.
- A Fase 318 extraiu somente `obterPrioridadeFixacaoPostComunidade` e `compararPostsFixadosPorDataComunidade` a partir dos ramos de fixação da ordenação de `postsVisiveis` e foi concluída com o PR #452 mesclado.
- A Fase 319 extraiu somente `compararDatasOrdenacaoPostsComunidade` a partir da comparação de datas normalizadas na ordenação de `postsVisiveis` e foi concluída com o PR #453 mesclado.
- A Fase 320 extraiu somente `compararPrioridadesAutoresSeguidosComunidade` a partir da comparação de prioridades de autores seguidos na ordenação de `postsVisiveis` e foi concluída com o PR #454 mesclado.
- A Fase 321 extraiu somente `devePriorizarAutoresSeguidosComunidade` a partir da condição que ativa a prioridade de autores seguidos na ordenação de `postsVisiveis` e foi concluída com o PR #455 mesclado.
- A Fase 322 extraiu somente `deveOrdenarPostsPorComentariosComunidade` e `deveOrdenarPostsPorPontuacaoComunidade` a partir das condições dos respectivos modos de ordenação de `postsVisiveis` e foi concluída com o PR #456 mesclado.
- A Fase 323 extraiu somente `postsPossuemFixacaoDiferenteComunidade` e `postsEstaoFixadosComunidade` a partir das condições dos ramos de fixação na ordenação de `postsVisiveis` e foi concluída com o PR #457 mesclado.
- A Fase 324 extraiu somente `prioridadesAutoresSeguidosSaoDiferentesComunidade` a partir da comparação das prioridades de autores seguidos na ordenação de `postsVisiveis` e foi concluída com o PR #458 mesclado.
- A Fase 325 extraiu somente `deveOcultarPostPorFiltrosBasicosEContextuaisComunidade` a partir da decisão combinada dos filtros básicos e contextuais de `postsVisiveis` e foi concluída com o PR #459 mesclado.
- A Fase 326 extraiu somente `compararUsuariosBuscaComunidade` a partir do comparador inline de `usuariosOrdenados.sort(...)` e foi concluída com o PR #460 mesclado.
- A Fase 327 extraiu somente `mesclarUsuariosBuscaComunidade` a partir do bloco de combinação e deduplicação da busca de usuários e foi concluída com o PR #461 mesclado.
- A Fase 328 extraiu somente `deveLimparBuscaUsuariosComunidade` a partir da condição de limpeza da busca de usuários e foi concluída com o PR #462 mesclado.
- A Fase 329 extraiu somente `normalizarTermoComparacaoUsuariosComunidade` a partir da normalização do termo usada no comparador da busca de usuários e foi concluída com o PR #463 mesclado.
- A Fase 330 extraiu somente `limitarUsuariosBuscaComunidade` a partir do limite final da busca combinada de usuários e foi concluída com o PR #464 mesclado.
- A Fase 331 extraiu somente `ordenarUsuariosBuscaComunidade` a partir do `.sort(...)` inline da busca combinada de usuários e foi concluída com o PR #465 mesclado.
- A Fase 332 extraiu somente `usuarioBuscaEhUsuarioAtualComunidade`, `usuarioBuscaEhSeguidoComunidade` e `usuarioBuscaEstaAtualizandoSeguimentoComunidade` a partir dos estados do resultado da busca de usuários e foi concluída com o PR #466 mesclado.
- A Fase 333 extraiu somente `obterInicialAvatarUsuarioBuscaComunidade` e `obterTextoUsernameUsuarioBuscaComunidade` a partir dos textos de apresentação do resultado da busca de usuários e foi concluída com o PR #467 mesclado.
- A Fase 334 extraiu somente `obterTextoBotaoSeguirUsuarioBuscaComunidade` a partir do texto do botão de seguir no resultado da busca de usuários e foi concluída com o PR #468 mesclado.
- A Fase 335 extraiu somente `deveExibirInstrucaoBuscaUsuariosComunidade` a partir da condição de termo mínimo da interface de busca de usuários e foi concluída com o PR #469 mesclado.
- A Fase 336 extraiu somente `temResultadosBuscaUsuariosComunidade` a partir da condição de existência de resultados da busca de usuários e foi concluída com o PR #470 mesclado.
- A Fase 337 extraiu somente `deveExibirControlesBuscaComunidade` a partir da condição de exibição dos controles da busca e foi concluída com o PR #471 mesclado.
- A Fase 338 extraiu somente `abrirBuscaComunidade` e `fecharBuscaComunidade` a partir dos handlers dos controles da busca e foi concluída com o PR #472 mesclado.
- A Fase 339 extraiu somente `deveExibirResultadosBuscaComunidade` a partir da condição compartilhada de exibição dos resultados da busca e foi concluída com o PR #473 mesclado.
- A Fase 340 extraiu somente `obterTextoContagemUsuariosBuscaComunidade` a partir do texto do contador de usuários da busca e foi concluída com o PR #474 mesclado.
- A Fase 341 extraiu somente `obterAriaLabelPerfilComunidade` a partir da construção compartilhada dos rótulos acessíveis dos avatares de perfil e foi concluída com o PR #475 mesclado.
- A Fase 342 extraiu somente `obterInicialAvatarAutorPostComunidade` e `obterInicialAvatarAutorComentarioComunidade` a partir das iniciais dos avatares dos autores de publicações e comentários e foi concluída com o PR #476 mesclado.
- A Fase 343 extraiu somente `usuarioCurtiuComentarioComunidade`, `usuarioPodeRemoverComentarioComunidade` e `usuarioPodeDenunciarComentarioComunidade` a partir dos estados de interação do usuário com comentários e foi concluída com o PR #477 mesclado.
- A Fase 344 extraiu somente `comentarioEstaSendoCurtidoComunidade`, `comentarioEstaSendoRemovidoComunidade` e `comentarioEstaSendoDenunciadoComunidade` a partir dos estados assíncronos das ações em comentários e foi concluída com o PR #478 mesclado.
- A Fase 345 extraiu somente `obterTextoBotaoRemoverComentarioComunidade` e `obterTextoBotaoDenunciarComentarioComunidade` a partir dos textos dos botões de ação dos comentários e foi concluída com o PR #479 mesclado.
- A Fase 346 extraiu somente `obterAriaLabelCurtidaComentarioComunidade` a partir do rótulo acessível da curtida de comentários e foi concluída com o PR #480 mesclado.
- A Fase 347 extraiu somente `obterAriaLabelExpansaoComentariosComunidade` a partir do rótulo acessível de expansão dos comentários e foi concluída com o PR #481 mesclado.
- A Fase 348 extraiu somente `obterTextoBotaoVerRespostasComunidade` e `obterTextoBotaoVerMaisRespostasComunidade` a partir dos textos dos controles de expansão das respostas e foi concluída com o PR #482 mesclado.
- A Fase 349 extraiu somente `obterTituloComentariosComunidade` a partir do texto do título da folha de comentários e foi concluída com o PR #483 mesclado.
- A Fase 350 extraiu somente `obterTextoCampoComentarioComunidade` e `obterTextoBotaoEnviarComentarioComunidade` a partir dos textos do formulário de envio de comentários e foi concluída com o PR #484 mesclado.
- A Fase 351 extraiu somente `obterAriaLabelReacaoRapidaComunidade` a partir do rótulo acessível das reações rápidas dos comentários e foi concluída com o PR #485 mesclado.
- A Fase 352 extraiu somente `temRespostasVisiveisComunidade`, `deveExibirBotaoVerRespostasComunidade` e `temRespostasOcultasComunidade` a partir das condições de visibilidade das respostas dos comentários e foi concluída com o PR #486 mesclado.
- A Fase 353 extraiu somente `obterTextoBotaoOcultarRespostasComunidade` a partir do texto do botão de ocultar respostas dos comentários e foi concluída com o PR #487 mesclado.
- A Fase 354 extraiu somente `obterAriaLabelOrdenacaoComentariosComunidade`, `obterTextoOrdenacaoComentariosRelevantesComunidade` e `obterTextoOrdenacaoComentariosRecentesComunidade` a partir dos textos do menu de ordenação dos comentários e foi concluída com o PR #488 mesclado.
- A Fase 355 extraiu somente `obterAriaLabelMencaoComentarioComunidade` e `obterAriaLabelEnvioComentarioComunidade` a partir dos rótulos acessíveis dos botões de menção e envio do formulário de comentários e foi concluída com o PR #489 mesclado.
- A Fase 356 extraiu somente `obterAvatarFormularioComentarioComunidade` e `obterInicialAvatarFormularioComentarioComunidade` a partir da apresentação do avatar no formulário de comentários e foi concluída com o PR #490 mesclado.
- A Fase 357 extraiu somente `temComentariosRaizComunidade` e `obterTextoEstadoVazioComentariosComunidade` a partir da decisão e do texto do estado vazio da lista de comentários e foi concluída com o PR #491 mesclado.
- A Fase 358 extraiu somente `obterQuantidadeRespostasVisiveisComunidade`, `obterRespostasVisiveisComunidade` e `obterQuantidadeRespostasOcultasComunidade` a partir dos cálculos da paginação visual das respostas e foi concluída com o PR #492 mesclado.
- A Fase 359 extraiu somente `obterQuantidadeInicialRespostasVisiveisComunidade` e `obterProximaQuantidadeRespostasVisiveisComunidade` a partir das transições de paginação visual das respostas e foi concluída com o PR #493 mesclado.
- A Fase 360 extraiu somente `respostasEstaoExpandidasComunidade` a partir da decisão de expansão das respostas e foi concluída com o PR #494 mesclado.
- A Fase 361 extraiu somente `obterRespostasComentarioComunidade` a partir da consulta das respostas associadas a cada comentário e foi concluída com o PR #495 mesclado.
- A Fase 362 extraiu somente `ordenacaoComentariosEhRelevantesComunidade` e `ordenacaoComentariosEhRecentesComunidade` a partir dos estados ativos do menu de ordenação dos comentários e foi concluída com o PR #496 mesclado.
- A Fase 363 extraiu somente `selecionarOrdenacaoComentariosRelevantesComunidade` e `selecionarOrdenacaoComentariosRecentesComunidade` a partir dos handlers do menu de ordenação dos comentários e foi concluída com o PR #497 mesclado.
- A Fase 364 extraiu somente `alternarMenuOrdenacaoComentariosComunidade` a partir do handler do gatilho do menu de ordenação dos comentários e foi concluída com o PR #498 mesclado.
- A Fase 365 extraiu somente `obterTextoBotaoResponderComentarioComunidade` a partir do texto do botão de resposta dos comentários e foi concluída com o PR #499 mesclado.
- A Fase 366 extraiu somente `obterReacoesRapidasComentarioComunidade` a partir da lista de reações rápidas dos comentários e foi concluída com o PR #500 mesclado.
- A Fase 367 extraiu somente `deveDesabilitarInteracaoComentarioComunidade` e `envioComentarioEstaAtivoComunidade` a partir dos estados de interação do formulário de comentários e foi concluída com o PR #501 mesclado.
- A Fase 368 extraiu somente `deveDesabilitarCurtidaComentarioComunidade` a partir da condição de desabilitação da curtida de comentários e foi concluída com o PR #502 mesclado.
- A Fase 369 extraiu somente `deveDesabilitarAcaoComentarioComunidade` a partir da condição compartilhada de desabilitação das ações de resposta, reação rápida e menção e foi concluída com o PR #503 mesclado.
- A Fase 370 extraiu somente `deveExibirInicialAvatarFormularioComentarioComunidade` a partir da condição de exibição da inicial do avatar no formulário de comentários e foi concluída com o PR #504 mesclado.
- A Fase 371 extraiu somente `deveAlternarExpansaoComentariosPorTeclaComunidade` a partir da condição de teclado do controle de expansão dos comentários e foi concluída com o PR #505 mesclado.
- A Fase 372 extraiu somente `deveExpandirComentariosPorArrasteComunidade`, `deveRecolherComentariosPorArrasteComunidade` e `deveFecharComentariosPorArrasteComunidade` a partir das decisões finais do gesto de arraste dos comentários e foi concluída com o PR #506 mesclado.
- A Fase 373 extraiu somente `obterLimiteSuperiorArrasteComentariosComunidade` e `obterLimiteInferiorArrasteComentariosComunidade` a partir dos limites do gesto de arraste dos comentários e foi concluída com o PR #507 mesclado.
- A Fase 374 extraiu somente `obterPosicaoAtualArrasteComentariosComunidade`, `calcularDeslocamentoArrasteComentariosComunidade` e `deveIgnorarCliqueAposArrasteComunidade` a partir dos cálculos do movimento do gesto de arraste dos comentários e foi concluída com o PR #508 mesclado.
- A Fase 375 extraiu somente `mostrarRespostasIniciaisComunidade`, `mostrarMaisRespostasComunidade` e `ocultarRespostasComunidade` a partir das ações de paginação visual das respostas dos comentários e foi concluída com o PR #509 mesclado.
- A Fase 376 extraiu somente `usuarioPodeRemoverPostComunidade`, `usuarioPodeDenunciarPostComunidade` e `usuarioPodeAlterarVisibilidadePostComunidade` a partir das permissões das ações de publicação e foi concluída com o PR #510 mesclado.
- A Fase 377 extraiu somente `usuarioCurtiuPostComunidade`, `postEstaSalvoComunidade` e `spoilerPostEstaReveladoComunidade` a partir dos estados de interação com as publicações e foi concluída com o PR #511 mesclado.
- A Fase 378 extraiu somente `postEstaSendoCurtido`, `postEstaSendoSalvo` e `postEstaSendoCompartilhado` a partir dos estados assíncronos das ações de publicação e foi concluída com o PR #512 mesclado.
- A Fase 379 extraiu somente `postEstaSendoRemovido`, `postEstaSendoFixado` e `postEstaAtualizandoVisibilidade` a partir dos estados assíncronos das ações administrativas de publicação e foi concluída com o PR #513 mesclado.
- A Fase 380 extraiu somente `postEstaSendoDenunciadoComunidade`, `menuOpcoesPostEstaAbertoComunidade` e `deveOcultarTextoSpoilerComunidade` a partir dos estados visuais de cada publicação e foi concluída com o PR #514 mesclado.
- A Fase 381 extraiu somente `obterTextoBotaoSalvarPostComunidade`, `obterTextoBotaoCompartilharPostComunidade` e `obterTextoBotaoFixarPostComunidade` a partir dos textos das ações de salvar, compartilhar e fixar publicação e foi concluída com o PR #515 mesclado.
- A Fase 382 extraiu somente `obterTextoBotaoRemoverPostComunidade`, `obterTextoBotaoDenunciarPostComunidade` e `obterTextoBotaoSpoilerPostComunidade` a partir dos textos das ações de remover, denunciar e revelar ou ocultar spoiler e foi concluída com o PR #516 mesclado.
- A Fase 383 extraiu somente `obterAriaLabelCurtidaPostComunidade` e `obterAriaLabelComentariosPostComunidade` a partir dos rótulos acessíveis das ações de curtida e comentários da publicação e foi concluída com o PR #517 mesclado.
- A Fase 384 extraiu somente `obterLarguraResultadoOpcaoEnqueteComunidade`, `obterTextoStatusOpcaoEnqueteComunidade` e `deveDesabilitarOpcaoEnqueteComunidade` a partir do estado visual de cada opção de enquete e foi concluída com o PR #518 mesclado.
- A Fase 385 extraiu somente `temPostsVisiveisComunidade`, `deveExibirCarregamentoAdicionalComunidade` e `obterTextoEstadoVazioFeedComunidade` a partir das decisões de apresentação do feed e foi concluída com o PR #519 mesclado.
- A Fase 386 extraiu somente `ordenacaoRecentesEstaAtivaComunidade`, `ordenacaoEmAltaEstaAtivaComunidade` e `ordenacaoMaisComentadasEstaAtivaComunidade` a partir dos estados ativos dos controles de ordenação do feed e foi concluída com o PR #520 mesclado.
- A Fase 387 extraiu somente `selecionarOrdenacaoRecentesComunidade`, `selecionarOrdenacaoEmAltaComunidade` e `selecionarOrdenacaoMaisComentadasComunidade` a partir dos seletores dos controles de ordenação do feed e foi concluída com o PR #521 mesclado.
- A Fase 388 extraiu somente `obterParametroBuscaComunidade`, `obterParametroObraComunidade` e `obterParametroPostComunidade` a partir das leituras dos parâmetros `busca`, `obra` e `post` da URL e foi concluída com o PR #522 mesclado.
- A Fase 389 extraiu somente `obterPostsVisiveisComunidade` a partir do pipeline completo de filtragem e ordenação de `postsVisiveis` e foi concluída com o PR #523 mesclado.
- A Fase 390 extraiu somente `CommunityCommentItem` a partir de `renderizarComentario` e foi concluída com o PR #524 mesclado.
- A Fase 391 extraiu somente `CommunityCommentThread` a partir do corpo do `.map()` de comentários raiz e foi concluída com o PR #525 mesclado.
- A Fase 392 extraiu somente `CommunityCommentsComposer` a partir do bloco de reações rápidas e formulário de comentários e foi concluída com o PR #526 mesclado.
- A Fase 393 extraiu somente `CommunityUserSearchResult` a partir do conteúdo de cada resultado individual da busca de usuários e foi concluída com o PR #527 mesclado.
- A Fase 394 extraiu somente `CommunityPostPoll` a partir do bloco visual da enquete e foi concluída com o PR #528 mesclado.
- A Fase 395 extraiu somente `CommunityPostActionBar` a partir da barra de ações da publicação e foi concluída com o PR #529 mesclado.
- A Fase 396 extraiu somente `CommunityPostOptionsMenu` a partir do menu de opções da publicação e foi concluída com o PR #530 mesclado.
- A Fase 397 extraiu somente `CommunityPostContent` a partir dos badges e do conteúdo visual da publicação e foi concluída com o PR #531 mesclado.
- A Fase 398 extraiu somente `CommunityPostHeaderMetadata` a partir dos metadados visuais do cabeçalho da publicação e foi concluída com o PR #532 mesclado.
- A Fase 399 extraiu somente `obterEstadoApresentacaoPostComunidade` a partir dos estados derivados de cada publicação e foi concluída com o PR #533 mesclado.
- A Fase 400 extraiu somente `criarAcoesPostComunidade` e o contrato `AcoesPostComunidade` a partir dos callbacks de cada publicação e foi concluída com o PR #534 mesclado.
- A Fase 401 extraiu somente `CommunityPostItem` a partir da composição visual de cada publicação e foi concluída com o PR #535 mesclado.
- A Fase 402 extraiu somente `CommunityFeedActionsSheet` a partir do painel de filtros, ordenação e ações da comunidade e foi concluída com o PR #536 mesclado.
- A Fase 403 extraiu somente `CommunityFeedControls` a partir dos controles de filtros avançados, busca e abas do feed e foi concluída com o PR #537 mesclado.
- A Fase 404 extraiu somente `CommunityPostComposerRelatedFields` a partir dos campos de obra e capítulo relacionados do composer e foi concluída com o PR #538 mesclado.
- A Fase 405 extraiu somente `CommunityPostComposerPublicationField` a partir do campo principal, modelo de enquete, sugestões e textarea do composer e foi concluída com o PR #539 mesclado.
- A Fase 406 extraiu somente `CommunityPostComposerClassificationFields` a partir dos campos de categoria, tipo e visibilidade do composer e foi concluída com o PR #540 mesclado.
- A Fase 407 extraiu somente `CommunityPostComposerActions` a partir dos controles de spoiler e publicação do composer e foi concluída com o PR #541 mesclado.
- A Fase 408 extraiu somente `CommunityPostComposer` a partir da composição visual completa do composer e foi concluída com o PR #542 mesclado.
- A Fase 409 extraiu somente `CommunityUserSearchResults` a partir da composição visual completa dos resultados da busca de usuários e foi concluída com o PR #543 mesclado.
- A Fase 410 extraiu somente `CommunityFeedPostsSection` a partir da lista, estado vazio e carregamento adicional do feed e foi concluída com o PR #544 mesclado.
- A Fase 411 extraiu somente `atualizarCurtidaPostComunidade` e `atualizarCurtidaComentarioComunidade` a partir das transformações puras do estado local de curtidas e foi concluída com o PR #545 mesclado.
- A Fase 412 extraiu somente `adicionarComentarioPostComunidade`, `removerComentarioPostComunidade` e `removerComentariosPostComunidade` a partir das transformações puras do estado local de comentários e foi concluída com o PR #546 mesclado.
- A Fase 413 extraiu somente `removerPostDoEstadoComunidade` e `removerPostSalvoDoEstadoComunidade` a partir das transformações puras do estado local de remoção de publicações e foi concluída com o PR #547 mesclado.
- A Fase 414 extraiu somente `atualizarVisibilidadePostNoEstadoComunidade` e `atualizarFixacaoPostNoEstadoComunidade` a partir das transformações puras dos metadados locais das publicações e foi concluída com o PR #548 mesclado.
- A Fase 415 extraiu somente `validarConteudoPublicacaoComunidade` a partir da validação pura do conteúdo da publicação e foi concluída com o PR #549 mesclado.
- A Fase 416 extraiu somente `prepararDadosInsercaoPostComunidade` a partir da preparação pura dos dados enviados ao insert de `comunidade_posts` e foi concluída com o PR #550 mesclado.
- A Fase 417 extraiu somente `mapearPostCriadoComunidade` a partir do mapeamento puro da linha recém-inserida para `PostComunidade` e foi concluída com o PR #551 mesclado.
- A Fase 418 extraiu somente `obterPrimeiraSugestaoObraSupabaseComunidade` a partir da transformação pura dos resultados de busca remota de obras e foi concluída com o PR #552 mesclado.
- A Fase 419 extraiu somente `mapearComentarioCriadoComunidade` a partir do mapeamento puro da linha recém-inserida para `ComentarioComunidade` e foi concluída com o PR #553 mesclado.
- A Fase 420 extraiu somente `prepararInsercaoComentarioComunidade` a partir da preparação pura da inserção de comentário e foi concluída com o PR #554 mesclado.
- A Fase 421 extraiu somente `prepararRemocaoComentarioComunidade` a partir da preparação pura da remoção de comentário e foi concluída com o PR #555 mesclado.
- A Fase 422 extraiu somente `consultarComentarioParaRemocaoComunidade` a partir da consulta remota usada para conferir o comentário antes da remoção e foi concluída com o PR #556 mesclado.
- A Fase 423 extraiu somente `removerComentarioSupabaseComunidade` a partir do delete remoto de comentário e foi concluída com o PR #557 mesclado.
- A Fase 424 extraiu somente `inserirComentarioSupabaseComunidade` a partir da operação Supabase de inserção do comentário e foi concluída com o PR #558 mesclado.
- A Fase 425 extraiu somente `inserirPostSupabaseComunidade` a partir do insert remoto de `comunidade_posts` e foi concluída com o PR #559 mesclado.
- A Fase 426 extraiu somente `consultarPostCriadoComunidade` a partir da consulta posterior usada para localizar o post recém-criado e foi concluída com o PR #560 mesclado.
- A Fase 427 extraiu somente `atualizarVisibilidadePostSupabaseComunidade` a partir da operação Supabase de atualização da visibilidade da publicação e foi concluída com o PR #561 mesclado.
- A Fase 428 extraiu somente `atualizarFixacaoPostSupabaseComunidade` a partir da operação Supabase de atualização da fixação da publicação e foi concluída com o PR #562 mesclado.
- A Fase 429 extraiu somente `consultarPostParaRemocaoComunidade` a partir da consulta remota usada para conferir a publicação antes da remoção e foi concluída com o PR #563 mesclado.
- A Fase 430 extraiu somente `consultarUsuarioEhAdminComunidade` a partir da RPC administrativa usada em `removerPost` e foi concluída com o PR #564 mesclado.
- A Fase 431 extraiu somente `removerPostSupabaseComunidade` a partir do delete condicional remoto de publicação e foi concluída com o PR #565 mesclado.
- A Fase 432 extraiu somente `sincronizarCurtidaPostSupabaseComunidade` a partir da sincronização remota da curtida de publicação e foi concluída com o PR #566 mesclado.
- A Fase 433 extraiu somente `sincronizarCurtidaComentarioSupabaseComunidade` a partir da sincronização remota da curtida de comentário e foi concluída com o PR #567 mesclado.
- A Fase 434 extraiu somente `consultarObrasPorTituloComunidade` a partir da consulta Supabase de obras publicadas por título e foi concluída com o PR #568 mesclado.
- A Fase 435 extraiu somente `consultarObrasPublicadasComunidade` a partir da consulta inicial das obras publicadas e foi concluída com o PR #569 mesclado.
- A Fase 436 extraiu somente `prepararSugestoesObrasRelacionadasComunidade` a partir da preparação assíncrona das sugestões de obras relacionadas e foi concluída com o PR #570 mesclado.
- A Fase 437 extraiu somente `prepararPerfilEStatusAdminComunidade` a partir da preparação sequencial do perfil e do status administrativo do usuário autenticado e foi concluída com o PR #571 mesclado.
- A Fase 438 extraiu somente `prepararResultadosBuscaUsuariosComunidade` a partir do pipeline puro de preparação dos resultados finais da busca de usuários e foi concluída com o PR #572 mesclado.
- A Fase 439 extraiu somente `carregarPostsSalvosLocaisComunidade` a partir do carregamento e da validação local dos IDs de posts salvos e foi concluída com o PR #573 mesclado.
- A Fase 440 corrigiu exclusivamente a hierarquia visual entre o comments sheet e o modal de denúncia de comentário, preservando o contexto aberto e os fluxos atuais, e foi concluída com o PR #574 mesclado.
- A correção final da refatoração estrutural da Comunidade moveu a marcação das Reviews pendentes para o processamento sequencial de cada item, preservando o retry após cancelamento parcial, e foi concluída com o PR #575 mesclado.
- Não mesclar nenhum PR sem autorização explícita.

## Encerramento

A auditoria final foi concluída. A hierarquia entre o modal de denúncia e o comments sheet foi corrigida no PR #574, e o retry das Reviews pendentes após cancelamento parcial foi corrigido no PR #575. Com essas correções, a refatoração estrutural da Comunidade está encerrada.

## Refatoração estrutural da página da obra

- Fase 441: extrair somente os utilitários de foco dos dialogs de `ObraDinamicaClient.tsx` para `app/obra/[slug]/lib/obra-dialog-focus.ts`, preservando foco inicial, ciclo de Tab/Shift+Tab, Escape e restauração de foco sem alterar comportamento visual ou de dados.
- Fase 442: extrair somente `criarStorageKeyUsuarioObraPublica`, `lerStorageUsuarioObraPublica` e `salvarStorageUsuarioObraPublica` para `app/obra/[slug]/lib/obra-user-storage.ts`, preservando exatamente chaves, serialização JSON, leitura, escrita e fallbacks de `localStorage`.
- Fase 443: extrair somente `formatarMediaAvaliacao`, `formatarTotalAvaliacoes`, `obterProximaNotaAvaliacao` e `obterPreenchimentoEstrela` para `app/obra/[slug]/lib/obra-rating-utils.ts`, preservando textos, arredondamento, limites e preenchimento visual das estrelas.
- Fase 444: extrair somente `obterNumeroMetrica` para `app/obra/[slug]/lib/obra-metric-utils.ts`, preservando normalização decimal, multiplicador `k`, arredondamento e fallback para zero.
- Fase 445: extrair somente `normalizarContadorObraPublica` para `app/obra/[slug]/lib/obra-metric-utils.ts`, preservando parsing de números e strings, normalização decimal, arredondamento, limite mínimo zero e fallback para zero.
- Fase 446: extrair somente `formatarGeneroObraPublica` para `app/obra/[slug]/lib/obra-text-utils.ts`, preservando normalização textual e os fallbacks de gênero exibidos.
- Fase 447: extrair somente `criarLoginHrefObraPublica` para `app/obra/[slug]/lib/obra-navigation-utils.ts`, preservando o redirect atual, validação de destino seguro e serialização de `redirectTo`.
- Fase 448: extrair somente `criarLinkComunidadeObra` para `app/obra/[slug]/lib/obra-navigation-utils.ts`, preservando os parâmetros `obra`, `grupo` e `tipo` e seus filtros atuais.
- Fase 449: extrair somente `obterTextoPerfilObra` para `app/obra/[slug]/lib/obra-text-utils.ts`, preservando leitura de strings, trim e fallback vazio.
- Fase 450: extrair somente `obterNomePerfilObra` para `app/obra/[slug]/lib/obra-text-utils.ts`, preservando a ordem dos campos de nome, trim e fallback `Autor não informado`.
- Fase 451: extrair somente `obterAvatarPerfilObra` para `app/obra/[slug]/lib/obra-text-utils.ts`, preservando a ordem dos campos de avatar e fallback vazio.
- Fase 452: extrair somente `obterBioPerfilObra` para `app/obra/[slug]/lib/obra-text-utils.ts`, preservando a ordem dos campos de bio e fallback vazio.
- Fase 453: extrair somente `criarLinkPerfilAutor` para `app/obra/[slug]/lib/obra-navigation-utils.ts`, preservando os parâmetros `autor`, `autorId` e `userId`, trim e fallback `Autor não informado`.
- Fase 454: extrair somente `capaObraPodeSerOtimizada` para `app/obra/[slug]/lib/obra-cover-utils.ts`, preservando validação do host/protocolo Supabase, caminho público do bucket de capas e fallback `false`.
- Fase 455: extrair somente `calcularProgressoLeitura` para `app/obra/[slug]/lib/obra-reading-utils.ts`, preservando contagem de capítulos lidos, arredondamento percentual e fallback zero quando não há capítulos.
- Fase 456: extrair somente `encontrarCapituloParaContinuarObraPublica` para `app/obra/[slug]/lib/obra-reading-utils.ts`, preservando filtro de capítulos disponíveis, prioridade após o último lido, fallback para o primeiro não lido e último capítulo disponível.
- Fase 457: extrair somente `normalizarPerfilPublicoObra` para `app/obra/[slug]/lib/obra-text-utils.ts`, preservando resolução de `userId`, fallbacks de nome/avatar/bio e limites de 80/160 caracteres.
- Fase 458: extrair somente `obterChaveAvaliacaoObra` para `app/obra/[slug]/lib/obra-rating-utils.ts`, preservando prioridade de `id`, depois `slug` e fallback pelo título normalizado.
- Fase 459: extrair somente `carregarListaLocalObraPublica` para `app/obra/[slug]/lib/obra-user-storage.ts`, preservando escopo por usuário, parse do JSON, filtro de strings válidas e fallback para lista vazia.
- Fase 460: extrair somente `obterChavesInteracaoObraPublica` para `app/obra/[slug]/lib/obra-interaction-utils.ts`, preservando `id`, `slug`, `link`, slug derivado do título, título normalizado, trim, remoção de vazios e deduplicação.
- Fase 461: extrair somente `obraEstaEmListaLocalObraPublica` para `app/obra/[slug]/lib/obra-interaction-utils.ts`, preservando o conjunto de chaves da obra, leitura da lista local por usuário, trim dos itens e verificação por correspondência.
- Fase 462: extrair somente `salvarListaLocalObraPublica` para `app/obra/[slug]/lib/obra-interaction-utils.ts`, preservando escopo por usuário, remoção das chaves atuais, deduplicação ao ativar, persistência no storage e retorno da lista resultante.
- Fase 463: extrair somente `calcularProximaAvaliacao` para `app/obra/[slug]/lib/obra-rating-utils.ts`, preservando remoção de nota, atualização de média/total, substituição de nota existente e flags `carregado`/`salvando`.
- Fase 464: extrair somente `criarComentarioObraId` para `app/obra/[slug]/lib/obra-comment-utils.ts`, preservando prioridade por `crypto.randomUUID()` e fallback com `Date.now()` + `Math.random()`.
- Fase 465: extrair somente `dataComentarioObra` para `app/obra/[slug]/lib/obra-comment-utils.ts`, preservando conversão de `criadoEm` para timestamp e fallback zero para datas inválidas.
- Fase 466: extrair somente `obterIdsComentarioComRespostas` para `app/obra/[slug]/lib/obra-comment-utils.ts`, preservando inclusão do comentário alvo e descoberta iterativa de todos os descendentes sem duplicação.
- Fase 467: extrair somente `copiarTextoComFallback` para `app/obra/[slug]/lib/obra-share-utils.ts`, preservando criação do textarea temporário, seleção, `document.execCommand("copy")`, tratamento de falha e remoção do elemento.
- Fase 468: extrair somente `decodificarCaminhoArquivoObra` para `app/obra/[slug]/lib/obra-file-utils.ts`, preservando `decodeURIComponent` e fallback para o caminho original em caso de erro.
- Fase 469: extrair somente `normalizarCategoriaArquivoSupabase` para `app/obra/[slug]/lib/obra-file-utils.ts`, preservando as categorias válidas `texto`, `documento`, `imagem`, `outro` e fallback para `outro`.
- Fase 470: extrair somente `totalComentariosObraPublica` para `app/obra/[slug]/lib/obra-metric-utils.ts`, preservando a normalização de `totalComentarios` pelo helper `normalizarContadorObraPublica`.
- Fase 471: extrair somente `totalVisualizacoesObraPublica` para `app/obra/[slug]/lib/obra-metric-utils.ts`, preservando a normalização de `visualizacoes` pelo helper `normalizarContadorObraPublica`.
- Fase 472: extrair somente `obterChavesBackupObra` para `app/obra/[slug]/lib/obra-file-utils.ts`, preservando as chaves `id`, `slug`, slug do título, filtragem de valores vazios e deduplicação.
- Fase 473: extrair somente `totalCurtidasObraPublica` para `app/obra/[slug]/lib/obra-metric-utils.ts`, preservando a normalização de `totalCurtidas` pelo helper `normalizarContadorObraPublica` e atualizando apenas marcadores estruturais dos testes afetados.
- Fase 474: extrair somente `obraLocalEstaDisponivelParaLeitura` para `app/obra/[slug]/lib/obra-reading-utils.ts`, preservando a exigência de obra publicada e a disponibilidade por capítulos ou arquivo da obra.
- Fase 475: extrair somente `formatarTempoRelativoComentarioObra` para `app/obra/[slug]/lib/obra-comment-utils.ts`, preservando parsing da data, limiares de segundos/minutos/horas/dias, singular/plural e fallback `agora`, atualizando apenas o marcador estrutural do teste afetado.
- Fase 476: extrair somente `obterSinopseObraExibida` para `app/obra/[slug]/lib/obra-text-utils.ts`, preservando `trim()` da sinopse e o fallback literal `Nenhuma sinopse informada.`.
- Fase 477: extrair somente `obterIndicadorConteudoObraPublica` para `app/obra/[slug]/lib/obra-reading-utils.ts`, preservando o ícone e a quantidade exibidos para capítulos, arquivo da obra e ausência de conteúdo.
- Fase 478: extrair somente `obterCapitulosObraPublica` para `app/obra/[slug]/lib/obra-reading-utils.ts`, preservando o retorno da lista de capítulos quando a obra existe e o fallback para lista vazia quando não existe ou não possui capítulos.
- Fase 479: extrair somente `obterObraIdComentarios` para `app/obra/[slug]/lib/obra-comment-utils.ts`, preservando o `trim()` do identificador da obra e o fallback para string vazia quando não houver ID.
- Fase 480: extrair somente `obterNomeAutorObraExibido` para `app/obra/[slug]/lib/obra-text-utils.ts`, preservando a prioridade do nome do perfil público, o fallback para o autor da obra e o literal `Autor não informado`.
- Fase 481: extrair somente `obterGeneroObraExibido` para `app/obra/[slug]/lib/obra-text-utils.ts`, preservando a formatação atual do gênero e o fallback literal `Não informado` quando não houver obra.
- Fase 482: extrair somente `obterObraDisponivelExibida` para `app/obra/[slug]/lib/obra-reading-utils.ts`, preservando exatamente `Boolean(obra?.disponivel)` usado na apresentação da disponibilidade dos capítulos.
- Fase 483: extrair somente `obterTextoDisponibilidadeCapitulosObra` para `app/obra/[slug]/lib/obra-reading-utils.ts`, preservando a contagem de capítulos e os literais `disponíveis`/`em breve` usados na apresentação e no i18n existente.
- Fase 484: extrair somente `obterTextosPainelClassificacaoObra` para `app/obra/[slug]/lib/obra-text-utils.ts`, preservando integralmente os textos e fallbacks do painel de classificação em português, inglês e espanhol.
- Fase 485: extrair somente `obterClassificacaoIndicativaCompactaObra` para `app/obra/[slug]/lib/obra-text-utils.ts`, preservando a detecção normalizada de `Livre`, o texto compacto `L` e o valor original para todas as demais classificações.
- Fase 486: extrair somente `obterIniciaisCapaObra` para `app/obra/[slug]/lib/obra-cover-utils.ts`, preservando exatamente a geração atual de até duas iniciais maiúsculas do título quando a obra não possui capa.
- Fase 487: extrair somente `normalizarCaminhoStorageArquivoObra` para `app/obra/[slug]/lib/obra-file-utils.ts`, preservando remoção de query/hash, decodificação tolerante, prefixos aceitos de `arquivos-obras`, limpeza de barras e validação da pasta proprietária por UUID.
- Fase 488: extrair somente `obterCaminhoStorageArquivoObra` para `app/obra/[slug]/lib/obra-file-utils.ts`, preservando `trim()`, rejeição de `data:`/`blob:`, aceitação exclusiva de URLs HTTP/HTTPS e fallback para normalização de caminho bruto.
- Fase 489: extrair somente `normalizarArquivoObra` para `app/obra/[slug]/lib/obra-file-utils.ts`, preservando validação de objeto, exigência de nome/conteúdo, categorias aceitas, defaults de tipo/tamanho/data e fallback de categoria `outro`.
- Fase 490: extrair `MetricasObraPublica`, `metricasObraVazias` e `criarMetricasBaseObra` para `app/obra/[slug]/lib/obra-metric-utils.ts`, preservando o mesmo objeto-base vazio e a conversão atual de views, curtidas e comentários.
- Fase 491: extrair `MetricasComunidadeObra` e `metricasComunidadeObraVazias` para `app/obra/[slug]/lib/obra-metric-utils.ts`, preservando o mesmo objeto-base com teorias, reviews, posts zerados e `carregado: false`.
- Fase 492: extrair `AvaliacaoObraPublica` e `avaliacaoObraVazia` para `app/obra/[slug]/lib/obra-rating-utils.ts`, preservando o mesmo objeto-base com média, total e nota zerados e `carregado`/`salvando` falsos.
- Fase 493: extrair somente `NOTAS_AVALIACAO_OBRA` para `app/obra/[slug]/lib/obra-rating-utils.ts`, preservando exatamente a tupla fixa `[1, 2, 3, 4, 5]` usada na exibição e interação de avaliação.
- Fase 494: extrair somente o tipo `OrdenacaoComentariosObra` para `app/obra/[slug]/lib/obra-comment-utils.ts`, preservando exatamente as opções `"relevantes" | "recentes"` usadas no estado e na organização dos comentários.
- Fase 495: extrair somente o tipo `RespostaComentarioObra` para `app/obra/[slug]/lib/obra-comment-utils.ts`, preservando os campos `comentarioPaiId`, `autorId` e `autorNome` usados no estado de resposta dos comentários.
- Fase 496: extrair somente o tipo `SupabaseComentarioObraRow` para `app/obra/[slug]/lib/obra-comment-utils.ts`, preservando os campos `id`, `obra_id`, `user_id`, `comentario`, `comentario_pai_id` e `criado_em` usados na leitura e paginação dos comentários remotos.
- Fase 497: extrair somente o tipo `ComentarioObraPublico` para `app/obra/[slug]/lib/obra-comment-utils.ts`, preservando os mesmos campos de identidade, autoria, conteúdo, hierarquia, origem local e curtidas usados em toda a camada de comentários.
- Fase 498: extrair somente o tipo `PaginaComentariosObra` para `app/obra/[slug]/lib/obra-comment-utils.ts`, preservando os campos `comentarios`, `temMais` e `proximoOffset` usados no retorno da paginação de comentários.
- Fase 499: extrair somente o tipo `PerfilPublicoObra` para `app/obra/[slug]/lib/obra-text-utils.ts`, preservando os campos `userId`, `nome`, `avatar` e `bio` produzidos pela normalização e usados nos perfis público, do autor e do usuário logado.
- Fase 500: extrair somente o tipo `TraducaoObraDinamica` para `app/obra/[slug]/lib/obra-text-utils.ts`, preservando exatamente os campos `en` e `es` usados no mapa de traduções da interface da obra.
- Fase 501: extrair somente o tipo `CapituloDinamico` para `app/obra/[slug]/lib/obra-reading-utils.ts`, preservando exatamente os campos de identificação, exibição, navegação, disponibilidade e estado de leitura usados na página da obra.
- Fase 502: extrair somente o tipo `SupabaseCapituloRow` para `app/obra/[slug]/lib/obra-reading-utils.ts`, preservando exatamente os campos usados na leitura, paginação e normalização dos capítulos publicados.
- Fase 503: extrair somente o tipo `ArquivoObraLocal` para `app/obra/[slug]/lib/obra-file-utils.ts`, preservando exatamente os campos e categorias usados no backup, restauração e exibição do arquivo da obra.
- Fase 504: extrair somente o tipo `ArquivosObrasBackup` para `app/obra/[slug]/lib/obra-file-utils.ts`, preservando o mesmo mapa `Record<string, ArquivoObraLocal>` usado no backup e restauração dos arquivos.
- Fase 505: extrair somente o tipo `CapituloLocal` para `app/obra/[slug]/lib/obra-reading-utils.ts`, preservando exatamente os campos e métricas locais usados na leitura, persistência e normalização dos capítulos.
- Fase 506: extrair somente o tipo `AlvoDenunciaObraDinamica` para `app/obra/[slug]/lib/obra-report-utils.ts`, preservando os mesmos tipos de alvo, identificador e título usados no modal de denúncia.
- Fase 507: extrair somente o tipo `SupabaseObraRow` para `app/obra/[slug]/lib/obra-data-utils.ts`, preservando exatamente os campos remotos usados no carregamento e normalização da obra pública.
- Fase 508: extrair somente o tipo `ObraLocal` para `app/obra/[slug]/lib/obra-data-utils.ts`, preservando exatamente os campos locais, métricas, arquivo e capítulos usados na normalização e persistência da obra.
- Fase 509: extrair somente o tipo `ObraDinamica` para `app/obra/[slug]/lib/obra-data-utils.ts`, preservando exatamente os campos exibidos, métricas formatadas, arquivo e capítulos usados na página pública.
- Fase 510: extrair somente o tipo `AvaliacaoLocalObra` para `app/obra/[slug]/lib/obra-rating-utils.ts`, preservando os campos `encontrada` e `nota` usados na leitura detalhada da avaliação local.
- Fase 511: extrair somente o tipo `DiarioAtividadeObraVisibilidade` para `app/obra/[slug]/lib/obra-activity-utils.ts`, preservando exatamente as opções `"publico" | "parcial" | "privado"` usadas no registro do Diário.
- Fase 512: extrair somente o tipo `DiarioAtividadeObraTipo` para `app/obra/[slug]/lib/obra-activity-utils.ts`, preservando exatamente os tipos `"salvou_obra" | "favoritou_obra" | "concluiu_obra" | "avaliou_obra"` usados no Diário.
- Fase 513: extrair somente o tipo `ResultadoCarregamentoObraPublica` para `app/obra/[slug]/lib/obra-data-utils.ts`, preservando exatamente `obras: ObraLocal[]` e os status `"carregada" | "nao_encontrada" | "erro" | "cancelada"` usados no carregamento da obra pública.
- Fase 514: extrair somente o tipo `EstadoTraducaoObraDinamica` para `app/obra/[slug]/lib/obra-text-utils.ts`, preservando exatamente os campos `original` e `traduzido` usados pelo bridge de idioma da página da obra.
- Fase 515: extrair somente `converterObraLocalParaDinamica` para `app/obra/[slug]/lib/obra-data-utils.ts`, preservando exatamente a conversão de status, métricas, disponibilidade, links de capítulos e progresso de leitura.
- Fase 516: extrair somente `normalizarCapituloLocal` para `app/obra/[slug]/lib/obra-reading-utils.ts`, preservando exatamente os fallbacks de identificação, título, texto, flags e normalização das métricas locais do capítulo.
- Fase 517: extrair somente `normalizarObraLocal` para `app/obra/[slug]/lib/obra-data-utils.ts`, preservando exatamente os fallbacks de identidade, metadados, classificação, tags, arquivo, capítulos, progresso, métricas, slug e link da obra local.
- Fase 518: extrair somente `restaurarArquivoObraComBackup` para `app/obra/[slug]/lib/obra-data-utils.ts`, preservando exatamente a prioridade do arquivo já presente, a busca pelas chaves de backup e o fallback para a obra original.
- Fase 519: extrair somente `criarEstruturaComentariosObra` para `app/obra/[slug]/lib/obra-comment-utils.ts`, preservando exatamente a resolução da raiz, ordenação cronológica das respostas e ordenação relevante/recente dos comentários raiz.
- Fase 520: extrair somente `normalizarObraSupabase` para `app/obra/[slug]/lib/obra-data-utils.ts`, preservando exatamente a mesclagem de dados remotos/locais, capítulos, arquivo, classificação, métricas, progresso, slug e link da obra pública.
- Fase 521: extrair somente `incrementarVisualizacaoObraPublicaSupabase` para `app/obra/[slug]/lib/obra-metric-utils.ts`, preservando exatamente a validação do ID, chamada ao endpoint de visualizações, normalização do total e fallback silencioso em caso de falha.
- Fase 522: extrair `LoadingSpinner` e seus estilos exclusivos para `app/obra/[slug]/ObraLoadingSpinner.tsx`, preservando exatamente os estados compacto/página, acessibilidade e animação visual.
- Fase 523: extrair somente `safeTextStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente `overflowWrap: "anywhere"` e `wordBreak: "break-word"` usados pelos estilos da página da obra.
- Fase 524: extrair `CommunityItem` e seus estilos exclusivos para `app/obra/[slug]/ObraCommunityItem.tsx`, preservando exatamente o link, rótulo acessível, número, texto e visual dos atalhos da Comunidade.
- Fase 525: extrair `MetricCard` e seus estilos exclusivos para `app/obra/[slug]/ObraMetricCard.tsx`, preservando exatamente estados ativo/inativo, coração, ARIA, rótulo, número e visual das métricas da obra.
- Fase 526: extrair somente `heroTitleOutlineStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente o `textShadow` usado no título principal da obra.
- Fase 527: extrair `mobileTopWaterFadeStyle` e `desktopTopWaterFadeStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente posição, altura, transparência e comportamento decorativo dos fades superiores.
- Fase 528: extrair `homeMainTitleTypographyStyle`, `homeMainMetaTypographyStyle` e `homeMainStatsTypographyStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente família tipográfica, pesos, espaçamento e altura de linha usados no card principal.
- Fase 529: extrair somente `communityGridStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente as três colunas responsivas, espaçamento e largura mínima do grid da Comunidade.
- Fase 530: extrair somente `ratingSummaryStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente dimensões, alinhamento, transparência e comportamento visual do resumo de avaliação.
- Fase 531: extrair somente `ratingNumberStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente cor, tamanho, peso, sombra e quebra segura do número principal da avaliação.
- Fase 532: extrair somente `ratingStarsStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente alinhamento, cor, tamanho, espaçamento, sombra e quebra segura da linha de estrelas da avaliação.
- Fase 533: extrair `ratingTopStarVisualStyle`, `ratingTopStarBaseStyle` e `ratingTopStarFillStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente posição, cores, preenchimento parcial e comportamento visual da estrela superior de avaliação.
- Fase 534: extrair somente `ratingTotalStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente cor, tipografia, alinhamento, sombra e quebra segura do total de avaliações.
- Fase 535: extrair somente `synopsisCardStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente transparência, ausência de borda, largura mínima e box-sizing do contêiner da sinopse.
- Fase 536: extrair somente `synopsisTextStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente cor, tipografia, espaçamento, alinhamento e quebra segura do texto da sinopse.
- Fase 537: extrair somente `chaptersListStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente grid, espaçamento e largura mínima da lista de capítulos.
- Fase 538: extrair somente `chapterCountBadgeStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente dimensões, transparência, tipografia, alinhamento e quebra segura do contador de capítulos.
- Fase 539: extrair somente `chapterContentStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente grid, espaçamento e largura mínima do conteúdo interno de cada capítulo.
- Fase 540: extrair somente `chaptersSectionStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente margem superior e largura mínima compartilhadas pela seção de capítulos e pela base da sinopse.
- Fase 541: extrair somente `synopsisSectionStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente a base visual compartilhada com capítulos e a animação de revelação da sinopse.
- Fase 542: extrair somente `sectionHeaderStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente grid, alinhamento, espaçamento, largura mínima e margem inferior dos cabeçalhos de seção.
- Fase 543: extrair somente `chapterCardStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente dimensões, grid, superfície, borda, alinhamento, overflow e comportamento visual/interativo do card de capítulo.
- Fase 544: extrair somente `chapterNumberStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente dimensões, superfície, borda, cor, alinhamento, tipografia e quebra segura do número do capítulo.
- Fase 545: extrair somente `chapterTitleStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente cor, tipografia, espaçamento e quebra segura do título do capítulo.
- Fase 546: extrair somente `chapterMetaStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente cor, tipografia, limitação em duas linhas, overflow e quebra segura dos metadados do capítulo.
- Fase 547: extrair somente `heroStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente posicionamento, largura full-bleed, margens compensatórias, overflow, superfície e box-sizing do hero base.
- Fase 548: extrair somente `heroGlowStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente o estado oculto atual do glow do hero.
- Fase 549: extrair somente `heroContentStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente posicionamento, altura mínima, overflow, largura, box-sizing e raios inferiores do conteúdo do hero.
- Fase 550: extrair somente `coverArtStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente dimensões, raios, posicionamento, overflow, gradiente, enquadramento, borda, sombra e box-sizing da arte de capa.
- Fase 551: extrair somente `heroCoverLinkStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente posicionamento absoluto, preenchimento total, empilhamento, aparência do link, largura mínima, raio inferior e overflow.
- Fase 552: extrair somente `heroOverlayContentStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente posicionamento, ancoragem inferior, empilhamento, padding, grid, alinhamento, espaçamento, fundo, largura mínima, box-sizing e centralização do overlay do hero.
- Fase 553: extrair somente `coverTitleStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente posicionamento absoluto, centralização flex, cor, tamanho, line-height e composições tipográficas/outline/text-safe do título da capa.
- Fase 554: extrair somente `titleStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente margens, tipografia responsiva, line-height, alinhamento, cor, text-shadow, transformação e composição text-safe do título principal.
- Fase 555: extrair somente `descriptionStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente margens, cor, tipografia, line-height, largura máxima, alinhamento, overflow, opacidade, text-shadow, transformação e composição text-safe da descrição principal.
- Fase 556: extrair somente `heroActionsStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente grid, colunas, espaçamento, margem superior, largura mínima, largura total e largura máxima da área de ações do hero.
- Fase 557: extrair somente `metricInlineContentStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente inline-flex, alinhamento central, espaçamento, largura mínima e nowrap do conteúdo inline das métricas.
- Fase 558: extrair somente `metricEmojiIconStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente inline-flex, alinhamento central, flex fixo, tamanho e line-height do ícone emoji das métricas.
- Fase 559: extrair somente `metricWhiteNumberStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente cor branca, WebkitTextFillColor branco e line-height do valor numérico das métricas.
- Fase 560: extrair somente `heroBottomMetaBarStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente posicionamento, empilhamento, largura, espaçamento, superfície transparente, flex layout, box-sizing e deslocamento vertical da barra inferior do hero.
- Fase 561: extrair somente `heroBottomAuthorLinkStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente largura mínima, cor, decoração, tipografia, nowrap, overflow, ellipsis, text-shadow e composição text-safe do link do autor na barra inferior do hero.
- Fase 562: extrair somente `heroBottomMetricsStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente flex fixo, alinhamento, justificação, espaçamento e largura mínima do agrupamento de métricas na barra inferior do hero.
- Fase 563: extrair somente `heroBottomMetricStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente cor, tamanho, line-height, tipografia estatística, nowrap, text-shadow e composição text-safe de cada métrica na barra inferior do hero.
- Fase 564: extrair somente `primaryReadingButtonStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente dimensões, grid, superfície, tipografia, alinhamento, espaçamento, box-sizing, sombra e composição text-safe do botão principal de leitura.
- Fase 565: extrair somente `secondaryButtonStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente dimensões, superfície, tipografia, cursor, alinhamento, espaçamento, box-sizing, ausência de efeitos visuais e composição text-safe do botão secundário.
- Fase 566: extrair somente `copyLinkButtonStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente dimensões, superfície profunda, borda, tipografia, cursor, alinhamento, espaçamento, ausência de efeitos visuais e composição text-safe do botão de copiar link.
- Fase 567: extrair somente `followedButtonStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente a composição com `secondaryButtonStyle`, borda, superfície, cor e ausência de sombra do estado seguido.
- Fase 568: extrair somente `obraAddButtonStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente a composição com `copyLinkButtonStyle`, dimensões quadradas, espaçamento, superfície, borda, cor e tipografia do botão de ações da obra.
- Fase 569: extrair somente `obraActionSheetOverlayStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente posicionamento fixo, cobertura da viewport, empilhamento, alinhamento, superfície escurecida, box-sizing, overscroll e touch-action do overlay do menu de ações.
- Fase 570: extrair somente `obraActionSheetHandleStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente largura, altura, raio, superfície, alinhamento e margem do handle do menu de ações.
- Fase 571: extrair somente `obraMenuActionsStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente grid, espaçamento, bordas, superfície transparente e overflow do agrupamento de ações do menu da obra.
- Fase 572: extrair somente `obraActionToastStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente posicionamento, dimensões, superfície, borda, sombra, espaçamento, tipografia, alinhamento e ausência de interação do toast de ações da obra.
- Fase 573: extrair somente `obraActionsMenuStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente posicionamento, dimensões, rolagem, superfície, sombra, espaçamento, grid, box-sizing, touch-action e empilhamento do menu de ações da obra, mantendo `desktopObraActionsMenuStyle` composto sobre o mesmo estilo via import.
- Fase 574: extrair somente `obraMenuHeaderStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente grid, alinhamento, espaçamento, largura mínima, padding, box-sizing e ausência de borda inferior do cabeçalho do menu da obra.
- Fase 575: extrair somente `obraMenuTitleStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente cor, tipografia, alinhamento, truncamento, largura máxima e composição text-safe do título do menu da obra.
- Fase 576: extrair somente `obraMenuAuthorMetricsRowStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente largura, largura mínima, flexbox, alinhamento e espaçamento da linha de autor e métricas do menu da obra.
- Fase 577: extrair somente `obraMenuAuthorLinkStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente largura, truncamento, cor, decoração, alinhamento, tipografia e composição text-safe do link do autor no menu da obra.
- Fase 578: extrair somente `obraMenuMetricsStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente largura, flexbox, quebra, espaçamento, cor, tipografia, nowrap e composição text-safe do agrupamento de métricas do menu da obra.
- Fase 579: extrair somente `obraMenuMetricStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente a cor branca aplicada a cada métrica individual do menu da obra.
- Fase 580: extrair somente `obraMenuTagsStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente flexbox, nowrap, alinhamento, espaçamento, largura, cor, overflow horizontal e ocultação da barra de rolagem do agrupamento de tags do menu da obra.
- Fase 581: extrair somente `obraMenuTagStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente dimensões flexíveis, espaçamento, superfície, borda, cor, tipografia, nowrap e composição text-safe de cada tag individual do menu da obra.
- Fase 582: extrair somente `obraMenuTagSeparatorStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente display inline-block, espaçamento lateral e cor translúcida do separador entre tags do menu da obra.
- Fase 583: extrair somente `obraMenuSectionLabelStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente display, padding, cor, tipografia, transformação uppercase, espaçamento de letras e composição text-safe dos rótulos de seção do menu da obra.
- Fase 584: extrair somente `obraMenuItemButtonStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente aparência, dimensões, flexbox, bordas, superfície, cor, espaçamento, tipografia, cursor, box-sizing, nowrap e composição text-safe dos itens acionáveis do menu da obra.
- Fase 585: extrair somente `obraMenuItemActiveStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente a composição com `obraMenuItemButtonStyle`, peso tipográfico, superfície transparente e cor branca do item ativo do menu da obra.
- Fase 586: extrair somente `obraMenuItemCopiedStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente a composição com `obraMenuItemButtonStyle`, peso tipográfico, superfície transparente e cor branca do estado copiado do menu da obra.
- Fase 587: extrair somente `obraMenuItemDotStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente dimensões, raio, borda, superfície, cor, flexbox, alinhamento, box-sizing e tipografia do indicador circular dos itens do menu da obra.
- Fase 588: extrair somente `obraMenuItemDotActiveStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente a composição com `obraMenuItemDotStyle`, borda branca, superfície branca e cor escura do indicador circular ativo do menu da obra.
- Fase 589: extrair somente `synopsisToggleIconStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente display, tipografia responsiva, line-height, origem de transformação e transição do ícone de alternância da sinopse.
- Fase 590: extrair somente `statsGridStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente grid de quatro colunas, espaçamento, margem superior e largura mínima da grade de estatísticas da obra.
- Fase 591: extrair somente `commentsSheetOverlayStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente posicionamento fixo, cobertura da viewport, empilhamento máximo, flexbox, alinhamento, pointer-events e isolamento do overlay da folha de comentários.
- Fase 592: extrair somente `commentsSheetBackdropStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente posicionamento absoluto, cobertura, empilhamento, borda, superfície, blur, pointer-events, cursor e padding do backdrop da folha de comentários.
- Fase 593: extrair somente `commentsSheetStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente posicionamento, empilhamento, dimensões, grid, espaçamento, superfície, bordas, sombra, interação, overflow, box-sizing e transição da folha de comentários.
- Fase 594: extrair somente `commentsSheetCompactStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente a altura responsiva do estado compacto da folha de comentários.
- Fase 595: extrair somente `commentsSheetExpandedStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente a altura responsiva do estado expandido da folha de comentários.
- Fase 596: extrair somente `desktopCommentsSheetStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente a composição com `commentsSheetStyle`, largura e altura responsivas da folha de comentários no desktop.
- Fase 597: extrair somente `commentsSheetHandleWrapStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente altura mínima, flexbox, alinhamento, touch-action, cursor, will-change e outline-offset do contêiner do handle da folha de comentários.
- Fase 598: extrair somente `commentsSheetHandleStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente largura, altura, raio e superfície do handle da folha de comentários.
- Fase 599: extrair somente `commentsSheetHeaderStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente altura mínima, grid de três colunas, alinhamento, espaçamento e largura mínima do cabeçalho da folha de comentários.
- Fase 600: extrair somente `commentsSheetHeaderSpacerStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente largura e altura do espaçador lateral do cabeçalho da folha de comentários.
- Fase 601: extrair somente `commentsSheetTitleStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente cor, tamanho, peso, alinhamento e espaçamento de letras do título da folha de comentários.
- Fase 602: extrair somente `commentsSortMenuWrapStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente posicionamento relativo, dimensões, alinhamento no grid e flexbox do contêiner do menu de ordenação dos comentários.
- Fase 603: extrair somente `commentsSortMenuTriggerStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente dimensões, raio, borda, superfície, cor, tipografia, padding e cursor do gatilho do menu de ordenação dos comentários.
- Fase 604: extrair somente `commentsSortMenuStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente posicionamento, empilhamento, dimensões, grid, espaçamento, superfície, borda, sombra e blur do menu de ordenação dos comentários.
- Fase 605: extrair somente `commentsSortMenuItemStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente dimensões, borda, superfície, cor, padding, alinhamento, tipografia e cursor dos itens do menu de ordenação dos comentários.
- Fase 606: extrair somente `commentsSortMenuItemActiveStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente a composição com `commentsSortMenuItemStyle` e a cor do estado ativo dos itens do menu de ordenação dos comentários.
- Fase 607: extrair somente `commentsSortMenuDividerStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente largura, altura e superfície do divisor do menu de ordenação dos comentários.
- Fase 608: extrair somente `commentsSheetListStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente grid, alinhamento, espaçamento, altura mínima, rolagem vertical, padding e rolagem suave da lista da folha de comentários.
- Fase 609: extrair somente `commentsLoadMoreStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente dimensões, alinhamento, borda, raio, superfície, cor, padding e tipografia do botão de carregar mais comentários.
- Fase 610: extrair somente `commentSheetItemStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente grid, colunas, espaçamento, alinhamento e largura mínima do item da folha de comentários.
- Fase 611: extrair somente `commentThreadStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente grid, espaçamento e largura mínima da thread de comentários.
- Fase 612: extrair somente `commentRepliesListStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente grid, espaçamento, recuo, padding, borda lateral e largura mínima da lista de respostas dos comentários.
- Fase 613: extrair somente `commentSheetReplyItemStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente grid, colunas, espaçamento, alinhamento e largura mínima do item de resposta dos comentários.
- Fase 614: extrair somente `commentRepliesToggleStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente dimensões, layout inline-flex, alinhamento, espaçamento, recuo, superfície, cor, tipografia, padding e cursor do controle de respostas dos comentários.
- Fase 615: extrair somente `commentRepliesControlsStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente flexbox, alinhamento, espaçamento, quebra de linha e largura mínima dos controles de respostas dos comentários.
- Fase 616: extrair somente `commentRepliesHideButtonStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente largura, recuo, borda, superfície, cor, tipografia, padding e cursor do botão de ocultar respostas dos comentários.
- Fase 617: extrair somente `commentRepliesLineStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente largura, altura e superfície da linha visual do controle de respostas dos comentários.
- Fase 618: extrair somente `commentSheetAvatarLinkStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente dimensões, raio, flexbox, alinhamento, superfície, cor, tipografia, decoração, borda, overflow e box-sizing do avatar dos comentários.
- Fase 619: extrair somente `commentSheetReplyAvatarLinkStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente a composição com `commentSheetAvatarLinkStyle`, dimensões, raio e tipografia do avatar das respostas dos comentários.
- Fase 620: extrair somente `commentSheetContentStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente posicionamento relativo, grid, espaçamento e largura mínima do conteúdo dos comentários.
- Fase 621: extrair somente `commentSheetTopLineStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente flexbox, alinhamento por baseline, espaçamento e largura mínima da linha superior dos comentários.
- Fase 622: extrair somente `commentSheetAuthorLinkStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente cor, tipografia, decoração e composição text-safe do link do autor nos comentários.
- Fase 623: extrair somente `commentSheetTimeStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente cor, tipografia e nowrap do tempo exibido nos comentários.
- Fase 624: extrair somente `commentSheetTextStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente margem, cor, tipografia, line-height, pre-wrap e composição text-safe do texto dos comentários.
- Fase 625: extrair somente `commentSheetActionsRowStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente flexbox, alinhamento, espaçamento e quebra de linha da linha de ações dos comentários.
- Fase 626: extrair somente `commentSheetReplyButtonStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente largura, borda, superfície, cor, tipografia, padding e cursor do botão de resposta dos comentários.
- Fase 627: extrair somente `commentSheetRemoveButtonStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente largura, borda, superfície, cor, tipografia, padding e cursor do botão de remoção dos comentários.
- Fase 628: extrair somente `commentSheetLikeWrapStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente largura mínima, grid, alinhamento e espaçamento do contêiner de curtida dos comentários.
- Fase 629: extrair somente `commentSheetLikeButtonStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente dimensões, borda, raio, superfície, flexbox, alinhamento, padding e cursor do botão de curtida dos comentários.
- Fase 630: extrair somente `commentSheetLikeCountStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente cor, tipografia, line-height, altura mínima e alinhamento do contador de curtidas dos comentários.
- Fase 631: extrair somente `commentSheetHeartIconStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente dimensões e display do ícone de coração dos comentários.
- Fase 632: extrair somente `commentsLoadingStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente largura, altura mínima, flexbox, alinhamento e box-sizing do estado de carregamento dos comentários.
- Fase 633: extrair somente `emptyCommentsStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente margem, cor, tipografia e alinhamento do estado vazio dos comentários.
- Fase 634: extrair somente `commentsToolsStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente grid, espaçamento e padding da área de ferramentas dos comentários.
- Fase 635: extrair somente `commentsQuickReactionsStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente flexbox, alinhamento, distribuição, espaçamento, largura, overflow horizontal, padding e comportamento de rolagem das reações rápidas dos comentários.
- Fase 636: extrair somente `commentsQuickReactionButtonStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente dimensões, borda, raio, superfície, tipografia, line-height, padding, cursor e flex do botão de reação rápida dos comentários.
- Fase 637: extrair somente `commentsSheetFormStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente grid, colunas, alinhamento, espaçamento, padding e largura mínima do formulário dos comentários.
- Fase 638: extrair somente `commentsInputAvatarStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente dimensões, raio, flexbox, alinhamento, superfície, borda, cor, tipografia e overflow do avatar do campo de comentários.
- Fase 639: extrair somente `commentsInputBoxStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente largura mínima, altura mínima, flexbox e alinhamento do contêiner do campo de comentários.
- Fase 640: extrair somente `commentsSheetInputStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente largura, alturas, raio, borda, superfície, cor, padding, outline, tipografia, resize, overflow, fonte e box-sizing do campo de texto dos comentários.
- Fase 641: extrair somente `commentsInputIconButtonStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente dimensões, borda, superfície, cor, tipografia, fonte, padding e cursor do botão de ícone do campo de comentários.
- Fase 642: extrair somente `commentsSheetSendStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente dimensões, raio, borda, superfície, cor, tipografia, line-height, fonte e padding do botão de envio dos comentários.
- Fase 643: extrair somente `commentStatusStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente display, cor, tipografia, line-height, alinhamento e composição com `safeTextStyle` do status dos comentários.
- Fase 644: extrair somente `sectionTitleStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente margem, cor, tipografia, line-height, peso, letter-spacing, largura máxima, alinhamento e composição com `safeTextStyle` dos títulos de seção.
- Fase 645: extrair somente `accentSectionTitleStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente composição com `sectionTitleStyle`, cor e transformação para uppercase do título de seção com destaque.
- Fase 646: extrair somente `fileBoxStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente margem, padding, raio, gradiente, borda, grid, espaçamento, largura mínima, overflow e sombra da caixa de arquivo.
- Fase 647: extrair somente `fileInfoCardStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente grid, colunas, espaçamento, alinhamento, padding, raio, superfície, borda, limites de largura, box-sizing e overflow do cartão de informações do arquivo.
- Fase 648: extrair somente `filePreviewLinkStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente dimensões, raio, superfície, borda, overflow, flexbox, alinhamento, decoração de texto e flex do link de prévia do arquivo.
- Fase 649: extrair somente `fileImagePreviewStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente dimensões, object-fit e display da imagem de prévia do arquivo.
- Fase 650: extrair somente `fileIconBoxStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente dimensões, raio, gradiente, cor, tipografia, flexbox, alinhamento e sombra do ícone do arquivo.
- Fase 651: extrair somente `fileInfoTextStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente grid, alinhamento de conteúdo, espaçamento, limites de largura e overflow do texto de informações do arquivo.
- Fase 652: extrair somente `fileMetaStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente cor, tipografia, line-height, peso, clamp em duas linhas, orientação, overflow e composição com `safeTextStyle` dos metadados do arquivo.
- Fase 653: extrair somente `fileActionsStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente grid, colunas, espaçamento e limites de largura da área de ações do arquivo.
- Fase 654: extrair somente `filePrimaryButtonStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente altura mínima, raio, superfície, borda, cor, decoração de texto, tipografia, flexbox, alinhamento, padding, sombra, cursor, fonte, appearance, tap highlight e composição com `safeTextStyle` do botão primário do arquivo.
- Fase 655: extrair somente `fileSecondaryButtonStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente composição com `filePrimaryButtonStyle` e cor do botão secundário do arquivo.
- Fase 656: extrair somente `workRatingBoxStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente margem superior, padding, raio, superfície, borda, grid, espaçamento, largura mínima e box-sizing da caixa de avaliação da obra.
- Fase 657: extrair somente `desktopWorkRatingBoxStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente composição com `workRatingBoxStyle` e margem superior da caixa desktop de avaliação da obra.
- Fase 658: extrair somente `workRatingHeaderStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente grid, alinhamento dos itens, espaçamento, largura mínima e alinhamento de texto do cabeçalho de avaliação da obra.
- Fase 659: extrair somente `workRatingTitleStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente margem, largura, cor, text fill, tipografia, line-height, peso, letter-spacing, uppercase, largura máxima, alinhamento e composição com `safeTextStyle` do título de avaliação da obra.
- Fase 660: extrair somente `workRatingStarsRowStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente grid, cinco colunas, espaçamento e largura mínima da linha de estrelas da avaliação da obra.
- Fase 661: extrair somente `workRatingStarButtonStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente altura mínima, raio, borda, superfície, cor, tipografia, cursor, sombra/filtros, padding e alinhamento flex do botão de estrela da avaliação da obra.
- Fase 662: extrair somente `workRatingStarActiveStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente composição com `workRatingStarButtonStyle`, borda, superfície, cor ativa, sombra e filtros da estrela ativa da avaliação da obra.
- Fase 663: extrair somente `workRatingStarVisualStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente posicionamento relativo, largura, altura, display e line-height do contêiner visual da estrela da avaliação da obra.
- Fase 664: extrair somente `workRatingStarBaseStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente cor base, posicionamento absoluto, inset e line-height da camada base da estrela da avaliação da obra.
- Fase 665: extrair somente `workRatingStarFillStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente cor ativa, posicionamento absoluto, inset, overflow, white-space e line-height da camada preenchida da estrela da avaliação da obra.
- Fase 666: extrair somente `communityBoxStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente margem superior, padding, raio, superfície, borda, grid, espaçamento, largura mínima, overflow e sombra da caixa da seção Comunidade.
- Fase 667: extrair somente `communityHeaderStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente flexbox, alinhamento, centralização, espaçamento, limites de largura e alinhamento de texto do cabeçalho da seção Comunidade.
- Fase 668: extrair somente `communityTitleStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente margem, largura, cor, text fill, tipografia, line-height, peso, letter-spacing, uppercase, alinhamento e composição com `safeTextStyle` do título da seção Comunidade.
- Fase 669: extrair somente `desktopHeroStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente composição com `heroStyle`, larguras, margem, overflow, raio, borda, superfície e sombra do hero desktop.
- Fase 670: extrair somente `desktopHeroContentStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente posicionamento, z-index, largura, grid, colunas, alinhamento, espaçamento, altura mínima, padding, overflow, limites de largura e box-sizing do conteúdo do hero desktop.
- Fase 671: extrair somente `desktopCoverArtStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente composição com `coverArtStyle`, dimensões, altura mínima, raio, posição do background, borda e sombra da arte de capa no desktop.
- Fase 672: extrair somente `desktopHeroCoverLinkStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente posicionamento, z-index, coluna do grid, dimensões, alinhamento, display, padding, raio, overflow, borda, background, sombra, cor, decoração de texto e box-sizing do link da capa no hero desktop.
- Fase 673: extrair somente `desktopHeroOverlayContentStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente posicionamento, z-index, coluna do grid, limites de largura, alinhamentos, flexbox, direção, espaçamento, padding, alinhamento de texto, superfície e box-sizing do conteúdo sobreposto do hero desktop.
- Fase 674: extrair somente `desktopHeroBottomMetaBarStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente posicionamento, z-index, ordem, larguras, margem superior, padding, raio, borda, superfície, flexbox, alinhamentos, espaçamento, largura mínima, box-sizing e transform da barra inferior de metadados do hero desktop.
- Fase 675: extrair somente `desktopTitleStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente composição com `titleStyle`, larguras, margem, tamanho de fonte, line-height, alinhamento, cor, sombra e transform do título da obra no desktop.
- Fase 676: extrair somente `desktopDescriptionStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente composição com `descriptionStyle`, larguras, altura mínima, margem, cores, tipografia, line-height, clamp, overflow, quebra de palavras, alinhamento, sombra e transform da descrição da obra no desktop.
- Fase 677: extrair somente `desktopHeroKickerStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente cor, tipografia, line-height, letter-spacing, uppercase e sombra do kicker do hero desktop.
- Fase 678: extrair somente `desktopHeroMetaStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente flexbox, alinhamento, espaçamento, quebra, limites de largura, cores e tipografia dos metadados do hero desktop.
- Fase 679: extrair somente `desktopHeroAuthorStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente cor, peso, decoração, sombra e composição com `safeTextStyle` do link do autor no hero desktop.
- Fase 680: extrair somente `desktopHeroMetaDividerStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente dimensões, raio, background e flex do divisor visual dos metadados do hero desktop.
- Fase 681: extrair somente `desktopHeroMetaTextStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente cor, tipografia, line-height, sombra e composição com `safeTextStyle` do texto de metadados do hero desktop.
- Fase 682: extrair somente `desktopHeroStatsStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente flexbox, alinhamento, espaçamento, cor, tipografia, larguras e quebra das estatísticas do hero desktop.
- Fase 683: extrair somente `desktopPrimaryReadingButtonStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente dimensões mínimas, padding, borda, superfície, cor, decoração, flexbox, tipografia, alinhamento, box-sizing, sombra, cursor e composição com `safeTextStyle` do botão principal de leitura no desktop.
- Fase 684: extrair somente `desktopSecondaryFollowButtonStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente dimensões mínimas, padding, borda, superfície, cor, decoração, flexbox, tipografia, alinhamento, box-sizing, sombra, cursor e composição com `safeTextStyle` do botão secundário de seguir no desktop.
- Fase 685: extrair somente `desktopFollowedButtonStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente a composição com `desktopSecondaryFollowButtonStyle` do estado seguido no desktop.
- Fase 686: extrair somente `desktopObraAddButtonStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente a composição com `desktopFollowedButtonStyle`, dimensões, padding e tipografia do botão de adicionar obra no desktop.
- Fase 687: extrair somente `desktopHeroActionsStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente ordem, flexbox, alinhamento, espaçamento, larguras, margem e box-sizing das ações do hero desktop.
- Fase 688: extrair somente `desktopObraActionsMenuStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente a composição com `obraActionsMenuStyle` e a largura do menu de ações da obra no desktop.
- Fase 689: extrair somente `desktopStatsGridStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente a composição com `statsGridStyle`, o espaçamento e a margem superior da grade de estatísticas no desktop.
- Fase 690: extrair somente `desktopFileBoxStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente a composição com `fileBoxStyle`, padding, raio da borda e margem superior da caixa de arquivo no desktop.
- Fase 691: extrair somente `desktopFileInfoCardStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente a composição com `fileInfoCardStyle`, as colunas da grade e o padding do card de informações do arquivo no desktop.
- Fase 692: extrair somente `desktopFileActionsStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente a composição com `fileActionsStyle`, as colunas da grade e o alinhamento das ações do arquivo no desktop.
- Fase 693: extrair somente `desktopCommunityBoxStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente a composição com `communityBoxStyle`, margem superior, padding, raio da borda e espaçamento da seção Comunidade no desktop.
- Fase 694: extrair somente `desktopChaptersListStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente a composição com `chaptersListStyle` e o espaçamento da lista de capítulos no desktop.
- Fase 695: extrair somente `desktopChapterCardStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente a composição com `chapterCardStyle`, as colunas da grade, o padding e o espaçamento do card de capítulo no desktop.
- Fase 696: extrair somente `classificationPanelOverlayStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente posicionamento fixo, inset, z-index, grid, centralização e padding do overlay do painel de classificação.
- Fase 697: extrair somente `classificationPanelBackdropStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente posicionamento absoluto, inset, borda, fundo, filtros de desfoque e cursor do backdrop do painel de classificação.
- Fase 698: extrair somente `classificationPanelStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente posicionamento, z-index, largura, overflow, raio, borda, fundo, sombra e cor do painel de classificação.
- Fase 699: extrair somente `classificationPanelHeaderStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando exatamente flexbox, alinhamento, espaçamento e padding do cabeçalho do painel de classificação.
- Fase 700: extrair somente `classificationPanelBadgeStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando literalmente dimensões, padding, raio, flexbox, alinhamento, borda, fundo, cor, tipografia, box-sizing e a ordem de composição antes de `classificationPanelBadgeAdultStyle`.
- Fase 701: extrair somente `classificationPanelBadgeAdultStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando literalmente borda, fundo, cor, sombra e a composição condicional depois de `classificationPanelBadgeStyle` apenas para classificação 18.
- Fase 702: extrair somente `classificationPanelCloseStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando literalmente dimensões, raio, borda, fundo, cor, grid, alinhamento, tipografia, cursor e o uso atual no botão de fechar.
- Fase 703: extrair somente `classificationPanelContentStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando literalmente `display`, `gap`, `padding` e o uso atual no conteúdo do painel de classificação.
- Fase 704: extrair somente `classificationPanelIntroStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando literalmente `display: "grid"`, `gap: "6px"` e o uso atual no JSX.
- Fase 705: extrair somente `classificationPanelTitleStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando literalmente `color`, `fontSize`, `fontWeight`, `letterSpacing` e o uso atual no JSX.
- Fase 706: extrair somente `classificationPanelDescriptionStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando literalmente `margin`, `color`, `fontSize`, `fontWeight`, `lineHeight` e o uso atual no JSX.
- Fase 707: extrair somente `classificationWarningsStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando literalmente `display`, `gap`, `paddingTop`, `borderTop` e o uso atual no JSX.
- Fase 708: extrair somente `classificationWarningsTitleStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando literalmente `color`, `fontSize`, `fontWeight`, `letterSpacing`, `textTransform` e o uso atual no JSX.
- Fase 709: extrair somente `classificationWarningsGridStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando literalmente `display`, `gridTemplateColumns`, `gap` e o uso atual no JSX.
- Fase 710: extrair somente `classificationWarningItemStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando literalmente suas 12 propriedades e o uso atual no JSX.
- Fase 711: extrair somente `classificationWarningDotStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando literalmente suas 7 propriedades e o uso atual no JSX.
- Fase 712: extrair somente `classificationNoWarningsStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando literalmente `margin`, `color`, `fontSize`, `fontWeight`, `lineHeight` e o uso atual no JSX.
- Fase 713: extrair somente `desktopHeaderRightStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando literalmente `display`, `alignItems`, `justifyContent`, `gap`, `flex`, `minWidth` e o uso atual no JSX.
- Fase 714: extrair somente `classificationTriggerAdultStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando literalmente `borderColor`, `background`, `color`, `boxShadow` e a composição condicional depois de `classificationTriggerStyle` somente para classificação 18, com fallback `{}`.
- Fase 715: extrair somente `classificationTriggerTextStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando literalmente `fontSize`, `fontWeight`, `lineHeight`, `letterSpacing`, o uso direto no JSX e o spread local em `classificationTriggerTextLivreStyle`.
- Fase 716: extrair somente `classificationTriggerTextLivreStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando `...classificationTriggerTextStyle` primeiro, `fontSize: "19px"`, `letterSpacing: 0` e o ternário atual no JSX.
- Fase 717: extrair somente `classificationTriggerStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando literalmente todas as propriedades, `...safeTextStyle` como última entrada e a composição condicional com `classificationTriggerAdultStyle` no JSX.
- Fase 718: extrair somente `heroTopOverlayStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando literalmente suas 13 propriedades e `desktopHeroTopOverlayStyle` local com `...heroTopOverlayStyle` como primeira entrada.
- Fase 719: extrair somente `desktopHeroTopOverlayStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando `...heroTopOverlayStyle` como primeira entrada e as quatro sobrescritas atuais, sem alterar o ternário do JSX.
- Fase 720: extrair somente `containerStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando literalmente suas sete propriedades, os usos atuais no JSX e `desktopContainerStyle` local com o spread da base antes das sobrescritas de `width` e `padding`.
- Fase 721: extrair somente `desktopContainerStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando `...containerStyle` como primeira entrada, as sobrescritas atuais de `width` e `padding` e os dois ternários do JSX inalterados.
- Fase 722: extrair somente `pageStyle` para `app/obra/[slug]/lib/obra-style-utils.ts`, preservando literalmente suas nove propriedades na mesma ordem, `useHistorietasTheme(pageStyle)`, os quatro usos de `pageThemeStyle` e os valores atuais de `background` e `color`.
- Fase 723: extrair somente `OBRA_DINAMICA_UI_TRANSLATIONS` para `app/obra/[slug]/lib/obra-text-utils.ts`, preservando literalmente todas as chaves, textos em português, inglês e espanhol, ordem, estrutura e o tipo `Record<string, TraducaoObraDinamica>`.
- Fase 724: extrair somente `traduzirTextoObraDinamica` para `app/obra/[slug]/lib/obra-text-utils.ts`, preservando literalmente a ordem dos regex, whitespace inicial/final, consulta à tabela antes dos regex, pluralização, interpolações, comportamento EN/ES e o fallback final.
- Fase 725: extrair somente o componente completo `ObraDinamicaLanguageBridge` para `app/obra/[slug]/components/obra-dinamica-language-bridge.tsx`, preservando literalmente o efeito, seletor das raízes da obra e comentários, `WeakMap`, `Set`, observer, cleanup e restauração condicional.
- Fase 726: extrair somente `FILE_BACKUP_STORAGE_KEY` e `carregarBackupArquivosObras` para `app/obra/[slug]/lib/obra-file-backup-utils.ts`, preservando a proteção SSR, leitura e escrita por usuário, parse e fallback de JSON, validação, normalização e regravação canônica do backup de arquivos.
- Fase 727: extrair somente `sincronizarBackupArquivosObras` para `app/obra/[slug]/lib/obra-file-backup-utils.ts`, preservando guards, ordem de carregamento e escrita, aliases por obra e o fallback silencioso do backup.
- Fase 728: extrair somente `LOCAL_WORKS_STORAGE_KEY` e `carregarObrasLocaisComBackup` para `app/obra/[slug]/lib/obra-local-works-utils.ts`, preservando leitura por usuário, parse sem fallback adicional, normalização, restauração por backup, filtragem e sincronização da coleção normalizada completa.
- Fase 729: extrair somente `aplicarMetricasObraPublica` para `app/obra/[slug]/lib/obra-metrics-application-utils.ts`, preservando coleta de IDs, contrato de métricas, fallbacks locais, progresso privado e todas as normalizações.
- Fase 730: extrair somente a paginação/consulta dos capítulos públicos da obra para `app/obra/[slug]/lib/obra-supabase-chapters-utils.ts`, preservando tabela, colunas, filtros, ordenação, ranges e propagação de erros.
- Fase 731: extrair somente a consulta inicial da obra pública por slug para `app/obra/[slug]/lib/obra-supabase-work-utils.ts`, preservando tabela, colunas, filtros, limite e retorno bruto de dados e erro.
- Fase 732: extrair somente a transformação que remove do cache local a obra confirmada como ausente remotamente para `app/obra/[slug]/lib/obra-data-utils.ts`, preservando aliases por slug explícito e título, ordem e retorno `nao_encontrada` no carregador.
- Fase 733: extrair somente a transformação que substitui ou insere a obra normalizada na coleção local para `app/obra/[slug]/lib/obra-data-utils.ts`, preservando igualdade estrita de IDs, ordem, referências não correspondentes e inserção no início.
- Fase 734: extrair somente a consulta de perfis públicos com fallback progressivo de colunas para `app/obra/[slug]/lib/obra-public-profile-query.ts`, preservando tabela, seleções, filtro, limite e retorno bruto das linhas válidas.
- Fase 735: extrair juntas as persistências remotas de favoritos, concluídas e curtidas de obra para `app/obra/[slug]/lib/obra-supabase-interaction-persistence.ts`, preservando guards, tabelas, filtros, upserts, fallback da curtida e propagação de erros.
- Fase 736: extrair juntas a chave e a persistência local de avaliações de obra para `app/obra/[slug]/lib/obra-local-rating-storage-utils.ts`, preservando isolamento por usuário, parse/fallback de JSON, chave de avaliação, arredondamento em passos de 0,5 e remoção lógica pela nota zero.
- Fase 737: extrair somente a persistência remota de avaliações de obra para `app/obra/[slug]/lib/obra-supabase-rating-persistence.ts`, preservando guards, delete condicional, upsert, conflito e propagação bruta de erros.
- Fase 738: extrair juntas as persistências remotas de remoção e registro de atividades do Diário da obra para `app/obra/[slug]/lib/obra-supabase-diary-activity-persistence.ts`, preservando guards, delete, normalização, payload, fallback, avisos e erros absorvidos.
- Fase 739: extrair juntas a chave e a persistência local de comentários da obra para `app/obra/[slug]/lib/obra-local-comment-storage-utils.ts`, preservando isolamento por usuário/obra, normalização, compatibilidade de parentagem, deduplicação de curtidas, limite e fallback de escrita.
- Fase 740: extrair somente a consulta paginada de curtidas dos comentários para `app/obra/[slug]/lib/obra-supabase-comment-likes-query.ts`, preservando tabela, seleção, filtro, ordenação, ranges e propagação de erros.
- Fase 741: extrair somente a consulta Supabase dos comentários raiz para `app/obra/[slug]/lib/obra-supabase-root-comments-query.ts`, preservando tabela, seleção, filtros, ordenações, range e retorno bruto de dados e erro.
- Fase 742: extrair somente a consulta paginada das respostas dos comentários para `app/obra/[slug]/lib/obra-supabase-comment-replies-query.ts`, preservando tabela, seleção, filtro, ordenações, ranges, lotes e propagação de erros.
- Fase 743: extrair somente `carregarPerfisPublicosObra` para `app/obra/[slug]/lib/obra-public-profile-loader.ts`, preservando validação, deduplicação, consultas por `user_id` e `id`, normalização, fallback e ordem do `Map`.
- Fase 744: extrair integralmente `normalizarComentariosObraSupabase` para `app/obra/[slug]/lib/obra-supabase-comment-normalizer.ts`, preservando deduplicação, ordem perfis → curtidas, fallback silencioso de curtidas, normalização e validação dos comentários públicos.
- Fase 745: extrair integralmente o carregador paginado de comentários da obra para `app/obra/[slug]/lib/obra-supabase-comments-page-loader.ts`, preservando sentinela, recursão, deduplicação, normalização e offsets.
- Fase 746: extrair integralmente `carregarPerfilPublicoObra` para `app/obra/[slug]/lib/obra-public-profile-resolver.ts`, preservando prioridade do perfil público, fallback autenticado e normalização final.
- Fase 747: extrair somente a persistência remota de criação de comentário para `app/obra/[slug]/lib/obra-supabase-comment-persistence.ts`, preservando payload preparado no cliente, tabela, seleção, retorno bruto, guard de identidade e orquestração do envio.
- Fase 748: proteger somente `removerComentarioObra` contra troca de identidade durante a remoção, preservando a query inline, a ordem dos filtros, a remoção local, o cache, contadores, resposta, mensagens e o lock para execuções ainda atuais.
- Fase 749: extrair somente a persistência remota de remoção de comentário para `app/obra/[slug]/lib/obra-supabase-comment-persistence.ts`, preservando tabela, delete, ordem dos filtros, retorno bruto e os guards de identidade no cliente.
- Fase 750: proteger somente `alternarCurtidaComentarioObra` contra troca de identidade durante a curtida, preservando atualização otimista, cache local, delete antes de insert, rollback, mensagens e lock para execuções ainda atuais.
- Fase 751: extrair somente as persistências remotas de remoção e inserção da curtida de comentário para `app/obra/[slug]/lib/obra-supabase-comment-like-persistence.ts`, preservando tabela, filtros, payload, retorno bruto e guards de identidade no cliente.
- Fase 752: migrar somente `avaliarObra` para identidade autenticada versionada, preservando `avaliacaoVersaoRef`, o fluxo otimista, cache, persistência remota, rollback e a sincronização do Diário.
- Fase 753: remover somente o helper legado `obterUsuarioLogadoParaAcao`, já sem consumidores, e o marcador temporário correspondente, preservando a autenticação versionada atual.
- Fase 754: extrair somente as queries remotas de inserção e remoção do seguimento de obra para `app/obra/[slug]/lib/obra-supabase-interaction-persistence.ts`, preservando guards, efeitos locais, Diário e tratamento de erro no cliente.
- Fase 755: extrair somente a mesclagem pura de comentários paginados por ID para `app/obra/[slug]/lib/obra-comment-utils.ts`, preservando ordem, substituição, duplicatas e guards no cliente.
- Fase 756: proteger somente os updaters funcionais de carregamento incremental de comentários contra execuções obsoletas, revalidando versão e identidade dentro dos callbacks antes de mesclar comentários ou atualizar o total.
- Fase 757: extrair somente a apresentação de cada comentário da obra para `app/obra/[slug]/components/obra-comment-item.tsx`, preservando estilos, acessibilidade, chaves nas listas e handlers no cliente.
- Fase 758: extrair somente a apresentação de cada thread de comentários da obra para `app/obra/[slug]/components/obra-comment-thread.tsx`, preservando cálculos, controles de respostas, chaves e estado de visibilidade no cliente.
- Fase 759: extrair somente a apresentação do compositor de comentários da obra para `app/obra/[slug]/components/obra-comment-composer.tsx`, preservando estado, ref, foco, handlers e persistência no cliente.
- Fase 760: extrair somente a apresentação do cabeçalho do painel de comentários da obra para `app/obra/[slug]/components/obra-comments-header.tsx`, preservando estado, ordenação e fechamento do menu no cliente.
- Fase 761: extrair somente a apresentação do handle de expansão e arraste do painel de comentários da obra para `app/obra/[slug]/components/obra-comments-handle.tsx`, preservando drag, foco e estado no cliente.
- Fase 762: extrair somente a apresentação da lista de comentários da obra para `app/obra/[slug]/components/obra-comments-list.tsx`, preservando estrutura, paginação, handlers e guards no cliente.
- Fase 763: extrair somente o shell visual e estrutural do painel de comentários da obra para `app/obra/[slug]/components/obra-comments-sheet.tsx`, preservando portal, foco e composição no cliente.
- Fase 764: extrair somente o painel visual e estrutural de classificação da obra para `app/obra/[slug]/components/obra-classification-panel.tsx`, preservando condição, foco, estado e composição no cliente.
- Fase 765: extrair somente a apresentação do menu de ações da obra para `app/obra/[slug]/components/obra-actions-sheet.tsx`, preservando estado, foco e handlers no cliente.
- Fase 766: extrair somente a apresentação do bloco de avaliação da obra para `app/obra/[slug]/components/obra-rating-box.tsx`, preservando estado, identidade, persistência e Diário no cliente.
- Fase 767: extrair somente a apresentação da seção Comunidade da obra para `app/obra/[slug]/components/obra-community-section.tsx`, preservando métricas, carregamento e links no cliente.
- Fase 768: extrair somente a apresentação do grid de métricas da obra para `app/obra/[slug]/components/obra-stats-grid.tsx`, preservando estado, handlers, identidade e persistência no cliente.
- Fase 769: extrair somente a apresentação do ramo de Sinopse da obra para `app/obra/[slug]/components/obra-synopsis-section.tsx`, preservando estado, derivação e o ramo de Capítulos no cliente.
- Fase 770: extrair somente a apresentação do ramo de Capítulos da obra para `app/obra/[slug]/components/obra-chapters-section.tsx`, preservando guard, derivação, disponibilidade, carregamento, filtro e ordenação no cliente.
- Fase 771: mover integralmente o componente `ArquivoObraPublico` para `app/obra/[slug]/components/arquivo-obra-publico.tsx`, preservando URLs assinadas, cancelamento, abertura, download e estados locais.
- Fase 772: mover literalmente a constante `obraPageCss` para `app/obra/[slug]/lib/obra-page-css.ts`, preservando keyframes, redução de movimento, custom properties e todos os consumidores de estilo no cliente.
- Fase 773: extrair somente a apresentação do resumo de avaliação do cabeçalho para `app/obra/[slug]/components/obra-rating-summary.tsx`, preservando estado, persistência e hero no cliente.
- Fase 774: extrair somente o header do hero para `app/obra/[slug]/components/obra-hero-header.tsx`, preservando classificação, foco e resumo de avaliação preparados no cliente.
- Fase 775: extrair somente a capa/link principal do hero para `app/obra/[slug]/components/obra-hero-cover.tsx`, preservando decisão de leitura e acessibilidade preparadas no cliente.
- Fase 776: extrair somente a barra inferior de metadados do hero para `app/obra/[slug]/components/obra-hero-meta-bar.tsx`, preservando autor, métricas e formatação preparados no cliente.
- Fase 777: extrair somente as ações do hero para `app/obra/[slug]/components/obra-hero-actions.tsx`, preservando decisão de leitura, seguimento, foco e handlers no cliente.
- Fase 778: extrair somente os detalhes textuais do hero para `app/obra/[slug]/components/obra-hero-details.tsx`, preservando container, estado e dados preparados no cliente.
- Fase 779: extrair somente o toast de ação para `app/obra/[slug]/components/obra-action-toast.tsx`, preservando estado, expiração e fluxos de mensagem no cliente.
- Fase 780: remover os fades superiores transparentes e inertes da página da obra, sem criar nova abstração.
- Fase 781: extrair integralmente `carregarObraSupabasePorSlug` para `app/obra/[slug]/lib/obra-public-work-loader.ts`, preservando consultas, guards, fallbacks, métricas, normalização e backup.
- Fase 782: extrair somente a estratégia de cópia do compartilhamento para `app/obra/[slug]/lib/obra-share-utils.ts`, preservando no cliente a ordem da chamada nativa, fechamento do menu, `await`, `AbortError`, setters, mensagens e timer.
- Fase 783: extrair o hook de foco inicial dos diálogos da obra, preservando o agendamento de 0 ms, cleanup, refs, fechamento, restauração de foco e trap de teclado no cliente.
- Fase 784: extrair a derivação pura da ação principal de leitura, preservando seleção de capítulo, rótulos, fallback da capa e CTA condicional.
- Fase 785: extrair somente `carregarSnapshotRemotoAvaliacaoObra` para concentrar consulta de sessão e métricas remotas da avaliação, preservando no cliente efeito, fallback local, guards de versão/cancelamento, cache, setters, erro visual e cleanup.
- Fase 786: extrair somente `useObraDesktopMode`, preservando estado inicial, breakpoint, agendamento inicial, listeners moderno/legado, cleanup e todos os consumidores visuais no cliente.
- Fase 787: extrair somente `useObraAuthorPublicProfile`, preservando estado inicial, cancelamento e os agendamentos de perfil público do autor.
- Fase 788: extrair somente `useObraCommentsNow`, preservando estado inicial, timeout de 0 ms, intervalo de 1000 ms, cleanup e consumidores do relógio de comentários.
- Fase 789: extrair somente `useObraContent18Access`, preservando estado indexado por obra, reavaliação agendada, confirmação manual e o consumo do status pela página.
- Fase 790: extrair somente `useObraCommentsSheetBodyLock`, preservando o lock/restauração do body e o cleanup ordenado do timer de drag do painel de comentários.
- Fase 791: extrair somente `obterObraDinamicaPorSlug`, preservando a busca por slug explícito ou derivado, primeira ocorrência, conversão e fallback nulo.
- Fase 792: extrair somente `useObraCommentRepliesVisibility`, preservando reset, visibilidade de resposta enviada e controles em blocos de cinco.
- Fase 793: extrair somente `useObraCommentsOrdering`, preservando seleção, abertura e fechamento do menu de ordenação dos comentários.
- Fase 794: extrair somente `useObraActionsSheet`, preservando lifecycle, foco inicial e restauração de foco do diálogo de ações.
- Fase 795: extrair somente `useObraClassificationPanel`, preservando lifecycle, foco inicial, restauração de foco e reset silencioso do painel de classificação.
- Fase 796: extrair somente `obterContextoAutorObra`, preservando a prioridade de perfil público, fallback de autor/ID da obra e a autoria por igualdade estrita de IDs não vazios.
- Fase 797: extrair somente `obterAvaliacaoLocalInicialObra`, preservando o bloqueio local de avaliação do autor e o fallback detalhado para os demais usuários.
- Fase 798: extrair somente `useObraViewRegistration`, preservando guards de acesso, deduplicação por ref string, registro assíncrono e atualização monotônica de visualizações.
- Fase 851: extrair somente `useAdminComunidadeDesktopMode`, preservando o estado inicial, breakpoint, atualização síncrona, listeners moderno/legado e todos os consumidores visuais no cliente.
- Fase 852: mover literalmente `adminComunidadePageCss` para módulo local, preservando os quatro consumidores e a ordem de precedência do CSS no cliente.
- Fase 853: extrair `AdminComunidadeLanguageBridge`, sua tabela de traduções e helpers exclusivos para componente local, preservando observer, cleanup e os quatro mounts na página.

## Registro da Fase 962 — Seguindo

- O painel visual de ordenação de Seguindo foi extraído sem alterar opções, estilos, callbacks ou o lifecycle de bloqueio de rolagem.

## Registro da Fase 963 — Seguindo

- O cabeçalho visual de Seguindo foi isolado sem alterar estados, busca, acessibilidade ou o acionamento do painel de ordenação.

## Contrato de preservação

A extração deve preservar exatamente:

- comportamento e fluxo assíncrono;
- visual, estados e acessibilidade;
- consultas, filtros, ordenação, paginação e contratos do Supabase;
- políticas, permissões e comportamento de RLS;
- chaves, formatos e fallbacks de `localStorage`;
- chaves, mensagens, interpolação e fallback de i18n;
- whitespace significativo e formatação não relacionada ao alvo.

Não alterar schema, migrations, dependências ou contratos públicos sem autorização explícita e uma fase dedicada.

## Validação obrigatória

Qualquer manutenção futura deve executar as validações aplicáveis definidas no `AGENTS.md`, incluindo lint, typecheck, auditoria estática, testes unitários, integrações com Supabase local, build, E2E e verificação final de diff/whitespace. Qualquer validação não executada ou com falha deve ser registrada claramente.
## Registro da Fase 975 — Seguindo

- A composição do carregamento da página Seguindo foi extraída para `useSeguindoPageDataLoading`.
- Loader, gatilho, ordem de execução, estados e contratos existentes foram preservados sem alteração de comportamento.

## Registro da Fase 976 — Seguindo

- Estados locais sociais e de descoberta foram agrupados em hooks de composição, sem alterar valores iniciais, setters ou ordem de hooks.

## Registro da Fase 2 — Configurações

- As primitives visuais reutilizáveis de seções, linhas e inputs foram isoladas com seus estilos literais.
- A página permaneceu responsável pela orquestração, estados, autenticação, storage e operações remotas, sem alteração intencional de comportamento.

## Registro da Fase 3 — Configurações

- O cabeçalho, a busca e o resumo visual do perfil foram movidos para componentes dedicados, com os estilos literais do shell isolados.
- Estados, traduções, navegação, autenticação, storage e operações remotas permaneceram na página sem alteração intencional de comportamento.

## Registro da Fase 4 — Configurações

- O toast de feedback e o painel visual de usuários bloqueados foram isolados com seus estilos literais.
- Estados, confirmações, callbacks, autenticação, storage e operações remotas continuaram na página sem alteração intencional de comportamento.

## Registro da Fase 5 — Configurações

- A fronteira de preferências de privacidade foi movida para um módulo dedicado, preservando normalização, compatibilidade, cache local e contratos Supabase.
- Estados e lifecycle da página continuaram como orquestradores, sem alteração intencional de comportamento.

## Registro da Fase 6 — Configurações

- Os helpers independentes de cópia do backup e rota de login foram isolados.
- O fallback de Clipboard, a URL de retorno e todos os consumidores permaneceram sem alteração intencional de comportamento.

## Registro da Fase 7 — Configurações

- A criação da chave de storage isolada por usuário foi movida para um helper dedicado, sem alteração intencional de comportamento.

## Registro da Fase 8 — Configurações

- A normalização da chave dos itens de resumo foi isolada, preservando identificação, serialização e fallbacks.

## Registro da Fase 11 — Configurações

- O tipo estrutural de usuário bloqueado foi centralizado nos modelos de conta e reutilizado pela página e pelo painel visual.
- Não houve alteração intencional de comportamento, dados ou ações.

## Registro da Fase 12 — Configurações

- Os tipos estruturais de conta e contratos Supabase foram centralizados nos modelos da conta.
- As traduções puras de erros de senha e username foram isoladas, preservando condições, textos e fallbacks.
- Não houve alteração intencional de comportamento, dados ou ações.

## Registro da Fase 13 — Configurações

- As chaves estáticas de storage, evento de atualização e inventário do backup foram isolados sem alterar valores ou consumidores.

## Registro da Fase 14 — Configurações

- A leitura/escrita local isolada por usuário e a composição do resumo local foram extraídas sem alterar chaves, fallbacks ou contagens.

## Registro da Fase 15 — Configurações

- A normalização pura do perfil Supabase foi isolada, preservando limpeza de texto e username.

## Registro da Fase 16 — Configurações

- A leitura e persistência das preferências locais da conta foram isoladas, preservando normalização, evento e fallbacks.

## Registro da Fase 17 — Configurações

- A composição do backup local da conta foi isolada, preservando inventário, serialização e fallbacks.

## Registro da Fase 18 — Configurações

- A visibilidade das seções pela busca foi isolada em helper puro, preservando normalização, aliases e fallback.
- Estados, JSX e operações remotas continuaram na página sem alteração intencional de comportamento.

## Registro da Fase 19 — Configurações

- A leitura remota do resumo da conta foi isolada, preservando consultas, contagens, fallbacks locais e avisos.
- Autenticação, estado, JSX e demais operações da página continuaram sem alteração intencional de comportamento.

## Registro da Fase 20 — Configurações

- A leitura RPC de usuários bloqueados foi isolada, preservando limite, normalização, validação e propagação de erro.
- Estados, ações e apresentação da página continuaram sem alteração intencional de comportamento.

## Registro da Fase 21 — Configurações

- A leitura de perfil no Supabase foi isolada, preservando as duas consultas, validação, normalização e fallback.
- Os estilos estáticos da página, dos modais de segurança/exclusão e dos selects de privacidade foram movidos sem alteração visual intencional.

## Registro da Fase 22 — Configurações

- A persistência do perfil no Supabase foi isolada, preservando busca, atualização, criação e fallbacks.
- A limpeza local posterior à exclusão de conta foi movida para helper dedicado, preservando isolamento por usuário e falhas não bloqueantes.

## Registro da Fase 23 — Configurações

- As mensagens de erro da exclusão de conta foram isoladas, preservando códigos, idiomas e fallback original.
- A preparação do download do backup foi movida para helper dedicado, preservando Blob, URL temporária, nome do arquivo e limpeza adiada.

## Registro da Fase 24 — Configurações

- As transições puras de preferências de conta e privacidade foram isoladas, preservando spreads, regras de alternância e o total da Biblioteca.
- Persistência, autenticação, sincronização remota, estados e apresentação permaneceram na página sem alteração intencional de comportamento.

## Registro da Fase 25 — Configurações

- As validações puras dos formulários de alteração de senha e exclusão de conta foram isoladas, preservando ordem, mensagens e idiomas.
- Autenticação, chamadas remotas, estados, redirecionamento e apresentação permaneceram na página sem alteração intencional de comportamento.

## Registro da Fase 26 — Configurações

- O lifecycle visual do modal de segurança foi isolado em hook, preservando body lock, Escape, limpeza dos campos e cleanup.
- Estados, validação, autenticação, chamadas remotas e apresentação permaneceram na página sem alteração intencional de comportamento.

## Registro da Fase 27 — Configurações

- As ações locais de copiar e baixar o backup foram isoladas, preservando geração, mensagens, fallback e download.
- Estados, autenticação, operações remotas e apresentação permaneceram na página sem alteração intencional de comportamento.

## Registro da Fase 28 — Configurações

- As transições locais de abertura e fechamento dos modais de segurança e exclusão de conta foram isoladas, preservando resets, guardas de carregamento e ordem dos setters.
- Validação, autenticação, operações remotas, lifecycle e apresentação permaneceram na página sem alteração intencional de comportamento.

## Registro da Fase 29 — Configurações

- O lifecycle e as ações do painel de usuários bloqueados foram isolados em hook, preservando carregamento, confirmação, RPC, mensagens, guardas e atualizações de estado.
- A carga inicial, autenticação, RLS, estados e apresentação da página permaneceram sem alteração intencional de comportamento.

## Registro da Fase 30 — Configurações

- As ações de atualização das preferências, alternância de avisos e sincronização de privacidade foram isoladas, preservando ordem dos setters, persistência local, fallbacks e mensagens.
- Autenticação, salvamento integral da conta, lifecycle, RLS, estados e apresentação permaneceram na página sem alteração intencional de comportamento.

## Registro da Fase 31 — Configurações

- A ação de saída da conta foi isolada, preservando limpeza de mensagem, encerramento de sessão, fallback de erro, redirecionamento e atualização da rota.
- Autenticação, RLS, estados, apresentação e regras de negócio permaneceram na página sem alteração intencional de comportamento.

## Registro da Fase 33 — Configurações

- A orquestração de salvamento do perfil, preferências e privacidade foi isolada, preservando validações, autenticação, persistência local, sincronização remota, mensagens, ordem dos setters e fallbacks.
- Estados, lifecycle, apresentação, RLS e regras de negócio permaneceram na página sem alteração intencional de comportamento.

## Registro da Fase 34 — Configurações

- A ação de exclusão de conta foi isolada, preservando validação, endpoint, limpeza local, encerramento de sessão, redirecionamento, atualização de rota, mensagens e fallbacks.
- Estados, lifecycle, apresentação, RLS e regras de negócio permaneceram na página sem alteração intencional de comportamento.

## Registro da Fase 35 — Configurações

- A ação de alteração de senha foi isolada, preservando validação, reautenticação, atualização da credencial, mensagens, resets e fallbacks.
- Estados, lifecycle, apresentação, RLS e regras de negócio permaneceram na página sem alteração intencional de comportamento.

## Registro da Fase 36 — Configurações

- O lifecycle de verificação de acesso administrativo foi isolado, preservando autenticação, fallback pelo token, RPC, assinatura de sessão, cancelamento e cleanup.
- Estados, apresentação, RLS e regras de negócio permaneceram na página sem alteração intencional de comportamento.

## Registro da Fase 37 — Configurações

- O lifecycle inicial de acesso foi isolado, preservando autenticação, perfil, preferências, resumo, usuários bloqueados, cargas paralelas, ordem dos setters, redirecionamento e cancelamento.
- Estados, apresentação, RLS e regras de negócio permaneceram na página sem alteração intencional de comportamento.

## Registro da Fase 38 — Configurações

- A composição das ações de preferências e privacidade foi isolada em hook, preservando argumentos, ordem das chamadas, persistência e mensagens.
- Estados, apresentação, autenticação, RLS e regras de negócio permaneceram na página sem alteração intencional de comportamento.

## Registro da Fase 39 — Configurações

- Os adaptadores das ações de salvar perfil, alterar senha, excluir conta, copiar/baixar backup e sair da conta foram isolados em hook, preservando argumentos, redirecionamentos, atualização de rota, mensagens e ordem das chamadas.
- As ações de domínio, autenticação, persistência, RLS, estados e apresentação permaneceram sem alteração intencional de comportamento.

## Registro da Fase 40 — Configurações

- Os modais de alteração de senha e exclusão de conta foram movidos para componentes de apresentação dedicados, preservando campos, traduções, acessibilidade, feedback, botões, estilos e handlers.
- Estados, lifecycle, validação, autenticação, persistência, RLS e regras de negócio permaneceram na página sem alteração intencional de comportamento.

## Registro da Fase 41 — Configurações

- As seções informativas de uso da conta, dados/backup e suporte foram movidas para componentes de apresentação dedicados, preservando filtros de busca, textos, traduções, contadores, rotas e callbacks.
- Estados, autenticação, persistência, RLS e regras de negócio permaneceram na página sem alteração intencional de comportamento.

## Registro da Fase 42 — Configurações

- As seções visuais de moderação, preferências e ações da conta foram movidas para componentes dedicados, preservando permissão administrativa, filtros, traduções, estilos, controles e callbacks.
- Estados, autenticação, persistência, RLS e regras de negócio permaneceram na página sem alteração intencional de comportamento.

## Registro da Fase 43 — Configurações

- As seções visuais de privacidade do perfil, visibilidade das abas e interações do Diário foram movidas para componentes dedicados, preservando filtros, traduções, selects, controles, usuários bloqueados e callbacks.
- Estados, autenticação, persistência, RLS e regras de negócio permaneceram na página sem alteração intencional de comportamento.

## Registro da Fase 44 — Configurações

- A seção visual “Sua conta” e a composição dos overlays de senha, exclusão e feedback foram movidas para componentes dedicados, preservando filtros, inputs, normalização de username, carregamento, traduções, modais e callbacks.
- Estados, autenticação, persistência, RLS e regras de negócio permaneceram na página sem alteração intencional de comportamento.

## Registro da Fase 45 — Configurações

- A composição visual das seções de Configurações e o estado de carregamento foram movidos para componentes dedicados, preservando a ordem das seções, props, filtros, estilos, traduções e callbacks.
- Estados, hooks, autenticação, persistência, RLS e regras de negócio permaneceram na página sem alteração intencional de comportamento.

## Registro da Fase 46 — Configurações

- Os adaptadores dos campos dos overlays de senha, exclusão e feedback foram isolados, preservando a ordem dos setters e a limpeza de mensagens de erro.
- Estados, hooks, autenticação, persistência, RLS e regras de negócio permaneceram na página sem alteração intencional de comportamento.

## Registro da Fase 47 — Configurações

- Os derivados de apresentação da página — tradução, visibilidade da busca e total da biblioteca — foram agrupados em um hook dedicado, preservando as dependências e os cálculos existentes.
- Estados, ações, autenticação, persistência, RLS e regras de negócio permaneceram na página sem alteração intencional de comportamento.

## Registro da Fase 48 — Configurações

- Os adaptadores de voltar e de limpar o erro de username foram isolados, preservando a navegação e a ordem dos callbacks da seção de conta.
- Estados, hooks, autenticação, persistência, RLS e regras de negócio permaneceram na página sem alteração intencional de comportamento.

## Registro da Fase 49 — Configurações

- Os contratos compartilhados de tradução e de mensagens de ação foram centralizados, preservando literalmente as assinaturas utilizadas por hooks, ações e componentes.
- Runtime, estados, autenticação, persistência, RLS e regras de negócio permaneceram sem alteração intencional de comportamento.

## Registro da Fase 50 — Configurações

- Os modelos compartilhados de mensagens de ação foram centralizados, preservando literalmente tipo, texto e identificador consumidos pelo hook e pelo toast.
- Runtime, temporização, estados, autenticação, persistência, RLS e regras de negócio permaneceram sem alteração intencional de comportamento.

## Registro da Fase 51 — Configurações

- O contexto de apresentação da página — tema, idioma, notificações e derivados de visualização — foi agrupado em um hook dedicado, preservando os mesmos inputs e valores retornados.
- Estados, lifecycles, ações, autenticação, persistência, RLS e regras de negócio permaneceram sem alteração intencional de comportamento.

## Registro da Fase 52 — Configurações

- O estado local não modal da página foi agrupado em um hook dedicado, preservando literalmente defaults, tipos e setters usados pela orquestração.
- Lifecycles, ações, autenticação, persistência, RLS e regras de negócio permaneceram sem alteração intencional de comportamento.

## Registro da Fase 53 — Configurações

- A composição dos controllers de acesso — carga inicial, acesso administrativo e usuários bloqueados — foi agrupada em um hook dedicado, preservando a ordem de chamadas e os mesmos setters.
- Estados, efeitos, autenticação, persistência, RLS e regras de negócio permaneceram sem alteração intencional de comportamento.

## Registro da Fase 54 — Configurações

- Os adaptadores puros dos callbacks de conteúdo e dos campos dos overlays foram compostos em uma única fronteira, preservando os handlers, setters e a ordem de criação existentes.
- Estados, efeitos, autenticação, persistência, RLS e regras de negócio permaneceram sem alteração intencional de comportamento.

## Registro da Fase 55 — Configurações

- Os contratos de tradução e de mensagem visual dos componentes principais de conteúdo e overlays passaram a reutilizar a fronteira tipada compartilhada, sem alterar props ou runtime.
- Estados, efeitos, autenticação, persistência, RLS e regras de negócio permaneceram sem alteração intencional de comportamento.

## Registro da Fase 56 — Configurações

- As seções de detalhes, ações e dados da conta passaram a reutilizar o contrato compartilhado de tradução, sem alterar props ou runtime.
- Estados, efeitos, autenticação, persistência, RLS e regras de negócio permaneceram sem alteração intencional de comportamento.

## Registro da Fase 57 — Configurações

- As três subseções visuais de privacidade passaram a reutilizar o contrato compartilhado de tradução, sem alterar filtros, controles, props ou runtime.
- Estados, efeitos, autenticação, persistência, RLS e regras de negócio permaneceram sem alteração intencional de comportamento.

## Registro da Fase 58 — Configurações

- As seções de moderação, preferências e suporte passaram a reutilizar o contrato compartilhado de tradução, sem alterar filtros, controles, props ou runtime.
- Estados, efeitos, autenticação, persistência, RLS e regras de negócio permaneceram sem alteração intencional de comportamento.

## Registro da Fase 59 — Configurações

- A seção de resumo de uso passou a reutilizar o contrato compartilhado de tradução, eliminando a última duplicação local dessa assinatura sem alterar props ou runtime.
- Estados, efeitos, autenticação, persistência, RLS e regras de negócio permaneceram sem alteração intencional de comportamento.

## Registro da Fase 60 — Configurações

- Os contratos tipados de navegação para redirecionamento, atualização de rota e retorno foram centralizados e reutilizados pelos hooks e ações correspondentes.
- Runtime, estados, efeitos, autenticação, persistência, RLS e regras de negócio permaneceram sem alteração intencional de comportamento.

## Registro da Fase 61 — Configurações

- Os contratos compartilhados de filtro de apresentação e atualização de preferências e privacidade foram centralizados, preservando literalmente as assinaturas usadas pelos componentes.
- Runtime, estados, efeitos, autenticação, persistência, RLS e regras de negócio permaneceram sem alteração intencional de comportamento.

## Registro da Fase 62 — Configurações

- Os contratos tipados dos overlays de Configurações — fechamento, submissão de formulário e atualização dos campos de texto — foram centralizados e reutilizados pelos componentes correspondentes.
- JSX, runtime, estados, efeitos, autenticação, persistência, RLS e regras de negócio permaneceram sem alteração intencional de comportamento.

## Registro da Fase 63 — Configurações

- Os contratos tipados do painel de usuários bloqueados — recarregamento, alternância e desbloqueio — foram centralizados e reutilizados pela composição e pelos componentes de privacidade.
- JSX, runtime, estados, efeitos, autenticação, persistência, RLS e regras de negócio permaneceram sem alteração intencional de comportamento.

## Registro da Fase 64 — Configurações

- Os contratos tipados de alternância do perfil, aprovação de seguidores e aplicação de privacidade foram centralizados e reutilizados pela composição e pelas seções de privacidade.
- JSX, runtime, estados, efeitos, autenticação, persistência, RLS e regras de negócio permaneceram sem alteração intencional de comportamento.

## Registro da Fase 65 — Configurações

- Os contratos tipados dos detalhes da conta — limpeza de erro de username, salvamento e abertura de segurança — foram centralizados e reutilizados pela composição e pela seção correspondente.
- JSX, runtime, estados, efeitos, autenticação, persistência, RLS e regras de negócio permaneceram sem alteração intencional de comportamento.

## Registro da Fase 66 — Configurações

- Os contratos tipados das ações de conta — abertura de exclusão e saída — foram centralizados e reutilizados pela composição e pela seção correspondente.
- JSX, runtime, estados, efeitos, autenticação, persistência, RLS e regras de negócio permaneceram sem alteração intencional de comportamento.

## Registro da Fase 67 — Configurações

- Os contratos tipados de busca e retorno, alternância de avisos e ações de backup foram centralizados e reutilizados pela composição e pelas seções correspondentes.
- JSX, runtime, estados, efeitos, autenticação, persistência, RLS e regras de negócio permaneceram sem alteração intencional de comportamento.

## Registro da Fase 68 — Configurações

- Os contratos tipados de redirecionamento para login e atualização de rota foram centralizados e reutilizados pelas ações de salvar perfil, exclusão e saída da conta.
- JSX, runtime, estados, efeitos, autenticação, persistência, RLS e regras de negócio permaneceram sem alteração intencional de comportamento.

## Registro da Fase 69 — Configurações

- Os contratos tipados de limpeza da mensagem de ação e fechamento do toast foram centralizados e reutilizados pelos hooks, ações e componente de feedback correspondentes.
- JSX, runtime, estados, efeitos, autenticação, persistência, RLS e regras de negócio permaneceram sem alteração intencional de comportamento.

## Registro da Fase 70 — Configurações

- Os contratos de setters textuais e booleanos dos controles de conteúdo e modais foram centralizados e reutilizados nas ações correspondentes.
- JSX, runtime, estados, efeitos, autenticação, persistência, RLS e regras de negócio permaneceram sem alteração intencional de comportamento.

## Registro da Fase 71 — Configurações

- O contrato de alternância foi compartilhado entre os toggles e as ações de preferência, e a primitive de input passou a reutilizar o contrato textual já centralizado.
- JSX, runtime, estados, efeitos, autenticação, persistência, RLS e regras de negócio permaneceram sem alteração intencional de comportamento.

## Registro da Fase 72 — Configurações

- O contrato de ações sem argumentos passou a ser compartilhado pelos aliases e pela primitive de linha, e o contrato textual passou a compor a atualização da busca.
- JSX, runtime, estados, efeitos, autenticação, persistência, RLS e regras de negócio permaneceram sem alteração intencional de comportamento.

## Registro da Fase 73 — Configurações

- Os contratos genéricos de atualização de valor e de ações assíncronas passaram a compor os aliases textuais, booleanos e de usuários bloqueados já existentes.
- JSX, runtime, estados, efeitos, autenticação, persistência, RLS e regras de negócio permaneceram sem alteração intencional de comportamento.

## Registro da Fase 74 — Configurações

- O contrato genérico de atualização por campo passou a compor as preferências de conta e privacidade, enquanto a aplicação integral de privacidade reutiliza o contrato de valor já existente.
- JSX, runtime, estados, efeitos, autenticação, persistência, RLS e regras de negócio permaneceram sem alteração intencional de comportamento.

## Registro da Fase 75 — Configurações

- Os contratos de navegação passaram a reutilizar as ações sem argumentos e a expor uma assinatura dedicada para rotas com `href`, preservando os tipos efetivos de router, retorno, atualização e login.
- JSX, runtime, estados, efeitos, autenticação, persistência, RLS e regras de negócio permaneceram sem alteração intencional de comportamento.

## Registro da Fase 76 — Configurações

- Os contratos de exibição de mensagem e de predicado de busca passaram a compor assinaturas genéricas de argumentos, sem alterar os parâmetros ou retornos efetivos.
- JSX, runtime, estados, efeitos, autenticação, persistência, RLS e regras de negócio permaneceram sem alteração intencional de comportamento.

## Registro da Fase 77 — Configurações

- A limpeza da mensagem de ação passou a reutilizar o contrato genérico de atualização de valor com `null`, preservando exatamente a assinatura efetiva.
- JSX, runtime, estados, efeitos, autenticação, persistência, RLS e regras de negócio permaneceram sem alteração intencional de comportamento.

## Registro da Fase 78 — Configurações

- Os modelos puros da mensagem de ação — tipo, representação visual e mensagem identificada — foram isolados em `configuracoes-action-message-models.ts` e reutilizados pelos consumidores tipados.
- JSX, runtime, estados, efeitos, autenticação, persistência, RLS e regras de negócio permaneceram sem alteração intencional de comportamento.

## Registro da Fase 79 — Configurações

- As primitives genéricas dos contratos de callback — ações, predicados, setters e variantes assíncronas — foram isoladas em `configuracoes-callback-primitives.ts`, preservando os aliases públicos existentes.
- JSX, runtime, estados, efeitos, autenticação, persistência, RLS e regras de negócio permaneceram sem alteração intencional de comportamento.

## Registro da Fase 80 — Configurações

- Os contratos puros de apresentação — tradução, predicado de visibilidade e atualização de busca — foram isolados em `configuracoes-presentation-types.ts`, preservando os aliases públicos existentes.
- JSX, runtime, estados, efeitos, autenticação, persistência, RLS e regras de negócio permaneceram sem alteração intencional de comportamento.

## Registro da Fase 81 — Configurações

- Os contratos puros de feedback, preferências/privacidade e alternâncias foram isolados em módulos próprios, preservando os aliases públicos existentes.
- JSX, runtime, estados, efeitos, autenticação, persistência, RLS e regras de negócio permaneceram sem alteração intencional de comportamento.

## Registro da Fase 82 — Configurações

- Os contratos puros das operações de conta, overlays e usuários bloqueados foram isolados em módulos próprios, preservando os aliases públicos existentes.
- JSX, runtime, estados, efeitos, autenticação, persistência, RLS e regras de negócio permaneceram sem alteração intencional de comportamento.

## Registro da Fase 83 — Configurações

- O contrato puro de retorno passou a pertencer à fronteira de navegação, preservando a reexportação pública e todas as assinaturas dos consumidores.
- JSX, runtime, estados, efeitos, autenticação, persistência, RLS e regras de negócio permaneceram sem alteração intencional de comportamento.

## Registro da Fase 84 — Configurações

- Os contratos puros de props da composição principal e dos overlays foram isolados junto aos seus componentes, preservando os campos, as assinaturas e os consumidores existentes.
- JSX, runtime, estados, efeitos, autenticação, persistência, RLS e regras de negócio permaneceram sem alteração intencional de comportamento.

## Registro da Fase 85 — Configurações

- Os contratos de props do estado de carregamento, cabeçalho e toast foram isolados junto aos respectivos componentes, mantendo campos, assinaturas e consumidores existentes.
- JSX, runtime, estados, efeitos, autenticação, persistência, RLS e regras de negócio permaneceram sem alteração intencional de comportamento.

## Registro da Fase 86 — Configurações

- Os contratos de props da busca, do cartão de perfil e do resumo de uso foram isolados junto aos respectivos componentes, preservando campos, assinaturas e consumidores existentes.
- JSX, runtime, estados, efeitos, autenticação, persistência, RLS e regras de negócio permaneceram sem alteração intencional de comportamento.

## Registro da Fase 1 — Publicar

- Os modelos locais e as opções estáticas de Publicar foram isolados em módulos dedicados, preservando contratos, limites, formatos, gêneros, tags, classificações, MIME types e chaves fixas.
- JSX, runtime, estados, efeitos, autenticação, persistência, Supabase, RLS e regras de negócio permaneceram sem alteração intencional de comportamento.

## Registro da Fase 2 — Publicar

- Os helpers puros de identificadores, validação de arquivos e normalização de obras foram isolados em módulos dedicados, preservando UUIDs, nomes de storage, categorias, MIME types, classificação, slugs e progresso de leitura.
- JSX, runtime, estados, efeitos, autenticação, persistência, Supabase, RLS e regras de negócio permaneceram sem alteração intencional de comportamento.

## Registro da Fase 3 — Publicar

- A normalização local de obras, o storage isolado por usuário e os helpers de login/metadata foram isolados em módulos dedicados, preservando serialização, fallbacks, chaves, backups e retorno de autenticação.
- JSX, runtime, estados, efeitos, autenticação, persistência, Supabase, RLS e regras de negócio permaneceram sem alteração intencional de comportamento.

## Registro da Fase 4 — Publicar

- A leitura, sincronização e persistência local dos backups de arquivos foram isoladas em `publicar-file-backup-storage-utils.ts`, preservando chaves, normalização, isolamento por autor e falhas silenciosas.
- JSX, runtime, estados, efeitos, autenticação, persistência, Supabase, RLS e regras de negócio permaneceram sem alteração intencional de comportamento.

## Registro da Fase 5 — Publicar

- Os rótulos puros de formato, gênero e tag foram isolados em `publicar-option-translations.ts`, preservando traduções, fallbacks e os consumidores existentes.
- JSX, runtime, estados, efeitos, autenticação, persistência, Supabase, RLS e regras de negócio permaneceram sem alteração intencional de comportamento.

## Registro da Fase 6 — Publicar

- As operações de upload, limpeza e rollback de arquivos foram isoladas em `publicar-storage-operations.ts`, preservando buckets, consultas, fallbacks e mensagens.

## Registro da Fase 7 — Publicar

- O registro não bloqueante de publicação no Diário foi isolado em `publicar-diary-activity.ts`, preservando payload, fallback e aviso de erro.

## Registro da Fase 8 — Publicar

- A verificação de slug único no Supabase foi isolada em `publicar-slug-supabase-loader.ts`, preservando consulta, limites e fallback.

## Registro da Fase 9 — Publicar

- O carregamento complementar do nome público de perfil foi isolado em `publicar-profile-loader.ts`, preservando as consultas e fallbacks.

## Registro da Fase 10 — Publicar

- Os estilos locais foram separados em `publicar-layout-styles.ts`, `publicar-form-upload-styles.ts` e `publicar-preview-styles.ts`, preservando valores, spreads, variantes desktop e helpers dinâmicos de capa.
- JSX, runtime, estados, efeitos, autenticação, persistência, Supabase, RLS e regras de negócio permaneceram sem alteração intencional de comportamento.

## Registro da Fase 11 — Publicar

- O cabeçalho, o indicador de progresso e a prévia visual da obra foram isolados em componentes dedicados, preservando responsividade, traduções, fallbacks e a composição existente.
- Estados, lifecycle, autenticação, persistência, Supabase, RLS e regras de publicação permaneceram orquestrados pela página, sem alteração intencional de comportamento.

## Registro da Fase 12 — Publicar

- Os seletores visuais de capa e de conteúdo por arquivo foram isolados em componentes dedicados, preservando formatos aceitos, feedbacks, variantes responsivas, fallbacks e chamadas dos callbacks existentes.
- Estados, leitura de arquivos, lifecycle, autenticação, persistência, Supabase, RLS e regras de publicação permaneceram orquestrados pela página, sem alteração intencional de comportamento.

## Registro da Fase 13 — Publicar

- Os avisos obrigatórios de conteúdo 18+, o campo de sinopse e as ações finais do formulário foram isolados em componentes controlados, preservando textos, traduções, contadores, callbacks e variantes responsivas.
- Estados, validação, autenticação, persistência, Supabase, RLS e regras de publicação permaneceram orquestrados pela página, sem alteração intencional de comportamento.

## Registro da Fase 14 — Publicar

- Os campos visuais controlados de metadados foram divididos em `PublicarBasicFields`, `PublicarFormatGenreFields` e `PublicarTagClassificationFields`, preservando opções, traduções, classificação 18+, responsividade e acessibilidade.
- Estados, validação, callbacks, autenticação, persistência, Supabase, RLS e regras de publicação permaneceram orquestrados pela página, sem alteração intencional de comportamento.

## Registro da Fase 15 — Publicar

- O lifecycle inicial de acesso à publicação foi isolado em `use-publicar-initial-access.ts`, preservando autenticação, aceite de termos, perfil, cancelamento, redirecionamentos e a atualização postergada do autor.
- Estados, envio, persistência, Supabase, RLS e regras de publicação permaneceram orquestrados pela página, sem alteração intencional de comportamento.

## Registro da Fase 16 — Publicar

- Os shells visuais de carregamento e da página foram isolados em `PublicarPageShell.tsx`, preservando tema, CSS, cabeçalho, decoração, fades e responsividade.
- Formulário, estado, autenticação, persistência, Supabase, RLS e regras de publicação permaneceram orquestrados pela página, sem alteração intencional de comportamento.

## Registro da Fase 17 — Publicar

- O backdrop visual e o aviso de erro do formulário foram isolados em componentes dedicados, preservando CSS, decoração, fades, responsividade, textos e acessibilidade.
- Estados, traduções, validação, autenticação, persistência, Supabase, RLS e regras de publicação permaneceram na página, sem alteração intencional de comportamento.

## Registro da Fase 18 — Publicar

- O estado, a validação, a leitura e a limpeza do upload de capa foram isolados em `use-publicar-cover-upload.ts`, preservando limites, mensagens, `FileReader` e a ref do input.
- Upload de conteúdo, validação do formulário, autenticação, persistência, Supabase, RLS e publicação permaneceram na página, sem alteração intencional de comportamento.

## Registro da Fase 19 — Publicar

- Os estados e callbacks das opções de publicação e do conteúdo por arquivo foram isolados em hooks dedicados, preservando limites, mensagens, `FileReader`, refs, limpeza e validação de classificação 18+.
- JSX, validação do formulário, autenticação, persistência, Supabase, RLS e publicação permaneceram na página, sem alteração intencional de comportamento.

## Registro da Fase 20 — Publicar

- Os campos básicos controlados e as tags foram isolados em `use-publicar-basic-fields.ts` e `use-publicar-tags.ts`, preservando estados, normalização, limites, deduplicação, callbacks e limpeza de erro.
- Validação do formulário, JSX, autenticação, persistência, Supabase, RLS e publicação permaneceram na página, sem alteração intencional de comportamento.

## Registro da Fase 21 — Publicar

- O estado derivado e a validação do formulário foram isolados em `use-publicar-form-validation.ts`, preservando normalização, classificação 18+, avisos, progresso, prévia e a ordem das mensagens de validação.
- JSX, efeitos, autenticação, persistência, Supabase, RLS e publicação permaneceram na página, sem alteração intencional de comportamento.

## Registro da Fase 22 — Publicar

- Os textos de interface, a tradução de classificação e as mensagens de erro foram isolados em `publicar-translations.ts`, preservando todos os textos, fallbacks, prefixos, sufixos e a recursão de publicação parcial.
- JSX, estado, efeitos, autenticação, persistência, Supabase, RLS e publicação permaneceram na página, sem alteração intencional de comportamento.

## Registro da Fase 23 — Publicar

- Os metadados visuais derivados do formulário foram isolados em `publicar-form-display-metadata.ts`, preservando contadores, tempo de leitura, tamanhos de arquivo, rótulos de categoria e fallbacks.
- Estado, JSX, autenticação, persistência, Supabase, RLS e publicação permaneceram na página, sem alteração intencional de comportamento.

## Registro da Fase 24 — Publicar

- A ação de submissão foi isolada em `publicar-submission-action.ts`, preservando validação, upload, publicação, rollback, Diário, persistência local e navegação.
- Estados, JSX, autenticação, persistência, Supabase, RLS e regras de publicação permaneceram sem alteração intencional de comportamento.

## Registro da Fase 25 — Publicar

- O adapter de submissão e sua guarda contra envio duplicado foram isolados em `use-publicar-submission.ts`, preservando os parâmetros e a ordem da ação de publicação.
- Estados, JSX, autenticação, persistência, Supabase, RLS e regras de publicação permaneceram sem alteração intencional de comportamento.

## Registro da Fase 26 — Publicar

- A composição visual do formulário foi isolada em `PublicarPublicationForm.tsx`, preservando a ordem dos campos, upload, avisos 18+, feedbacks e ações.
- Estados, callbacks, validação, autenticação, persistência, Supabase, RLS e regras de publicação permaneceram orquestrados pela página, sem alteração intencional de comportamento.

## Registro da Fase 27 — Publicar

- O estado transversal e a apresentação de tema/i18n da página foram isolados em hooks dedicados, preservando os defaults, as traduções e as funções de classificação e mensagem.
- O lifecycle de acesso, a validação, a submissão, o armazenamento, Supabase, RLS e as regras de publicação permaneceram sem alteração intencional de comportamento.

## Registro da Fase 28 — Publicar

- A composição dos estados do formulário, upload, validação, metadados e adapter de submissão foi concentrada em `usePublicarFormController`, mantendo a página como orquestradora visual.
- O lifecycle de acesso, consultas e mutações Supabase, Storage, RLS, validações, mensagens e contratos de submissão foram preservados sem alteração intencional de comportamento.

## Registro da Fase 1 — Comunidade

- O controle responsivo de desktop e o lifecycle de lock de `body`/overscroll dos overlays foram isolados em hooks dedicados.
- Os gatilhos de menu, comentários e composer, incluindo o cleanup e o foco postergado do composer, foram preservados sem alteração intencional de comportamento.

## Registro da Fase 2 — Comunidade

- O lifecycle de busca de usuários e o carregamento dos usuários seguidos foram isolados em `use-comunidade-user-search-sync.ts`.
- A normalização, debounce, cancelamento, combinação de resultados locais/Supabase e os estados de carregamento e limpeza foram preservados sem alteração intencional de comportamento.

## Registro da Fase 3 — Comunidade

- O lifecycle inicial de parâmetros por URL e de abertura automática de comentários foi isolado em `use-comunidade-initial-url-navigation.ts`.
- A leitura e aplicação dos parâmetros, timers, refs e cleanups foram preservados sem alteração intencional de comportamento; o efeito de scroll e disparo inicial do feed permaneceu na página por depender do `useEffectEvent` do carregador.

## Registro da Fase 4 — Comunidade

- Os lifecycles de posts salvos e de votos de enquete foram isolados em `use-comunidade-personal-data-sync.ts`.
- As leituras locais, sincronizações Supabase, timers, cancelamentos, persistência e a reconciliação dos votos/resultados foram preservados sem alteração intencional de comportamento; as ações de salvar e votar permaneceram na página.

## Registro da Fase 5 — Comunidade

- O carregamento cancelável de sugestões de obras relacionadas e a sincronização sequencial das reviews pendentes com o Diário foram isolados em `use-comunidade-related-work-diary-sync.ts`.
- A detecção, os refs por usuário, os resets, os cancelamentos, os payloads e as ações de publicação, visibilidade e remoção foram preservados sem alteração intencional de comportamento.

## Registro da Fase 6 — Comunidade

- O lifecycle de autenticação e troca de conta foi isolado em `use-comunidade-auth-account-lifecycle.ts`.
- O carregamento e a confirmação de identidade, os guards de versão, a assinatura, os timers, os resets de conta, a limpeza do composer e o recarregamento do feed foram preservados sem alteração intencional de comportamento.

## Registro da Fase 7 — Comunidade

- A orquestração de carregamento e paginação do feed foi isolada em `use-comunidade-feed-lifecycle.ts`.
- O carregamento inicial, scroll, filtro de obra por URL, timer, cleanup, paginação e os estados de feed foram preservados sem alteração intencional de comportamento.

## Registro da Fase 8 — Comunidade

- O estado e o lifecycle do composer foram isolados em `use-comunidade-composer-state.ts`.
- Defaults, refs, limpeza postergada ao fechar e os consumidores da composição foram preservados sem alteração intencional de comportamento.

## Registro da Fase 9 — Comunidade

- A ação de publicação do composer foi isolada em `community-composer-publication-action.ts`.
- Os guards de sessão, validações, INSERT/leitura separada, fallback do feed, sincronização com o Diário, limpeza e finalização do lock foram preservados sem alteração intencional de comportamento.

## Registro da Fase 10 — Comunidade

- As ações de engajamento dos posts foram isoladas em `community-post-engagement-actions.ts`.
- Locks, guards de login, sincronização Supabase, persistência local, notificações, feedbacks e estados de curtir, salvar, compartilhar, votar e spoiler foram preservados sem alteração intencional de comportamento.

## Registro da Fase 11 — Comunidade

- A ação de envio de comentários foi isolada em `community-comment-publication-action.ts`.
- Lock, guards, validação, INSERT, notificação de comentário raiz, estado local, feedback, retornos e cleanup foram preservados sem alteração intencional de comportamento.

## Registro da Fase 12 — Comunidade

- A ação de curtir/descurtir comentário foi isolada em `community-comment-like-action.ts`.
- Lock, guards, sincronização Supabase, notificação de curtida, estado local, feedback, recarregamento do feed e cleanup foram preservados sem alteração intencional de comportamento.

## Registro da Fase 13 — Comunidade

- A ação de remoção de comentário foi isolada em `community-comment-removal-action.ts`.
- Lock, confirmação de identidade, consulta/autoria, confirmação traduzida, remoção de respostas descendentes, Supabase, fallback de permissão, estado local, feedback e cleanup foram preservados sem alteração intencional de comportamento.

## Registro da Fase 14 — Comunidade

- A ação de seguir/deixar de seguir usuários da busca foi isolada em `community-search-follow-action.ts`.
- Guards, lock, atualização otimista, persistência, rollback, estados seguindo/solicitado, feedbacks e cleanup foram preservados sem alteração intencional de comportamento.

## Registro da Fase 15 — Comunidade

- A ação de atualização de visibilidade de posts foi isolada em `community-post-visibility-action.ts`.
- Lock, guards de autoria, proteção/sincronização da Review com o Diário, atualização Supabase, estado local, fechamento do menu, feedback e cleanup foram preservados sem alteração intencional de comportamento.

## Registro da Fase 16 — Comunidade

- A ação de fixar/desafixar posts foi isolada em `community-post-pinning-action.ts`.
- Guard de administração, prevenção de duplicidade, atualização Supabase, estado local, feedback e cleanup foram preservados sem alteração intencional de comportamento.

## Registro da Fase 17 — Comunidade

- A preparação da denúncia foi isolada em `community-report-preparation-action.ts`.
- Guards, normalização, título, fechamento do menu e abertura do alvo do modal foram preservados sem alteração intencional de comportamento.

## Registro da Fase 18 — Comunidade

- A composição visual superior do feed foi isolada em `community-feed-top-composition.tsx`.
- O cabeçalho desktop, os controles do feed e a sheet de ações recebem estados e callbacks explicitamente da página, que permanece orquestradora sem alteração intencional de comportamento.

## Registro da Fase 19 — Comunidade

- A composição visual central do feed foi isolada em `community-feed-center-composition.tsx`.
- Busca de usuários, cabeçalho/contagem de publicações e seção do feed recebem dados e callbacks explicitamente da página; estados, regras, renderização de cada post e ações permanecem em `page.tsx`, sem alteração intencional de comportamento.

## Registro da Fase 20 — Comunidade

- O portal visual do composer foi isolado em `community-post-composer-portal.tsx`.
- A condição de abertura, o portal para `document.body` e a apresentação recebem props explícitas; estados, regras e callbacks continuam na página sem alteração intencional de comportamento.

## Registro da Fase 21 — Comunidade

- A composição visual dos overlays de interação foi isolada em `community-interaction-overlays-composition.tsx`.
- Comentários, denúncia e feedback recebem props e callbacks preparados pela página, que mantém estados, ações e decisões de negócio sem alteração intencional de comportamento.

## Registro da Fase 22 — Comunidade

- O shell estrutural visual foi isolado em `community-page-shell-composition.tsx`.
- A página prepara os slots de cabeçalho, erro, controles, feed, composer e overlays; estados, callbacks e regras de negócio permanecem explicitamente na orquestração principal.

## Registro da Fase 9 — Editar Obra

- Os helpers puros de normalização de nome e resolução de caminhos de Storage foram isolados em `editar-obra-storage-path-utils.ts`, preservando buckets, Data URLs, prefixes reconhecidos, decodificação e fallbacks.
- Upload, remoção de arquivos, Supabase, estado e salvamento permaneceram em `app/editar-obra/page.tsx`, sem alteração intencional de comportamento.

## Registro da Fase 10 — Editar Obra

- A conversão pura de arquivos vindos do Supabase foi isolada em `editar-obra-supabase-file-converter.ts`, preservando categorias, precedência entre dados remotos e locais, tamanhos, tipos, datas e fallbacks.
- Consultas Supabase, Storage, estado, salvamento e JSX permaneceram em `app/editar-obra/page.tsx`, sem alteração intencional de comportamento.

## Registro da Fase 11 — Editar Obra

- A geração pura das chaves de backup de arquivos foi isolada em `editar-obra-file-backup-key-utils.ts`, preservando prefixos, ordem, fallback de slug, normalização de título, filtragem e deduplicação.
- Leitura, escrita, sincronização e restauração do backup permaneceram em `app/editar-obra/page.tsx`, sem alteração intencional de comportamento.

## Registro da Fase 12 — Editar Obra

- A persistência local do backup de arquivos foi isolada em `editar-obra-file-backup-storage.ts`, preservando a chave, normalização, aliases, sincronização, restauração e fallbacks por usuário.
- Carregamento das obras, salvamento principal, Storage, Supabase e JSX permaneceram em `app/editar-obra/page.tsx`, sem alteração intencional de comportamento.

## Registro da Fase 13 — Editar Obra

- A normalização pura de capítulos foi isolada em `editar-obra-chapter-normalizer.ts`, preservando IDs, títulos, textos, flags, datas, publicação e fallbacks.
- A normalização da obra, carregamento, Storage, Supabase, salvamento e JSX permaneceram em `app/editar-obra/page.tsx`, sem alteração intencional de comportamento.

## Registro da Fase 14 — Editar Obra

- A normalização pura de obras foi isolada em `editar-obra-work-normalizer.ts`, preservando capítulos, metadados, arquivos, métricas, slug, link e fallbacks.
- Carregamento, persistência, Storage, Supabase, salvamento e JSX permaneceram em `app/editar-obra/page.tsx`, sem alteração intencional de comportamento.

## Registro da Fase 15 — Editar Obra

- A normalização pura da obra vinda do Supabase foi isolada em `editar-obra-supabase-work-normalizer.ts`, preservando precedências, reconciliação de capítulos remotos, avisos, arquivos, métricas, slug, link e fallbacks.
- Consultas Supabase, carregamento da obra, persistência, Storage, salvamento e JSX permaneceram em `app/editar-obra/page.tsx`, sem alteração intencional de comportamento.

## Registro da Fase 16 — Editar Obra

- A preparação persistível da obra foi isolada em `editar-obra-storage-preparation.ts`, preservando o descarte de capas e arquivos Data URL e todos os demais campos da obra.
- Persistência local, carregamento, Storage, Supabase, salvamento e JSX permaneceram em `app/editar-obra/page.tsx`, sem alteração intencional de comportamento.

## Registro da Fase 17 — Editar Obra

- A persistência local das obras foi isolada em `editar-obra-local-work-storage.ts`, preservando normalização, ownership, restauração e sincronização de backup, regravação sanitizada e fallbacks por usuário.
- Carregamento remoto, Storage, Supabase, estado, salvamento e JSX permaneceram em `app/editar-obra/page.tsx`, sem alteração intencional de comportamento.

## Registro da Fase 18 — Editar Obra

- As operações de upload e limpeza do Supabase Storage foram isoladas em `editar-obra-remote-storage.ts`, preservando MIME, cache, caminhos, referências, deduplicação, rollback e falhas individuais.
- Autenticação, obtenção de caminhos antigos, fluxo de salvamento, consultas Supabase, estado e JSX permaneceram em `app/editar-obra/page.tsx`, sem alteração intencional de comportamento.

## Registro da Fase 19 — Editar Obra

- O registro de edição de obra no Diário foi isolado em `editar-obra-diary-action.ts`, preservando payload completo, fallback simplificado, visibilidade, href e tolerância a falhas.
- Salvamento principal, autenticação, consultas Supabase, estado e JSX permaneceram em `app/editar-obra/page.tsx`, sem alteração intencional de comportamento.

## Registro da Fase 20 — Editar Obra

- A validação e o cálculo puro de progresso do formulário foram isolados em `editar-obra-form-validation.ts`, preservando ordem das mensagens, critérios, arredondamento e a diferença entre autor do perfil e campo de autor.
- Salvamento, estado, valores derivados, autenticação, Supabase, Storage e JSX permaneceram em `app/editar-obra/page.tsx`, sem alteração intencional de comportamento.

## Registro da Fase 21 — Editar Obra

- Os helpers de estilo das capas miniatura e de prévia foram isolados em `editar-obra-cover-style-utils.ts`, mantendo os estilos-base locais e explicitamente passados pela página.
- Formulário, estilos-base, estado, autenticação, Supabase, Storage e JSX permaneceram em `app/editar-obra/page.tsx`, sem alteração intencional de comportamento.

## Registro da Fase 22 — Editar Obra

- O cálculo puro dos próximos valores de tags foi isolado em `editar-obra-tag-utils.ts`, preservando limpeza, validação, limite, seleção de tag normal e fluxo de tag personalizada.
- Setters, ordem de efeitos, autenticação, Supabase, Storage e JSX permaneceram em `app/editar-obra/page.tsx`, sem alteração intencional de comportamento.

## Registro da Fase 23 — Editar Obra

- As rotas de login e os hrefs derivados da obra foram isolados em `editar-obra-navigation-utils.ts`, preservando codificação, prioridade e fallbacks de navegação.
- Carregamento, estado, autenticação, Supabase, Storage e JSX permaneceram em `app/editar-obra/page.tsx`, sem alteração intencional de comportamento.

## Registro da Fase 24 — Editar Obra

- A preparação pura dos valores aplicados ao formulário foi isolada em `editar-obra-form-preparation.ts`, preservando perfil do autor, valores editáveis, tags, classificação e avisos de conteúdo.
- A aplicação ordenada dos setters, carregamento, autenticação, Supabase, Storage e JSX permaneceram em `app/editar-obra/page.tsx`, sem alteração intencional de comportamento.

## Registro da Fase 25 — Editar Obra

- Os valores derivados do formulário foram isolados em `editar-obra-derived-form-values.ts`, preservando opções personalizadas, normalização e validação de tags.
- A orquestração do formulário, progresso, setters, carregamento, autenticação, Supabase, Storage e JSX permaneceram em `app/editar-obra/page.tsx`, sem alteração intencional de comportamento.

## Registro da Fase 26 — Editar Obra

- O preparo e o fallback puro da lista de tags foram isolados em `editar-obra-tags-list-utils.ts`, preservando ordem, limite e `"sem tags"`.
- O useMemo, salvamento, estados, autenticação, Supabase, Storage e JSX permaneceram em `app/editar-obra/page.tsx`, sem alteração intencional de comportamento.

## Registro da Fase 27 — Editar Obra

- A preparação pura dos valores iniciais de salvamento foi isolada em `editar-obra-save-preparation.ts`, preservando classificação, avisos, capa e fallback de tags.
- A orquestração temporal, autenticação, Supabase, Storage, setters, Diário, redirecionamento e JSX permaneceram em `app/editar-obra/page.tsx`, sem alteração intencional de comportamento.

## Registro da Fase 28 — Editar Obra

- A preparação pura dos assets atuais foi isolada em `editar-obra-current-assets-preparation.ts`, preservando prioridades de capa, arquivo, backup e caminhos de Storage.
- Autorização, uploads, remoções, Supabase, Storage, setters, persistência, Diário e JSX permaneceram em `app/editar-obra/page.tsx`, sem alteração intencional de comportamento.

## Registro da Fase 29 — Editar Obra

- A construção pura do payload de atualização de obras foi isolada em `editar-obra-update-payload.ts`, preservando colunas, fallbacks de arquivo e `atualizado_em`.
- A chamada Supabase, autorização, uploads, remoções, rollback, persistência, Diário, setters, redirecionamento e JSX permaneceram em `app/editar-obra/page.tsx`, sem alteração intencional de comportamento.

## Registro da Fase 30 — Editar Obra

- A reconstrução pura da lista local após a edição foi isolada em `editar-obra-local-update.ts`, preservando ordem, dupla normalização e os valores atualizados da obra alvo.
- Remoção de Storage, persistência local, backup, Diário, setters, tratamento de erro, Supabase e JSX permaneceram em `app/editar-obra/page.tsx`, sem alteração intencional de comportamento.

## Registro da Fase 31 — Editar Obra

- A construção pura do alvo de remoção do backup de arquivo foi isolada em `editar-obra-backup-target.ts`, preservando prioridades de slug, link e os fallbacks de URL.
- A condição de remoção manual, a gravação/sincronização do backup, persistência local, Diário, setters, tratamento de erro, Supabase e JSX permaneceram em `app/editar-obra/page.tsx`, sem alteração intencional de comportamento.

## Registro da Fase 32 — Editar Obra

- O bridge específico de tradução foi movido para `components/EditarObraLanguageBridge.tsx`, preservando textos, padrões dinâmicos, atributos, observação do DOM e restauração no cleanup.
- A página manteve somente a montagem de `EditarObraLanguageBridge`; formulário, estados, salvamento, autenticação, Supabase, Storage, estilos e JSX restante permaneceram sem alteração intencional de comportamento.

## Registro da Fase 33 — Editar Obra

- A preparação pura da obra remota com o nome de profile e da lista final carregada foi isolada em `editar-obra-loaded-work-merge.ts`, preservando ordem, ownership e a obra remota com seus capítulos como fonte de verdade.
- Consultas e paginação Supabase, persistência local, backup, setters, controle de cancelamento e aplicação do formulário permaneceram em `app/editar-obra/page.tsx`, sem alteração intencional de comportamento.

## Registro da Fase 34 — Editar Obra

- O carregamento paginado remoto dos capítulos foi isolado em `editar-obra-chapters-loader.ts`, preservando consulta, filtros, ordenação, fallback vazio e warning em falhas.
- Autenticação, profile, ownership, consulta da obra, normalização, reconciliação, persistência, backup, setters e controle de cancelamento permaneceram em `app/editar-obra/page.tsx`, mantendo os capítulos remotos como fonte de verdade.

## Registro da Fase 35 — Editar Obra

- A consulta remota da obra principal foi isolada em `editar-obra-work-loader.ts`, preservando seleção, filtros de ownership, warning e fallback nulo.
- Autenticação, profile, ownership local, capítulos, normalização, reconciliação, persistência, backup, setters e controle de cancelamento permaneceram em `app/editar-obra/page.tsx`, sem alteração intencional de comportamento.

## Registro da Fase 36 — Editar Obra

- A seleção pura das obras locais autorizadas e da obra alvo foi isolada em `editar-obra-local-selection.ts`, preservando ownership, ordem e fallbacks.
- A página continua orquestrando carregamento local/remoto, capítulos, normalização, persistência, backup, setters e cancelamento.

## Registro da Fase 37 — Editar Obra

- A leitura pura de `obraId` dos search params foi isolada em `editar-obra-search-params.ts`, preservando `URLSearchParams`, fallback vazio e valores sem trim adicional.
- A página manteve a leitura de `window.location.search`, o timer, o controle de cancelamento e toda a orquestração do carregamento.

## Registro da Fase 38 — Editar Obra

- O lifecycle responsivo de `matchMedia` foi isolado em `useEditarObraDesktopMode`, preservando breakpoint, timer inicial, listeners modernos/legados e cleanup.
- A página manteve todos os consumidores visuais de `isDesktop`, além de estados, refs e a orquestração do carregamento e salvamento.

## Registro da Fase 39 — Editar Obra

- A configuração estática do formulário foi isolada em `editar-obra-form-config.ts`, preservando limites de upload, valores personalizados e a ordem das opções de formato, gênero e tags.
- A página continuou consumindo as mesmas constantes na validação, preparação, valores derivados e JSX, sem alterar estado, fluxo ou visual.

## Registro da Fase 40 — Editar Obra

- O template CSS estático foi isolado em `styles/editar-obra-page-css.ts`, preservando variáveis, seletores, valores, ordem e whitespace do conteúdo original.
- A página manteve os mesmos três consumidores de `<style>{`${historietasThemeCss}${editarObraPageCss}`}</style>` e todos os objetos de estilo React locais.

## Registro da Fase 41 — Editar Obra

- A prévia visual da obra foi isolada em `components/EditarObraPreview.tsx`, preservando JSX, fallbacks, indicadores, progresso e responsividade.
- `safeTextStyle` foi centralizado em `styles/editar-obra-shared-styles.ts` e passou a ser compartilhado pela página e pela prévia, sem duplicar o objeto.

## Registro da Fase 42 — Editar Obra

- O rodapé visual de ações e progresso foi isolado em `components/EditarObraFormActions.tsx`, preservando submit, estados, links, SVG, barra e responsividade.
- A página manteve o `<form>`, `onSubmit`, os valores derivados e toda a orquestração; os estilos exclusivos do rodapé passaram ao componente usando o mesmo `safeTextStyle` compartilhado.

## Registro da Fase 43 — Editar Obra

- Os blocos visuais de upload da capa e do arquivo completo foram isolados em `components/EditarObraAssetUploads.tsx`, preservando inputs, accepts, refs, callbacks, textos, erros e responsividade.
- A página manteve os handlers, refs, estados, validações e toda a orquestração; `fieldGroupStyle`, `labelStyle` e `hintStyle` passaram a ser compartilhados com o componente ao lado de `safeTextStyle`.

## Registro da Fase 44 — Editar Obra

- O bloco visual de Formato e Gênero foi isolado em `components/EditarObraFormatGenreFields.tsx`, preservando selects, valores especiais, campos personalizados, opções e responsividade.
- A página manteve os quatro callbacks, sanitização, limpeza dos valores personalizados e marcação de alteração; `inputStyle` passou a ser compartilhado sem duplicação.

## Registro da Fase 45 — Editar Obra

- A apresentação de classificação indicativa e avisos obrigatórios de conteúdo 18+ foi isolada em `components/EditarObraContentRatingField.tsx`, preservando opções, traduções, checkboxes, estilos e responsividade.
- A página manteve integralmente a limpeza dos avisos ao sair de 18+ e o toggle imutável de cada aviso, incluindo a marcação de alteração.

## Registro da Fase 46 — Editar Obra

- A apresentação do campo de Tag foi isolada em `components/EditarObraTagField.tsx`, preservando opções, valor especial, campo personalizado e estilos compartilhados.
- A página manteve integralmente os handlers, helpers, setters, sanitização, limites e marcação de alteração da seleção de tags.

## Registro da Fase 47 — Editar Obra

- A apresentação dos campos de identificação Título da obra e Autor foi isolada em `components/EditarObraIdentityFields.tsx`, preservando ids, labels, placeholders, hints e estilos compartilhados.
- A página manteve os setters de título e autor e a marcação de alteração nos callbacks que controla.

## Registro da Fase 48 — Editar Obra

- A apresentação do campo de Sinopse foi isolada em `components/EditarObraSynopsisField.tsx`, preservando responsividade, textarea, estilos e `safeTextStyle` compartilhado.
- A página manteve a atualização de estado e a marcação de alteração no callback que controla.

## Registro da Fase 49 — Editar Obra

- Os estilos estáticos de layout e shell foram isolados em `styles/editar-obra-layout-styles.ts`, preservando nomes, derivações, responsividade e `safeTextStyle` compartilhado.
- A página manteve integralmente o JSX, os estados de renderização e a orquestração da edição.

## Registro da Fase 1 — Editar Capítulo

- A bridge de tradução foi isolada em `components/EditarCapituloLanguageBridge.tsx`, preservando textos, padrões dinâmicos, `MutationObserver`, restauração condicional e a dependência de idioma.
- A página manteve todas as ocorrências de `<EditarCapituloLanguageBridge />` e a orquestração dos seus estados de renderização.

## Registro da Fase 2 — Editar Capítulo

- Os utilitários de `localStorage` por usuário foram isolados em `lib/editar-capitulo-storage-utils.ts`, preservando chaves, leitura segura, serialização e falhas silenciosas.
- A página manteve as constantes de storage e os consumidores de backup, obras locais e persistência por conta.

## Registro da Fase 3 — Editar Capítulo

- Os helpers puros de texto foram isolados em `lib/editar-capitulo-text-utils.ts`, preservando contagens Unicode, palavras e a normalização do título importado de `.txt`/`.md`.
- A página manteve os consumidores de estatísticas, importação e validação do capítulo.

## Registro da Fase 4 — Editar Capítulo

- Os helpers puros de métricas e números foram isolados em `lib/editar-capitulo-metrics-utils.ts`, preservando parsing, estatísticas do capítulo e progresso de leitura.
- A página manteve os consumidores de normalização, importação e atualização de obras.

## Registro da Fase 5 — Editar Capítulo

- Os helpers puros de rota foram isolados em `lib/editar-capitulo-route-utils.ts`, preservando redirects de login, encoding e a decisão entre leitura pública e fallback local.
- A página manteve os consumidores de autenticação, diário, notificações e href derivado de leitura.

## Registro da Fase 6 — Editar Capítulo

- O normalizador puro de arquivo foi isolado em `lib/editar-capitulo-file-normalization.ts`, preservando validação estrutural, categorias, campos originais e fallbacks.
- A página manteve os consumidores de backup e normalização local de obras.

## Registro da Fase 7 — Editar Capítulo

- O backup local do arquivo completo foi isolado em `lib/editar-capitulo-file-backup-utils.ts`, preservando chaves, normalização, persistência por usuário e restauração ordenada.
- A página manteve os consumidores de carregamento, sincronização e restauração do backup.

## Registro da Fase 8 — Editar Capítulo

- O normalizador puro de capítulo foi isolado em `lib/editar-capitulo-chapter-normalizer.ts`, preservando campos originais, coerções, fallbacks e a validação de ordem.
- A página manteve `normalizarObra` e o mesmo `map` de capítulos como orquestrador da normalização de obras.

## Registro da Fase 9 — Editar Capítulo

- O normalizador local completo de obra foi isolado em `lib/editar-capitulo-work-normalizer.ts`, preservando fallbacks, aliases legados de métricas, progresso, slug, link e ordem dos capítulos.
- A página manteve todos os consumidores da normalização e os normalizadores Supabase fora desta fronteira.

## Registro da Fase 10 — Editar Capítulo

- Os normalizadores puros de tags e categoria de arquivo vindas do Supabase foram isolados em `lib/editar-capitulo-supabase-normalization.ts`, preservando filtros, ordem, duplicados e fallbacks.
- A página manteve `mapearObraSupabase` e suas mesmas expressões de precedência entre dados remotos e locais.

## Registro da Fase 11 — Editar Capítulo

- Os mapeadores puros de capítulo e obra vindos do Supabase foram isolados em `lib/editar-capitulo-supabase-mappers.ts`, preservando a fonte de verdade remota dos capítulos, métricas e fallbacks locais.
- A página manteve queries, paginação, carregamento e o fluxo de aplicação da obra mapeada.

## Registro da Fase 12 — Editar Capítulo

- Os helpers puros de leitura e aplicação do nome de profile foram isolados em `lib/editar-capitulo-profile-utils.ts`, preservando ownership, referências e fallbacks.
- A página manteve o loader sensível, a ordem das queries Supabase e todos os consumidores da aplicação do profile.

## Registro da Fase 13 — Editar Capítulo

- O storage local normalizado de obras por usuário foi isolado em `lib/editar-capitulo-local-work-storage.ts`, preservando ownership, restauração de backup, normalização e persistência ordenada.
- A página manteve os consumidores de carregamento, salvamento e exclusão, assim como o restante da orquestração do editor.

## Registro da Fase 14 — Editar Capítulo

- A ação de registro da edição do capítulo no Diário foi isolada em `actions/registrar-diario-edicao-capitulo.ts`, preservando validação de IDs, payload completo, fallback simplificado e falhas silenciosas.
- A página manteve a orquestração do salvamento e a atualização de notificação na mesma ordem.

## Registro da Fase 15 — Editar Capítulo

- A ação de atualização das notificações após a edição do capítulo foi isolada em `actions/atualizar-notificacao-capitulo.ts`, preservando validação, RPC, parâmetros e falhas silenciosas.
- A página manteve a orquestração sequencial do Diário antes da tentativa de notificação.

## Registro da Fase 16 — Editar Capítulo

- O loader do nome de profile foi isolado em `actions/carregar-nome-profile-editar-capitulo.ts`, preservando as consultas ordenadas por `user_id` e `id`, o parser compartilhado e falhas silenciosas.
- A página manteve os dois consumidores nos mesmos fluxos de carregamento e salvamento.

## Registro da Fase 17 — Editar Capítulo

- O lifecycle responsivo de desktop foi isolado em `hooks/useEditarCapituloDesktopMode.ts`, preservando o estado inicial, breakpoint, atualização postergada, APIs moderna e legada e respectivos cleanups.
- A página manteve todos os consumidores visuais de `isDesktop` e a orquestração dos demais efeitos.

## Registro da Fase 18 — Editar Capítulo

- A mensagem pura de confirmação de exclusão foi isolada em `lib/editar-capitulo-delete-message.ts`, preservando os textos por idioma, o título trimado e seu fallback.
- A página manteve `window.confirm`, a ordem e o restante do fluxo de exclusão do capítulo.

## Registro da Fase 19 — Editar Capítulo

- A validação pura de capítulo foi isolada em `lib/editar-capitulo-validation.ts`, preservando título automático, mínimos, mensagens e prioridade das validações.
- A página manteve a orquestração do salvamento e o tratamento de `erroValidacao` no mesmo ponto.

## Registro da Fase 20 — Editar Capítulo

- Os 66 estilos estáticos tipados foram isolados em `lib/editar-capitulo-styles.ts`, preservando valores, ordem e heranças por spread.
- A página manteve os mesmos consumidores visuais, incluindo `pageStyle` em `useHistorietasTheme`.

## Registro da Fase 21 — Editar Capítulo

- O CSS estático de Editar Capítulo foi isolado em `lib/editar-capitulo-page-css.ts`, preservando integralmente a template string e seus três consumidores de tema.

## Registro da Fase 22 — Editar Capítulo

- A leitura e preparação determinística de arquivos `.txt` e `.md` foram isoladas em `lib/editar-capitulo-text-import.ts`, mantendo o handler e a ordem dos setters na página.

## Registro da Fase 23 — Editar Capítulo

- A mutação local determinística do salvamento de capítulo foi isolada em `lib/editar-capitulo-local-save-mutation.ts`, preservando normalização, ordem das obras, atualização pontual do capítulo, autor e progresso.
- A página manteve backup, persistência local, setters, Diário e notificações na mesma ordem.

## Registro da Fase 24 — Editar Capítulo

- A mutação local determinística da exclusão de capítulo foi isolada em `lib/editar-capitulo-local-delete-mutation.ts`, preservando normalização, contadores, progresso e último capítulo lido.
- A página manteve confirmação, Supabase, persistência local, setters e redirecionamentos na mesma ordem.

## Registro da Fase 25 — Editar Capítulo

- Os valores derivados da tela foram isolados em `hooks/useEditarCapituloDerivedValues.ts`, preservando seleção, ordem, links, labels e prévias.
- A página manteve estados, carregamento, salvamento, exclusão e composição visual.

## Encerramento — Editar Capítulo

- A refatoração estrutural de `app/editar-capitulo/page.tsx` foi encerrada após a Fase 25, pois o restante concentra orquestração, estado, efeitos e JSX.

## Registro da Fase 1 — Adicionar Capítulo

- Os helpers de storage por usuário foram isolados em `lib/adicionar-capitulo-storage-utils.ts`, preservando chaves, leitura segura, serialização e falhas silenciosas.
- A página manteve as chaves de storage e todos os consumidores de backup, carregamento e persistência.

## Registro da Fase 2 — Adicionar Capítulo

- Os helpers puros de geração de IDs foram isolados em `lib/adicionar-capitulo-id-utils.ts`, preservando a prioridade de Web Crypto, o fallback UUID v4 e os bytes de variante RFC.
- A página manteve os dois consumidores de `criarId` na notificação e na criação do novo capítulo.

## Registro da Fase 3 — Adicionar Capítulo

- Os helpers puros de texto foram isolados em `lib/adicionar-capitulo-text-utils.ts`, preservando a contagem Unicode e a normalização do título do arquivo importado.
- A página manteve os consumidores de estatísticas, importação e validação nos mesmos fluxos.

## Registro da Fase 4 — Adicionar Capítulo

- Os helpers puros de rota foram isolados em `lib/adicionar-capitulo-route-utils.ts`, preservando redirects de login, prioridades de slug e fallbacks de leitura.
- A página manteve todos os consumidores de carregamento, salvamento, Diário, notificações e link derivado nos mesmos fluxos.

## Registro da Fase 5 — Adicionar Capítulo

- Os helpers puros de profile foram isolados em `lib/adicionar-capitulo-profile-utils.ts`, preservando trim, referências e ownership local.
- A página manteve o loader e a sincronização Supabase do autor nos mesmos fluxos.

## Registro da Fase 6 — Adicionar Capítulo

- As métricas puras de capítulo foram isoladas em `lib/adicionar-capitulo-metrics-utils.ts`, preservando estatísticas, validações e progresso.
- A página manteve todos os consumidores de importação, normalização, merge e criação nos mesmos fluxos.

## Registro da Fase 7 — Adicionar Capítulo

- Os helpers puros de ordenação de capítulos foram isolados em `lib/adicionar-capitulo-chapter-order-utils.ts`, preservando fallbacks, desempate por data e a cópia antes da ordenação.
- A página manteve os consumidores de próxima ordem, criação, ordenação e rota de leitura nos mesmos fluxos.

## Registro da Fase 8 — Adicionar Capítulo

- O normalizador puro de capítulo foi isolado em `lib/adicionar-capitulo-chapter-normalizer.ts`, preservando valores originais validados, coerções, fallbacks e a ordem positiva.
- A página manteve o `map` de capítulos dentro de `normalizarObra` no mesmo fluxo.

## Registro da Fase 9 — Adicionar Capítulo

- O normalizador puro de arquivo da obra foi isolado em `lib/adicionar-capitulo-file-normalizer.ts`, preservando validações estruturais, categorias e valores originais.
- A página manteve os consumidores de backup, sincronização, restauração e normalização da obra nos mesmos fluxos.

## Registro da Fase 10 — Adicionar Capítulo

- Os helpers puros de chaves e restauração de backup foram isolados em `lib/adicionar-capitulo-file-backup-utils.ts`, preservando ordem, deduplicação e referências de obras sem arquivo recuperável.
- A página manteve a leitura e escrita de storage nos fluxos atuais de backup.

## Registro da Fase 11 — Adicionar Capítulo

- Os helpers puros de normalização e seleção de métricas numéricas foram isolados em `lib/adicionar-capitulo-number-utils.ts`.
- A página manteve os normalizadores de obra local e Supabase, incluindo aliases, fallbacks e precedência das métricas.

## Registro da Fase 12 — Adicionar Capítulo

- Os normalizadores puros menores de categoria de arquivo e capítulo Supabase foram isolados em `lib/adicionar-capitulo-supabase-normalization.ts`.
- A página manteve a normalização da obra Supabase, a ordenação e o complemento local de capítulos no fluxo atual.

## Registro da Fase 13 — Adicionar Capítulo

- O normalizador puro da obra local foi isolado em `lib/adicionar-capitulo-work-normalizer.ts`.
- A página manteve os fluxos de carregamento e persistência como consumidores do normalizador extraído.

## Registro da Fase 14 — Adicionar Capítulo

- O normalizador puro da obra Supabase foi isolado em `lib/adicionar-capitulo-supabase-work-normalizer.ts`, preservando capítulos remotos, complementos locais e fallbacks de métricas.
- A página manteve o merge entre obras locais e remotas e toda a orquestração de carregamento.

## Registro da Fase 15 — Adicionar Capítulo

- O merge puro entre obras locais e Supabase foi isolado em `lib/adicionar-capitulo-work-merge-utils.ts`, preservando referências, ordem, métricas e estado local de leitura.

## Registro da Fase 16 — Adicionar Capítulo

- Os helpers puros de ownership e atualização da lista local foram isolados em `lib/adicionar-capitulo-ownership-utils.ts`.

## Registro da Fase 17 — Adicionar Capítulo

- A preparação pura de obras para storage foi isolada em `lib/adicionar-capitulo-storage-preparation.ts`.

## Registro da Fase 18 — Adicionar Capítulo

- A criação pura da notificação de novo capítulo foi isolada em `lib/adicionar-capitulo-notification-utils.ts`.

## Registro da Fase 19 — Adicionar Capítulo

- O loader de nome do profile foi movido para `actions/carregar-nome-profile-adicionar-capitulo.ts`; a página manteve os dois consumidores e a sincronização do autor.

## Registro da Fase 20 — Adicionar Capítulo

- A sincronização complementar do autor com o profile foi movida para `actions/sincronizar-autor-obra-profile-adicionar-capitulo.ts`, preservando o disparo fire-and-forget com `void` na página.

## Registro da Fase 21 — Adicionar Capítulo

- O registro do novo capítulo no Diário foi movido para `actions/registrar-diario-novo-capitulo.ts`, preservando o payload principal, o fallback sem metadata e o disparo fire-and-forget com `void` na página.

## Registro da Fase 22 — Adicionar Capítulo

- O registro de notificações Supabase para novo capítulo foi movido para `actions/registrar-notificacoes-novo-capitulo-supabase.ts`, preservando a RPC, os retornos antecipados e o disparo fire-and-forget com `void` na página.

## Registro da Fase 23 — Adicionar Capítulo

- A bridge imperativa de tradução foi movida para `lib/adicionar-capitulo-language-bridge.ts`, preservando os helpers, os estados com `WeakMap` e o lifecycle de `MutationObserver` na página.

## Registro da Fase 24 — Adicionar Capítulo

- O carregamento e a sincronização do backup local de arquivos das obras foram movidos para `lib/adicionar-capitulo-file-backup-storage.ts`, preservando normalização, chaves de backup, persistência por usuário e falhas silenciosas.

## Registro da Fase 25 — Adicionar Capítulo

- O carregamento e a persistência local das obras foram movidos para `lib/adicionar-capitulo-local-work-storage.ts`, preservando normalização, restauração de backup, ownership, persistência por usuário e a ordem entre backup e storage.

## Registro da Fase 26 — Adicionar Capítulo

- A validação pura do capítulo foi movida para `lib/adicionar-capitulo-validation.ts`, preservando título automático, contagem Unicode e as mensagens de validação.

## Registro da Fase 27 — Adicionar Capítulo

- O CSS global da página foi movido para `lib/adicionar-capitulo-page-css.ts`, preservando variáveis, seletores, regras duplicadas da navegação e os três consumidores existentes.

## Registro da Fase 28 — Adicionar Capítulo

- Os estilos React da página foram movidos para `lib/adicionar-capitulo-styles.ts`, preservando os 62 contratos `CSSProperties`, variantes responsivas, spreads e consumidores existentes.

## Registro da Fase 29 — Adicionar Capítulo

- O lifecycle imediato do modo desktop e os valores derivados de obra, capítulo e prévia foram movidos para hooks dedicados, preservando breakpoints, listeners, links e fallbacks existentes.

## Registro da Fase 30 — Adicionar Capítulo

- A preparação da importação de arquivos `.txt` e `.md` foi movida para `lib/adicionar-capitulo-text-import.ts`, preservando validações, normalização, estatísticas, resumo e falhas de leitura; a página manteve a orquestração dos setters.

## Registro da Fase 31 — Adicionar Capítulo

- A mutação local determinística da criação de capítulo foi movida para `lib/adicionar-capitulo-local-create-mutation.ts`, preservando ordenação, autoria e progresso da obra alvo.

## Registro da Fase 32 — Adicionar Capítulo

- O lifecycle da bridge de tradução foi movido para `hooks/useAdicionarCapituloLanguageBridge.ts`, preservando gatilhos, observer, filtros de atributos e os três refs da página.

## Registro da Fase 1 — Login

- Os redirects seguros e os helpers básicos de storage foram movidos para módulos dedicados, preservando validações de URL, fallbacks, isolamento de falhas e os consumidores de autenticação existentes.

## Registro da Fase 2 — Login

- As chaves de storage e os helpers puros de normalização e ownership de obras foram movidos para módulos dedicados, preservando autoria, trim, precedência e os consumidores da sincronização local.

## Registro da Fase 3 — Login

- Os leitores de erros de autenticação e o diagnóstico de falhas de sincronização de profile foram movidos para módulos dedicados, preservando classificação, registro em sessão e falhas silenciosas.

## Registro da Fase 4 — Login

- A sincronização local de storage por usuário foi movida para `lib/login-storage-sync.ts`, preservando ownership de obras, migração das obras antigas e normalização das listas associadas à conta.

## Registro da Fase 5 — Login

- Os lifecycles de modo desktop e de aviso após redefinição de senha foram movidos para hooks dedicados, preservando atualização imediata, listeners legados e modernos, timer e cleanup.
## Registro da Fase 6 — Login

- As traduções e a formatação de erros de autenticação foram movidas para módulos dedicados, preservando textos, prioridades de classificação e os consumidores existentes na página.

## Registro da Fase 7 — Login

- A preparação e a validação determinística do formulário foram movidas para helpers puros, preservando normalização, prioridade das regras e a orquestração de feedback da página.

## Registro da Fase 8 — Login

- A preparação determinística dos dados e o payload de profile foram movidos para helpers puros, preservando prioridades, fallbacks e o fluxo de sincronização da página.

## Registro da Fase 9 — Login

- O CSS global do Login foi movido para `lib/login-page-css.ts`, preservando integralmente os seletores, os dois blocos `html` e a concatenação do tema na página.

## Registro da Fase 10 — Login

- Os contratos de estilos React do Login foram movidos para `lib/login-styles.ts`, preservando valores, spreads, responsividade e os consumidores visuais da página.

## Registro da Fase 11 — Login

- A tentativa única de sincronização de profile foi movida para `actions/sincronizar-profile-login-uma-vez.ts`, preservando consultas, payload, update/upsert e o retry controlado pela página.

## Registro da Fase 12 — Login

- A orquestração de sincronização de profile e o helper de timing foram movidos para módulos dedicados, preservando tentativas, delays, diagnóstico e o callback estável da página.

## Registro da Fase 13 — Login

- O lifecycle de sessão já autenticada foi movido para `hooks/useLoginExistingSessionRedirect.ts`, preservando sincronização, feedback, delays, redirecionamento e cleanup.

## Registro da Fase 14 — Login

- A solicitação de recuperação de senha foi movida para `actions/solicitar-recuperacao-senha-login.ts`, preservando redirect, chamada de autenticação e feedback orquestrado na página.

## Registro da Fase 15 — Login

- A solicitação de criação de conta foi movida para `actions/criar-conta-login.ts`, preservando metadata de aceite, payload de autenticação e o restante do fluxo na página.

## Registro da Fase 16 — Login

- A autenticação por senha foi movida para `actions/entrar-com-senha-login.ts`, preservando payload, resposta e orquestração de profile, storage e redirect na página.

## Registro da Fase 17 — Login

- A finalização pós-autenticação foi movida para `actions/finalizar-autenticacao-login.ts`, preservando storage, redirect e refresh na ordem atual.

## Registro da Fase 1 — Admin Comunidade

- As rotas de moderação foram movidas para `lib/admin-comunidade-route-utils.ts`, preservando redirects de login, perfis denunciados e Diário.

## Registro da Fase 2 — Admin Comunidade

- Os status e rótulos puros de moderação foram movidos para módulos dedicados, preservando tipos, fallbacks e consumidores da página.

## Registro da Fase 3 — Admin Comunidade

- Os helpers puros de erros e nomes de perfis de moderação foram movidos para módulos dedicados, preservando detalhes, fallbacks e mapeamentos por identificador.

## Registro da Fase 4 — Admin Comunidade

- Os textos de confirmação de moderação e a detecção de conteúdo indisponível foram movidos para módulos puros, preservando locales, mensagens e padrões de normalização.

## Registro da Fase 5 — Admin Comunidade

- Os estilos React estáticos da página foram movidos para `lib/admin-comunidade-styles.ts`, preservando objetos, spreads, responsividade e consumidores visuais.

## Registro da Fase 6 — Admin Comunidade

- Os filtros derivados e totais de moderação foram movidos para módulos puros, preservando filtros por status, busca normalizada, mapeamento de denúncias de perfil e contadores.

## Registro da Fase 7 — Admin Comunidade

- O carregamento de reincidências de moderação foi movido para `loaders/carregar-reincidencias-moderacao.ts`, preservando a RPC, a transformação e a orquestração de estado na página.

## Registro da Fase 8 — Admin Comunidade

- O carregamento de denúncias de perfil foi movido para `loaders/carregar-denuncias-perfis-moderacao.ts`, preservando consultas, normalização e contexto de perfis.

## Registro da Fase 9 — Admin Comunidade

- A consulta e normalização base de denúncias foram movidas para `loaders/carregar-denuncias-base-moderacao.ts`, preservando a montagem de contexto na página.

## Registro da Fase 10 — Admin Comunidade

- O agrupamento de IDs dos alvos denunciados foi movido para `lib/admin-comunidade-target-id-utils.ts`, preservando filtros, deduplicação e ordem.

## Registro da Fase 11 — Admin Comunidade

- O carregamento dos alvos primários de moderação foi movido para `loaders/carregar-alvos-primarios-moderacao.ts`, preservando consultas independentes e fallbacks.

## Registro da Fase 12 — Admin Comunidade

- O contexto de anotações do Diário foi movido para `loaders/carregar-anotacoes-diario-contexto-moderacao.ts`, preservando IDs, consulta e fallbacks.

## Registro da Fase 13 — Admin Comunidade

- O contexto de capítulos foi movido para `loaders/carregar-capitulos-contexto-moderacao.ts`, preservando IDs, consulta e fallbacks.

## Registro da Fase 14 — Admin Comunidade

- O contexto de obras foi movido para `loaders/carregar-obras-contexto-moderacao.ts`, preservando IDs, consulta e fallbacks.

## Registro da Fase 15 — Admin Comunidade

- O contexto de perfis foi movido para `loaders/carregar-perfis-contexto-moderacao.ts`, preservando IDs, consultas independentes e composição final.

## Registro da Fase 16 — Admin Comunidade

- Os mapas de contexto foram movidos para `lib/admin-comunidade-context-map-utils.ts`, preservando referências, chaves e a semântica nativa de `Map`.

## Registro da Fase 17 — Admin Comunidade

- A montagem final do contexto das denúncias foi movida para `lib/admin-comunidade-report-context-utils.ts`, preservando fluxos, fallbacks e prioridades.

## Registro da Fase 18 — Admin Comunidade

- A sincronização das observações de moderação foi movida para `lib/admin-comunidade-observation-utils.ts`, preservando valores editados, chaves antigas e a ordem dos setters na página.

## Registro da Fase 19 — Admin Comunidade

- A verificação de usuário autenticado e da permissão administrativa foi movida para `loaders/verificar-acesso-moderacao.ts`, preservando consultas, erros e a orquestração de acesso na página.

## Registro da Fase 20 — Admin Comunidade

- A persistência do status das denúncias de perfil foi movida para `actions/atualizar-status-denuncia-perfil-moderacao.ts`, preservando query, validação e feedback da página.

## Registro da Fase 21 — Admin Comunidade

- A persistência do status das denúncias foi movida para `actions/atualizar-status-denuncia-moderacao.ts`, preservando query, validação e feedback da página.

## Registro da Fase 22 — Admin Comunidade

- A remoção transacional de conteúdo denunciado foi movida para `actions/remover-conteudo-denunciado-moderacao.ts`, preservando RPC, validação e atualizações locais da página.

## Registro da Fase 23 — Admin Comunidade

- A persistência do arquivamento de denúncias foi movida para `actions/arquivar-denuncia-moderacao.ts`, preservando query, validação e feedback da página.

## Registro da Fase 24 — Admin Comunidade

- A persistência da restauração de denúncias foi movida para `actions/restaurar-denuncia-moderacao.ts`, preservando query, validação e feedback da página.

## Registro da Fase 25 — Admin Comunidade

- A persistência da remoção de denúncias resolvidas foi movida para `actions/remover-denuncia-resolvida-moderacao.ts`, preservando query, validação e atualizações locais da página.

## Registro da Fase 26 — Admin Comunidade

- A persistência da remoção de denúncias de perfil resolvidas foi movida para `actions/remover-denuncia-perfil-resolvida-moderacao.ts`, preservando query, validação e feedback da página.

## Registro da Fase 27 — Admin Comunidade

- O cartão de denúncia de perfil foi movido para `components/admin-comunidade-profile-report-card.tsx`, preservando menu, ações, estados e apresentação da página.

## Registro da Fase 28 — Admin Comunidade

- O cartão de denúncia de conteúdo foi movido para `components/admin-comunidade-content-report-card.tsx`, preservando menu, ações, observação interna, estados e apresentação da página.

## Registro da Fase 29 — Admin Comunidade

- O painel de filtros da moderação foi movido para `components/admin-comunidade-filters-sheet.tsx`, preservando status, limpeza, acessibilidade e apresentação da página.

## Fase 1 — Admin Exclusões de Conta

- Tipos e normalização dos contratos foram extraídos para `lib/admin-exclusoes-conta-normalization-utils.ts`, sem alteração de comportamento.

## Fase 2 — Admin Exclusões de Conta

- Textos, rótulos e helpers puros de apresentação foram extraídos para `lib/admin-exclusoes-conta-text-utils.ts`, sem alteração de comportamento.

## Fase 3 — Admin Exclusões de Conta

- Filtros e totais foram movidos para helpers puros sem alteração de comportamento.

## Fase 4 — Admin Exclusões de Conta

- A construção segura da rota de login foi extraída para `lib/admin-exclusoes-conta-route-utils.ts`, sem alteração de comportamento.

## Fase 5 — Admin Exclusões de Conta

- A requisição GET de solicitações foi isolada em loader, mantendo na página autenticação, HTTP, normalização e estados.

## Fase 6 — Admin Exclusões de Conta

- A requisição GET das operações recuperáveis foi isolada em loader, mantendo decisões HTTP, normalização e estado na página.

## Fase 7 — Admin Exclusões de Conta

- A requisição PATCH de atualização da solicitação foi isolada, mantendo validação, HTTP, normalização e estado na página.

## Fase 8 — Admin Exclusões de Conta

- A requisição POST de recuperação foi isolada, mantendo decisões HTTP, recarga e feedback na página.

## Fase 9 — Admin Exclusões de Conta

- CSS e estilos React estáticos foram movidos para módulo dedicado sem alteração visual ou funcional.

## Fase 10 — Admin Exclusões de Conta

- A seção visual de recuperação operacional foi movida para componente dedicado sem alteração funcional ou visual.

## Fase 11 — Admin Exclusões de Conta

- O card visual das solicitações foi movido para componente dedicado sem alteração funcional ou visual.

## Fase 1 — Admin Problemas Técnicos

- Tipos e normalizadores puros foram extraídos sem alteração de comportamento.

## Fase 2 — Admin Problemas Técnicos

- Textos, rótulos e cores puras foram movidos para módulo dedicado sem alteração de comportamento.

## Fase 3 — Admin Problemas Técnicos

- Rota segura de login e formatação de erros foram extraídas sem alteração de comportamento.

## Fase 4 — Admin Problemas Técnicos

- A verificação administrativa via RPC foi isolada sem alteração na ordem, fallback ou tratamento de autenticação.

## Fase 5 — Admin Problemas Técnicos

- A query de leitura da fila foi isolada sem alteração de campos, ordenação, limite, normalização ou estado.

## Fase 6 — Admin Problemas Técnicos

- As consultas de perfis usadas para resolver nomes foram isoladas sem alteração de campos, limites, paralelismo ou fallbacks.

## Fase 7 — Admin Problemas Técnicos

- A mutation Supabase de atualização do chamado foi isolada sem alteração de payload, filtros, retorno, autorização ou estado.

## Fase 8 — Admin Problemas Técnicos

- CSS e estilos React estáticos foram movidos para módulo dedicado sem alteração visual ou funcional.

## Fase 9 — Admin Problemas Técnicos

- A filtragem da fila e o cálculo de totais foram movidos para helpers puros sem alteração de critérios ou comportamento.

## Fase 10 — Admin Problemas Técnicos

- Somente o resumo visual do card foi movido para componente dedicado, mantendo os detalhes e toda a orquestração na página.

## Fase 11 — Admin Problemas Técnicos

- Somente o grid de informações básicas do chamado foi movido para componente dedicado, mantendo descrição, ambiente, controles e mutations na página.

## Fase 12 — Admin Problemas Técnicos

- Somente a seção de descrição informada foi movida para componente dedicado, mantendo ambiente, controles e mutations na página.

## Fase 13 — Admin Problemas Técnicos

- Somente a seção visual de ambiente foi movida para componente dedicado, mantendo controles e mutations na página.

## Fase 14 — Admin Problemas Técnicos

- Somente o controle visual de status foi movido para componente dedicado, mantendo mutation e orquestração na página.

## Fase 15 — Admin Problemas Técnicos

- Somente o controle visual de prioridade foi movido para componente dedicado, mantendo mutation e orquestração na página.

## Fase 16 — Admin Problemas Técnicos

- Somente a exibição da última análise foi movida para componente dedicado.

## Fase 1 — Em Breve

- Somente o catálogo de traduções e o helper de tradução foram movidos para módulo dedicado, mantendo o bridge e toda a orquestração na página.

## Fase 2 — Em Breve

- Somente os helpers de leitura de parâmetros e construção segura da rota de login foram movidos para módulo dedicado.

## Fase 3 — Em Breve

- Somente a chave e os helpers de fallback em localStorage foram movidos para módulo dedicado, sem alterar sincronização com Supabase ou fluxo da página.

## Fase 4 — Em Breve

- Somente os tipos da obra e a normalização básica dos registros Supabase foram movidos para módulo dedicado, sem alterar consultas ou regras de negócio.

## Fase 5 — Em Breve

- Somente os helpers puros de normalização de IDs, geração de identificadores e consulta de presença de uma obra na lista foram movidos para módulo dedicado.

## Fase 6 — Em Breve

- As operações puras de adicionar, remover e normalizar obras salvas foram consolidadas no módulo de listas, mantendo toda sincronização remota na página.

## Fase 7 — Em Breve

- Somente o carregamento paginado dos avisos salvos em `seguindo_obras` foi movido para loader dedicado, mantendo mutations e orquestração na página.

## Fase 8 — Em Breve

- Somente o helper puro de identificação de erro de registro duplicado foi movido para módulo dedicado, mantendo toda sincronização Supabase na página.

## Fase 9 — Em Breve

- Somente a mutation de ativar e desativar avisos salvos em `seguindo_obras` foi movida para action dedicada, mantendo estado, mensagens e orquestração na página.

## Fase 10 — Em Breve

- Somente o carregamento paginado das obras reais sem conteúdo foi movido para loader dedicado, mantendo efeitos, redirecionamentos e demais consultas na página.

## Fase 11 — Em Breve

- Somente os helpers puros de construção de links dos cards e das obras publicadas foram movidos para módulo dedicado, mantendo redirecionamento, consultas e orquestração na página.

## Fase 12 — Em Breve

- Somente a deduplicação pura das obras do Em Breve foi movida para o módulo de listas existente, preservando chave, ordem e primeira ocorrência.

## Fase 13 — Em Breve

- Somente o helper puro de seleção do ícone temático por gênero foi movido para módulo de apresentação dedicado, sem alterar cards, estilos ou lógica da página.

## Fase 14 — Em Breve

- Somente a consulta responsável por localizar obra publicada com arquivo ou capítulo para redirecionamento foi movida para loader dedicado, mantendo o efeito e a navegação na página.

## Fase 15 — Em Breve

- Somente o template literal de CSS global da página foi movido para módulo dedicado, preservando integralmente seletores, variáveis, duplicações, `!important` e ordem de aplicação.

## Fase 16 — Em Breve

- Os objetos de estilo inline e o helper de estilo da capa foram movidos para módulo dedicado, preservando integralmente valores, heranças e comportamento visual.

## Fase 17 — Em Breve

- O bridge isolado de tradução DOM/MutationObserver foi movido para componente dedicado, preservando integralmente tradução de textos/atributos, observação do DOM e cleanup.

## Fase 18 — Em Breve

- A detecção responsiva do layout desktop foi movida para hook dedicado, preservando breakpoint, atualização inicial, listeners modernos/legados e cleanup.

## Fase 19 — Em Breve

- A seleção pura da obra consultada e a montagem da lista limitada de obras exibidas foram movidas para util dedicado, preservando prioridade por ID, fallback por título normalizado, ordem e limite.

## Fase 20 — Em Breve

- O efeito isolado de persistência local dos lançamentos salvos normalizados foi movido para hook dedicado, preservando condição de execução, chave de storage e dependências.

## Fase 21 — Em Breve

- O estado e o efeito isolado de carregamento inicial das obras reais foram movidos para hook dedicado, preservando loader, atualização assíncrona via timer, proteção de componente ativo e cleanup.

## Fase 22 — Em Breve

- A normalização memoizada dos lançamentos salvos foi movida para hook dedicado, preservando fallback sem usuário/obras, helper de normalização e dependências do memo.

## Fase 23 — Em Breve

- O header visual da página foi movido para componente dedicado, preservando título, navegação, responsividade, contador de notificações e acessibilidade.

## Fase 24 — Em Breve

- As camadas visuais responsivas de water fade foram movidas para componente dedicado, preservando condições desktop/mobile, estilos e acessibilidade decorativa.

## Fase 25 — Em Breve

- O estado visual vazio da página foi movido para componente dedicado, preservando aviso de acesso, mensagens condicionais e estilo.

## Fase 26 — Em Breve

- A seção visual das obras em breve foi movida para componente dedicado, preservando cards, estados de aviso, links, responsividade, botão de ativação e acessibilidade, mantendo a mutation na página.

## Fase 27 — Em Breve

- O rodapé visual “Sobre o aviso” foi movido para componente dedicado, preservando condição de exibição, texto e estilo.

## Fase 28 — Em Breve

- O estado e o ciclo inicial de parâmetros, redirecionamento, autenticação e carregamento dos lançamentos salvos foram movidos para hook dedicado, preservando timers, storage, Supabase, proteção de componente ativo e cleanup.

## Fase 29 — Em Breve

- Os estados e a ação de ativar/desativar aviso de lançamento foram movidos para hook dedicado, preservando autenticação, mutation Supabase, normalização local, storage, mensagens e estado de processamento.

## Fase 1 — Top 5 do Perfil Autor

- O catálogo e o helper de tradução do Top 5 foram movidos para módulo dedicado, preservando traduções exatas, padrões dinâmicos, espaços e fallback em português.

## Fase 2 — Top 5 do Perfil Autor

- O bridge de tradução do DOM com MutationObserver foi movido para componente dedicado, preservando tradução de textos e atributos, observação do DOM e cleanup.

## Fase 3 — Top 5 do Perfil Autor

- Os tipos e modelos de capítulo, arquivo, obra, registro salvo, registro Supabase e usuário foram movidos para módulo dedicado, sem alteração dos contratos de dados.

## Fase 4 — Top 5 do Perfil Autor

- Os normalizadores puros de valores, arquivos, capítulos, obras locais e registros Supabase foram movidos para módulo dedicado, preservando aliases, fallbacks e contratos atuais.

## Fase 5 — Top 5 do Perfil Autor

- A geração dos identificadores e da chave canônica das obras foi movida para módulo puro dedicado, preservando prioridade, deduplicação, slug e normalização textual.

## Fase 6 — Top 5 do Perfil Autor

- Os helpers genéricos de chave, leitura e escrita de localStorage por usuário foram movidos para módulo dedicado, preservando SSR guards, formato da chave, serialização e fallbacks.

## Fase 7 — Top 5 do Perfil Autor

- A persistência da seleção TOP 5 foi movida para módulo dedicado, preservando chave de storage, limite de cinco obras, deduplicação, trim, SSR guards e serialização.

## Fase 8 — Top 5 do Perfil Autor

- O carregamento das obras locais por usuário foi movido para loader dedicado, preservando chave de storage, SSR guard, parsing, validação, normalização e fallbacks.

## Fase 9 — Top 5 do Perfil Autor

- O carregamento remoto das obras publicadas via Supabase foi movido para loader dedicado, preservando seleção de campos, filtro de publicação, ordenação, limite, normalização e fallback.

## Fase 10 — Top 5 do Perfil Autor

- A mesclagem e deduplicação das obras foi movida para módulo puro dedicado, preservando filtro de publicação/18+, prioridade dos dados, fallbacks e identificação canônica.

## Fase 11 — Top 5 do Perfil Autor

- A normalização dos IDs selecionados foi movida para módulo puro dedicado, preservando resolução por identificadores, chave canônica, deduplicação, ordem e limite máximo.

## Fase 12 — Top 5 do Perfil Autor

- Os helpers e estilos específicos das capas disponíveis e selecionadas foram movidos para módulo dedicado, preservando fallbacks, gradientes e composição visual.

## Fase 13 — Top 5 do Perfil Autor

- O CSS global da página Top 5 foi movido para módulo dedicado, preservando variáveis de tema, seletores, media query, valores e `!important`.

## Fase 14 — Top 5 do Perfil Autor

- A ordenação e o filtro textual das obras disponíveis foram movidos para função pura dedicada, preservando prioridade das selecionadas, locale `pt-BR`, normalização e campos pesquisáveis.

## Fase 15 — Top 5 do Perfil Autor

- A criação do mapa de obras por identificador e a resolução das obras selecionadas foram movidas para seletores puros dedicados, preservando ordem, resolução e descarte de IDs inválidos.

## Fase 16 — Top 5 do Perfil Autor

- Os estilos estáticos da seção de obras selecionadas e de suas ações foram movidos para módulo dedicado, preservando integralmente dimensões, tipografia, espaçamentos, backgrounds, estados e composição visual.

## Fase 17 — Top 5 do Perfil Autor

- Os estilos estáticos da busca, mensagens de estado e aviso de autenticação foram movidos para módulo dedicado, preservando dimensões, tipografia, cores, variáveis de tema e composição visual.

## Fase 18 — Top 5 do Perfil Autor

- Os estilos restantes da página, grid, cards e badge de posição foram movidos para módulo dedicado, preservando tema, layout, grid, tipografia, estados e composição visual.

## Fase 19 — Top 5 do Perfil Autor

- As transformações puras de remoção e reordenação da lista selecionada foram movidas para módulo dedicado, preservando ordem, imutabilidade e retorno da referência original em movimentos inválidos.

## Fase 20 — Top 5 do Perfil Autor

- A alternância pura de uma obra selecionada foi movida para módulo dedicado, preservando ordem, limite de cinco obras, referência no limite e feedback de limite na página.

## Fase 21 — Top 5 do Perfil Autor

- A consulta do nome atual do usuário em `profiles` foi movida para loader dedicado, preservando query, fallback do nome, propagação de exceções e pontos de cancelamento do effect.

## Fase 22 — Top 5 do Perfil Autor

- A composição do nome inicial do usuário foi movida para helper puro dedicado, preservando prioridade entre `nome`, `name`, email e fallback `"Usuário"`.

## Fase 23 — Top 5 do Perfil Autor

- A composição das obras locais e Supabase foi movida para loader dedicado, preservando ordem das fontes e regras existentes de mesclagem.

## Fase 24 — Top 5 do Perfil Autor

- O carregamento e a normalização da seleção inicial foram movidos para helper dedicado, mantendo a persistência corretiva e os setters na página.

## Fase 25 — Top 5 do Perfil Autor

- A sincronização corretiva da seleção inicial foi movida para helper dedicado, preservando condição por `userId`, comparação via `JSON.stringify` e gravação silenciosa com `salvarTop5`.

## Fase 26 — Top 5 do Perfil Autor

- O carregamento paralelo da sessão autenticada e das obras Supabase foi movido para loader dedicado, preservando `Promise.all`, ordem das chamadas, paralelismo e propagação de erros.

## Fase 27 — Top 5 do Perfil Autor

- A preparação das obras mescladas e da seleção inicial foi movida para helper dedicado, preservando a ordem obras → seleção antes dos setters e da sincronização corretiva na página.

## Fase 28 — Top 5 do Perfil Autor

- A persistência manual da seleção foi movida para helper dedicado, preservando normalização, gravação, erro de persistência e a orquestração de estados, mensagens e navegação na página.

## Fase 29 — Top 5 do Perfil Autor

- A barra de busca foi movida para componente controlado dedicado, preservando estado na página, atributos de acessibilidade, comportamento e composição visual.

## Fase 30 — Top 5 do Perfil Autor

- O aviso para usuário não autenticado foi movido para componente apresentacional dedicado, preservando a condição de exibição na página, textos, URL de login e composição visual.

## Fase 31 — Top 5 do Perfil Autor

- A mensagem de status foi movida para componente apresentacional dedicado, preservando condição de exibição na página, conteúdo, acessibilidade e estilo.

## Fase 32 — Top 5 do Perfil Autor

- O indicador visual de carregamento foi movido para componente apresentacional dedicado, preservando a condição de exibição na página, texto, acessibilidade e estilo.

## Fase 33 — Top 5 do Perfil Autor

- O estado visual de lista vazia foi movido para componente apresentacional dedicado, preservando a condição do grid na página, texto e estilos.

## Fase 34 — Top 5 do Perfil Autor

- O cabeçalho da seleção e as ações Cancelar/Salvar foram movidos para componente controlado dedicado, preservando estado e regra de desabilitação na página.

## Fase 35 — Top 5 do Perfil Autor

- A lista visual dos cinco slots selecionados foi movida para componente controlado dedicado, preservando handlers, estado e seleção derivada na página.

## Fase 36 — Top 5 do Perfil Autor

- O grid visual das obras disponíveis foi movido para componente controlado dedicado, preservando filtro, seleção e handler de alternância na página.

## Fase 37 — Top 5 do Perfil Autor

- A seção de obras selecionadas passou a ser composta por componente controlado dedicado, preservando estado, seleção derivada e handlers na página.
