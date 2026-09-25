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
- A `main` local está sincronizada com `origin/main` e o worktree está limpo.
- Não mesclar nenhum PR sem autorização explícita.

## Próxima fase

A Fase 305 ainda não foi iniciada e aguarda autorização explícita. Não iniciar funções, componentes, limpezas, renomeações ou melhorias antes dessa autorização.

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
