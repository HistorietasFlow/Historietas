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
- A Fase 311 extraiu somente `postCombinaTermoBuscaComunidade` a partir do trecho final da busca textual de `postsVisiveis`; a implementação está no PR #445.
- A `main` local está sincronizada com `origin/main` e o worktree está limpo.
- Não mesclar nenhum PR sem autorização explícita.

## Próxima fase

A Fase 312 ainda não foi iniciada e aguarda autorização explícita. Não iniciar funções, componentes, limpezas, renomeações ou melhorias antes dessa autorização.

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
