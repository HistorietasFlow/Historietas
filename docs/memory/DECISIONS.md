# Decisões importantes

## Refatoração

- Refatorações devem ser incrementais e pequenas.
- Um PR pode reunir 2–3 extrações pequenas e diretamente relacionadas quando o risco continuar baixo.
- Funções grandes, delicadas ou pouco relacionadas devem ficar em PRs separados.
- Preservar contratos e comportamento; evitar reescrita oportunista.
- Merge sempre exige autorização explícita do usuário.

## Supabase

- RLS deve continuar sendo tratado separadamente de GRANT.
- Novas tabelas `public` precisam declarar permissões explicitamente nas migrations aplicáveis à Data API.
- Testes destrutivos nunca devem apontar para Supabase remoto.

## Vercel

- Não usar pausa do projeto como mecanismo normal para esconder o site durante desenvolvimento, porque isso bloqueia deploys e pode causar 503.
- Para manter o site fechado enquanto continua sendo desenvolvido, usar Deployment Protection.
- Estado escolhido em 2026-11-03: **Vercel Authentication → All Deployments**.
- Desde 2026-11-04, deployments automáticos por Git ficam habilitados somente para `main`; todas as outras branches e PRs têm Preview Deployments automáticos desabilitados por `git.deploymentEnabled` em `vercel.json`.
- A restrição de previews reduz consumo de Build CPU, Function Storage e Deployment Storage sem alterar o GitHub Actions ou a política de proteção dos deployments.

## Observabilidade e testes

- Sentry foi configurado sem coleta desnecessária de dados sensíveis.
- Playwright deve usar o servidor iniciado pela CI; reutilização de servidor existente fica desabilitada em CI.
- Lighthouse iniciou como baseline com thresholds em modo de aviso, evitando bloquear PRs por variação de medição até haver baseline estável.

## Dependências e segurança

- Dependabot roda semanalmente.
- CodeQL permanece habilitado.
- Atualizações de dependência não devem ser misturadas com refatorações sem necessidade explícita.
