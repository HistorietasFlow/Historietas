# Validação isolada — Biblioteca / função de privacidade

Este preparo **não contém** a migration de otimização nem os testes pgTAP que
permanecem no notebook. Contém apenas o workflow GitHub Actions e um benchmark
capaz de comparar a definição **original capturada antes da migration** com a
definição modificada **aplicada somente no banco descartável**.

## Integração pelo Codex Local

1. No VS Code, preservar os arquivos locais e conferir `git status` e `git diff`.
2. Confirmar que a branch atual é `perf/biblioteca-privacy-single-read`.
3. Fazer commit apenas dos arquivos autorizados da otimização, pgTAP e relatório,
   preservando outras alterações locais sem incluí-las.
4. Incorporar o commit de preparo por `git fetch origin qa/biblioteca-privacy-validation-prep`
   e `git cherry-pick origin/qa/biblioteca-privacy-validation-prep`.
   Se houver conflito, parar e revisar; **não forçar** e não descartar trabalho.
5. Conferir o diff. Publicar **somente** a branch
   `perf/biblioteca-privacy-single-read`, sem abrir PR e sem merge ainda.
   O workflow dispara com o push dessa branch.

## O que será verificado

- A branch precisa conter exatamente uma migration `20261117035853*.sql`,
  além de pelo menos um pgTAP novo ou alterado em `supabase/tests/database`.
- O runner separa temporariamente essa migration, inicia o Supabase local
  com migrations da main e copia **no runner apenas** a migration/testes
  do Ranking Geral da PR #2348 (commit fixo `5aac2c3`).
- Antes da nova migration, clona a definição SQL real da helper existente.
  Em seguida aplica a migration candidata **no PostgreSQL descartável**.
- Executa `supabase test db` (inclusive o pgTAP preparado pelo Local),
  testes da Data API para Histórias em Comum, paginação e Ranking Geral.
- Compara ambas as helpers em políticas RLS anônimas, com tabelas sintéticas
  equivalentes e 4.000/20.000 avaliações. São 2 aquecimentos e 7 medições
  alternadas por variante; reporta mediana, p95 e buffers.
- A comparação de desempenho não substitui a validação de segurança de
  usuários autenticados, proprietário, bloqueios, seguidores, alterações e
  revogações — estes contratos devem ser cobertos pelo pgTAP do Local.

## Limites de segurança

**Nenhum segredo remoto é usado.** O workflow requer apenas checkout de leitura.
O banco está dentro do GitHub Actions e é destruído ao término, inclusive na
falha. Este arquivo **não** faz merge, migration remota, deploy nem modifica
a PR #2348. Ele não substitui a CI obrigatória após abrir a PR funcional.

**Status:** runner preparado; ainda não validado contra os arquivos locais
não publicados do Codex Local. O resultado do workflow só poderá ser
avaliado após o push da branch com migration e testes.
