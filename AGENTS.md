# Regras permanentes de refatoração

Estas regras valem para todo o repositório e para todas as fases da refatoração incremental.

## Escopo de cada fase

- Trate cada fase como uma alteração pequena, isolada e revisável.
- Extraia somente a função, o componente ou a responsabilidade indicada para a fase atual.
- Não antecipe fases, não inclua melhorias oportunistas e não altere arquivos fora do escopo sem necessidade comprovada.
- Antes de editar, confira o estado do Git, localize todos os usos do alvo e registre os contratos que precisam permanecer idênticos.
- Prefira mover a implementação existente sem reescrevê-la. Passe dependências de forma explícita e preserve assinaturas, retornos, ordem de execução, efeitos colaterais e temporização das atualizações de estado.

## Invariantes obrigatórias

- Preserve integralmente o comportamento funcional e o visual, inclusive estados de carregamento, erro, vazio, foco, responsividade e acessibilidade.
- Preserve as consultas ao Supabase, filtros, ordenação, paginação, tratamento de erros, autenticação e contratos de dados.
- Não altere schema, migrations, políticas, permissões nem o comportamento de RLS sem autorização explícita e uma fase dedicada.
- Preserve chaves, formatos, serialização, leitura, escrita e fallbacks de `localStorage`.
- Preserve todas as chaves e mensagens de i18n, incluindo acentos, interpolação e fallback.
- Preserve whitespace significativo em textos e conteúdo renderizado. Não aplique formatação em massa nem gere diffs de whitespace fora do alvo.
- Não adicione, remova ou atualize dependências durante uma extração, salvo autorização explícita.

## Processo seguro

- Mantenha uma fase por branch. Um PR pode reunir 2–3 extrações pequenas, simples e diretamente relacionadas quando isso não aumentar significativamente o risco nem dificultar a revisão.
- Mantenha funções maiores, delicadas ou não relacionadas em PRs separados.
- Inclua no próprio PR funcional de cada fase a atualização correspondente de `docs/refatoracao-comunidade.md`; não abra um PR documental separado somente para registrar a fase concluída.
- Revise o diff completo antes de concluir e confirme que somente os arquivos previstos foram alterados.
- Execute `git diff --check` para detectar erros de whitespace.
- Após a autorização para iniciar uma fase, o agente pode criar a branch, implementar, validar, fazer commit, push e abrir o PR. Nunca deve fechar ou mesclar PR sem autorização explícita do usuário.
- Nunca mescle um PR apenas porque as validações passaram; merge exige autorização explícita.
- Após abrir o PR, aguarde e confirme individualmente CI, Build, Typecheck, Lint, testes, Supabase/Data API, Playwright, Vercel e mesclabilidade. Não faça merge.
- Nunca inclua `supabase/.temp/cli-latest` em commits.
- Se uma validação não puder ser executada por limitação do ambiente, informe exatamente qual ficou pendente e não declare validação completa.

## Validações obrigatórias

Antes de concluir qualquer fase, execute todas as verificações equivalentes à CI:

1. `npm audit --omit=dev --audit-level=high`
2. `npm run lint`
3. `npm run typecheck`
4. `npm run test:static`
5. `npm run test:pagination`
6. `npm run test:session`
7. Com o Supabase local descartável preparado, `npm run test:pagination:integration`.
8. Com o Supabase local descartável preparado, `npm run test:spam:integration`.
9. `npm run build`
10. Prepare as fixtures locais com `npm run test:e2e:prepare:local` e execute os testes Playwright com `npm --prefix qa test` contra o build do código da fase.
11. Ao final, execute novamente `git diff --check` e confira `git status --short`.

Use Node.js 22, instalação reproduzível com `npm ci` e as versões travadas nos lockfiles. Integrações e E2E devem usar somente o Supabase local descartável; nunca aponte testes destrutivos para um projeto remoto.
