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
as duas agendas, mas deixa ambos os crons como placeholders a aprovar.
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
recuperacao falsa. Alertas de negocio fazem o monitor sair com erro mesmo se
o transporte funcionar; VERIFICACAO_FALHOU inclui esse caso, nao prova crash.
O watchdog nao procura uma execucao antiga verde para ocultar a ultima falha.
Uma execucao manual posterior pode exigir nova verificacao real antes de ficar
saudavel: preferimos incerteza explicita a tratar teste de e-mail como sucesso.

### Integracao Sentry Cron Monitor preparada (sem ativacao)

O mesmo workflow do watchdog agora chama
`chapter-scheduling-sentry-checkin.mjs`: **somente** `schedule` da `main` no
repositorio esperado emite `in_progress`, seguido de `ok` se a verificacao real
e a entrega GitHub terminarem com codigo 0; resultados 1/2 ou excecoes emitem
`error`. `workflow_dispatch`, teste de e-mail e execucao simulada nao renovam o
Sentry. Falha no envio inicial/final deixa o job com erro; falha na abertura nao
impede a tentativa de alerta GitHub. Resposta perdida nao recebe retry cego.
Se o GitHub nao iniciar o workflow, nao ha check-in e o proprio Sentry deve
classificar a execucao como ausente; se parar apos o inicio, como timeout.

Continuam **inativos** o `schedule`, o Cron SQL, o runner e a publicacao
automatica. Nao foi criado monitor no Sentry, configurado alerta ou realizada
chamada de check-in real. Antes de ativar, o responsavel deve aprovar cadencia,
janela de atraso, custo/limite do plano e destino de e-mail; criar manualmente
um Cron Monitor no projeto Sentry correto e configurar alerta para `missed`,
`failed` e `timed_out`, com teste controlado de falta de execucao e recebimento.
O monitor deve ser preconfigurado, sem auto-criacao por payload.

Proposta a aprovar (nao e configuracao aplicada): watchdog a cada 15 minutos,
Sentry no mesmo cron UTC, margem de check-in 10 minutos, runtime maximo 3
minutos (workflow limita o job a 2), limiares de falha/recuperacao 1. GitHub
Actions pode atrasar/descartar schedules; a margem reduz falsos alertas, mas
nao constitui SLA. A cadencia pressupoe aproximadamente 2.880 execucoes do
watchdog em 30 dias, alem das do monitor SQL; confirmar minutos GitHub e quota
Sentry antes de aprovar. O plano Developer listado publicamente pelo Sentry
inclui um Cron Monitor, mas a disponibilidade do slot nesta conta nao foi
verificada e excedentes podem gerar custo: nao criar sem essa verificacao.

Configurar como **GitHub Actions secrets** `AGENDAMENTO_SENTRY_CHECKIN_URL`
(endpoint HTTPS de check-ins do monitor na regiao correta, sem query/token) e
`AGENDAMENTO_SENTRY_DSN` (DSN do projeto correto). O script aceita apenas
dominios Sentry e caminho de check-ins, rejeita redirects, limita cada request
a 8 segundos e nunca registra URL, resposta ou credencial. O workflow manual
nao envia check-ins mesmo que os secrets ja existam. Falha conjunta GitHub +
Sentry ou alerta Sentry nao entregue ao responsavel continua sendo risco a
homologar; o GitHub nao e tratado como testemunha de si mesmo.

### Limite externo que o codigo nao pode remover

Workflow separado detecta falha **do outro workflow**, nao queda conjunta do
GitHub/Actions/canal. O observador privado SQL compartilha a falha do banco.
O Sentry preparado oferece uma testemunha externa da ausencia do watchdog,
mas monitor, alerta, agenda, canal e recebimento ainda nao foram certificados
nem provisionados. Saida 2 local nao e alerta entregue. Nao adicionar um
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
