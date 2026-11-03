# Estado atual

Atualizado em: 2026-11-03

## Infraestrutura e ferramentas

Concluídos:

- Sentry
- GitHub CodeQL
- Dependabot
- Supabase Advisors + pgTAP/RLS baseline
- Playwright
- Lighthouse CI
- Vercel Speed Insights
- Knip (diagnóstico de código/dependências não utilizados; inicialmente não bloqueante)
- Gitleaks (scan bloqueante de segredos no histórico Git, com allowlists específicas para falsos positivos conhecidos)
- Dependency Cruiser (baseline de dependências circulares em `app/`, `components/` e `lib/`)
- OWASP ZAP (baseline passivo contra o app local da CI; sem scan ativo em produção)
- k6 (baseline leve de carga/desempenho contra rotas públicas do app local da CI)

## Produção Vercel

O deploy do commit que adicionou Speed Insights foi concluído com sucesso após o projeto ser retomado.

PR correspondente:

- #2147 — `feat(vercel): adicionar Speed Insights`

O projeto havia sido pausado pelo Spend Management, fazendo deploys retornarem `Deployment was blocked` e visitantes receberem `503 DEPLOYMENT_PAUSED`.

Após retomar o projeto, o deploy voltou a funcionar.

O projeto está temporariamente protegido com:

- Vercel Authentication
- All Deployments

Objetivo: continuar desenvolvimento e deploys sem deixar o site público.

## Pendências conhecidas

### Supabase Storage

Security Advisor apontou warnings relacionados a listagem pública nos buckets:

- `avatars`
- `capas-obras`

Não alterar essas policies sem uma fase dedicada e testes, porque podem existir dependências de list/upsert no app.

### Supabase Auth

Leaked Password Protection estava indisponível no plano Supabase observado durante a configuração. Reavaliar caso o plano/capacidade mude.

### Lighthouse baseline

Primeiro baseline observado:

- Home: performance 53, accessibility 83
- Explorar: performance 65, accessibility 93
- Login: performance 97, accessibility 94, SEO 66

Usar esses números como ponto de partida, não como contrato permanente. Confirmar medições atuais antes de priorizar otimizações.

## Próxima regra operacional

Antes de sugerir ou iniciar um novo passo de refatoração, verificar no GitHub o estado real da PR/branch atual e não depender apenas deste arquivo.
