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
- A remoção de comentários em obras e capítulos é autorizada para o próprio comentarista, o autor da obra e administradores. A interface pode antecipar essa decisão, mas o RLS permanece como autoridade e deve validar a propriedade da obra, inclusive por meio do capítulo.

### Uploads ilustrados — suspensão após #2227 (08/11/2026)

- Suspender a ativação dos uploads ilustrados: não foi comprovado um contrato
  do Storage gerenciado que encerre todas as transferências já aceitas e impeça
  gravações físicas posteriores. Timeout, logout, lease vencido, aborto do
  cliente ou ausência momentânea do objeto não comprovam terminalidade.
- Preservar integralmente as fases 1–2C2d, o diagnóstico local `392ee0f2`, o
  bucket privado, ledger, recibos e retenção conservadora de capacidade. Upload,
  publicação ilustrada, assinatura em lote e limpeza física seguem bloqueados.
- Quarentena ou promoção por cópia não resolvem sozinhas a liberação de quotas
  e a exclusão segura de contas. Não relaxar essas garantias, ampliar quotas ou
  contratar serviços para contornar o bloqueador. Retomar somente com contrato
  verificável do backend e testes de corrida/recuperação correspondentes.
- A conferência de bytes da #2227 é somente observação; não é autorização para
  finalizar, limpar ou liberar capacidade. Ver
  `docs/capitulos-ilustrados-verificacao-recuperacao.md`.

### Agendamento de capítulos — fase 1 (08/11/2026)

- Agendamento é intenção privada, não autorização de publicação. Apenas drafts
  de texto em obras já publicadas podem ser agendados por sessão ativa do autor,
  com termos vigentes. Não retirar de circulação capítulos já publicados.
- A revisão do registro é monotônica, inclusive ao cancelar ou invalidar.
  Editar título/texto exige nova confirmação; o banco invalida a intenção antiga.
  Não reutilizar `versao_paginas`, que pertence ao manifesto ilustrado.
- Instantes são absolutos com fuso IANA separado; não guardar horário local sem
  offset como contrato de publicação. Nenhum executor/Cron é ativado nesta fase.
- O futuro executor precisa revalidar autorização e persistir publicação,
  resultado e efeitos idempotentes atomicamente. Nenhum estado ou resposta da
  fase 1 permite publicar. Uploads ilustrados e sua limpeza seguem suspensos.

### Agendamento de capítulos — fase 2 (08/11/2026)

- Executor é operação SQL administrativa privada/invoker, sem grant de API,
  endpoint, consumidor ou Cron. Não depender de `auth.uid()` nulo: autor ativo,
  propriedade, aceites, revisão e prazo são revalidados explicitamente sob locks.
- Publicação e notificações precisam concluir com o recibo na mesma transação;
  falha de notificação não pode ser silenciosamente tratada como sucesso. A
  variante estrita interna preserva destinatários/IDs/links do contrato legado,
  sem mudar a RPC best-effort existente. Retry não duplica esses efeitos.
- Intenção em erro continua cancelável/invalidável. Retry manual conserva sua
  revisão e aguarda um minuto; lote é limitado a dez capítulos. Não há execução
  automática, promessa de pontualidade ou dependência de serviço adicional.
- Não ampliar o CHECK do Diário nesta fase: `publicou_capitulo` usado pelo helper
  legado não é aceito no schema atual. Diário, cache e ativação futura exigem
  validação separada. Bloqueios ilustrados permanecem integralmente preservados.

### Agendamento — Diário e limite do cache (fase 3, 08/11/2026)

- `publicou_capitulo` é habilitado sem remover tipos anteriores nem habilitar
  `publicou_obra`. O Diário agendado é um efeito do recibo privado, atômico com
  publicação/notificações, sem backfill ou recriação após exclusão voluntária.
- A publicação no Diário não pode contornar autoria, preferências, publicação
  atual ou bloqueio 18+. Predicados privados evitam expor a tabela de preferências;
  a expressão legada permanece invoker e o novo tipo tem proteção restritiva.
- Cache Next e transação SQL não compartilham commit. Não fazer HTTP sob locks,
  invalidar antes de commit ou afirmar que TTL resolve cache negativo/sitemap.
  A ponte pós-commit (outbox/consumidor restrito) exige implementação separada;
  publicação automática e UI continuam desativadas. Ver
  `docs/agendamento-cache-publico.md`. Bloqueios ilustrados não mudam.

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
- O filtro literal de uma tag é aplicado no banco antes da paginação. A assinatura
  legada de `listar_obras_catalogo` continua intacta; a variante com `p_tag` exige
  os onze argumentos, sem defaults que tornem chamadas antigas ambíguas. Nenhuma
  falha da variante deve ser ocultada como consulta ampla bem-sucedida.
- Avaliação mínima compara a média não arredondada de notas elegíveis antes
  do cursor. É opcional e não modifica rankings nem exige quantidade mínima
  adicional de avaliações. A variante de 12 argumentos preserva as duas
  anteriores; cache sem confirmação da consulta atual não satisfaz o filtro.
- Exclusão de uma tag completa usa a mesma igualdade normalizada da inclusão,
  com `NOT EXISTS` antes da paginação. Não substituir por filtragem da amostra
  cliente; tags antigas do cache não comprovam ausência: exigir IDs confirmados
  pela consulta/identidade atuais, além da proteção local. Nenhuma variante
  antiga da RPC deve ser removida ou tornada ambígua.

- Exclusão de gênero usa somente o vocabulário público do Explorar, com aliases
  de Ficção e limites de termos, sem negar indiscriminadamente a substring da
  inclusão. Aplica-se no banco antes da paginação e no cliente como proteção
  adicional, exigindo confirmação remota atual para não certificar cache antigo.
  A variante de 14 argumentos não altera as quatro assinaturas anteriores nem
  a correspondência dos filtros inclusivos; tags não são inferidas como gênero.

## Comentários para autores

- A localização de comentários em obras reutiliza a central de Notificações e o comments sheet existente; não deve criar um segundo inbox nem duplicar consultas de comentários.
- O parâmetro público `comentarios=1` abre apenas o sheet da rota canônica `/obra/[slug]`. Links de capítulo, Comunidade e outros destinos não recebem esse estado.
- Respostas, moderação e permissões permanecem nos fluxos existentes e sob RLS; o deep link não concede novas capacidades.

## Proteção contra spoilers

- Comentários e respostas de capítulos ficam protegidos até leitura confirmada
  no Supabase para a identidade atual, propriedade da obra verificada ou
  revelação manual temporária. Capítulo aberto, porcentagem e cache local não
  comprovam leitura. A confirmação é por ID, sem inferir capítulos anteriores.
- Textos da discussão não são consultados antes do desbloqueio. Confirmações e
  revelações são invalidadas em troca de conta/capítulo; abertura do sheet,
  retorno à página e conclusão de marcação/desmarcação revalidam o estado, sem
  polling. O mecanismo é proteção de UX, não nova autorização de acesso.
- Notificações de comentários de capítulo, inclusive cache e registros legados,
  recebem título/mensagem genéricos antes de busca e exibição. Comentários
  gerais da obra não têm origem de capítulo inferida nem são alterados.
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
