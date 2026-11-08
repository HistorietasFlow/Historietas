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

### Capítulos ilustrados — contrato inicial, ainda inativo

- A migration `20261107223400_infraestrutura_capitulos_ilustrados.sql` adiciona
  `capitulos.tipo_conteudo` (padrão `texto`) e `versao_paginas`, sem converter
  capítulos existentes. Clientes não podem ativar `imagens` nem alterar a versão.
- `capitulo_paginas` contém um manifesto ordenado: UUID, capítulo, caminho privado
  imutável, dimensões, bytes, MIME e descrição acessível. O contrato limita a dez
  páginas de até 2 MiB, 2.048 × 4.096 px e oito milhões de pixels por imagem;
  JPEG, PNG e WebP. As posições são únicas/contíguas no commit e mudanças avançam
  a versão do capítulo. Publicação ilustrada exige manifesto não vazio.
- A projeção pública exclui `storage_path`. RLS depende da visibilidade do
  capítulo/obra, autoria real, publicação e bloqueio 18+ vigente. Não há DML
  concedido a `anon`, `authenticated` ou `service_role` na tabela de páginas.
- Reservas de uploads e outbox ficam em `historietas_privado`, com RLS e sem
  permissões para clientes ou service role. Exclusões de páginas/reservas
  preservam caminhos na outbox, inclusive em cascatas; não removem bytes.
- **Não está pronta para uso:** não existem upload, finalizador autorizado,
  assinatura em lote, executor de limpeza ou renderização
  ilustrada. Nenhuma escrita de páginas ou upload direto deve ser concedido
  antes dessas garantias.
- `arquivos-obras` permanece privado; policies dos anexos e quotas não mudam.
  Policies restritivas adicionais bloqueiam INSERT/UPDATE/DELETE autenticados
  somente no novo namespace `<usuario>/capitulos/`, até uma fase de upload seguro.
  A migration aborta se esse namespace já contiver arquivos, evitando bloquear
  silenciosamente anexos preexistentes.
  Seu teto de 30 objetos por usuário é compartilhado por todas as obras e também
  precisa comportar arquivos antigos, substituições e uploads pendentes.

#### Fase 2A — validação binária isolada, sem ativação

- `lib/server/capitulos-ilustrados/validar-imagem-pagina.ts` aceita somente bytes,
  identifica JPEG/PNG/WebP pelo conteúdo e usa Sharp para decodificar/re-encodar
  todos os pixels. Rejeita APNG, WebP animado e JPEG MPO; cabeçalhos/metadados do
  navegador não comprovam formato, dimensões nem integridade.
- Antes do decoder, PNG com metadados comprimidos possui orçamento agregado
  de expansão de 1 MiB. O limite de pixels não protege contra bombas zTXt/iTXt/iCCP.
- Verifica os limites da fase 1 antes e depois da codificação. Não redimensiona:
  aplica orientação, remove metadados e mantém o formato. JPEG é re-encodado com
  qualidade 100/4:4:4; isso não promete identidade pixel a pixel. A futura prévia
  do autor precisa usar os bytes finais, não o original. Se a saída superar
  2 MiB, a validação falha em vez de ampliar quotas ou reduzir a imagem sozinha.
- Retorna hash SHA-256 e metadados dos bytes canônicos; somente cópias desses
  bytes são acessíveis. Limita a duas validações simultâneas por instância do
  módulo, sem fila ilimitada, com timeout nativo de processamento de cinco
  segundos. Isso não substitui limite do corpo HTTP, rate limit ou autenticação.
- Sharp 0.35.5 já estava travado como dependência do Next; foi declarado direto
  na mesma versão para não depender de um pacote transitivo opcional. Nenhuma
  versão foi atualizada. O módulo é server-only e não possui endpoint/consumidor
  de produção nesta etapa. Os testes executam o decoder real com Node 22.
- **Divisão da fase 2:** a próxima parte deve contabilizar reservas com os mesmos
  locks/limites dos objetos legados, sem duplicar contagens quando o objeto surgir.
  Upload via service role não pode simplesmente contornar as policies de quota.
  Depois: fronteira autenticada com propriedade verificada, finalização atômica
  por versão/idempotência, reordenação/substituição/remoção e executor de limpeza
  com lease e revalidação de referências. Não abrir o namespace nem a interface
  de publicação até completar e testar esse fluxo. A fase 2A não cria migrations.

#### Fase 2B — reserva de capacidade, ainda sem upload

- `20261107235846_reservar_capacidade_capitulos_ilustrados.sql` adiciona RPCs
  autenticadas de reserva/liberação, com wrappers `SECURITY INVOKER` e núcleo
  privado `SECURITY DEFINER`, `search_path` vazio e grants mínimos. Não recebe
  identidade, caminho ou tamanho do navegador: verifica `auth.uid()`, autoria
  real de obra e capítulo e versão do manifesto; gera UUID/caminho no banco.
- Cada reserva compromete 2 MiB e um objeto por 15 minutos, sem renovar no retry.
  Chave idempotente é isolada por usuário e vinculada a capítulo/versão/formato.
  Liberação é idempotente; a chave encerrada não reativa. Há no máximo dez
  pendências por capítulo e cem novas reservas por usuário em 24 horas para
  limitar churn de registros. Tombstones não são excluídos nesta fase; uma futura
  retenção deve manter a idempotência e as referências da outbox.
- O ledger privado une reservas ativas e objetos dos três buckets nas quotas
  legadas: 30 objetos por usuário em `arquivos-obras`, 100 objetos/100 MiB por
  usuário e 5.000 objetos/700 MiB no projeto, sem ampliar limites por bucket.
  Caminho com objeto e reserva conta uma vez, cobrando o maior tamanho; objetos
  ainda sem metadata mantêm a reserva conservadora máxima do bucket. Expiração
  ou liberação não elimina capacidade ocupada por objetos físicos.
- Reserva e uploads legados usam o MESMO advisory lock transacional
  `historietas:storage:cota:v1`; leituras posteriores ao lock usam snapshots
  atuais. Obra é bloqueada antes do capítulo, e capítulo antes da reserva, para
  preservar ordem com exclusões em cascata. Conflito de versão retorna `PT409`,
  não `40001` (PostgREST pode repetir automaticamente falhas de serialização).
- A reserva pode preparar um draft de texto sem convertê-lo. Texto publicado
  não pode ser reservado; capítulos ilustrados próprios podem preparar futuras
  substituições, contando arquivos antigos até a remoção real. Leitura/RLS/18+
  não mudam. A resposta não contém caminho, URL ou token de upload.
- Liberação guarda o caminho na outbox quando não referenciado pelo manifesto,
  sem apagar bytes. Expiração é lógica, sem cron: o ledger ignora a capacidade
  pendente vencida; os registros/caminhos continuam disponíveis para a futura
  limpeza recuperável. O worker futuro deverá descobrir expiradas e revalidar
  referências e leases antes de remover via Storage API.
- **Ainda bloqueados:** upload de páginas (inclusive com reserva), ativação na
  interface, finalização, assinatura e leitor ilustrado. A próxima fase deve
  confirmar novamente sessão/propriedade/validade da reserva, validar bytes no
  servidor e coordenar upload/finalização/limpeza sem bypass administrativo das
  quotas. Não deduzir aplicação em produção pelo merge desta migration.

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
