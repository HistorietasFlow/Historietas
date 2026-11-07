# Estado atual

Atualizado em: 2026-11-06

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

### Triagem final de segurança — 07/11/2026

- A árvore de produção foi atualizada para `@sentry/nextjs 11.11.0`, que resolve
  `glob 14.0.4` e `minimatch 11.0.5`. Com isso, `npm audit --omit=dev` passou de
  cinco vulnerabilidades moderadas transitivas para zero.
- Os alertas CodeQL legados ainda abertos foram revisados: #1 é fluxo de dados
  impreciso sobre um helper que persiste somente listas locais, sem senha, token
  ou sessão; #2 e #4 apontam exclusivamente para assertions de QA com entradas
  constantes. Não há exposição de runtime comprovada nesses três alertas.
- O audit completo ainda inclui avisos de ferramentas de desenvolvimento
  (`eslint-config-next`/`typescript-eslint`/`minimatch` e `zod`). Eles não entram
  no bundle de produção e não justificam downgrade ou atualização major forçada.

Os testes locais no Windows usam Node 22, normalizam CRLF somente nas leituras
textuais dos testes estruturais e executam listas extensas pelo `spawn` do Node,
sem delegar a linha de comando ao `cmd.exe`. O preparo E2E grava credenciais
descartáveis em `qa/.env.e2e.generated`, ignorado pelo Git, e o runner local
gerencia `next start` diretamente. Fora da CI, Playwright usa um worker e zero
retries; os parâmetros Linux da CI permanecem inalterados.

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

O runtime Node.js também é versionado no `package.json` como `22.x`. Esse
contrato prevalece sobre o valor selecionado no painel da Vercel e mantém os
builds/funções alinhados ao Node 22 usado no desenvolvimento e na CI, sem
alterar a proteção **Vercel Authentication: All Deployments**.

## Pendências conhecidas

### Capítulos públicos canônicos

A rota `/obra/[slug]/capitulo/[numero]` entrega o leitor compartilhado com HTTP 200, metadata de capítulo, canonical próprio e título/texto no HTML inicial para capítulos públicos válidos. Capítulos publicados permitidos também entram no sitemap usando sua `ordem` real, enquanto combinações inexistentes ou inválidas respondem HTTP 404 sem redirect.

As páginas públicas de obras e capítulos incluem JSON-LD semântico no HTML inicial, usando respectivamente `CreativeWork` e `Chapter`, URLs canônicas absolutas e serialização segura contra fechamento de `<script>`.

O leitor interno por query (`/ler-capitulo`) continua disponível.

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

A listagem de metadados dos buckets públicos `avatars` e `capas-obras` foi
restrita ao prefixo do usuário autenticado. URLs públicas conhecidas continuam
acessíveis, mas usuários anônimos não enumeram os buckets e uma conta não lista
objetos de outra.

O `SELECT` do proprietário deve ser preservado porque o upload de avatar usa
`upsert: true`, que depende de `SELECT` e `UPDATE`. A cobertura local valida
listagem, URL pública, escrita própria, isolamento entre contas, quotas, MIME,
tamanho e limpeza administrativa com service role.

### Supabase Auth

Leaked Password Protection estava indisponível no plano Supabase observado durante a configuração. Reavaliar caso o plano/capacidade mude.

A RPC de aceite dos termos recupera atomicamente o perfil mínimo da própria
identidade autenticada quando uma conta confirmada ficou sem `public.profiles`.
Perfis existentes continuam sendo apenas atualizados, sem sobrescrever dados
legítimos; a recuperação não cria trigger em `auth.users`.

### Progresso de leitura entre dispositivos

O Leitor persiste marcações e desmarcações por uma RPC condicional baseada no
momento da ação. Respostas antigas não sobrescrevem eventos mais recentes,
desmarcações deixam tombstones `lido=false` e o isolamento por conta continua
sob RLS. A cobertura local valida concorrência, retries, troca de identidade e
sincronização do Leitor com Home e Biblioteca em contextos desktop/mobile.

### Gestão de comentários pelo autor

O autor de uma obra pode remover comentários recebidos tanto na página da obra
quanto nos capítulos. A autorização continua sendo validada pelo RLS: somente o
próprio comentarista, o autor da obra ou um administrador pode excluir o
comentário. Localização por notificações, respostas, denúncia e moderação
administrativa permanecem nos fluxos existentes.

### Seguidores por obra no Painel do Autor

Os cards do Painel do Autor exibem a contagem agregada de seguidores de cada obra
permitida pela política de visibilidade, reutilizando
`interacoesDiretas.seguidores` da RPC de métricas já consultada.
Nenhuma consulta adicional ou identidade individual de seguidor é exposta.

### Explorar — catálogo de autores

A aba Autores reutiliza a paginação por cursor do catálogo público e permite
carregar páginas adicionais, sem limitar a descoberta à amostra inicial de
obras. A busca da RPC `listar_obras_catalogo` também considera o nome atual em
`profiles_publicos`, mantendo filtros, RLS e deduplicação por identidade.

### Lighthouse baseline

Primeiro baseline observado:

- Home: performance 53, accessibility 83
- Explorar: performance 65, accessibility 93
- Login: performance 97, accessibility 94, SEO 66

Usar esses números como ponto de partida, não como contrato permanente. Confirmar medições atuais antes de priorizar otimizações.

## Próxima regra operacional

Antes de sugerir ou iniciar um novo passo de refatoração, verificar no GitHub o estado real da PR/branch atual e não depender apenas deste arquivo.

## Ciclo de melhorias funcionais — 06/11/2026

- PRs #2192–#2198: Explorar ganhou filtros compartilháveis na URL, busca full-text sem refiltro indevido, estados de erro/retry, coleções pessoais paginadas, foco acessível dos filtros e descoberta paginada de autores com nome público atual; gêneros de autores e obras seguem a mesma regra.
- PRs #2199–#2200: Home, Biblioteca e Leitor usam a ordem persistida dos capítulos para continuar a leitura, com fallback para dados legados e capítulos com lacunas.
- PR #2201: sincronização de progresso entre dispositivos usa RPC condicional e tombstones de desmarcação. Migration aplicada à produção com checagem de permissões e `SECURITY INVOKER`; PR integrada à main.
- Gestão de comentários para autores: notificações de comentários e respostas em obras abrem diretamente o comments sheet da obra por `?comentarios=1`, preservando o mesmo fluxo acessível, paginação, respostas e RLS existentes.
- Proteção contra spoilers: fallbacks de notificações para comentários/respostas da Comunidade, capítulos e Diário, além de reviews, usam mensagens genéricas; o texto criado pelo usuário permanece no contexto de destino e não entra no estado nem na busca das Notificações.
- Histórico de moderação: o painel administrativo consulta sob demanda o log imutável de denúncias de conteúdo e perfil, com paginação, decisão, transição de estado, responsável e observação interna. O acesso continua limitado a administradores/moderadores pela RLS; usuários comuns não veem o painel nem os eventos.
- A migration de autores da #2197 também foi aplicada em produção. Não deduzir que toda futura migration foi aplicada apenas pelo merge.

### Ambiente local e consumo de recursos

- Docker Desktop com Supabase CLI **2.116.0** e portas locais adaptadas para o Windows; a configuração `supabase/config.toml` e a migration auxiliar de normalização ACL são **locais, não versionadas**.
- Testes de integração e Playwright devem usar Supabase local descartável. Para E2E, preferir `next build` + `next start`, com `--retries=0`; não atingir produção.
- No Windows foram observadas falhas ambientais preexistentes em `test:static` (auditoria 196/197 pela migration auxiliar) e `test:session` (251/279 pela resolução de imports). A CI Linux é a referência para distinguir ambiente de regressão, sem ignorar falhas novas.
- A conta Vercel foi alterada de **Pro para Hobby**. Snapshot informado em 06/11: **Deployment Storage 67,52 GB / 10 GB**; existe risco de bloqueio de novos deploys. A retenção foi configurada pelo responsável em **Canceled 7 dias / Errored 7 dias / Pre-Production 30 dias / Production 30 dias**. Não afirmar que a limpeza já reduziu o consumo sem nova medição.
- Permanecem habilitados deployments automáticos somente na `main` e **Vercel Authentication: All Deployments**. Continuar trabalho e QA local sem exigir deploy para cada PR; não excluir deployments nem modificar a proteção de produção sem autorização.

### Estado do ciclo

O ciclo funcional iniciado pelas melhorias de Explorar, continuidade de leitura,
gestão de comentários para autores, proteção contra spoilers e histórico de
moderação está concluído no código. Novas melhorias devem partir de uma nova
priorização, sem reabrir essas frentes sem evidência de regressão.
