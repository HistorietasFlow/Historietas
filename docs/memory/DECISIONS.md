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
- Buckets públicos de mídia não concedem listagem pública de metadados: `avatars` e `capas-obras` mantêm entrega pública por URL conhecida, enquanto `SELECT` em `storage.objects` fica restrito ao prefixo da identidade autenticada.
- O `SELECT` do proprietário em `avatars` não deve ser removido enquanto o fluxo de avatar usar `upsert: true`, pois a substituição exige `INSERT`, `SELECT` e `UPDATE`.
- O aceite dos termos é a fronteira transacional de recuperação para uma conta autenticada sem `public.profiles`: a função privada cria somente o perfil mínimo de `auth.uid()`, com tipo constante e nome de exibição sanitizado. Metadata editável nunca decide autorização. Não introduzir trigger em `auth.users` sem uma fase separada.

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

## Rotas públicas e SEO

- Capítulos publicados usam `/obra/[slug]/capitulo/[numero]` como página canônica real, com HTTP 200, metadata própria e conteúdo no HTML inicial.
- A rota pública reutiliza o leitor cliente existente com dados públicos iniciais carregados no servidor; não deve haver uma segunda implementação visual nem redirect para `/ler-capitulo` em capítulos públicos válidos.
- O carregamento server-side respeita o cliente público do Supabase, RLS, publicação e o bloqueio vigente de conteúdo 18+.
- O sitemap inclui capítulos publicados de obras públicas permitidas e usa `capitulos.ordem`, sem inferir o número pela posição em uma coleção.
- Ausência ou parâmetros inválidos na rota canônica de capítulo resultam em HTTP 404; erros do Supabase/rede não devem ser capturados como `null` nem transformados em 404.
- Para garantir o status antes do streaming do App Router, o proxy consulta somente a existência pública via cliente anônimo/RLS e reescreve ausências confirmadas para `/_not-found` com status 404; falhas da consulta devem seguir para o loader, nunca ser classificadas como inexistência.
- Structured data de conteúdo público usa `CreativeWork` para obras e `Chapter` para capítulos, é renderizado no servidor, não inclui o texto completo do capítulo e passa por serialização que neutraliza fechamento/injeção de `<script>`.

## Catálogo do Explorar

- A descoberta de autores pagina a mesma RPC pública de obras por cursor; não deve baixar o catálogo inteiro nem criar uma varredura paralela sem limites.
- A correspondência textual por autor usa o nome público atual de `profiles_publicos`, enquanto o nome gravado na obra permanece apenas como dado histórico/fallback de apresentação.
- A RPC continua `SECURITY INVOKER`: privacidade e visibilidade dos perfis permanecem sob os contratos públicos e RLS existentes.

## Dependências e segurança

- Dependabot roda semanalmente.
- CodeQL permanece habilitado.
- Atualizações de dependência não devem ser misturadas com refatorações sem necessidade explícita.

## Operação e continuidade — 06/11/2026

- Código, migrations, configurações e estado real do GitHub são fontes de verdade; o Memory Bank e assistentes de memória (incluindo Dot) são auxiliares, nunca backups infalíveis.
- Ao concluir alteração duradoura, atualizar **no mesmo PR** os documentos pertinentes do Memory Bank; não é necessário modificar todos a cada PR. Confirmar lacunas antes de documentar.
- Priorizar teste local (Docker/Supabase/Playwright) e redução de consumo da Vercel; merge de PR na `main` pode disparar deploy automático, enquanto a simples criação de PR não cria preview.
- Antes de recomendar merge: revisar diff, mergeabilidade e CI/Gitleaks. Não fazer consultas repetidas enquanto os checks estiverem rodando. Seguir a regra do `AGENTS.md` de autorização explícita para merge e produção.
- O assistente de planejamento deve responder de forma curta, sinalizar o próximo passo e não executar mudanças somente por receber um resumo.
