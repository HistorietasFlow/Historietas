# Desbloqueio operacional — preparacao apos #2262

Base `main`/`origin/main` `f18087e3`, 10/11/2026. **NAO APTO para ativacao.**
Escopo: preparar controles verificaveis, nao repetir a auditoria geral nem a
investigacao da Obra sem nova falha. Aplicacao, RPCs, RLS, grants, executor,
outbox e gates SQL permanecem inalterados; uploads ilustrados suspensos.

## 1. Monitor e watchdog: implementacao concreta, nenhuma agenda ativa

Reutiliza `chapter-scheduling-monitor.mjs`, snapshot SQL restrito e a issue de
alertas existente. A leitura SQL e o teste de transporte passam a ser etapas
distintas. Testar e-mail nao certifica leitura do banco; o modo de teste nao
recebe segredos SQL. Workflow existente agora tambem exige a branch main.

`chapter-scheduling-watchdog.mjs` e uma verificacao one-shot independente do
banco. Pode executar no workflow manual separado ou, futuramente, num host
existente fora do GitHub, SEM instalar servico nesta fase. Credencial restrita
ao repositorio: Actions read e Issues write; nenhuma chave Supabase/SQL.

- Consulta workflow fixo, ultima execucao CONCLUIDA da main e jobs da tentativa
  exata. Sao ate tres GETs; nao baixa logs/artefatos nem segue URLs da resposta.
- Exige job/etapa SQL unicos e concluidos, timestamps consistentes e intervalo
  explicitamente configurado. Inicio de job, teste de entrega, skipped, historico
  incompleto, JSON invalido ou tentativa diferente nao renovam a prova.
- Detecta workflow desativado, verificacao ausente/atrasada/falha/nao comprovada
  e falha de observacao da API. Configuracao ausente tambem falha fechada.
- Reutiliza o transporte com marcadores distintos por fluxo. Recuperacao do
  watchdog NAO limpa alerta do banco; deduplicacao/concorrencia dos workflows
  usam escopos diferentes. POST perdido e reconciliado por leitura futura,
  nunca reenvio cego; nenhuma retomada/alteracao de gates.
- Saida 0: prova recente sem alertas do watchdog; 1: condicao a investigar;
  2: entrega nao confirmada. Sucesso do watchdog nao atesta saude do banco,
  capacidade, processamento da outbox ou recebimento do e-mail pelo humano.
- Relatorio externo somente horario/codigos allowlist; sem identidade, URLs,
  logs, corpo SQL, tokens, caminhos ou medidas internas. Buffer/historico limitado
  do transporte existente falha fechado se nao puder reconciliar o fluxo.

Escolher um unico chamador por fluxo (ou serializacao comprovada no host externo).
Concurrency do Actions nao serializa um processo externo concorrente; a API de
comentarios nao oferece aqui CAS/exactly-once entre dois POSTs simultaneos do
MESMO fluxo. Esta preparacao nao habilita os dois chamadores ao mesmo tempo.

O workflow novo e **somente manual** e exige
`AGENDAMENTO_WATCHDOG_AUTORIZADO=true`, sem configurar essa variavel.
Monitor mantem seu gate separado. Nenhum `schedule` ativo foi adicionado.
O patch **inerte** `docs/operacao/agendamento-periodico.patch.example` prepara
as duas agendas. Em 11/11, a cadencia do watchdog foi aprovada para preparacao:
`*/15 * * * *` UTC; a cadencia SQL continua placeholder. Nao aplicar o patch
inteiro. A aprovacao da cadencia NAO autoriza ativacao.
Nao copiar para `.github/workflows` nem aplicar antes de revisao/autorizacao.
Eventos schedule usariam leitura real (`inputs.teste_entrega` ausente/false);
workflow_dispatch continua com teste de transporte=true por padrao.

Configuracoes obrigatorias SEM defaults novos:

| Variavel | Significado/aceite |
| --- | --- |
| AGENDAMENTO_MONITOR_ESPERADO_DESDE | Instante UTC aprovado de inicio da expectativa; teste antigo nao e heartbeat |
| AGENDAMENTO_MONITOR_MAX_INTERVALO_MS | Maior intervalo entre conclusoes SQL aceito; inteiro positivo aprovado |
| Cadencias UTC dos dois workflows | Aprovadas separadamente, nao extraidas dos valores sinteticos dos testes |
| AGENDAMENTO_ALERT_ISSUE | Issue aberta com marcador de aprovacao existente; sem novo destino implicito |

Antes da primeira prova real, o watchdog informa nao comprovada/ausente, nunca
recuperacao falsa. O modo legado continua saindo com erro para alertas de saude;
a etapa v2 separa execucao/entrega desses alertas, conforme a continuacao abaixo.
O watchdog nao procura uma execucao antiga verde para ocultar a ultima falha.
Uma execucao manual posterior pode exigir nova verificacao real antes de ficar
saudavel: preferimos incerteza explicita a tratar teste de e-mail como sucesso.

### Integracao Sentry Cron Monitor preparada (sem ativacao)

O mesmo workflow do watchdog agora chama
`chapter-scheduling-sentry-checkin.mjs`: **somente** `schedule` da `main` no
workflow e repositorio esperados emite `in_progress`, seguido de `ok` se a
verificacao real
e a entrega GitHub terminarem com codigo 0; resultados 1/2 ou excecoes emitem
`error`. `workflow_dispatch`, teste de e-mail e execucao simulada nao renovam o
Sentry. Falha no envio inicial/final deixa o job com erro; falha na abertura nao
impede a tentativa de alerta GitHub. Resposta perdida nao recebe retry cego.
Se o GitHub nao iniciar o workflow, nao ha check-in e o proprio Sentry deve
classificar a execucao como ausente; se parar apos o inicio, como timeout.

Continuam **inativos** o `schedule`, o Cron SQL, o runner e a publicacao
automatica. Em 11/11/2026, o responsavel informou ter criado monitor/alerta no
Sentry e cadastrado o secret `AGENDAMENTO_SENTRY_CHECKIN_URL` no GitHub.
Configuracao/secret nao foram lidos nesta revisao; nenhum check-in real enviado.
Antes de ativar, conferir janela de atraso, custo/limite do plano e destino de
e-mail, incluindo `missed`, `failed` e `timed_out`, com teste controlado de falta
de execucao e recebimento. A existencia do secret nao habilita os gates.
O monitor deve ser preconfigurado, sem auto-criacao por payload.

Cadencia de 15 minutos aprovada para preparacao, nao aplicada. Demais valores
a conferir/aprovar: Sentry no mesmo cron UTC, margem de check-in 10 minutos, runtime maximo 3
minutos (workflow limita o job a 2), limiares de falha/recuperacao 1. GitHub
Actions pode atrasar/descartar schedules; a margem reduz falsos alertas, mas
nao constitui SLA. A cadencia pressupoe aproximadamente 2.880 execucoes do
watchdog em 30 dias, alem das do monitor SQL; confirmar minutos GitHub e quota
Sentry antes de aprovar. O plano Developer listado publicamente pelo Sentry
inclui um Cron Monitor, mas a disponibilidade do slot nesta conta nao foi
verificada e excedentes podem gerar custo: nao criar sem essa verificacao.

Configurar como **GitHub Actions secret** `AGENDAMENTO_SENTRY_CHECKIN_URL`: URL
de ingestao HTTP/Relay do Cron Monitor, copiada do Sentry para o projeto e
regiao corretos, com slug real no lugar do placeholder. O caminho e
`/api/<projeto>/cron(s)/<slug>/<chave_publica>/`; a chave embutida na URL
deve ser tratada como segredo. A API legada de organizacoes e o secret DSN
separado nao sao usados. O inicio e o fim enviam o mesmo `check_in_id`
gerado localmente via HTTPS, com `status=in_progress` e depois `ok` ou `error`.
O script restringe host/caminho, rejeita redirects, limita cada request
a 8 segundos e nunca registra URL, resposta ou credencial. O workflow manual
nao envia check-ins mesmo que os secrets ja existam. Falha conjunta GitHub +
Sentry ou alerta Sentry nao entregue ao responsavel continua sendo risco a
homologar; o GitHub nao e tratado como testemunha de si mesmo.

### Limite externo que o codigo nao pode remover

Workflow separado detecta falha **do outro workflow**, nao queda conjunta do
GitHub/Actions/canal. O observador privado SQL compartilha a falha do banco.
O Sentry preparado oferece uma testemunha externa da ausencia do watchdog,
mas agenda, configuracao do monitor/alerta e recebimento ainda nao foram
certificados. Monitor/alerta/secret foram provisionados segundo o responsavel.
Saida 2 local nao e alerta entregue. Nao adicionar um
terceiro workflow no mesmo Actions como falsa independencia.

GitHub documenta schedule best-effort: pode atrasar/descartar execucoes e ser
desativado por inatividade. Se for exigido prazo maximo rigido, esta alternativa
nao satisfaz sozinha. Se aceitar best-effort, registrar atraso aceito, responsavel,
janela de observacao e teste de uma verificacao deliberadamente omitida. Nao
presumir recurso gratuito/instalar outro servico. Transporte GitHub/Gmail pontual 6D2 ja
validado e reaproveitado, sem nova escrita remota nesta fase.

Custos futuros devem ser calculados, nao ativados: com cadencia `P` minutos,
`ceil(43200/P)` execucoes por 30 dias por workflow, mais execucoes manuais;
minutos cobrados dependem de duracao/arredondamento/plano. Watchdog usa ate tres
GETs de observacao mais transporte limitado existente. Na preparacao atual:
zero novas execucoes periodicas/servicos/dependencias/custos recorrentes criados.

### Dependencia identificada e corrigida na continuacao da #2267

O snapshot SQL usa papel dedicado NOLOGIN, TLS e leitura restrita; conexao
gerenciada e gates requerem provisionamento/autorizacao separados. O monitor
retornava falha para alertas de saude: mesmo snapshot valido inclui
`WAL_ORCAMENTO_NAO_DEFINIDO` e `DISCO_MEDICAO_INDISPONIVEL`; runner false inclui
`RUNNER_DESATIVADO`. O usuario autorizou separar execucao/entrega de saude.
Etapa `Comprovar observacao SQL e entrega (v2)` usa opcao explicita do monitor:
somente SQL concluido, snapshot valido e entrega confirmada permitem codigo 0.
Allowlist de diagnosticos operacionais permite runner desligado/capacidade sem
suprimir os alertas. SQL/JSON/contrato/tempo invalidos, telemetria incompleta,
codigos desconhecidos ou teste de transporte nunca comprovam a execucao.
Modo legado mantem seus exit codes. Nenhuma mudanca SQL, permissao ou gate.

Watchdog aceita somente a etapa versionada e a tentativa recente/exata;
execucoes antigas nao servem de prova. Entrega `obsolete` agora falha no monitor
v2 e watchdog. Resposta perdida exige nova leitura/reconciliacao, sem POST cego.
`ok` Sentry prova execucao/entrega, nao saude, capacidade fisica ou recebimento
humano. Homologacao externa continua pendente, sem agendas/check-ins reais.

Preparacao e checklist de falha/ausencia/recuperacao em
[`sentry-watchdog-homologacao.md`](../operacao/sentry-watchdog-homologacao.md).
Testes integrados desde a leitura SQL simulada ate wrapper/watchdog distinguem
saude ruim de falha de verificacao e mantem os alertas de saude. Dispatch manual
nunca envia check-in. Workflow permanece somente manual; nenhum secret/gate alterado.

Validacao anterior da preparacao: 48/48 testes focados (monitor, watchdog e Sentry),
Lint, Typecheck, Build, test:static (inclui auditoria 199/199), test:pagination,
test:session e audit de producao (zero vulnerabilidades) aprovados. YAML dos
dois workflows e git apply --check do hunk do watchdog validados sem aplica-lo;
diff --check limpo. Node 22.23.4, npm ci --ignore-scripts com lockfile intacto.
Build sem credenciais Sentry/URL Supabase de producao. Nao repetidos pgTAP,
Data API mutante ou Playwright: somente docs/template inerte/testes mudaram.
Nenhum teste de entrega remota ou check-in real; CI do novo commit e homologacao
operacional permanecem verificacoes distintas dos testes locais.

Continuacao de correcao na mesma PR: **55/55 testes focados** aprovados, incluindo
cadeia monitor SQL/entrega -> etapa v2 -> watchdog -> Sentry com transportes
simulados, timeout/JSON invalido, resposta perdida, recuperacao, entrega obsoleta
concorrente, isolamento manual e rejeicao de etapas antigas. Lint completo e
focado, YAML, Typecheck, Build, test:static, test:pagination, test:session e audit
de producao aprovados. Resultados de CI do commit final ficam na PR; nao reutilizar
CI verde do commit anterior como prova desta correcao. Sem nova validacao remota
do banco/Sentry, pgTAP ou Playwright local; SQL, RLS e aplicacao inalterados.

## 2. Orcamento: decisao preenchivel, nao novos numeros arbitrarios

Reutilizar [criterios da #2262](CRITERIOS_ATIVACAO_AGENDAMENTO.md), nao criar
outro saldo SQL. Limites demonstrados no codigo atual:

| Limite existente | Cobertura real | Nao certifica |
| --- | --- | --- |
| 6D4: 100 destinatarios/linhas por capitulo; 8 KiB por linha, 256 KiB por capitulo; saldo total 1.000 linhas/2 MiB | Admissao transacional de notificacoes agendadas, antes da publicacao, rollback integral | Outras notificacoes, tamanho fisico/WAL ou capacidade global |
| 6B3: 10.000 eventos; amostras 16 MiB outbox/64 MiB notificacoes/400 MiB banco | Freios e pausas logicas existentes | Reserva de disco ou WAL, bloat e escritores em voo |
| 6D10: saldo aprovado por CAS; ate cinco claims por lote | Claims confirmados, sem reutilizar debito | Intencoes vazias, tombstones, abortos, todas as sessoes/requests |
| Uma intencao pendente/gate 6D12 | Fecha novas admissoes diante de incerteza | Conexoes concorrentes recusadas ou CPU/WAL anterior ao rollback |

Nenhum limite acima e ampliado ou apresentado como aprovacao fisica.
Medicoes ja disponiveis: producao agregada historica ~21,79 MiB banco,
0,03 MiB outbox e 0,20 MiB notificacoes; 6D3 local, 10.000 eventos apos varias
rodadas de leases ~14,5 MiB; probe de claim local 11.348 bytes WAL. Sao amostras
com condicoes/indices especificos, NAO tetos por item nem disco livre atual.
Nao repetir carga nem extrapolar maxima/p95 para garantir ausencia de esgotamento.

Folha obrigatoria de aprovacao, com responsavel/revisao/validade:

| Campo a aprovar/medir | Regra verificavel antes da ativacao |
| --- | --- |
| H, horizonte finito | Parada/revisao obrigatoria no fim; nao operacao ilimitada sem retencao segura |
| A, admissoes totais | Incluir vazio/tombstone/reconciliacao sem UUID; saldo de claims sozinho nao cobre A |
| X, envios e concorrencia | Limitar no chamador antes de enviar; UUID estavel e reconciliacao antes de retry ambiguo |
| B, bytes de evidencias | Outbox+indices+bloat+recibos+intencoes+tombstones+historicos cabem em H, sem purga |
| F, idade/erro de medicao | Fonte homologada, timestamp de coleta, ausencia/obsolescencia impedem nova admissao |
| M, margem de recuperacao | Cobre crescimento durante atraso de deteccao/parada, IO em voo, WAL retido, temporarios/manutencao e demais escritores |

Aplicar a desigualdade fisica da #2262 e, separadamente, a quota comercial do
banco. `pg_stat_wal` e cumulativo/resetavel; `pg_ls_waldir` e ocupacao; nenhum
mede disco livre. Rollback nao apaga WAL. Sem limite superior justificavel para
TODOS os termos e horizonte, capacidade permanece NAO APTA. O threshold de
read-only do fornecedor e best-effort, nao uma reserva do aplicativo.

Pendencia de medicao externa: GET oficial `/v1/projects/{ref}/config/disk/util`,
com `infra_disk_config_read` apenas. Certificar acesso Free, timestamp/unidades,
erro/frescor/latencia e 401/403/429/500; nao usar PAT amplo como substituto.
Faltam limites/condicoes do provedor para WAL, temporarios e operacoes em voo.
Sem esses dados ou contrato de risco explicitamente aceito, nao escolher M por
percentual arbitrario. Outbox/recibos/tombstones ficam integrais, sem ACK/TTL.

## 3. Cron gerenciado e chamado existente SU-546160

O ID foi fornecido pelo responsavel. O conteudo/respostas do chamado nao estao
nos arquivos acessiveis nem nas issues pesquisadas; nao presumir que ja foram
respondidas as garantias abaixo. NENHUM novo chamado ou follow-up enviado.
Anexar a resposta relevante sanitizada ao mesmo registro, com data e escopo do
projeto, antes de marcar cada item aprovado. Documentacao geral/template nao e
resposta especifica do ambiente.

Procedimento minimo preparado, **sem instalar/ativar Cron ou runner**:

1. Obter aprovacao para inventario somente leitura do destino. Executar
   `docs/operacao/homologar-cron-somente-leitura.sql` com credencial administrativa
   autorizada, nunca pelo cliente/PostgREST; nenhuma senha em argumentos/logs.
   Nesta fase o arquivo e preparado/local, nao executado remotamente.
2. Conferir extensao/modo/log_run disponiveis e reais, defaults por papel/banco,
   membros e grantor, negacao da entrada a anon/authenticated/service_role.
   Ausencia/NULL/erro de permissao e pendencia, nao permissao para conceder acesso.
   Nao criar job para descobrir se funciona; papel continua NOLOGIN/gate false.
3. No SU-546160, obter o que nao pode ser inferido do inventario:
   - HBA/auth efetiva no caminho libpq de loopback do job dedicado, sem senha
     privilegiada no comando e sem conexao externa indevida.
   - Suporte ao provisionamento minimo e revogacao posterior dos privilegios de
     scheduler; sem superuser, runtime postgres/service_role ou mudanca global.
   - Modo/versao sustentados e aplicacao dos defaults na conexao REAL antes da
     instrucao; versao diferente de 1.6.4 requer certificacao, nao guard relaxado.
   - Semantica e persistencia de job_run_details em timeout/crash/restart,
     indisponibilidade do launcher e forma de perceber lacunas de historico.
   - Limites reais/telemetria de disco/WAL/retencao do Free e frescor da API.
4. Depois, em ambiente GERENCIADO de homologacao autorizado ou por evidencia
   equivalente especifica do provedor, repetir somente provas faltantes da 6D1:
   session_user dedicado/role=none; timeouts previos 10s/500ms/5s; rollback apos
   aborto e negacao de operacoes fora da entrada. Ensaios nao publicam capitulos.
   Este passo exige autorizacao propria: NAO executar nesta PR.
5. Guardar resultado/horarios sanitizados e restaurar associacoes pelo grantor
   exato; runner false, sem job ativo. Sem evidencias, manter acionador NAO APTO.

Inventario nao executa o runner nem demonstra timeout real. Defaults declarados,
template de HBA e prova Docker ja existentes sao reaproveitados, nao certificados
novamente como gerenciados. Nenhuma migration corretiva necessaria comprovada.

## 4. Validacao e proxima decisao

Testes focados: **37/37**, incluindo 25 regressões existentes e 12 novos cenarios
de interrupcao, atraso (inclusive durante consulta), API indisponivel,
entrega/reconciliacao e isolamento concorrente dos fluxos. Sao deterministicos;
transporte HTTP real em loopback com resposta POST perdida e credenciais sinteticas.
Os metadados publicos do teste 6D2 foram consultados uma vez para confirmar o
schema real da API (run_id/run_attempt/steps), sem ler logs ou repetir o dispatch.
YAML dos tres workflows validado pelo parser ja instalado; patch inerte validado
com git apply --check, sem aplica-lo. Build e audit de producao (zero) aprovados.
Lint completo, Lint dos arquivos finais, Typecheck e diff --check aprovados.
Auditoria estatica do index isolado **199/199**; no workspace **198/199**, somente
pela migration ACL auxiliar local preexistente, preservada e nao versionada.
Node 22.23.4 e instalacao travada existente reutilizados, sem dependencias novas.
pgTAP, Data API mutante, suite Playwright e gates caros sem relacao nao repetidos:
nenhuma migration, RPC, RLS, regra de negocio ou interface foi alterada. O unico
SQL novo e inventario de catalogos, testado em transacao somente leitura.
CI/CodeQL/Gitleaks do novo commit devem ser consultados uma vez, sem dispatch
manual ou confundir em execucao com aprovado.

Inventario SQL validado no banco local preservado, somente leitura/ROLLBACK:
PostgreSQL 17.6, pg_cron 1.6.4 disponivel mas NAO instalado, modo/configuracao
carregada libpq/log_run/loopback; runner NOLOGIN, sem heranca/privilégios elevados,
defaults 10s/500ms/5s e zero relacoes com privilegios nos schemas verificados.
Entrada negada a anon/authenticated/service_role e permitida ao papel dedicado.
Associacao administrativa original pelo grantor supabase_admin sem INHERIT/SET.
O papel do monitor mais recente nao existe nesse banco antigo: ausencia registrada,
nao contornada. Outbox 14 e runner=false preservados. Nao instaladas migrations,
Cron, papeis ou fixtures, nem executado o runner.

Nao equivalem a novo alerta remoto, recebimento humano, periodicidade ativa ou
prova de falha conjunta. Nao executada nova auditoria/E2E da Obra.

Proximas intervencoes indispensaveis: resposta sanitizada do SU-546160;
responsavel/host/canal independente e cadencias/janelas explicitamente aprovados;
homologacao minima de disco e envelope finito H/A/X/B/F/M. Enquanto isso, nenhuma
ativacao e nenhuma nova camada de saldo ou purga para simular garantia.

Fontes oficiais: [workflow runs](https://docs.github.com/en/rest/actions/workflow-runs),
[jobs por tentativa](https://docs.github.com/en/rest/actions/workflow-jobs),
[limites do schedule](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule),
[Supabase Cron](https://supabase.com/docs/guides/cron),
[disco](https://supabase.com/docs/reference/api/v1-get-disk-utilization),
[banco versus disco/WAL](https://supabase.com/docs/guides/platform/database-size).
