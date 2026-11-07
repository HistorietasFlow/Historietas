# Arquitetura e infraestrutura

## Aplicação

- Framework: Next.js 16.3.4
- React: 19.2.4
- TypeScript
- Node.js 22 para CI e desenvolvimento suportado
- Node.js `22.x` versionado em `package.json#engines`, inclusive para builds e
  funções Node.js na Vercel
- Instalação reproduzível com `npm ci`

### Leitura pública de capítulos

- `/obra/[slug]/capitulo/[numero]` é a rota canônica pública de capítulos publicados e responde com o leitor real, sem redirecionar para `/ler-capitulo`.
- O servidor consulta somente obra e capítulos públicos com o cliente anônimo/RLS, gera metadata própria e fornece o estado público inicial ao mesmo Client Component usado pelo leitor interno.
- O título e o texto do capítulo são renderizados no HTML inicial; após a hidratação, o lifecycle existente recarrega interações e estado da identidade autenticada sem substituir dados com respostas obsoletas.
- O sitemap cruza consultas públicas paginadas de obras e capítulos sem N+1, publica somente combinações permitidas e usa o valor persistido de `capitulos.ordem` na URL canônica.
- Combinações canônicas inválidas ou ausentes são verificadas antes do streaming pelo proxy com cliente público/RLS e recebem rewrite interno para `/_not-found` com HTTP 404; a página mantém `notFound()` como defesa adicional.
- Falhas de infraestrutura nessa verificação não viram ausência: a requisição segue para o loader server-side, que preserva o tratamento de erro normal.
- Obras públicas renderizam JSON-LD `CreativeWork` e capítulos públicos renderizam `Chapter` no HTML inicial; o capítulo referencia a obra por `isPartOf`, sempre com URLs canônicas absolutas e conteúdo serializado com neutralização de caracteres capazes de encerrar o script.
- `/ler-capitulo?obraId=...&capituloId=...` permanece disponível para fluxos internos, drafts e leituras por identificador.

### Comentários de obras e notificações

- Comentários e respostas em obras continuam sendo persistidos e autorizados pelos contratos existentes de Supabase/RLS.
- Notificações do tipo `comentario-obra` apontam para a rota pública da obra com `comentarios=1`; o cliente abre o mesmo comments sheet acessível usado pelo acionador visual, sem duplicar carregamento ou mutations.
- O deep link reage à navegação Back/Forward e não altera links de capítulos ou de outros tipos de notificação.

## Backend e dados

Supabase é usado para autenticação, banco e fluxos de dados da aplicação.

Regras importantes:

- RLS e GRANT são controles separados.
- Tabelas novas no schema `public`, em migrations datadas a partir de 2026-10-30, precisam de GRANT/REVOKE explícito quando forem expostas ou bloqueadas para Data API.
- CI valida essa regra com `qa/scripts/check-public-table-grants.mjs`.
- Testes de banco usam pgTAP contra Supabase local descartável.
- `avatars` e `capas-obras` permanecem buckets públicos para entrega por URL conhecida, mas a listagem de `storage.objects` é limitada ao prefixo do usuário autenticado; rotinas administrativas usam service role no servidor.

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

## Ambiente de testes local — novembro de 2026

- Docker Desktop/WSL2 fornece Supabase local com CLI fixada em `2.116.0`; portas foram remapeadas devido às reservas de portas no Windows (API 54421, banco 54422, Studio 54423). Esses valores são **configuração da máquina**, não contrato de produção.
- A inicialização local pode exigir a migration auxiliar de normalização ACL já usada na CI; não versionar esses ajustes locais sem fase específica.
- Fixtures Playwright usam identidades descartáveis e Supabase de loopback. Preferir build de produção local (`next build`/`next start`) para testes E2E repetíveis.
- O limite de storage do plano Hobby não afeta a execução de build/testes locais ou GitHub Actions, mas pode bloquear novas publicações na Vercel.
