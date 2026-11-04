# Estado atual

Atualizado em: 2026-11-04

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

O projeto voltou a ser pausado pelo Spend Management após consumo elevado de Build CPU, Function Storage e Deployment Storage.

Para reduzir esse consumo quando o projeto for retomado, os deployments automáticos por Git estão configurados em `vercel.json` assim:

- `main`: habilitado, mantendo o deployment automático de produção;
- demais branches e PRs: desabilitados, sem Preview Deployment automático.

Essa política não altera os workflows do GitHub Actions nem as configurações de Vercel Authentication e domínio.

## Pendências conhecidas

### Capítulos públicos canônicos

A rota `/obra/[slug]/capitulo/[numero]` entrega o leitor compartilhado com HTTP 200, metadata de capítulo, canonical próprio e título/texto no HTML inicial para capítulos públicos válidos. Capítulos publicados permitidos também entram no sitemap usando sua `ordem` real, enquanto combinações inexistentes ou inválidas respondem HTTP 404 sem redirect.

O leitor interno por query (`/ler-capitulo`) continua disponível. Structured data permanece em etapa separada.

### Dependency Cruiser — ciclos do DenunciaModal

Os tipos compartilhados de denúncia foram extraídos de `components/DenunciaModal.tsx` para `components/denuncia-types.ts`.

Os hooks `use-denuncia-submit-action.ts` e `use-denuncia-modal-lifecycle.ts` deixam de importar o componente do modal, removendo os 2 ciclos associados ao `DenunciaModal` sem alterar comportamento.

A compatibilidade de imports externos é preservada porque `DenunciaModal.tsx` continua reexportando os mesmos tipos.


### OWASP ZAP — headers de segurança de baixo risco

Foi criada uma fase dedicada para os headers apontados pelo baseline do ZAP, começando apenas pelos de baixo risco:

- `X-Content-Type-Options: nosniff`;
- `X-Frame-Options: SAMEORIGIN`;
- `Permissions-Policy: camera=(), microphone=(), geolocation=(), browsing-topics=()`.

A configuração é global via `next.config.ts` e possui validação Playwright no app real, incluindo rota protegida com redirect para login.

CSP e Cross-Origin-Embedder-Policy permanecem fora desta fase por poderem quebrar scripts inline, Sentry, Supabase ou outros recursos sem uma política calibrada.

O aviso `Content-Type Header Missing` observado em rotas protegidas está associado a respostas de redirect e não é forçado artificialmente nesta fase.


### OWASP ZAP — Potential XSS revisado

O alerta `User Controllable HTML Element Attribute (Potential XSS)` do baseline foi revisado e classificado como falso positivo no estado atual.

- URL observada: `/login?redirectTo=%2Fpublicar`;
- o ZAP associou o valor `/publicar` ao `href` fixo da bottom nav em `app/layout.tsx`;
- o parâmetro `redirectTo` não é interpolado nesse link;
- redirects do login passam por `obterRedirectToSeguro`, que restringe o destino a caminhos internos e normaliza caracteres perigosos;
- foi adicionada cobertura de regressão para esquemas perigosos, origens externas e tentativa de quebra de atributo HTML.

Não houve alteração funcional no app para esse alerta.


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
