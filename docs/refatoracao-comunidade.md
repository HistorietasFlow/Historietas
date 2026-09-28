# Refatoração da Comunidade

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
- A Fase 412 extraiu somente `adicionarComentarioPostComunidade`, `removerComentarioPostComunidade` e `removerComentariosPostComunidade` a partir das transformações puras do estado local de comentários e está implementada neste PR.
- Não mesclar nenhum PR sem autorização explícita.

## Próxima fase

A Fase 413 ainda não foi iniciada e aguarda autorização explícita. Não iniciar funções, componentes, limpezas, renomeações ou melhorias antes dessa autorização.

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

Antes de considerar a fase concluída, executar todas as validações definidas no `AGENTS.md`, incluindo lint, typecheck, auditoria estática, testes unitários, integrações com Supabase local, build, E2E e verificação final de diff/whitespace. Qualquer validação não executada ou com falha deve ser registrada claramente; não declarar a fase pronta enquanto houver pendências.
