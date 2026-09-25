# Refatoração da Comunidade

## Estado atual

- O PR #419 está aberto e aguarda autorização.
- A Fase 297 extraiu somente `compartilharPublicacao`.
- Não mesclar o PR #419, nem qualquer outro PR, sem autorização explícita.

## Próxima fase

A Fase 298 deve extrair somente `carregarPostsComunidade`. Não incluir outras funções, componentes, limpezas, renomeações ou melhorias no mesmo diff.

## Contrato de preservação

A extração deve preservar exatamente:

- comportamento e fluxo assíncrono;
- visual, estados e acessibilidade;
- consultas, filtros, ordenação, paginação e contratos do Supabase;
- políticas, permissões e comportamento de RLS;
- chaves, formatos e fallbacks de `localStorage`;
- chaves, mensagens, interpolação e fallback de i18n;
- whitespace significativo e formatação não relacionada ao alvo.

Não alterar schema, migrations, dependências ou contratos públicos como parte da Fase 298.

## Validação obrigatória

Antes de considerar a fase concluída, executar todas as validações definidas no `AGENTS.md`, incluindo lint, typecheck, auditoria estática, testes unitários, integrações com Supabase local, build, E2E e verificação final de diff/whitespace. Qualquer validação não executada ou com falha deve ser registrada claramente; não declarar a fase pronta enquanto houver pendências.
