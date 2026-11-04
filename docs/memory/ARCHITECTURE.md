# Arquitetura e infraestrutura

## Aplicação

- Framework: Next.js 16.3.4
- React: 19.2.4
- TypeScript
- Node.js 22 para CI e desenvolvimento suportado
- Instalação reproduzível com `npm ci`

## Backend e dados

Supabase é usado para autenticação, banco e fluxos de dados da aplicação.

Regras importantes:

- RLS e GRANT são controles separados.
- Tabelas novas no schema `public`, em migrations datadas a partir de 2026-10-30, precisam de GRANT/REVOKE explícito quando forem expostas ou bloqueadas para Data API.
- CI valida essa regra com `qa/scripts/check-public-table-grants.mjs`.
- Testes de banco usam pgTAP contra Supabase local descartável.

## Observabilidade e qualidade

- Sentry para captura de erros.
- Vercel Speed Insights para métricas reais de experiência/performance em deploys Vercel.
- Lighthouse CI para baseline de performance, acessibilidade, boas práticas e SEO.
- Playwright para E2E.
- CodeQL para análise de segurança.
- Dependabot para atualizações de dependências e GitHub Actions.

## CI

O workflow principal fica em `.github/workflows/ci.yml`.

Jobs principais:

- Lint
- Typecheck
- Tests
- Build

O job de testes inclui:

- testes estáticos;
- validação de GRANT/REVOKE;
- paginação;
- sessão;
- Supabase local;
- pgTAP;
- integrações Data API;
- build;
- Playwright;
- Lighthouse CI.

## Deploy

Produção é hospedada na Vercel.

Em 2026-11-03 o projeto estava protegido por **Vercel Authentication: All Deployments**. Isso permite continuar fazendo deploys sem deixar o domínio público acessível a visitantes comuns.

Os deployments automáticos da integração Git são controlados pelo `vercel.json` da raiz:

- `main` permanece habilitada como branch de deployment automático de produção;
- o padrão globstar `**` fica desabilitado, impedindo Preview Deployments automáticos inclusive em branches com `/`;
- os workflows do GitHub Actions continuam independentes dessa política.
