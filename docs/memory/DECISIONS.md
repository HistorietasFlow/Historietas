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
- O runtime de build e das funções Vercel é fixado pelo repositório em Node.js
  `22.x`, via `engines.node` no `package.json`, para permanecer idêntico ao
  runtime validado pela CI. Não depender apenas do valor mutável do painel.

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

## Comentários para autores

- A localização de comentários em obras reutiliza a central de Notificações e o comments sheet existente; não deve criar um segundo inbox nem duplicar consultas de comentários.
- O parâmetro público `comentarios=1` abre apenas o sheet da rota canônica `/obra/[slug]`. Links de capítulo, Comunidade e outros destinos não recebem esse estado.
- Respostas, moderação e permissões permanecem nos fluxos existentes e sob RLS; o deep link não concede novas capacidades.

## Proteção contra spoilers

- Notificações fallback de comentários e reviews não carregam trechos do conteúdo criado pelo usuário. A mensagem identifica autor e contexto de destino de forma genérica, alinhada às notificações diretas do banco.
- O texto potencialmente sensível a spoiler permanece no comments sheet ou na publicação de origem; busca e cache local de Notificações não devem reintroduzir esse conteúdo.

## Histórico de moderação

- `moderacao_historico` continua sendo a fonte de auditoria append-only para denúncias de conteúdo e perfil; decisões administrativas não devem depender apenas do estado final mutável da denúncia.
- A interface administrativa lê o histórico sob demanda e de forma paginada, exibindo transições, responsável e observação interna. Não criar uma cópia cliente nem expor esses dados em rotas comuns.
- `authenticated` conserva somente `SELECT` na tabela, condicionado pela RLS administrativa; escrita e exclusão de eventos permanecem fora do cliente. Usuários sem papel administrativo não podem consultar o histórico.

## Dependências e segurança

- Dependabot roda semanalmente.
- CodeQL permanece habilitado.
- Atualizações de dependência não devem ser misturadas com refatorações sem necessidade explícita.
- Advisories transitivos de produção devem ser removidos por atualização
  compatível da dependência raiz quando houver correção estável; não usar
  `npm audit fix --force` nem alterar majors apenas para zerar avisos de
  ferramentas de desenvolvimento sem exposição de runtime.

## Operação e continuidade — 06/11/2026

- Código, migrations, configurações e estado real do GitHub são fontes de verdade; o Memory Bank e assistentes de memória (incluindo Dot) são auxiliares, nunca backups infalíveis.
- Ao concluir alteração duradoura, atualizar **no mesmo PR** os documentos pertinentes do Memory Bank; não é necessário modificar todos a cada PR. Confirmar lacunas antes de documentar.
- Priorizar teste local (Docker/Supabase/Playwright) e redução de consumo da Vercel; merge de PR na `main` pode disparar deploy automático, enquanto a simples criação de PR não cria preview.
- Antes de recomendar merge: revisar diff, mergeabilidade e CI/Gitleaks. Não fazer consultas repetidas enquanto os checks estiverem rodando. Seguir a regra do `AGENTS.md` de autorização explícita para merge e produção.
- O assistente de planejamento deve responder de forma curta, sinalizar o próximo passo e não executar mudanças somente por receber um resumo.
