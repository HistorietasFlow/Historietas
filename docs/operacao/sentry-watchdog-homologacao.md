# Homologacao do watchdog Sentry — PR de agenda em draft, sem ativacao

Base atual: `main` `aaf693fc`, 11/11/2026. O responsavel informou que criou o
monitor/alerta Sentry e cadastrou o secret. A execucao real
[#43089501994](https://github.com/HistorietasFlow/Historietas/actions/runs/43089501994),
attempt 1, comprova SQL/entrega v2 na mesma main: transporte de teste skipped,
preflight TLS e etapa v2 success. Criada 19:41:13Z, job 19:41:17Z–19:41:27Z,
etapa v2 19:41:21Z–19:41:24Z. Os 4 s ate iniciar o job e os 3 s da etapa sao
uma amostra MANUAL, nao distribuicao de atrasos do schedule nem SLA.
O responsavel confirmou `AGENDAMENTO_MONITOR_AUTORIZADO=false` apos o ensaio.
Nao reabrir a auditoria de credenciais; nao ler secrets ou repetir SQL remoto.
Periodicidade, check-ins reais, incidentes Sentry e recebimento de e-mail ainda
nao foram homologados. Nenhum check-in foi enviado nesta preparacao.

Conferencia visual do responsavel em 11/11: monitor Sentry `*/15` UTC, margem
10 min, runtime 3 min, limiares de falha/recuperacao 1/1; regra de alerta ativa
com destinatarios sugeridos e fallback para membros do projeto, sem entrega
real de e-mail comprovada. Billing: plano Developer gratuito com teste Business
(5 dias restantes), 1/300 Cron Monitors (299 gifted), gasto extra US$ 0,00 e
nenhum metodo de pagamento. O plano Developer permite somente 1 Cron Monitor
apos o teste e o existente ocupa esse unico slot; nao criar segundo monitor nem
presumir limite de 300 permanente. Fontes do fornecedor:
https://www.sentry.help/en/articles/13963931-how-do-i-can-i-get-more-crons-on-a-developer-plan
https://www.sentry.help/en/articles/13965075-what-happens-when-my-trial-expires

## Ressincronizacao do agendamento SQL — PR draft

No dia 11/11, apos o merge #2271 na `main` (`1942f3e9`), o workflow SQL
estava ativo na interface do GitHub e o gate de leitura estava `true`, mas
nenhum run com evento `schedule` apareceu nos horarios observados. A causa
interna nao foi comprovada: o GitHub admite atrasos/descarte de agendamentos.
Esta PR altera **somente a sintaxe** do cron SQL de
`10,25,40,55 * * * *` para `10/15 * * * *`. Os minutos seguem
**10, 25, 40, 55 UTC**. A mudanca de cron em `main` pode ressincronizar o
registro/ator do scheduler; nao garante correcao do servico GitHub.
A agenda do watchdog/Sentry (`*/15`), gates, SQL v2, credenciais, TLS,
alertas e publicacao automatica nao mudam. Nenhuma nova execucao agendada
pode ser certificada por testes locais ou uma rodada de CI. A PR fica em
draft, sem merge nem alteracoes de variaveis ou producao. Nao aceitar
`workflow_dispatch` como prova do scheduler. O patch de exemplo anterior
e historico e nao deve ser reaplicado.

## Cadencia preparada

Watchdog: **`*/15 * * * *`, UTC**, aprovado para preparacao. Monitor SQL:
**proposta `10,25,40,55 * * * *`, UTC**, nominalmente cinco minutos antes de cada
watchdog. Reutiliza os dois workflows existentes e seus locks/gates separados.
O patch `agendamento-periodico.patch.example` e referencia INERTE, incorporada
nesta PR de ativacao EM DRAFT. Na `main`, ambos os workflows seguem manuais ate
um merge especificamente autorizado. O merge dos workflows adiciona eventos
`schedule` (mesmo com jobs pulados); por isso, antes do merge, conferir os dois
gates `AGENDAMENTO_MONITOR_AUTORIZADO=false` e
`AGENDAMENTO_WATCHDOG_AUTORIZADO=false`. Sem essas verificacoes, nao mesclar.

Na PR, revisar o diff dos dois workflows e executar os testes focados de
monitor/watchdog/Sentry, Lint, Typecheck e CI/Gitleaks. O patch historico nao
deve ser reaplicado depois do merge. O SQL usa a etapa v2 real no evento
`schedule` (input de teste ausente/falso); `workflow_dispatch` continua com
`teste_entrega=true` por padrao. A branch draft nao dispara cron; GitHub agenda
somente na branch default apos merge autorizado.
Sentry precisa usar o mesmo cron UTC. Margem de 10 min, runtime de 3 min e
limiares de falha/recuperacao de 1 continuam propostas, a conferir/aprovar no
painel; somente a cadencia de 15 min foi aprovada aqui. O job limita-se a 2 min.

Sao 96 execucoes/dia POR workflow: 5.760 jobs em 30 dias entre os dois, ate
11.520 minutos de job pelo teto de 2 min (nao previsao de consumo), e ate 5.760
requests de check-in do watchdog. Somar GETs GitHub e leituras SQL existentes.
Nao repetir POST de alerta quando o estado nao mudou. Conferir quotas/minutos/slot Sentry
antes de ativar; nao implica custo zero certificado. Schedules do GitHub sao
best-effort e podem atrasar ou ser descartados, especialmente no inicio da hora.
Nao ha SLA de deteccao de 15 min. Se o deslocamento do cron for desejado,
alinhar tambem o Sentry em revisao explicita, nao alterar so um dos lados.

### Janela de observacao aprovada PARA ENSAIO, ainda nao ativada

`AGENDAMENTO_MONITOR_MAX_INTERVALO_MS=1800000` (30 min), sem adicionar default
ao codigo; `AGENDAMENTO_MONITOR_ESPERADO_DESDE` deve ser o inicio UTC da janela
autorizada, nunca retrodatado para aceitar uma prova antiga. O watchdog mede
idade da CONCLUSAO da etapa v2, nao do inicio/update do run. Um SQL nominalmente
5 min anterior ainda pode estar queued; a conclusao anterior pode sustentar a
prova apenas enquanto fresca. Falha concluida mais recente nao e ocultada por
sucesso antigo. Um ciclo SQL perdido produz idade nominal de ~20 min; dois,
~35 min e alerta. Isso aceita explicitamente perda de um ciclo, nao a esconde.

Os 30 min sao proposta de tolerancia a uma perda de 15 min + fase de 5 min +
2 min de job + folga de 8 min. Nao sao percentil medido nem limite de atraso
do GitHub. A fase nao garante ordem entre workflows; nao adicionar espera,
polling, workflow_run ou dependencia que impece o watchdog independente de rodar.
Margem Sentry de 10 min cobre somente atraso para INICIAR o check-in;
max_runtime de 3 min cobre o par iniciado. Nao somar essas margens como SLA.

Proposta de ensaio: 72 h (288 oportunidades por workflow), registrar slot UTC,
created_at, started_at, fim v2, fim do job, attempt, idade SQL, status de entrega,
incidente/e-mail e recuperacao; sem snapshots/URLs de check-in/credenciais. Medir atrasos e
lacunas reais, p50/p95/max e filas separadamente da duracao SQL. Slot sem run e
perda, nao duracao zero. Suspender aprovacao se houver falso ok, entrega nao
confirmada, lacuna nao detectada ou atraso incompativel com o contrato aprovado;
nao aumentar a janela automaticamente. Uma observacao finita nao garante SLA.
Sentry e e-mail tambem podem atrasar ou falhar. Falha conjunta dos provedores
nao e coberta por uma garantia de entrega; registrar a lacuna, sem criar outra
testemunha ou um novo servico nesta preparacao.

## Dependencias e autorizacao verificadas no codigo

| Componente | Contrato / pre-requisito |
| --- | --- |
| Watchdog | `AGENDAMENTO_WATCHDOG_AUTORIZADO=true` e branch `main`; `GITHUB_TOKEN` efemero com contents/read, actions/read, issues/write. Nenhuma credencial SQL ou service role. |
| Check-in | Secret existente `AGENDAMENTO_SENTRY_CHECKIN_URL`, endpoint Relay HTTPS validado; URL nunca em logs. Somente evento `schedule` no repositorio/workflow/main exatos envia. |
| Evidencia SQL | Ultima execucao concluida do workflow `agendamento-monitor.yml`, job `verificar`, etapa `Comprovar observacao SQL e entrega (v2)`, tentativa exata, recente e bem-sucedida. Nao aceita a etapa antiga nem um run verde antigo para esconder falha mais recente. |
| Janela | `AGENDAMENTO_MONITOR_ESPERADO_DESDE` (instante UTC) e `AGENDAMENTO_MONITOR_MAX_INTERVALO_MS` (intervalo positivo aprovado entre conclusoes SQL). Sem defaults; 15 min do watchdog nao define o intervalo SQL. |
| Destino GitHub | `AGENDAMENTO_ALERT_ISSUE`: issue aberta aprovada com marcador `<!-- historietas-agendamento-monitor:v1 -->`; token pode comentar, nao precisa PAT extra. |
| Monitor SQL | Gate independente `AGENDAMENTO_MONITOR_AUTORIZADO=true`, `main`, `psql` disponivel; secrets `AGENDAMENTO_MONITOR_PGHOST` e `AGENDAMENTO_MONITOR_PGPASSWORD`, variable `AGENDAMENTO_MONITOR_PROJECT_REF`. Shared Session pooler, porta 5432, banco postgres, usuario `historietas_agendamento_monitor_login.PROJECT_REF`; TLS `verify-full` e CA oficial versionada/preflight, sem novo secret de CA. |
| Papel SQL | Grupo permanece NOLOGIN; LOGIN separado NOINHERIT com SET explicito para o snapshot. Conexao real v2 aprovada no run #43089501994; migration nao contem senha. Ver [requisitos](monitor-sql-login.md); nunca usar postgres/service_role como runtime. |
| Snapshot | Atualizacoes `20261110062820` e `20261110174613` acrescentam recursos e operacoesCache mantendo ACL. Leitura em REPEATABLE READ/READ ONLY com rollback, timeouts 5 s/500 ms/5 s e limite externo 12 s. Nao executa runner, observador mutante, retomada, ACK ou purga. |

A prova real v2 substitui a pendencia anterior de conexao SQL, nao certifica
periodicidade ou o painel Sentry. Os gates/variaveis/secrets remotos nao foram
consultados nem alterados nesta preparacao. Nao supor autorizacao a partir da
existencia do secret Sentry. Cron SQL, runner e uploads continuam bloqueados.

## Contrato v2: execucao/entrega separadas da saude

A etapa v2 configura `AGENDAMENTO_MONITOR_COMPROVAR_EXECUCAO=true`. Codigo 0
exige execucao da consulta SQL fixa, validacao do snapshot e entrega `delivered`
ou `unchanged` (alerta do bot lido e com os mesmos codigos). Nenhum relatorio
externo ou variavel de sucesso substitui a consulta. `obsolete`, resposta
perdida ou entrega falha nao confirmam a observacao. Proxima tentativa faz
nova leitura SQL e reconcilia o alerta existente, sem retry cego do POST.

Uma allowlist explicita admite diagnosticos operacionais conhecidos, incluindo
runner desligado, falta de orcamento WAL e fonte de disco indisponivel. Esses
codigos continuam integralmente no alerta GitHub; os gates SQL nao mudam.
`FONTE_INVALIDA` refere-se ao Cron observado, nao a origem da consulta fixa.
Erro SQL/timeout, JSON/contrato invalido, evidencia temporal invalida/obsoleta,
telemetria incompleta e codigos desconhecidos falham fechados. O modo legado
sem a opcao continua retornando erro por problemas de saude.

Sentry agora testemunha **execucao/entrega**, nao prontidao para publicacao.
Um `ok` nao apaga o alerta de saude nem habilita o runner. O watchdog exige o
nome versionado da etapa, conclusao recente e mesma tentativa/job: resultados
anteriores a esta mudanca nao certificam o novo contrato. Teste de transporte
na etapa v2 retorna erro mesmo com e-mail entregue; dispatch do watchdog nunca
envia check-in. Concurrency separado por fluxo permanece; nao executar outro
chamador concorrente fora desse contrato. Entrega obsoleta falha tambem no watchdog.

O bloqueador de contrato foi corrigido; a homologacao remota de recebimento,
periodicidade e recuperacao ainda exige autorizacao e os pre-requisitos acima.

## Matriz de testes controlados

| Caso | Prova local sem rede remota | Homologacao futura autorizada e criterio |
| --- | --- | --- |
| Sucesso | Wrapper + watchdog exigem etapa v2 exata, mesma tentativa, frescor e entrega | SQL REAL recente/entrega confirmada seguido de schedule REAL; mesmo ID in_progress/ok; alertas de saude continuam presentes |
| Falha SQL/entrega | Timeout/JSON/identidade/contrato invalidos, HTTP 503 e resposta perdida nunca geram ok | Primeiro omitir novas leituras SQL pelo gate do monitor; nao danificar credenciais/banco. Falha SQL real so conta se ocorrer/capturada legitimamente; nao inventar incidente remoto |
| Execucao ausente | Ausencia/obsolescencia/desativacao falham fechadas | Suspender apenas watchdog numa janela; nenhum check-in; Sentry missed + e-mail apos margem. Diferenciar ausencia de toda a plataforma (nao simulada) |
| Timeout | Erro/aborto SQL rejeita prova; falha no check-in final nao certifica recebimento | Cancelar job REAL somente depois de confirmar in_progress no Sentry; exigir ausencia de final e timed_out apos max_runtime. Se ja acabou, ensaio inconclusivo, nao enviar check-in avulso nem repetir indiscriminadamente |
| Recuperacao | Novo par/novo ID, SQL fresco e entrega; erro anterior nao pode ser mascarado | Restaurar SOMENTE monitoramento autorizado, nova prova SQL + proximo schedule real; Sentry recupera segundo limiar; nao limpar alertas operacionais |
| E-mail | Transportes sinteticos/loopback nao provam recebimento | Responsavel confirma incidente e recebimento, horarios e recuperacao no painel; registrar confirmacao sem copiar mensagem com URL/secret/dados pessoais |

O timeout do PRODUTOR SQL e diferente de timed_out do watchdog no Sentry.
Cancelar antes de in_progress testa ausencia, nao runtime. A janela curta pode
impedir cancelamento manual; se nao for reproduzivel, manter timed_out pendente
ou planejar ensaio seguro separado, nunca atrasar o workflow de producao para
fabricar prova. O codigo atual nao possui um modo de injetar falhas em producao.

Testes de transporte manuais podem invalidar temporariamente a prova mais
recente (intencional: a etapa SQL fica skipped). Durante o ensaio periodico,
nao os intercalar; se necessarios, registrar que NAO renovam o banco e exigir
uma nova execucao real v2 antes de declarar recuperacao. Nao enviar sinais
artificiais para silenciar missed enquanto o monitor SQL esta desautorizado.

## Acoes administrativas restantes — nenhuma executada aqui

1. Aprovar cadencia SQL, janela 30 min, ensaio 72 h, responsavel/horario de
   retorno e tolerancias Sentry (cron UTC aprovado, margem 10 min, runtime
   3 min, falha/recuperacao 1). Conferir no monitor/alerta EXISTENTES o destino
   e-mail, nao silenciado, ambiente correto, quotas e custos; nao criar outro.
2. Aprovar uma mudanca separada que aplique o patch inerte na main. Conferir
   diff de ambos os workflows, input real, gates e secrets existentes, sem
   alterar senha, TLS, monitor SQL ou contrato v2. Antes de ativar o watchdog,
   conferir no Sentry que nao existe incidente preexistente confundindo ensaio.
3. Na janela autorizada, definir ESPERADO_DESDE/intervalo e habilitar somente
   AGENDAMENTO_MONITOR_AUTORIZADO; aguardar primeira prova v2 criada depois do
   inicio aprovado. So entao habilitar AGENDAMENTO_WATCHDOG_AUTORIZADO, sem
   aceitar o run manual antigo como heartbeat. Registrar estado inicial/final.
   Hoje o primeiro permanece false por relato do responsavel.
4. Coletar prova periodica/alertas conforme matriz. Habilitar schedules exige
   aprovacao propria; nao autoriza Cron SQL, runner, publicacao ou uploads.
5. Ao encerrar, restaurar gates/agendas conforme autorizacao. Se falhar, manter
   ativacao suspensa e incidentes preservados. Nao tratar ok de transporte como
   certificacao de capacidade fisica, WAL ou agendamento automatico.

Links administrativos: [variables GitHub](https://github.com/HistorietasFlow/Historietas/settings/variables/actions),
[monitor SQL](https://github.com/HistorietasFlow/Historietas/actions/workflows/agendamento-monitor.yml)
e [watchdog](https://github.com/HistorietasFlow/Historietas/actions/workflows/agendamento-watchdog.yml).
Usar o monitor Sentry ja cadastrado em Insights/Crons e sua regra de alerta,
sem copiar a URL de check-in. Nao e necessario cadastrar novos secrets.

Se o Sentry estiver habilitado sem produtor ativo, missed pode ser esperado;
coordenar manutencao autorizada, nunca silenciar com check-ins artificiais.
Cada caso da matriz comeca com estado inicial registrado e recuperacao real
antes do proximo. Incidente ja aberto nao comprova uma nova transicao nem
obriga outro e-mail; marcar essa prova inconclusiva, nao forcar recuperacao.
Dispatch manual continua proibido como prova de Sentry: nao exportar GITHUB_*
falsos, chamar a URL diretamente ou usar retry manual para fabricar schedule.

Testes automatizados usam somente fixtures sinteticas e transporte simulado
ou loopback; comprovam selecao de prova, erros, correlacao e isolamento manual,
nao entrega Sentry/e-mail ou disponibilidade do banco gerenciado.

Fontes: [GitHub: atrasos, descarte e desativacao de schedules](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule),
[Sentry: inicio/fim e timeout](https://www.sentry.help/en/articles/13963932-why-are-my-cron-monitors-marked-as-timed-out).
