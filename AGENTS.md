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
- Após a autorização para iniciar uma fase, o agente pode criar a branch, implementar, validar, fazer commit, push e abrir o PR somente dentro da tarefa autorizada. Nunca deve fechar ou mesclar PR sem autorização explícita do usuário.
- Nunca mescle um PR apenas porque as validações passaram; merge exige autorização explícita.
- Após o push e a abertura/atualização do PR, consulte os checks uma vez e informe o estado conhecido, incluindo mesclabilidade quando disponível. Se estiverem em andamento, entregue o link e pare: não aguarde em loop nem faça polling de CI/deploy/testes; não prometa acompanhamento em segundo plano. Uma nova revisão solicitada pelo usuário pode consultar o estado atual.
- Produção e ativação de serviços exigem autorização própria. CI aprovada não autoriza publicação automática, uploads ilustrados, abertura pública do site ou alterações no banco remoto.
- Preserve alterações locais, arquivos, dados e volumes Docker; restaure os containers temporariamente pausados ao finalizar.
- Nunca inclua `supabase/.temp/cli-latest` em commits.
- Se uma validação não puder ser executada por limitação do ambiente, informe exatamente qual ficou pendente e não declare validação completa.
- Mantenha respostas finais curtas, sem omitir resultados, limitações ou links; prompts e evidências técnicas devem permanecer completos.

## Validação proporcional ao risco

Execute primeiro os testes locais afetados e as regressões diretamente relacionadas. A suíte completa permanece obrigatória na CI; não repita toda a suíte localmente sem risco ou evidência que justifique a ampliação. Classifique pelo risco real da mudança, não apenas pela extensão dos arquivos; se houver mais de uma categoria, aplique os requisitos pertinentes de cada uma.

- **Documentação:** revise o diff completo, referências e coerência das instruções; execute `git diff --check` e verificadores documentais existentes quando aplicáveis. Não inicie Docker, banco, Playwright, instalação de dependências ou build apenas para uma alteração exclusivamente documental.
- **QA:** execute os testes alterados e as regressões diretamente relacionadas, além de Lint focado quando aplicável. Não repita a suíte inteira localmente sem motivo concreto.
- **Aplicação:** execute unitários e integrações diretamente afetados, Typecheck e Lint pertinentes. Execute Build e Playwright focado quando necessários ao comportamento alterado; se a interface for afetada, cubra desktop/mobile e acessibilidade.
- **Mudanças críticas:** banco, migrations, RLS, autenticação, permissões, concorrência, publicação, outbox e agendamento exigem validação local ampliada dos contratos e riscos afetados, além da CI. Inclua pgTAP, Data API, Storage e testes de segurança, concorrência, rollback ou recuperação conforme o contrato alterado. Unitários ou CI verde não homologam produção gerenciada, capacidade física nem serviços externos.

### Tratamento de falhas

- Investigue o primeiro erro real e reproduza primeiro o teste afetado; separe a causa das falhas subsequentes.
- Amplie a execução somente quando houver risco ou evidência. Não aumente timeouts, adicione retries, pule testes ou enfraqueça asserções para obter aprovação.
- Mantenha falhas não resolvidas explícitas. Não classifique uma falha como preexistente ou ambiental sem comprovação, nem declare validação completa diante de uma pendência.

### Cobertura completa da CI

Todos os gates e a cobertura obrigatória existentes permanecem integrais. Não remova jobs, reduza cobertura, altere workflows para contornar falhas ou torne verificações obrigatórias opcionais. A política local acima não substitui a validação completa da CI. Comandos de referência para os gates existentes, sem limitar outras verificações do pipeline:

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

Quando a validação exigir execução Node.js, use Node.js 22, instalação reproduzível com `npm ci` e as versões travadas nos lockfiles; não reinstale dependências sem necessidade. Integrações e E2E devem usar somente o Supabase local descartável; nunca aponte testes destrutivos para um projeto remoto.

Ao final de qualquer tarefa, revise o diff completo, execute `git diff --check` e confira `git status --short`. Registre as verificações executadas, seus resultados e as pendências, diferenciando validação local de CI e homologação externa.

## Memory Bank do projeto

O repositório mantém contexto persistente em `docs/memory/`.

Antes de iniciar uma tarefa relevante:

1. Leia `docs/memory/README.md`.
2. Leia pelo menos `docs/memory/PROJECT_CONTEXT.md` e `docs/memory/CURRENT_STATUS.md`.
3. Consulte `DECISIONS.md`, `ARCHITECTURE.md`, `PROBLEMS_AND_SOLUTIONS.md` e `PR_HISTORY.md` quando forem pertinentes ao escopo.

Depois de uma mudança que altere de forma duradoura arquitetura, regras, segurança, CI/CD, integrações, estado de refatoração ou solução de problema recorrente, atualize os arquivos correspondentes do Memory Bank no mesmo PR quando isso fizer parte natural da mudança.

O Memory Bank é contexto auxiliar. Código, migrations, configurações e o estado real do GitHub têm prioridade quando houver divergência. Nunca registre segredos, tokens, senhas ou chaves privadas nesses arquivos.
