# Agendamento — 6D10: saldo transacional da outbox, desativado

Base `14c13f6b` (#2257). Sem Cron, runner automatico, upload ilustrado ou
migration remota. Capacidade fisica continua **NAO APTA**.

## Contrato

Migration `20261110135028_orcamento_transacional_reivindicacoes_outbox.sql`:

- Singleton privado com RLS e nenhum acesso direto de anon, authenticated,
  service_role, runner ou monitor. Instalacao: habilitado=false, limite=NULL,
  consumidas=0, pausado=true, revisao=1. Nenhum limite de producao foi escolhido.
- Desativado preserva a selecao/retorno legados, sem contabilizacao retroativa.
  Portanto NAO existe protecao ativa de saldo enquanto o gate estiver falso.
- Quando ativado futuramente, cada linha efetivamente reivindicada custa uma
  unidade, inclusive recuperacao apos expiracao. Lote vazio nao debita nem
  atualiza o controle. Lotes continuam de ate cinco, reduzidos ao saldo restante.
- Controle FOR UPDATE precede eventos FOR UPDATE SKIP LOCKED. Dois consumidores
  aguardam a admissao SQL curta e recebem eventos distintos, sem um novo erro
  arbitrario de concorrencia. Nenhum lock atravessa operacoes Next/HTTP.
- Lease, incremento de tentativas e debito estao na mesma transacao. Atualizar
  o controle tambem e barreira de escrita: snapshot REPEATABLE READ antigo falha
  com 40001, nao reutiliza saldo. Rollback/timeout desfazem debito e leases.
- Ultimo debito confirma a pausa na mesma transacao. Chamadas seguintes recebem
  estado orcamento_esgotado; pausa com saldo retorna orcamento_pausado. Nunca []
  para representar saturacao. Recusas ja pausadas nao fazem novo UPDATE.
- O lock exclusivo do controle e adquirido mesmo com o gate falso, para
  serializar uma futura ativacao administrativa com reivindicacoes em andamento.
  Isso tem custo de lock/WAL; nao e uma otimizacao de WAL zero.

## Retomada administrativa

`historietas_privado.retomar_orcamento_cache_capitulos(revisao,limite,justificativa)`
e invoker, search_path vazio, sem grants para API/service_role/runner/monitor.
Exige SQL administrativo confiavel, revisao atual, pausa e teto explicito maior
que o consumo, sem reduzir o teto anterior. Justificativa e enum, nao texto livre.
Configurar ou retomar NAO habilita o controle nem o runner.
O owner SQL continua sendo a fronteira administrativa confiavel; estes contratos
nao pretendem impedir seu proprio owner de editar tabelas diretamente.

Historico privado guarda a revisao esperada e os parametros. Retry equivalente
retorna ja_registrado e o estado ATUAL, sem reabrir uma pausa posterior. Parametros
divergentes ou CAS obsoleto falham. Consumo acumulado nunca e resetado/devolvido;
ampliar o teto e uma nova decisao administrativa, nao renovacao automatica.

Nao ha funcao/endpoint de ativacao nesta entrega. Ativacao futura exige aprovacao
operacional explicita, configuracao validada e procedimento separado. Nao copiar
os valores pequenos usados exclusivamente nas fixtures para producao.

## Consumidor e preservacao

RPC existente mantem assinatura, owner e grants; nenhuma variante alternativa
pode contornar o saldo do nucleo. Retorno normal continua sendo array de eventos.
Estados de bloqueio sao objetos estritos, somente com estado. O consumidor
server-only reconhece a allowlist e retorna HTTP 503 sem invalidar/registrar,
sem expor saldo ou dados internos. Contrato desconhecido continua falhando.
Array vazio legitimo continua HTTP 202, zero solicitadas e zero confirmadas.

Registrar solicitacao continua permitido para lease valido durante a pausa,
sem novo debito. A funcao da #2257 NAO foi alterada: timestamp/ctid preservados
no retry, lease antigo/expirado negado. Evento solicitado continua pendente e
recuperavel; solicitada_em nunca e ACK. Sem exclusao, TTL, reset ou purga da fila.

## Garantias que NAO foram implementadas

- Contagem de abortos, WAL, bytes fisicos ou chamadas recusadas/vazias.
  Rollback desfaz contadores, nao WAL; locks e transacoes abortadas custam.
- Idempotencia de reivindicacao por identificador de requisicao. Resposta perdida
  mantem o lease e o debito confirmado; apos expiracao, nova reivindicacao debita
  outra unidade. Nao reembolsar nem tratar resposta ambigua como falha definitiva.
  Falha na invalidacao apos o claim tambem nao restitui o debito confirmado.
- Observacao independente das RPCs manuais: o observador atual do Cron monitora
  o runner, nao certifica abortos destas chamadas. O monitor externo e read-only.
- Certificacao de disco livre, retencao WAL, outros escritores e capacidade
  fisica. O saldo logico nao limita os demais fluxos nem autoriza ativacao.
- Exposicao do novo saldo no monitor, alertas automaticos, rearmamento automatico
  ou limpeza do historico. Sao contratos separados, nao implicitamente prontos.

## Validacao

Node 22.23.4, Supabase CLI 2.116.0, PostgreSQL 17.6 no descartavel `6d5-verify`.
Integracao nova usa somente URL HTTP/DB loopback, restaura saldos e leases
anteriores e conserva os eventos novos da fixture. Numeros 1–4 sao orcamentos
artificiais de teste, nao defaults.

- pgTAP completo: **831/831 em 29 arquivos**, incluindo **40/40** novos.
- Integracoes de saldo/outbox/#2257: **20/20**, seriais e sem retries. Arquivo
  novo FINAL **8/8**, com timeout armado somente DEPOIS da reivindicacao para
  comprovar rollback de lease e debito. Duas chamadas Data API disputam a ultima
  unidade; somente uma recebe evento. RR antigo falha 40001. Retomadas
  concorrentes equivalentes registram uma unica ampliacao.
- Unitario de consumidor/route: **11/11**, incluindo HTTP 503 e ausencia de
  efeitos nos estados de bloqueio, sem aceitar payload desconhecido.
- npm ci raiz/QA, audit de producao (zero), Lint, Typecheck e Build passaram.
  Sessao **2.002/2.002**, paginacao unitaria **37/37**, pos-estatica **60/60**.
  As **475** assercoes unitarias anteriores a auditoria passaram. Estatica no
  workspace **198/199**, guard da migration auxiliar preexistente; worktree
  temporario limpo contendo somente os nove arquivos da fase **199/199**. Nenhum
  guard enfraquecido e nenhuma alteracao local removida para forcar passe.
- Data API ampla: primeira rodada teve timeout de comentarios e 13 curtidas
  aceitas versus 60 esperadas, sintomas semelhantes aos da 6D5/6D8. Com o antigo
  Supabase pausado mediante autorizacao, sem outros testes concorrentes, rodada
  final **14/14** paginacao/progresso e **5/5** anti-spam. Sem reset de contadores,
  alteracao de timeout/assercoes ou retry automatico. O passe nao isola sozinho
  a causa de todos os sintomas iniciais.
- Playwright pertinente FINAL **5/5**, workers=1/retries=0, desktop/mobile e duas
  instancias Next; valida publicacao, Diario, consumidor, revisao/cache e sitemap.
  A primeira rodada falhou no primeiro cenario e os outros quatro nao rodaram:
  o Build incorporava a porta 54421 do ambiente E2E anterior, enquanto fixtures
  e runtime usavam 54321. Log comprovou ECONNREFUSED 54421; bundles tinham 19
  referencias a essa porta. Recompilar com o ambiente gerado do descartavel
  corrigiu a fronteira; bundles finais usam 54321 e os cinco passaram, sem mudar
  codigo/testes/timeouts. Preparar ambiente ANTES do Build: mudar NEXT_PUBLIC_
  somente ao iniciar next start nao corrige constantes ja incorporadas.

Nao foi repetido Playwright completo, Lighthouse, k6, ZAP, CodeQL ou Gitleaks
localmente. CI automatica da PR deve validar o commit, sem dispatch manual ou
polling continuo. Nao declarar aprovacao integral do pipeline antes dos checks.
Nao houve nova medicao/certificacao fisica ou leitura de producao.

O antigo Supabase foi pausado com consentimento, sem remover volumes; seus
14 eventos e runner=false foram conferidos antes e depois da pausa. Os mesmos
11 containers foram restaurados, sem recriar imagens/volumes. Vector/Analytics
ja apresentavam degradacao antes da pausa; nao foram corrigidos fora do escopo.
Descartavel parado COM backup: 39 eventos preservados, runner=false, Cron ausente,
saldo desativado/NULL/zero, revisao=1 e historico de retomadas vazio apos teardown.
Ambiente E2E anterior restaurado por hash; config.toml e migration auxiliar
conferidos por hash, sem mudancas. Scripts/backup temporarios removidos, sem
entrar no commit. Logs ignorados `qa/reports/6d10-*`.
Alteracoes preexistentes ficam fora do PR, inclusive o diagnostico 6D8B local.
