# Agendamento: Diário atômico e invalidação ainda sem confirmação

## Fase 6B3 — capacidade limitada, sem autorizacao de ativacao

Migration `20261109215507_protecao_capacidade_outbox_capitulos.sql` adiciona
controle privado e incidentes de capacidade. Nenhuma extensao/job e instalado;
o runner permanece `habilitado=false`. API, service_role e papel operacional
nao recebem acesso as novas tabelas/funcoes. Sao INVOKER, search_path vazio,
com RLS e REVOKE explicitos. A entrada SQL restrita continua usando o contrato
anterior, sem novos privilegios para o papel NOLOGIN.

### Orcamento conservador proposto para revisao

| Recurso | Freio | Alerta consultavel |
| --- | --- | --- |
| Eventos pendentes, inclusive `solicitada_em` preenchido | 10.000 | 70% |
| Outbox, incluindo indices/TOAST | 16 MiB | 70% |
| Notificacoes, incluindo indices/TOAST | 64 MiB | 70% |
| Banco compartilhado | 400 MiB | 70% |
| Incidentes de capacidade preservados | 100, sem retomada na saturacao | pausa |

Estes valores sao limites iniciais de revisao, nao uma capacidade aprovada para
ativacao nem ampliacao de quotas do Storage. Podem ser reduzidos com gate fechado;
constraints impedem ultrapassar os tetos desta migration. Alteracao de orcamento
usa os locks do runner/capacidade. O plano identificado e Free, mas o consumo do
banco gerenciado NAO foi medido: a consulta remota agregada foi bloqueada pela
revisao automatica de seguranca. Nao extrapolar a medicao descartavel para producao.

### Garantias e limites

- Todo INSERT efetivo da outbox disputa um advisory lock transacional, atualiza
  uma barreira e verifica o limite antes de gravar. Commit/rollback incluem
  publicacao, recibo, Diario e notificacoes. Concorrente ocupado recebe `55P03`;
  snapshot REPEATABLE READ antigo recebe `40001`, sem exceder a ultima vaga.
  Conflitos idempotentes continuam sujeitos a unicidade/imutabilidade originais.
- O runner mede antes do lote e de cada item. Limite atingido ou medicao
  indisponivel fecha o gate, persiste pausa/revisao e incidente numerico, sem
  consumir a tentativa do proximo capitulo. Indisponibilidade que aborta a propria
  transacao continua dependendo da observacao independente da fase 6B2.
- `retomar_capacidade_runner_capitulos(revisao, justificativa)` exige headroom
  medido e gate fechado; registra decisao por CAS, sem habilitar nada. Retry de
  uma retomada antiga nao remove pausa nova. Nao ha retry infinito ou purga de logs.
- **Somente o limite de quantidade de eventos e transacionalmente estrito.**
  Medidas de bytes sao instantaneas, nao reservas de disco/WAL. Outros escritores,
  atualizacoes de leases e uma unica publicacao com muitos destinatarios podem
  crescer depois da medicao. Fan-out de notificacoes nao tem limite por capitulo.
  Portanto estes freios NAO comprovam suspensao antes de todo excesso fisico.
- Outbox integral: sem ACK, TTL, exclusao de pendencias ou interpretacao de
  `solicitada_em` como flush confirmado. Ao esgotar capacidade, parar e revisar;
  nao existe politica aprovada de eliminacao de eventos. Preservar uploads bloqueados.

### Medicao reproduzivel local (09/11/2026)

`node qa/scripts/measure-scheduling-capacity-local.mjs` exige CLI/Docker local;
usa clones TEMP com os mesmos campos/indices, rollback, sem modificar a outbox.
PostgreSQL 17.6, CLI 2.116.0. Valores sao amostras, nao limites superiores.

| Amostra | Tabela (bytes) | Indices (bytes) | Total |
| --- | --- | --- | --- |
| Outbox real inicial, 0 eventos (inclui espaco de QA anterior) | 24.576 | 49.152 | 72 KiB |
| Clone, 1.000 eventos | 196.608 | 196.608 | 384 KiB |
| Clone, 10.000 eventos | 1.613.824 | 1.474.560 | 2,95 MiB |
| Mesmos 10.000, cinco atualizacoes de lease na transacao | 10.715.136 | 5.324.800 | 15,30 MiB |
| Clone, 1.000 notificacoes | 663.552 | 991.232 | 1,58 MiB |
| Clone, 10.000 notificacoes | 6.340.608 | 8.118.272 | 13,79 MiB |

Notificador transacional usa a uniao deduplicada de seguidores da obra, favoritos
e seguidores do autor, excluindo o autor. A amostra custou cerca de 1,45 KB por
destinatario com mensagem de 300 caracteres; 1.000 destinatarios representam
aproximadamente 1,38 MiB pela media de 10.000 linhas. Exclui WAL, pior caso de
textos, outros escritores e efeitos de vacuum. Atualizacoes de lease podem
multiplicar o espaco mesmo sem novos eventos. Banco local inicial: 43.887.763 bytes;
notificacoes reais: 417.792 bytes. Nao medir somente tamanho logico das linhas.

Fontes: [medidas PostgreSQL](https://www.postgresql.org/docs/17/functions-admin.html#FUNCTIONS-ADMIN-DBSIZE),
[tamanho do banco Supabase](https://supabase.com/docs/guides/platform/database-size).
Quota de banco do plano e protecao fisica/read-only por disco sao contratos
distintos; nenhum deles substitui admissao transacional da aplicacao.

### Validacao e bloqueadores

pgTAP focado: 225/225 (34 novos); integracao nova: 9/9, com ultima vaga real,
snapshot antigo, timeout/rollback, resposta perdida, backlog, pausa/retomada,
falha de medicao e negativa da Data API para anon/authenticated/service_role.
Paginacao Data API 14/14 e anti-spam 5/5. O harness conserva todos os eventos e
incidentes sinteticos: 14 pendencias locais ao fim das duas rodadas investigativas,
sem apagar evidencia nem alterar eventos anteriores. Tres testes pgTAP legados
foram isolados pela propria fixture/contador inicial, sem presumir banco vazio.
O pgTAP completo inicial revelou essas suposicoes; a repeticao completa foi
bloqueada pela revisao automatica devido a TRUNCATE CASCADE em arquivos legados.
Os seis arquivos focados, com rollback e sem essa operacao, passaram. A rodada
completa em ambiente limpo continua pendente, nao declarada aprovada.
Build, Lint, Typecheck, audit de producao (zero vulnerabilidades), auditoria
estatica (199/199, mais 528 unitarios), sessao (2.002) e paginacao (37) passaram.
Playwright pertinente contra build local: 22/22, serial e sem retries, incluindo
Obra/Leitor desktop/mobile, axe, Back/Forward, BFCache e progresso autenticado
entre dispositivos. Fixtures E2E locais existentes reutilizadas; nao foi rodada
a suite inteira nem refeito o harness Cron. Nenhuma execucao remota manual de CI.

**Ativacao automatica continua NAO APTA:** falta certificar uso/headroom no
gerenciado, limitar/reservar fan-out fisico e crescimento compartilhado, aprovar
capacidade/retencao sustentavel sem perder eventos e concluir acionamento
independente/entrega de alertas da fase 6B2. Alerta consultavel nao e alerta
entregue. Nao ativar Cron/publicacao para testar esses bloqueadores em producao.

## Fase 6B2 — observacao independente e pausa, sem acionamento

Migration `20261109194305_observabilidade_privada_runner_capitulos.sql` prepara
um observador administrativo **em outra transacao**. Nao instala extensao, job,
credencial, endpoint ou alerta externo. Gate continua falso e papel NOLOGIN.
Todas as novas funcoes sao INVOKER, search_path vazio, sem EXECUTE para PUBLIC,
anon, authenticated, service_role ou o papel do runner. Tabelas privadas com
RLS, sem grants para essas identidades. Nao copiar erros SQL livres, conteudo,
usuarios ou tokens para logs operacionais.

### Fonte e garantias delimitadas

`configurar_monitor_capitulos(job_id, intervalo_segundos)` exige gate fechado,
monitor ainda inexistente, job novo/inativo e sem historico. Certifica somente
pg_cron **1.6.4 em modo de conexao**, log_run=on, banco/host/porta locais, papel
dedicado e comando exato `select historietas_privado.acionar_runner_capitulos()`.
Cadencia: 15–59 segundos ou um minuto (`* * * * *`). Identidade do job e OID da
extensao ficam fixados; recriacao/mudanca da fonte exige investigacao, nao rebind
automatico. Configurar NAO agenda nem autoriza ativacao.

`observar_runner_capitulos(100)` usa o mesmo advisory lock transacional do
runner. Se ocupado, nao disputa/avanca observacoes. Depois do rollback/commit
do executor, importa ate 100 resultados reais de `cron.job_run_details`, em
ordem de runid, parando no primeiro desfecho indeterminado. Cursor e evidencia
sao confirmados juntos: rollback do observador permite reprocessar; resposta
perdida nao duplica registros. `succeeded` significa somente sucesso do comando
SQL, nunca prova de publicacao. Backlog, atraso, erros por item e cinco tentativas
esgotadas continuam vindo das metricas da fase 6A, reunidas por
`saude_runner_capitulos()`; falhas globais sao observadas separadamente.

Tres `failed` consecutivos **observados** fecham o gate e abrem incidente
duravel. Um sucesso SQL posterior nao remove a pausa. Fonte indisponivel,
ancora ausente/alterada, saturacao e silencio superior a max(60 s, 3 cadencias)
tambem pausam conservadoramente; silencio nao e classificado como aborto.
Uma habilitacao isolada do gate e rejeitada enquanto a pausa estiver aberta.

`retomar_monitor_capitulos(revisao, justificativa)` exige administracao SQL,
gate fechado, job inativo, fonte consistente, nenhum resultado por observar e
capacidade de logs. Registra a decisao, sem habilitar gate/job e sem zerar retries
de capitulos. CAS por revisao evita liberar um incidente novo com uma resposta
antiga; repetir uma retomada ja registrada nao modifica pausas posteriores.
Justificativas sao enums (`configuracao_validada`/`causa_corrigida`), nao texto
livre. Tentativas esgotadas precisam da revisao operacional/reagendamento ja
previstos, nunca de retries ilimitados.

### Retencao e recuperacao

- Ate 1.000 observacoes: remover apenas sucessos com mais de uma hora, em lotes
  de 100; conservar a ancora atual e todas as falhas. Saturacao pausa antes de
  perder a proxima evidencia; o historico original do Cron nao e apagado.
  Uma hora equivale a ate 240 sucessos na cadencia minima; o limite nao deve
  saturar apenas pela retencao normal, se a observacao estiver funcionando.
- Ate 100 incidentes/retomadas no fluxo normal: ao atingir esse limite, nao
  permitir retomada. Nenhum incidente e eliminado. Arquivamento verificavel e
  revisao administrativa sao uma etapa futura; nao prometer retencao infinita
  com armazenamento limitado. As rotinas nao sao um substituto de backup.
- A outbox permanece integral e intocada: sem ACK, TTL ou purga. Quotas e
  suspensao dos uploads ilustrados nao mudam.

**Limites que ainda bloqueiam ativacao:** nao ha acionador automatico do
observador, alerta entregue ou garantia de pausa antes de uma quarta execucao.
O lock impede observar enquanto o runner esta ativo; o pg_cron pode iniciar
outro job antes da observacao. Nao existe prova de completude se o launcher
nao registrou uma execucao, se log_run foi desligado temporariamente ou se
alguem apagou resultados ainda nao observados. A ancora detecta sua propria
remocao/alteracao, nao todas as lacunas anteriores. Nao purgar o historico Cron
externamente. Reinicio pode produzir `failed` sem end_time: permanece incerto,
nao se inventa horario. Banco/observador indisponivel ou timeout do proprio
observador nao deixam evidencia transacional garantida. Uma consulta de saude
antiga nao e confirmacao de funcionamento atual.

Proxima etapa: certificar no ambiente gerenciado, mediante autorizacao separada,
autenticacao/modo/versao e um caminho independente limitado de observacao e
alerta. Definir o contrato de disponibilidade e acoplamento antes de cada novo
disparo caso se exija interromper estritamente apos o terceiro aborto. Ate la,
operacao automatica **NAO APTA**. Nao inferir garantias do trust TCP local.
O Supabase local concede leitura do historico a postgres (BYPASSRLS), mas o
dono da extensao e supabase_admin. O harness usa esse dono somente para
ativar/inativar/alterar o job descartavel via `cron.alter_job`; nao concede
esse poder ao runner. O procedimento administrativo equivalente no gerenciado
tambem precisa ser certificado, nao se presume superuser para postgres.

Referencias primarias: [Supabase Cron](https://supabase.com/docs/guides/cron),
[pg_cron 1.6.4](https://github.com/citusdata/pg_cron/tree/v1.6.4). O launcher
registra status fora da transacao do job; seu historico e mutavel e nao constitui
um log completo/inviolavel de todos os abortos possiveis.

### Validacao 6B2 local

pgTAP 646/646, integracao Cron real 9/9 e demais integracoes de agendamento,
outbox e projecoes 37/37. O cenario novo comprova tres statement_timeouts reais
com rollback dos efeitos/metricas internos, persistencia externa das observacoes,
lock compartilhado, pausa, retry antigo de retomada, falha da fonte, retencao,
saturacao e recusa de historico incompleto. Saturacao usa registros sinteticos
de QA explicitamente identificados; abortos e resultados Cron nao sao simulados.
Ao terminar, o harness remove a extensao/jobs e restaura NOLOGIN/gate false.
Lint, Typecheck, Build, auditoria estatica, sessao, paginacao, Data API e
anti-spam passaram. Audit de producao: zero vulnerabilidades.
Playwright inicial serial sem retries: 134/135; baseline axe da Obra falhou
com dois roots e, isoladamente, document-title serious. Investigacao posterior
com MutationObserver comprovou transicao de streaming/hidratacao: um root
visivel coexistiu com outro oculto e o titulo saiu do body antes de aparecer
no head. Frontend/dependencias eram identicos a main `50cb0841`, sem relacao
com o observador SQL. O teste passa a exigir raiz unica confirmada/interativa
e titulo correto no head antes do axe integral, em desktop/mobile. Sem mudar
timeouts, retries, regras axe ou codigo de producao. O smoke legado da Obra
tem seletor main igualmente ambiguo (CI `42690781924`, passou no retry) e merece
tratamento separado; CI verde nao equivale a ausencia de instabilidade.
Revalidacao com fixtures locais novas e CLI fixado: acessibilidade 11/11,
Obra critica 9/9 e agendamento/Diario 4/5, sem retries. Neste ultimo arquivo,
linha 190 encontra dois spans do texto do Leitor no desktop; publicacao e HTTP
200 ja haviam sido confirmados, e mobile passou. Seletor identico a main.
Na investigacao seguinte, instrumentar operacoes DOM comprovou um span visivel
coexistindo por cerca de 50 ms com uma copia oculta em `div#S:1`; apos hidratacao,
restou uma unica ocorrencia. A correcao e somente QA: aguardar a resposta da
barreira publica e uma unica raiz do Leitor, verificar titulo e texto exatos
dentro dela e exigir uma unica ocorrencia do texto. Mantem as verificacoes de
HTTP/SSR, Diario e retry idempotente do executor. Sem first(), timeout maior,
retries ou alteracao de producao. Instrumentacao removida; arquivo 5/5 aprovado
em condicoes normais, desktop/mobile, serial e sem retries.
Lint/Typecheck/Build passaram. A rodada ampla anterior nao e uma suite limpa:
127 passes, cinco falhas e quatro nao executados, com fixtures consumidas e
CLI ausente no PATH antes desse preparo. Essas rodadas historicas nao comprovam
suite integralmente verde; a ativacao automatica permanece bloqueada.
Validacao relacionada final apos a correcao: 31/31, incluindo 5/5 de
agendamento/Diario, 6 da rota canonica, 9 de reconciliacao/progresso e 11 de
acessibilidade. Fixtures novas, build local, workers=1, retries=0; Lint,
Typecheck, Build e diff --check passaram. Runner false e sem pg_cron local.

## Fase 6B1 — entrada SQL restrita, sem ativacao

Migration `20261109183045_entrada_sql_restrita_runner_capitulos.sql` cria o papel
`historietas_capitulo_runner` com NOLOGIN, NOINHERIT e sem superuser, BYPASSRLS,
CREATEROLE, CREATEDB ou replicacao. Nao cria senha, extensao, job ou endpoint.
Somente USAGE do schema privado e EXECUTE de `acionar_runner_capitulos()` sao
concedidos. O ADMIN automatico do criador no PostgreSQL 17 nao concede SET ou
heranca. Authenticator, anon, authenticated e service_role nao recebem acesso.
A instalacao exige gate false; nao liga nem desliga implicitamente um runner
que ja esteja em operacao. Nome de papel preexistente causa falha, nao e adotado.

A entrada e SECURITY DEFINER, owner postgres, search_path vazio e sem argumentos
ou SQL dinamico. Confere session_user dedicado e recusa SET ROLE; a elevacao
serve somente para chamar o runner existente com **3 itens/2.000 ms**. Nao
concede leitura/escrita de tabelas, execucao do nucleo ou alteracao do gate ao
papel operacional. O executor continua revalidando autoria, propriedade, termos,
tipo texto, revisao e prazo; auth.uid() nulo nao e usado como autorizacao.

O trigger invoker diferido `capitulos_manifesto_integro` mostrou uma dependencia
real no commit: depois do retorno da funcao definer, o papel restrito nao pode
ler capitulos para validar o manifesto. A entrada antecipa **somente esse
constraint** para IMMEDIATE, antes do runner, mantendo sua validacao dentro da
operacao autorizada. Nao o desativa, nao altera sua funcao e nao concede SELECT
da tabela. O runner modifica somente capitulos de texto; nao edita manifestos.
A mudanca de temporizacao e local a essa transacao operacional; nao combinar a
entrada com outras mutacoes. Outros caminhos e constraints permanecem intactos.

### Contrato dos timers e do futuro chamador

Defaults exclusivos do papel: statement_timeout 10 s, lock_timeout 500 ms,
idle_in_transaction_session_timeout 5 s. Eles sao carregados na nova conexao,
antes do comando fixo `SELECT historietas_privado.acionar_runner_capitulos()`.
A entrada recusa limites zero ou superiores, mas nao instala timers. Valores
de GUC nao provam quando o timer foi armado: a credencial SQL futura e confiavel,
jamais entregue a clientes ou usada para SQL arbitrario. SET dentro da mesma
expressao, wrapper ou comando nao substitui o contrato da conexao.

O teste utiliza pg_cron **1.6.4**, modo de conexao (`use_background_workers=off`),
sem SET de timeout no comando do job. A conexao autentica como o papel dedicado
e cada job executa uma instrucao/uma transacao, com commit automatico. O modo
background worker nao foi habilitado nem e certificado por esta entrega.
O timeout de ociosidade cobre sessao administrativa abandonada em transacao;
nao limita CPU de um comando ativo (statement_timeout cumpre esse papel).

Somente no Supabase descartavel, o harness instala/remove a extensao, concede
temporariamente LOGIN/USAGE de cron e agenda jobs de teste. Usa a regra TCP
loopback ja existente no container, sem editar pg_hba.conf, trust, senha ou
configuracao global. Ao terminar, remove jobs/extensao e restaura NOLOGIN/gate
false. Nenhum desses passos esta na migration de entrega. A autenticacao do
papel e a disponibilidade/versao/modo no Supabase gerenciado continuam exigindo
verificacao autorizada antes de rollout; nao extrapolar o trust local.

### Limites registrados na fase 6B1

A fase 6B2 acima acrescenta observacao administrativa e pausa/retomada limitada.
O texto abaixo registra o limite da entrada original; nao implica acionamento
automatico do observador nem recuperacao garantida durante indisponibilidade.

O historico `cron.job_run_details` registra falha por statement_timeout mesmo
quando publicacao, Diario, notificacoes, recibos, outbox e contadores do runner
sofrem rollback. `succeeded` nesse historico e sucesso SQL, nao prova de que
houve publicacao: um item pode retornar erro ou o gate estar fechado. Correlacionar
job/run, horario, duracao, status e metricas privadas; nao exportar SQLERRM,
contextos SQL, conteudo ou identificadores de usuarios para alertas publicos.
Ausencia de execucao, registro sem termino e indisponibilidade do banco devem
ser classificados como estado desconhecido, nunca como sucesso. Um futuro
observador precisa confrontar o historico com a cadencia e o prazo esperados;
esta fase nao implementa esse observador nem garante alertas durante uma queda.

Uma resposta perdida depois do commit nao autoriza repetir efeitos: estado e
recibo continuam autoritativos. Aborto global nao incrementa tentativas e pode
repetir indefinidamente se um acionador ingenuo for instalado. Ainda faltam
observador de abortos fora dessa transacao, politica de pausa/retomada, alertas,
cadencia aprovada, recuperacao apos indisponibilidade e capacidade/retenção.
Nada disso e declarado implementado por esta entrada; nenhum job fica instalado.

A outbox permanece integralmente privada e retida, sem ACK, purge ou expiracao
de pendencias. Chamar o runner nao aciona o consumidor Next nem confirma flush.
Uploads/publicacao/limpeza ilustrados permanecem suspensos. O 503 publico
historico continua inconclusivo, independente desta fase.

### Validacao local e limites

pgTAP confere papel, grants, gate e impersonacao. A integracao local exercita
Data API negada, login real do job, gate fechado, commit/rollback, concorrencia,
resposta funcional perdida, timeout real de 10 s, lock_timeout de 500 ms,
backoff e encerramento de sessao ociosa com liberacao do lock. Falhas injetadas
na fixture nao alteram triggers de producao. Os testes devem rodar em serie,
sem retries, e nunca junto do pgTAP que inspeciona o estado inicial NOLOGIN.
Foram aprovados 629 testes pgTAP (14 novos) e os oito testes do harness Cron,
sem retries artificiais. O ensaio encontrou o problema do constraint diferido
descrito acima e confirmou a correcao sem ampliar grants. O ambiente voltou a
gate false, NOLOGIN e nenhuma extensao/job Cron instalado. A suite integrada
de agendamento passou 45 testes; paginacao/anti-spam, 19; sessao, 2.002;
paginacao unitaria, 22. npm ci, audit de producao (zero), auditoria estatica,
Lint, Typecheck e build local passaram.

Playwright completo serial, sem retries: 129 aprovados, duas falhas e quatro
nao executados. O arquivo scheduled-chapter-diary falhou antes dos testes por
CLI ausente no PATH do processo; corrigido apenas o ambiente, seus cinco
cenarios passaram (desktop/mobile, duas instancias, cache, sitemap e Diario).
Resta o smoke legado `smoke-routes.spec.mjs:106`: locator('main') encontra o
loading e o root da Obra em verificacao simultaneamente. O snapshot ja contem
a obra; esse seletor e a aplicacao nao foram alterados nesta fase. Nao declarar
a suite completa verde nem corrigir esse fluxo dentro desta entrega SQL.
O 503 historico nao foi reproduzido nem teve sua causa esclarecida aqui.
As evidencias ficam na PR; este contrato nao e SLA de producao.

## Fase 6A — runner privado, operacionalmente desativado

`20261109171652_runner_privado_agendamento_capitulos.sql` acrescenta somente
`historietas_privado.executar_runner_capitulos(limite, orcamento_ms)` e métricas
administrativas. Não altera o executor transacional, seus gates, o consumidor
Next ou a outbox. Nenhum endpoint, Cron, extensão, job ou serviço foi criado.
O singleton `capitulo_runner_controle.habilitado` nasce **false**; nem usuário,
admin via Data API nem service role podem ler/escrever o controle ou executar
o runner. É invoker, search_path vazio, sem grants de API. Ativação exige outra
autorização explícita, rollout e implementação do acionador; merge não ativa.

### Orçamento e exclusão mútua

- Lote de 1–5 (padrão 3); orçamento cooperativo de 10–5.000 ms (padrão 2.000).
  Verifica o relógio antes de cada item e não inicia outro após o prazo.
  Um item já iniciado pode ultrapassar esse orçamento cooperativo.
- O chamador administrativo precisa configurar `statement_timeout` não zero
  de até 10 s e `lock_timeout` não zero de até 1 s, menor que o primeiro,
  **antes da instrução SELECT**, em transação curta. Sem isso o runner recusa.
  Configurar statement_timeout dentro da função não cria um timer novo.
  O guard confere valores, não consegue atestar quando o timer foi armado:
  wrappers que mudem o GUC dentro da instrução não satisfazem o contrato.
  O futuro acionador precisa comprovar a sequência e o cancelamento efetivo.
  [Contrato PostgreSQL](https://www.postgresql.org/docs/17/runtime-config-client.html#GUC-STATEMENT-TIMEOUT).
  O timeout global/cancelamento aborta o lote inteiro, inclusive contadores,
  publicação, Diário, notificações, recibos e outbox; não há commit parcial.
- Um try-advisory-lock **transacional global** impede dois runners simultâneos
  até COMMIT/ROLLBACK. Não há lease/takeover por tempo. Cada item reutiliza os
  locks e a revalidação do executor, inclusive contra execuções manuais.
  Não inverter a ordem pai/filho bloqueando a fila antecipadamente.
- Falhas de um item, incluindo lock_timeout, revertem sua subtransação e
  registram apenas código fixo `erro`; query_canceled propaga para abortar tudo.
  Não há HTTP nem espera externa sob locks. Um futuro chamador deve usar
  conexão dedicada, uma chamada por transação, commit imediato e timeout de
  sessão ociosa em transação; uma sessão abandonada conectada pode reter locks.

### Backlog, recuperação e observabilidade

Seleciona intenções vencidas em `agendado`/`erro`, respeitando o cooldown de um
minuto já existente. Menos recentemente atendidas têm prioridade, com desempate
por instante UTC e UUID. Não baixa todo o catálogo: consulta a fila privada e
limita resultados, embora o sort/join possa custar proporcionalmente ao backlog.
Não promete SLA sob indisponibilidade ou fluxo ilimitado de novas intenções.

Uma linha privada por capítulo/revisão atual registra tentativa, resultado e
próxima elegibilidade. São no máximo cinco tentativas, com backoff 60, 120, 240,
480 e 960 s, sem loop interno nem retry imediato. Esgotadas ficam pendentes para
diagnóstico humano e, quando apropriado, novo reagendamento autenticado/revisão;
não apagar a intenção nem rearmar automaticamente. Revisão nova não herda os
erros antigos. Cancelamento/edição continuam prevalecendo no executor. Erros
permanentes de autorização tornam a intenção bloqueada, sem publicar.

`metricas_runner_capitulos()` retorna apenas contagens privadas: pendências,
atrasados, maior atraso em segundos, retries esgotados, lotes, tentativas,
sucessos, erros, última execução e outbox sem confirmação. Não retorna UUID,
autor, sessão, título, conteúdo ou SQLERRM. Contadores abrangem apenas commits;
abortos, desconexões e indisponibilidade precisam ser registrados/alertados pelo
futuro acionador. Uma resposta perdida após commit não repete a publicação:
o estado/recibo do executor é autoritativo, não a resposta do cliente.
Agregações de métricas são separadas do runner e podem ser O(pendências/outbox);
não chamar por item nem criar coleta contínua nesta fase.

### Retenção conservadora e limites de ativação

- Outbox e snapshots imutáveis não são alterados pelo runner. `solicitada_em`
  não é ACK; lease vencido, timeout, idade e HTTP 202 não autorizam descarte.
- Reter **todas** as entradas sem confirmação verificável, inclusive após
  exclusão de conta/obra/capítulo. Nenhuma retenção por prazo, purge, cascata,
  compactação destrutiva ou tarefa de limpeza foi adicionada. Retenção é por
  tempo indeterminado até aprovação de contrato verificável por implantação.
- Revisões/barreiras garantem seleção de conteúdo público atual; não provam
  flush físico nem encerram a obrigação da outbox. Medir volume/idade antes
  da ativação e pausar a futura automação se o crescimento não for sustentável;
  não apagar pendências para caber no plano. Não ampliar quotas nesta fase.
- Ainda faltam acionador autorizado, cadência/recuperação, observação externa
  de abortos e política de alertas/capacidade aprovada. Não existe atraso máximo
  garantido durante indisponibilidade. O runner permanece desativado.
- Abas sem eventos não se atualizam imediatamente e bytes já entregues não
  são revogáveis. O 503 público anterior continua inconclusivo, separado desta
  fase. A corrida conhecida Storage/reservas é independente: uploads,
  publicação e limpeza ilustrados continuam integralmente suspensos.

## Fase 5C2B — sincronização da página de Obra (em revisão)

A página compartilha, somente no render atual, `obterSnapshotObraPublica` entre
metadata/JSON-LD e SSR do componente existente. O DTO leve é a única fonte de
sinopse, capa, tags e capítulos públicos; o loader GET/local anterior fica
desativado nesse caminho. Não se escrevem snapshots públicos em drafts/backups.
Listas vazias continuam obras válidas, e links/números usam a ordem persistida.

`GET /api/obra-publica` não usa sessão nem service role: reutiliza o loader
server-only e os POST/no-store ao primário antes/depois do Data Cache versionado.
HTTP/CDN/Vercel-CDN são no-store. A revisão conhecida permite resposta leve
`inalterada`, mas nunca dispensa as duas barreiras. Ausência confirmada remove
o conteúdo; erro temporário o oculta e oferece retry sem reload/404 falso.

Hidratação, rota, Back/Forward, foco, visibilidade e BFCache confirmam a projeção.
Eventos no mesmo frame são agrupados; eventos posteriores invalidam leituras
anteriores. O coordenador do Leitor é reutilizado, sem cache global de promessas.
Versões menores, pedidos antigos e identidades/gerações anteriores são recusados.
Revisão igual conserva a referência pública, sem repetir métricas/avaliações ou
visualizações. Um novo objeto RSC de mesma versão não reinicia a confirmação.

Progresso confirmado é lido separadamente, paginado sob a identidade/RLS atual;
não torna conteúdo local autoritativo. Troca/logout de conta invalida progresso
e operações pessoais, inclusive A→B→A. Métricas, avaliações e comentários mantêm
seus hooks; alterações de obra/geração limpam estado anterior antes da pintura.
Mutations atrasadas não podem aplicar estado à outra obra/geração/rota.
Antes da primeira confirmação da identidade/snapshot, os guards também impedem
ações otimistas locais; `obra=null` sozinho não era um bloqueio suficiente.
O conteúdo SSR permanece pintado, mas o `main` fica busy/inert até confirmar
identidade e leitura pessoal inicial. Assim, cliques não são consumidos antes
de o lifecycle estar pronto nem retomam um capítulo antes da leitura do progresso.
Métricas continuam paralelas ao progresso. Se esta leitura pessoal falhar,
mantém-se apenas progresso já confirmado da mesma identidade/geração, ou o
padrão sem leitura; eventos posteriores permitem nova consulta, sem loop.
O perfil público do autor só participa da apresentação quando sua identidade
corresponde à autoria do snapshot atual; a resposta anterior não determina
nome, link ou propriedade da nova obra.

O SSR aplica os mesmos estilos desktop/mobile existentes por media queries,
sem esperar a detecção de viewport no cliente. A área da avaliação conserva
sua geometria enquanto a autenticação inicial resolve, mas fica invisível,
inert e fora da árvore acessível. Isso evita os deslocamentos reproduzidos
ao entregar conteúdo antes da hidratação, sem novo layout ou consulta.
Seletores responsivos usam `:where()` para não sobrepor regras importantes
do tema, como a ausência de sombra no título.

Anexos entram somente como metadados. O componente existente solicita acesso
pelo assinador legado usando a obra, nunca um caminho/URL do snapshot. Sessão,
visibilidade, namespace ilustrado e autorização permanecem no assinador. URLs
temporárias ficam só no estado do componente e são descartadas ao trocar conta,
obra, geração ou revisão; não entram no cache público.

**Limites:** não há polling. Abas continuamente abertas sem novos eventos não
detectam imediatamente mudanças remotas. Bytes já entregues em HTML/RSC,
memória, histórico ou BFCache não podem ser revogados. A confirmação representa
o snapshot da última leitura, não bloqueia edições posteriores. Metadata/JSON-LD
já entregue só se renova com outra resposta SSR. Um 404 inicial não monta o
lifecycle. Cron, publicação automática, ACK da outbox e uploads ilustrados
continuam suspensos; merge não aplica migrations em produção.
A ativação deste código exige que o responsável já tenha aplicado a migration
da fase 5C2A (`20261109040303_snapshot_leve_publico_obra.sql`) no ambiente alvo.
Esta fase não cria nem aplica migration remotamente.

### Medição local da fase 5C2B

Build de produção, Supabase descartável em `127.0.0.1:54421`, visitante e obra
representativa E2E. Três contextos Chromium novos por viewport, servidor
reutilizado, estabilização por ausência de requests e observação adicional de
10 segundos. No build final, conteúdo útil exige um único main visível,
confirmado e fora de busy/inert, não uma cópia transitória do Router Cache.
Medianas (antes → depois); não representam latência de produção.

| Viewport | Requests | Supabase no navegador | Transferência (CDP) | Conteúdo útil | Estabilização | LCP observado | CLS |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Mobile 390 | 49 → 46 | 5 → 2 | 629.192 → 634.346 B | 446 → 447 ms | 2.334 → 1.326 ms | 456 → 264 ms | 0 → 0,000071 |
| Desktop 1440 | 43 → 41 | 5 → 2 | 583.516 → 588.381 B | 442 → 442 ms | 1.337 → 1.324 ms | 384 → 280 ms | 0,000007 → 0,000005 |

Saem os GETs cliente de obra/capítulos e a consulta combinada de métricas do
loader antigo. Permanecem perfil público e métricas da obra, além de uma
confirmação Next por hidratação. Não houve requests nos 10 segundos adicionais.
Isso **não** significa redução equivalente de consultas totais ao banco: cada
SSR/confirmação exige dois POSTs autoritativos; misses também leem páginas leves.
Progresso autenticado é uma operação adicional, separada desses números.
Não houve HTTP >= 400. Foram registradas interrupções de requests de
RSC/prefetch durante o carregamento; o motivo não foi capturado, portanto não
são classificados como falhas funcionais nem ignorados como sucesso de rede.

Lighthouse existente, três execuções por dispositivo, mesmos URL/fixtures e
presets. O baseline desktop teve `NO_LCP` em uma amostra: somente duas válidas,
sem substituir erro por zero. Medianas descritivas:

| Preset | Performance | LCP | TBT | CLS | Peso total |
| --- | --- | --- | --- | --- | --- |
| Mobile (3/3 → 3/3) | 41 → 48 | 6,27 → 6,48 s | 7,15 → 1,92 s | 0,000113 → 0,000113 | 706.610 → 711.914 B |
| Desktop (2/3 → 3/3) | 59,5 → 98 | 1,69 → 0,94 s | 813 → 108 ms | 0,000008 → 0,000005 | 600.715 → 680.472 B |

A variação local foi grande, inclusive entre contextos da mesma versão. A
medição final foi serial, sem outras validações concorrentes; o baseline não
ficou completamente isolado dessas cargas. Não se atribui causalmente a
melhora de score/TBT ao código. Conteúdo útil ficou estável, transferência CDP
subiu cerca de 0,8% e LCP Lighthouse mobile ficou cerca de 3% acima do baseline,
dentro das faixas variáveis observadas. Os dados comprovam a redução de
requests cliente e CLS próximo de zero, não uma aprovação de performance em
produção. Manter a draft para revisão/CI e eventual comparação isolada de ambos
os builds antes da ativação. Não foram adicionados prefetch, polling ou serviços.

## Histórico da fase 5C2A — snapshot leve antes da integração 5C2B

`obterSnapshotObraPublica` é uma entrada server-only preparada para a futura
integração SSR. Reutiliza a barreira POST/no-store antes/depois e cache por
obra/geração/revisão, com namespace próprio `obra-leve-v1`. Não é usado pela
página, metadata nem pelo lifecycle cliente nesta fase: não substituir o loader
atual até concluir a reconciliação da fase 5C2B.

A migration `20261109040303_snapshot_leve_publico_obra.sql` adiciona somente
`listar_capitulos_leves_projecao_publica`, STABLE/SECURITY INVOKER, com EXECUTE
explícito para anon/authenticated e nenhum grant para service role. Cada página
confere geração/revisão no mesmo snapshot SQL; cursor `(ordem,id)` e limite de
500 reutilizam os índices existentes. Não muda assinaturas, policies ou grants
de tabelas. Obra e capítulo precisam estar publicados, com autoria consistente;
drafts e 18+ continuam indisponíveis, inclusive para o autor pela RPC pública.

O DTO contém identidade, campos visuais públicos, capítulos leves e hrefs pela
`ordem` real, não pela posição. Não contém textos, comentários, métricas pessoais,
bytes, caminhos privados ou URLs assinadas. Capas com padrões de assinatura
conhecidos são omitidas. Anexos legados aparecem apenas como nome, MIME, tamanho
e categoria, nunca como autorização de acesso; o assinador existente continua
responsável pela sessão/visibilidade e pelo bloqueio do namespace ilustrado.
O renderer e os contratos de anexos existentes não foram substituídos.

Lista vazia válida retorna snapshot com `capitulos: []`; ausência pública
confirmada retorna `null` sem persistir negativo por slug desconhecido. Falha de
rede, página inválida ou mudança contínua de revisão propaga erro, sem devolver
lista parcial, fallback local ou 404 falso. As três tentativas limitadas da
barreira são mantidas; hits também exigem confirmação final no primário.

Não há endpoint novo, polling, listeners cliente, Cron ou publicação automática.
Esta entrega não corrige ainda conteúdo antigo no Router Cache/abas abertas nem
o mapeamento legado de capítulos da página de Obra. Abas continuamente abertas
sem eventos não detectarão mudanças imediatamente mesmo na futura fase 5C2B.
Uploads ilustrados e limpeza física continuam suspensos. A migration precisa
ser aplicada pelo responsável antes da futura ativação, nunca inferida do merge.

Comparação Data API local com 503 capítulos (duas páginas), bytes de JSON UTF-8
sem headers/compressão: lista anterior da Obra ~149 KB, nova lista versionada
~109 KB, RPC do Leitor com textos ~1.047 KB. Cada lista fez duas requisições;
isso não inclui as barreiras nem mede latência/transferência de uma página Next.
O loader faz duas barreiras por hit e, em miss, também as páginas necessárias.
Nenhuma consulta nova é iniciada pela UI nesta fase, pois não há consumidor.
Não alegar ganho de LCP/TBT nem comparar uma execução isolada como SLA. A fase
5C2B precisará medir SSR, hidratação, payload RSC e capítulos numerosos no build
real antes de ativar o contrato; o tamanho total do cache não é ilimitado.

## Fase 5C1 — reconciliação do leitor canônico por eventos

A rota canônica entrega UUID público da obra/capítulo, geração e revisão decimal
do mesmo snapshot confirmado no servidor. O cliente não reaproveita o loader
GET/local de `/ler-capitulo` para confirmar conteúdo público. O leitor interno
conserva seus contratos de drafts, autorização e fallback.
O opt-in é a projeção SSR: apenas gerar um href canônico por `pushState` em uma
instância iniciada por `/ler-capitulo` não a converte para o novo lifecycle.
Sem nova projeção SSR essa transição continua legada e permanece pendente.

`GET /api/leitura-publica` é somente leitura pública, sem sessão ou credenciais
privilegiadas. Reutiliza `obterLeituraCapituloPublico`: POST/no-store no primário,
cache identificado pela geração/revisão e conferência final da barreira. Resposta
HTTP, CDN e Vercel-CDN são no-store. A revisão conhecida apenas permite omitir
textos na resposta inalterada; nunca dispensa a consulta autoritativa.
O fetch mantém credenciais same-origin para não remover cookies de Deployment
Protection da Vercel. O handler não interpreta nem encaminha cookies/Auth para
o Supabase: seu cliente continua anônimo e o payload não é personalizado.

O lifecycle canônico confirma hidratação, troca de capítulo, Back/Forward,
retorno da aba (foco/visibilidade) e `pageshow.persisted`. Agrupa operações em
andamento da mesma rota/epoch de autenticação; retry explícito pode substituir
uma operação antiga. Cleanup, mudança de conta/rota e sequência invalidam
respostas atrasadas. Revisão menor da mesma geração é recusada, não aplicada.
IDs da query nunca substituem slug/número da URL canônica.
Retorno/BFCache e popstate invalidam pedidos anteriores, inclusive na mesma URL:
não reutilizar uma leitura iniciada antes do evento como sua confirmação fresca.

Somente conteúdo/metadados públicos são reconciliados. Estado pessoal é mantido
por capítulo/identidade; interações privadas carregam uma vez por conta/geração.
Revisão inalterada conserva referências dos objetos, evitando recarregar métricas
ou repetir efeitos de entrada. Ausência confirmada remove o conteúdo; falha
temporária oculta o conteúdo não confirmado e oferece retry, sem 404 falso ou
fallback público local apresentado como atual. Retry não recarrega a página.
O retorno de mutations/rollback aplica apenas o delta pessoal aos capítulos ainda
presentes: um snapshot anterior da ação não pode restaurar texto ou capítulos
removidos pela reconciliação. Novo objeto RSC com a mesma identidade/versão não
reinicia a hidratação; versão diferente exige nova confirmação autoritativa.

**Limites:** bytes já entregues (HTML, RSC, BFCache) não são revogados. Abas
continuamente abertas, sem novo evento, **não detectam mudanças remotas de forma
imediata**. Não há polling, Realtime, job ou serviço adicional. Confirmação é no
snapshot da última consulta, não um lock que impeça edições posteriores à leitura.
Metadata/JSON-LD do documento já entregue não são regenerados por essa troca de
estado cliente; nova resposta SSR conserva a barreira existente. A página de Obra
e seus lifecycles clientes ainda exigem fase própria. Agendamento automático,
Cron, UI, ACK da outbox e uploads/publicação/limpeza ilustrados seguem bloqueados.
Uma rota que já abriu no 404 global não monta este lifecycle do leitor; nova
navegação/requisição continua necessária nesse caso. Não há observador global de 404.

Conteúdo já conhecido mantém a geometria durante validação de navegação, com
`aria-busy` e ações pessoais aguardando confirmação. Em erro o conteúdo é ocultado;
o retry bem-sucedido restaura a rolagem da mesma rota. Persistência canônica altera
somente campos pessoais de obras locais existentes: nunca substitui drafts ou
edições do autor pelo snapshot público. Respostas completas do endpoint usam stream
JSON; a resposta inalterada não transfere novamente os textos. Permanece o contrato
anterior de carregar os textos públicos da obra, não uma otimização de obras ilimitadas.

O custo é uma chamada Next e duas RPCs pequenas por evento consolidado/cache hit;
no miss somam-se as páginas de dados versionadas. Não há cache global de promessas
no navegador, consultas por intervalo ou infraestrutura paga nova. Medições
locais e suas limitações serão registradas na PR; não constituem SLA Vercel.

## Fase 5B — barreira no servidor, sem ativação automática

`20261108205505_barreira_revisao_cache_publico.sql` adiciona somente leituras
SQL STABLE/SECURITY INVOKER, com EXECUTE para anon/authenticated, sem novo DML
ou privilégio de tabela. Deve preceder o app no rollout autorizado; não foi
aplicada em produção. RLS e bloqueio 18+ continuam aplicados.

### Obra e capítulo

- Cada loader começa por `obter_projecao_publica_obra`, POST/no-store, cliente
  público sem sessão. Non-GET usa o primário no roteador Supabase; não configurar
  endpoint dedicado de réplica para esses loaders.
- Data Cache: namespace de código + UUID da obra + geração + revisão decimal +
  tipo do payload + número canônico. `revalidate: 60` rege revalidação, não
  garante atualização nem exclusão física em 60 s. Chaves de revisões antigas
  podem permanecer até a evicção da plataforma, mas não são reutilizadas pela
  barreira. Tags por slug permanecem compatíveis com a outbox.
- Metadata vem do snapshot da RPC. Cada página da lista do leitor exige a mesma
  geração/revisão: dados e conferência na mesma instrução SQL. Mudança entre
  páginas recusa a coleta. Normalização e contrato do leitor são preservados.
- Antes de devolver inclusive um cache hit, OUTRO POST/no-store confere revisão.
  Mudanças descartam o resultado: até três tentativas, sem loop ilimitado. Erros
  propagam indisponibilidade, nunca cache antigo ou null/404. Escritor atrasado
  só ocupa uma chave antiga; duas instâncias não precisam compartilhar memória.
- Slug desconhecido não tem geração: não persistir seu null. Capítulo ausente
  em obra pública só pode ter null cacheado sob a revisão dessa obra. Exclusão,
  rename, despublicação, 18+ e recriação resolvem a identidade atual.
- `React.cache` compartilha metadata/HTML somente na mesma requisição, com o
  snapshot já confirmado. O adaptador autoritativo e suas duas leituras NÃO são
  memoizados. Isso evita duplicar barreiras dentro do mesmo render.
- `revalidate = 0` nas páginas impede Full Route/HTML/RSC Cache do servidor de
  pular a barreira; respostas locais devem ter private/no-store. O proxy decide
  existência por POST/no-store leve, sem texto ou GET de réplica; erros seguem
  ao loader, não são classificados como ausência.

### Sitemap

O XML deixa de usar ISR 3600. `/sitemap.xml` passa a Route Handler explícito
(`app/sitemap.xml/route.ts`), preservando URLs/campos/formato e escapando XML.
O metadata route anterior, mesmo dinâmico, emitiu `public, max-age=0,
must-revalidate` no teste real. O handler agora declara private/no-store também
para CDN/Vercel-CDN, sem depender desse padrão de cache de resposta.
A barreira é SHA-256 dos trios públicos ordenados
`obraId:geracao:revisao`, calculado em um snapshot SQL. Não é MAX(revisão) ou
timestamp: inclusão e exclusão também mudam a impressão do conjunto.

Um hit faz duas pequenas RPCs, antes/depois do payload cacheado. No miss, o
manifesto e os capítulos paginam por UUID (500 itens), sem textos nem N+1. O
SHA do manifesto coletado deve coincidir com a barreira e cada capítulo com a
geração/revisão de sua obra. Uma conferência antes de armazenar e outra antes
de devolver recusam coletas mistas. Preservam-se rotas estáticas, ordem real,
publicação, RLS, 18+ e lastModified. Erro não retorna XML parcial/antigo como
sucesso. O cache agregado tem namespace/impressão próprios, sem limpar catálogo.

A agregação custa O(número de obras públicas) por barreira no primário, embora
transfira só 64 caracteres. O miss pagina os metadados públicos existentes. Não
há lock global de escrita, tabela de epoch, serviço pago ou quota ampliada.
Catálogos muito grandes exigem nova medição; o sitemap único conserva o limite
arquitetural anterior, não é uma solução ilimitada de escala.
Versionar chaves aumenta a quantidade de entradas durante edições/publicações.
O volume/retenção real do Data Cache gerenciado não foi medido nem limitado por
uma API nova. Revisar bytes, churn e política operacional antes de ativar:
não confundir revalidação, flush solicitado ou TTL com limpeza física confirmada.

### Limites e bloqueios

Garantia de snapshot confirmado no servidor não revoga bytes já entregues.
Router Cache do cliente, prefetch explícito anterior, Back/Forward e abas abertas
podem reutilizar RSC/HTML SEM requisição. `revalidate = 0` não elimina esse
comportamento. Não introduzir reload, polling, flag experimental ou alteração
do histórico do leitor para mascará-lo. **Ativação automática segue bloqueada**
até contrato/validação dessas navegações e rollout de todas as instâncias.
Os lifecycles clientes existentes (`useObraPublicWorkLoad` e
`useLerCapituloInitialLoad`) ainda recarregam conteúdo/interações após hidratação
e possuem fallbacks locais. Eles não consomem esta revisão; a entrega desta fase
não deve ser apresentada como barreira ponta a ponta desses caminhos ou como
substituição das regras autenticadas/drafts do leitor interno. Integrá-los exige
fase específica, sem remover guards de identidade ou misturar dados privados.
Caches externos, restore ou mudança de policies exigem revisão de namespace e
rollout; testes locais não são SLA multi-região nem revogação instantânea.

A outbox fica intacta: `solicitada_em` não é ACK e nenhum evento é confirmado ou
removido por esta barreira. Cron, UI e publicação automática seguem desativados.
Uploads/publicação ilustrada/limpeza e retenção de quotas permanecem suspensos;
o diagnóstico local `392ee0f2` é preservado.

Referências verificadas: [renderização dinâmica](https://nextjs.org/docs/app/api-reference/functions/connection),
[cache sem Cache Components](https://nextjs.org/docs/app/guides/caching-without-cache-components),
[Router Cache/histórico](https://nextjs.org/docs/app/api-reference/config/next-config-js/staleTimes)
e [primário/réplicas Supabase](https://supabase.com/docs/guides/platform/read-replicas).
Também foram conferidos os documentos distribuídos com Next 16.4.5.

### Medições locais da fase 5B

Build de produção + Supabase descartável 54421, mesma fixture pública; tempos
de resposta SSR completa (não LCP, nem latência Vercel). Antes: três amostras
aquecidas. Depois: três coletas válidas, nove amostras aquecidas agregadas; a
primeira resposta de cada coleta foi excluída. Não houve medição remota.

| Resposta | Mediana antes | Mediana depois | Bytes do corpo antes/depois |
| --- | --- | --- | --- |
| Obra | 44 ms | 52 ms | 167.717 / 168.372 |
| Capítulo | 71 ms | 73 ms | 183.627 / 184.282 |
| Sitemap | 11 ms | 87 ms | 463.292 / 449.939 |

Não inferir ganho do leitor por execuções isoladas: a variação é ambiental. O
sitemap tem custo adicional comprovado ao abandonar a resposta ISR sem barreira.
Contagem real sanitizada nos access logs locais, por resposta aquecida: obra
faz duas RPCs de projeção; capítulo duas mais uma de existência no proxy; sitemap
duas RPCs de impressão. No código anterior, hits de Data Cache/ISR podiam não
consultar o banco (o proxy do capítulo fazia um GET); isso é análise de contrato,
não uma contagem de rede retrospectiva medida. No miss, somam-se as páginas de
dados e conferências descritas acima. Não há novas consultas de hidratação.
O sitemap transfere menos XML por serialização compacta, sem remover URLs.
Scripts temporários de medição foram removidos; logs locais ignorados não são
artefatos públicos, prova de multi-região ou SLA de produção.

### Medições locais da fase 5C1

Três contextos Chromium frios por viewport, antes/depois, mesmo build de produção
local/fixture anônima e dez segundos de observação. Servidor aquecido após a
primeira resposta; sem emulação de CPU/rede de aparelho real ou medição remota.
Medianas (ms); long tasks observadas não equivalem ao TBT do Lighthouse.

| Viewport | Requests antes/depois | Supabase no navegador | Confirmação Next | Conteúdo útil | Estável | LCP | CLS |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 390 px | 31 / 30 | 3 / 1 | 0 / 1 | 304 / 310 | 926 / 1102 | 304 / 352 | 0,164 / 0 |
| 1440 px | 31 / 30 | 3 / 1 | 0 / 1 | 246 / 250 | 855 / 899 | 244 / 288 | 0,022 / 0,022 |

Não há repetição da confirmação durante a observação. O endpoint novo substitui
os dois GETs de conteúdo do navegador, mas faz duas RPCs no servidor por hit:
**não é redução comprovada do total de consultas ao banco**. Contagem da tabela
é do navegador, não dos logs Supabase/SSR. Nenhuma mudança no prefetch global.
Recursos mensuráveis por ResourceTiming: ~454.767 → ~457.533 bytes (+0,6%);
exclui documento HTML e origens sem Timing-Allow-Origin. Bloqueio observado por
long tasks >50 ms foi zero nas duas versões. Não foi coletado TBT Lighthouse
comparável. LCP aumentou 48 ms no mobile e 44 ms no desktop; estabilização mobile
aumentou 176 ms. São custos observados da confirmação nesta amostra, não ganho
de performance nem prova de regressão em produção. Não interpretar os demais
deltas como ganho estatístico ou SLA da Vercel.

## Fase 5A — revisão transacional, ainda sem barreira nos caches

`20261108195558_revisao_transacional_projecao_publica.sql` mantém um ledger
privado por UUID de obra, com geração e revisão bigint monotônica. Sem FK/cascata:
exclusão conserva tombstone; recriar o mesmo UUID avança a revisão e troca a
geração. Reutilizar um slug resolve a identidade atual, não a obra antiga.
Não apagar esses registros nem restaurar contadores antigos isoladamente.

Triggers comuns às escritas manuais e agendadas atualizam o ledger na mesma
transação. Cobrem conteúdo/metadados da obra, slug, autoria, publicação,
classificação e capítulos publicados (conteúdo, ordem, vínculos, exclusão e
publicação/despublicação). Mudanças somente de métricas, timestamp automático
ou documento de busca derivado não avançam revisão; edições de drafts de
capítulos também não revelam atividade pelo contador. TRUNCATE administrativo
avança conservadoramente os registros, sem apagar o histórico. Backfill e
instalação dos triggers ocorrem sob locks que excluem escritas concorrentes.

Escritas serializam no registro do ledger; não fazem UPDATE da obra para refletir
alterações de capítulos. Rollback desfaz dados e revisão juntos. Como em outras
transações com múltiplos registros, deadlocks/serialização podem exigir retry da
transação inteira; nenhuma falha autoriza aplicar dados/revisão parcialmente.
Não usar timestamps, MAX de IDs, revisão do agendamento ou versão ilustrada como
substitutos deste contrato.

`obter_projecao_publica_obra(slug, numero opcional)` é SQL STABLE/SECURITY INVOKER:
uma única instrução/snapshot retorna identidade, geração, revisão decimal em
string, dados públicos da obra e somente o capítulo solicitado. Não agrega todos
os textos nem dados de conta, arquivos privados ou comentários. RLS existente
continua aplicada, junto do predicado público explícito: obra/capítulo publicados,
autoria consistente e classificações permitidas (18+ segue bloqueado inclusive
para o autor nesta RPC). Ausência, draft, despublicação e bloqueio retornam a
mesma indisponibilidade pública, sem vazar identidade ou revisão privadas.
Capítulo ausente em obra pública retorna `capitulo_indisponivel`, com a identidade
e revisão da obra; erros SQL/infraestrutura não são capturados como ausência.

O ledger tem RLS e SELECT apenas de três colunas para anon/authenticated, somente
quando a própria obra é publicamente legível sob RLS. Tombstones não são
legíveis e não há grants de escrita; service role não recebe acesso. O schema privado
continua fora da Data API. Os triggers definer internos têm search_path vazio,
owner postgres e nenhum EXECUTE concedido a clientes.

`lerProjecaoPublicaObra` é o adaptador server-only, com cliente público sem sessão,
POST RPC e fetch `no-store`. Cada invocação faz uma leitura nova, sem memoizar
barreiras. Bigint permanece string; falhas propagam. A leitura deve usar o
primário (não uma réplica atrasada). O snapshot é consistente no instante da
consulta, não bloqueia alterações posteriores nem apaga conteúdo já entregue.

**Ainda não resolve a confirmação do cache:** nenhum loader/cache Next, sitemap,
proxy, consumidor/outbox ou executor foi integrado a essa revisão nesta fase.
Listas paginadas/sitemap precisam de contratos próprios de snapshot/geração;
futura barreira deve conferir a revisão antes de servir o payload e evitar que
CDN/Full Route/Router Cache a pulem. Mudanças de policies, código de projeção ou
restore de banco também exigem nova versão/namespace de cache no rollout futuro.
Não dar ack do flush, ativar Cron, UI ou publicação automática. Uploads ilustrados,
publicação ilustrada e limpeza física permanecem suspensos.

## Fase 4 — entrega parcial e bloqueador de confirmação

Migration `20261108182554_outbox_cache_capitulos_agendados.sql`:

- `capitulo_cache_outbox` é privada, com RLS e sem acesso de tabela para anon,
  authenticated ou service role. AFTER INSERT do recibo cria o snapshot na mesma
  subtransação da publicação/Diário/notificações. Sem HTTP ou backfill.
  Recibos anteriores à fase 4 não recebem um snapshot histórico inventado.
- Capítulo/revisão identificam logicamente o recibo; obra, slug, ordem e instante
  são imutáveis. Não há FK com cascata: apagar capítulo, obra, Diário ou conta
  não pode apagar uma invalidação ainda pendente. Não contém texto nem sessão.
- Reivindicação exclusivamente server-side, lote de 1–5, SKIP LOCKED e lease de
  dois minutos. Não é lease de Storage nem liberação de quota. Expiração permite
  repetir a invalidação, nunca publicar novamente. Tentativas menos atendidas
  têm prioridade, evitando que um lote antigo esconda indefinidamente os novos.
- `solicitada_em` registra apenas que o consumidor chamou as APIs do Next.
  **Não existe ack, estado processado ou exclusão automática.** Falha tardia,
  resposta perdida ou lease vencido não eliminam a obrigação durável.

Os três loaders públicos mantêm cliente anônimo, filtros, consultas e TTLs,
mas recebem uma tag SHA-256 do slug conhecido ANTES de consultar o banco. Assim,
ausências também são etiquetadas; a mesma tag cobre metadata, resolução da rota
e todas as listas retornadas pelos capítulos da obra. As chaves foram versionadas
para não reaproveitar entradas antigas sem essa tag. Tags globais preexistentes
continuam declaradas, mas **não são invalidadas pelo consumidor**.
O versionamento causa um aquecimento inicial único desses loaders após deploy;
não é uma limpeza global disparada por cada publicação.

`POST /api/admin/cache-capitulos` é manual, sem caller na interface, job ou Cron:

1. Exige Origin com mesmo protocolo e Host real (sem confiar em forwarded-host), cookies de sessão válidos via
   `getUser` e gate SQL que confere sessão ativa e papel **admin atual no Auth**.
   Metadata editável, moderador, usuário comum, JWT de sessão removida ou papel
   revogado não autorizam. Nenhuma nova senha ou chave de automação foi criada.
2. Somente após autorização cria o cliente administrativo existente, que chama
   wrappers restritos ao service role. Não recebe IDs, slugs ou tags do cliente.
3. Solicita `revalidateTag(tagDoSlug, { expire: 0 })` para o slug imutável e o
   atual (caso renomeado), caminhos canônicos seguros e `/sitemap.xml`. Não
   invalida Home, Explorar, tags globais ou todo o catálogo. Sitemap é o único
   agregado necessariamente global, sem alteração de suas regras públicas.
4. Retorna HTTP **202**, `estado=solicitado_sem_confirmacao`, `confirmadas=0` e
   `publicacaoAutomaticaHabilitada=false`. Não retorna snapshots ou tokens.
   Exceções retornam erro genérico 503; a fila continua pendente.

### Por que não confirmar depois da chamada

No Next 16.4.5 instalado, `revalidateTag`/`revalidatePath` apenas acrescentam
`pendingRevalidatedTags` ao work store e retornam `void`. O App Route chama
`executeRevalidates` em `finalizeResponse`, **depois que o handler retornou**,
guardando a Promise em `pendingWaitUntil`. Um ack SQL dentro do handler seria
anterior à execução real e poderia perder uma invalidação que falha depois.

Teste executável usa o Next real com um backend de cache deliberadamente
falho: a chamada pública retorna normalmente sem executar o backend; o flush
posterior rejeita. Os imports internos existem APENAS nesse diagnóstico de QA,
nunca no consumidor de produção. `after()` também não fornece contrato público
documentado de flush anterior ao callback; não foi usado como suposta barreira.

**Bloqueador:** não há, nas APIs públicas auditadas do App Router atual, uma
Promise/recibo de conclusão do flush que permita confirmar duravelmente a outbox
sem depender de internals ou de uma suposição sobre o encerramento HTTP. Não
inventar ack com `await` sobre `void`, timeout, resposta 202 ou processo vivo.
Mesmo um ack de invalidação não garante atualização instantânea de abas já
abertas/Router Cache nem terminalidade de leituras antigas em andamento.

### Evidências e limites dos testes

- Unitários com backend controlado aquecem null de rota/leitura/metadata e listas
  positivas; verificam reconsulta, isolamento de outra obra, despublicação e 18+.
  São testes de contrato, não medição do Data Cache gerenciado da Vercel.
- pgTAP/Data API exercitam rollback após outbox, snapshot imutável, ausência de
  acesso, concorrência real, invisibilidade antes do commit, leases, retry e
  revogação. A fila sobrevive às exclusões e não duplica efeitos de publicação.
- Playwright aquece null real da metadata da obra, leitura/lista e sitemap no
  build de produção local e verifica os efeitos após acionamento manual em
  desktop/mobile (quatro cenários focados aprovados, sem retries). A resposta continua sem ack mesmo quando os efeitos locais
  são observáveis. O proxy impede aquecer null da leitura canônica por uma URL
  inexistente; esse caso permanece no teste de contrato, não é apresentado como
  invalidação negativa ponta a ponta de capítulo.

### Próximo passo, sem ativação nesta fase

Validar com o fornecedor um contrato público de conclusão/erro do backend de
cache, ou aprovar separadamente um modelo de gerações/barreira de leitura que
torne a confirmação verificável. Cache handler próprio, imports internos do Next
e autoconfirmação por webhook não são workarounds aprovados. Depois testar falha
entre flush e ack, resposta perdida, escritores de cache atrasados e ambientes
múltiplos/regiões. A fila atual é de uma única implantação; não pode haver um ack
global para caches independentes de desenvolvimento/preview/produção.
O teste serial de despublicação não comprova ausência de leituras antigas em
voo. Slugs original/atual são observados no claim; múltiplas renomeações
concorrentes e aliases intermediários também exigem contrato próprio antes
de prometer invalidação completa. Não apresentar os testes locais como SLA.

Sem prova de conclusão, o consumidor não descarta pendências nem promete entrega
automática. Retenção/crescimento e operação manual precisam de decisão antes de
ativar o agendamento. Nenhuma alteração foi aplicada em produção; uploads
ilustrados, publicação ilustrada e limpeza física continuam suspensos.

## Fase 3 — garantias preservadas

A migration `20261108164909_diario_publicacao_capitulos_agendados.sql` acrescenta
`publicou_capitulo` ao CHECK sem retirar os oito tipos anteriores. Não habilita
`publicou_obra`, outra incompatibilidade legada fora desta fase.

O trigger **AFTER INSERT** do recibo privado cria a atividade e vincula seu UUID.
Capítulo, notificações, recibo e Diário pertencem à mesma subtransação do
executor da #2229. Falha após criar a atividade desfaz todos os efeitos. Retry
reconhece o recibo e não reinsere atividades; remover voluntariamente uma
atividade zera a referência por FK e não autoriza sua recriação. Recibos antigos
não recebem backfill nem geram notificações/atividades retroativas.

Título, autor, capítulo, ordem real, URL e data vêm do banco, sem texto completo.
A atividade só é criada após publicação autorizada, não ao agendar ou cancelar.
O Perfil reconhece o novo tipo como “Publicou um capítulo.”, sem confiar em href
arbitrário da metadata.

Policies restritivas limitam o novo tipo à autoria real e impedem exposição a
terceiros de capítulos/obras não publicados, removidos ou 18+. A decisão de
privacidade do novo tipo lê as preferências reais por predicado privado definer,
sem conceder SELECT da tabela a anon. A expressão anterior é preservada em um
predicado privado **invoker**, não inline; mantém permissões/RLS e comportamento
dos tipos antigos. Isso é necessário porque CASE com subqueries diretas ainda
exige permissões ao preparar o SELECT. Não apresentar essa adaptação como uma
revisão geral das policies legadas do Diário.

O predicado é gerado com `search_path` vazio para que `pg_get_expr` qualifique as
relações antes de criar a função. A regressão executa também SELECT de tipos
legados, não apenas INSERT. Leitura anônima de tipos antigos continua sujeita à
limitação de permissões anterior; uma consulta mista pode falhar. Essa pendência
independente não foi contornada com grants nem apresentada como resolvida.

## Fase 3 — diagnóstico original do cache

O executor continua exclusivamente SQL administrativo, sem chamada Next.js,
endpoint, consumidor ou Cron. Não existe `revalidateTag`/`revalidatePath` no fluxo.

| Fonte | Cache atual | Consequência após commit SQL |
| --- | --- | --- |
| Obra/Diário/capítulos pela Data API | RLS e consulta direta | Publicação e atividade disponíveis conforme autorização |
| Metadata pública da obra | `unstable_cache`, 300 s | Não há invalidação pós-commit |
| Rota/leitura canônica | `unstable_cache`, 60 s | Lista antiga e resultados `null` podem continuar armazenados |
| Sitemap | ISR `revalidate = 3600` | Capítulo novo não entra imediatamente no documento já gerado |
| Verificação 404 do proxy | Consulta pública por requisição | URL antes ausente pode passar a 200 sem provar invalidação do Data Cache |

Os prazos são TTLs nominais, **não SLA de atualização**. Revalidação pode servir
valor antigo e ocorrer em background; falha de rede também impede renovação.
`unstable_cache` serializa `null` como um resultado válido. Invalidar apenas o
capítulo novo não renova listas de capítulos já incluídas em outras leituras.

Diagnóstico controlado com o Next 16.4.5 instalado e adaptador incremental em
memória: o loader retornou `null` uma vez; mudar a fonte para publicado não o
executou novamente, mantendo `null`. `revalidateTag` fora do contexto Next lançou
`static generation store missing`. É evidência do contrato da biblioteca, não
medição de produção nem prova de invalidação do servidor real.

O teste Playwright cobre 404 antes e 200/HTML inicial após publicar, com Diário
sem duplicação, em desktop/mobile. Ele não comprova remoção de uma entrada
negativa já persistida no Data Cache nem atualização imediata do sitemap.
Não alegar que a visibilidade de todas essas fontes está sincronizada.

## Fase 3 — proposta original, ainda sem confirmação final na fase 4

1. Usar uma outbox privada transacional vinculada ao recibo, com snapshot imutável
   de obra, slug, capítulo, ordem e revisão. O vínculo ao Diário editável/removível
   não substitui esse snapshot. Sem HTTP dentro da transação SQL.
2. Introduzir consumidor **server-only autorizado**, pós-commit, limitado e
   idempotente. Não abrir webhook público sem autenticação nem usar dados de
   navegador como prova de publicação. Sua forma de acionamento ainda exige
   aprovação; não instalar jobs nesta fase.
3. Acrescentar tags por obra/slug aos caches correspondentes, incluindo resultados
   negativos e listas retornadas por outras URLs da mesma obra. Hoje as tags são
   globais; não esvaziar todo o catálogo para publicar um capítulo.
4. Expirar imediatamente essas tags no contexto Next válido e invalidar o único
   agregado afetado, `/sitemap.xml`. Os loaders continuam anônimos/RLS; o consumidor
   não injeta dados privilegiados no cache público.
5. Confirmar processamento só depois da invalidação; em resposta perdida/falha,
   repetir sem publicar novamente, notificar novamente ou liberar rascunhos.
6. Testar cache positivo/negativo previamente aquecido, listas de outros capítulos,
   sitemap, concorrência, falha entre invalidação e ack, despublicação e 18+.

Essa ponte não pode compartilhar a atomicidade de uma transação PostgreSQL com
o cache Next. Uma outbox permite recuperação pós-commit, não commit distribuído.
Não está implementada nem comprovada nesta PR. Não ativar publicação automática
antes desse contrato e da definição operacional de latência/recuperação.

Referência: [revalidateTag](https://nextjs.org/docs/app/api-reference/functions/revalidateTag)
opera no servidor Next, em Server Functions/Route Handlers; não é uma função SQL.
Também foi inspecionado o código de `unstable_cache` do Next 16.4.5 instalado.
Uploads ilustrados e sua limpeza continuam suspensos.
