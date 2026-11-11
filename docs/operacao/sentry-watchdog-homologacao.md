# Homologacao do watchdog Sentry — preparacao, sem ativacao

Base: `main` `cda7e996`, 11/11/2026. O responsavel informou que criou o monitor
e o alerta Sentry e cadastrou `AGENDAMENTO_SENTRY_CHECKIN_URL` no GitHub.
Esse relato nao certifica a configuracao do painel, a URL, o recebimento de
alertas ou uma execucao periodica; nenhum secret foi lido nem check-in enviado.

## Cadencia preparada

Watchdog: **`*/15 * * * *`, UTC**, aprovado para preparacao. O patch existente
`agendamento-periodico.patch.example` continua INERTE. Os dois workflows reais
continuam somente manuais. A cadencia do monitor SQL ainda e um placeholder;
nao aplicar o patch inteiro nem deduzir que o SQL deve executar a cada 15 minutos.

Validacao local, sem modificar workflows:

```powershell
git apply --check --include=.github/workflows/agendamento-watchdog.yml docs/operacao/agendamento-periodico.patch.example
```

Depois de autorizacao explicita de ativacao, uma revisao separada devera incluir
somente esse hunk no workflow do watchdog. Nao remover `--check` nesta fase.
Aplicar o template ou fazer merge desta preparacao NAO autoriza habilitar gates.
Sentry precisa usar o mesmo cron UTC. Margem de 10 min, runtime de 3 min e
limiares de falha/recuperacao de 1 continuam propostas, a conferir/aprovar no
painel; somente a cadencia de 15 min foi aprovada aqui. O job limita-se a 2 min.

Sao 96 execucoes/dia, 2.880 em 30 dias e ate 5.760 requests de check-in, mais
os acessos GitHub existentes e o monitor SQL. Conferir quotas/minutos/slot Sentry
antes de ativar; nao implica custo zero certificado. Schedules do GitHub sao
best-effort e podem atrasar ou ser descartados, especialmente no inicio da hora.
Nao ha SLA de deteccao de 15 min. Se o deslocamento do cron for desejado,
alinhar tambem o Sentry em revisao explicita, nao alterar so um dos lados.

## Dependencias e autorizacao verificadas no codigo

| Componente | Contrato / pre-requisito |
| --- | --- |
| Watchdog | `AGENDAMENTO_WATCHDOG_AUTORIZADO=true` e branch `main`; `GITHUB_TOKEN` efemero com contents/read, actions/read, issues/write. Nenhuma credencial SQL ou service role. |
| Check-in | Secret existente `AGENDAMENTO_SENTRY_CHECKIN_URL`, endpoint Relay HTTPS validado; URL nunca em logs. Somente evento `schedule` no repositorio/workflow/main exatos envia. |
| Evidencia SQL | Ultima execucao concluida do workflow `agendamento-monitor.yml`, job `verificar`, etapa `Comprovar observacao SQL e entrega (v2)`, tentativa exata, recente e bem-sucedida. Nao aceita a etapa antiga nem um run verde antigo para esconder falha mais recente. |
| Janela | `AGENDAMENTO_MONITOR_ESPERADO_DESDE` (instante UTC) e `AGENDAMENTO_MONITOR_MAX_INTERVALO_MS` (intervalo positivo aprovado entre conclusoes SQL). Sem defaults; 15 min do watchdog nao define o intervalo SQL. |
| Destino GitHub | `AGENDAMENTO_ALERT_ISSUE`: issue aberta aprovada com marcador `<!-- historietas-agendamento-monitor:v1 -->`; token pode comentar, nao precisa PAT extra. |
| Monitor SQL | Gate independente `AGENDAMENTO_MONITOR_AUTORIZADO=true`, `main`, `psql` disponivel; secrets `AGENDAMENTO_MONITOR_PGHOST`, `AGENDAMENTO_MONITOR_PGPORT`, `AGENDAMENTO_MONITOR_PGPASSWORD`. Banco postgres, usuario fixo `historietas_agendamento_monitor`; TLS `verify-full` e CA confiavel no runner. |
| Papel SQL | Migration `20261110014753_snapshot_monitor_externo_agendamento.sql`: NOLOGIN, NOINHERIT, sem superuser/bypassrls; USAGE do schema privado e EXECUTE apenas do snapshot agregado. Provisionar conexao dedicada minima exige autorizacao separada; nunca usar postgres/service_role para contornar NOLOGIN. |
| Snapshot | Atualizacoes `20261110062820` e `20261110174613` acrescentam recursos e operacoesCache mantendo ACL. Leitura em REPEATABLE READ/READ ONLY com rollback, timeouts 5 s/500 ms/5 s e limite externo 12 s. Nao executa runner, observador mutante, retomada, ACK ou purga. |

O merge das migrations nao comprova sua aplicacao remota. Conferir previamente
papel, ACL, conectividade/TLS e contrato do snapshot em inventario autorizado,
sem modificar grants nesta preparacao. Os gates/variaveis/secrets remotos nao
foram consultados nem alterados. Nao supor autorizacao a partir da existencia
do secret Sentry. Cron SQL, runner e uploads continuam bloqueados.

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

## Procedimento futuro de homologacao — requer autorizacao propria

1. Registrar aprovacao, janela, responsavel e destino de e-mail, confirmar
   limites do plano, cron UTC, margem/runtime/limiares no monitor existente.
   Se ele ja estiver habilitado no Sentry sem produtor ativo, `missed` pode ser
   esperado; nao enviaremos sinais artificiais para silencia-lo. Coordenar
   essa manutencao com o responsavel, sem mudar o painel nesta fase.
2. Confirmar a versao v2 na main e os pre-requisitos SQL. Realizar leitura autentica
   com `workflow_dispatch` do monitor, `teste_entrega=false`, somente apos
   autorizacao para acesso/alerta. Registrar run/attempt/horarios/codigos, nunca
   stdout SQL, host, senha, token ou URL de check-in. Teste de transporte
   (`teste_entrega=true`, default) nao renova a prova do banco.
3. Ativar somente a agenda do watchdog em mudanca futura aprovada. Aguardar
   evento REAL `schedule`: conferir mesmo `check_in_id` em `in_progress` e
   `ok`/`error`, e correlacionar conclusao SQL/entrega GitHub. Dispatch manual
   nao emite check-ins, mesmo que termine verde. Nao exportar variaveis
   GITHUB_* falsas, chamar a URL diretamente ou usar retry manual como prova.
4. Falha: numa janela autorizada, suspender apenas novas observacoes do monitor
   SQL, sem quebrar banco/credenciais ou mexer no runner. Apos a janela aprovada,
   uma execucao REAL do watchdog deve acusar ausencia/atraso/desativacao e
   enviar `error`. Confirmar incidente Sentry e recebimento pelo responsavel.
   Se o estado inicial ja era `error`, isso nao comprova nova transicao nem
   exige novo e-mail; registrar a limitacao, nao forcar recuperacao.
5. Ausencia: omitir controladamente a agenda do watchdog, com autorizacao e
   plano de restauracao, sem mandar check-in. Conferir `missed` apos a margem
   e recebimento independente do GitHub. Isso prova ausencia do produtor,
   nao uma indisponibilidade real de toda a infraestrutura GitHub/Sentry.
   Interrupcao apos `in_progress` deve ser distinguida de `missed` (`timed_out`).
6. Recuperacao: restaurar exclusivamente as configuracoes autorizadas de
   monitoramento; exigir nova leitura SQL valida/entrega e proximo `schedule`
   real. Confirmar recuperacao no Sentry segundo seu limiar, sem reduzir gates
   de saude. Alertas operacionais podem permanecer ativos durante essa
   recuperacao do transporte; nao os declarar resolvidos. Sem prova real,
   marcar a homologacao PENDENTE.
7. Encerrar o ensaio com estado de agendas/gates registrado e conforme a
   autorizacao, mantendo runner/Cron SQL/publicacao/uploads desativados. Nao
   apagar incidentes, eventos ou recibos. Se a homologacao falhar, suspender
   a ativacao operacional; nunca mascarar os alertas.

Testes automatizados usam somente fixtures sinteticas e transporte simulado
ou loopback; comprovam selecao de prova, erros, correlacao e isolamento manual,
nao entrega Sentry/e-mail ou disponibilidade do banco gerenciado.

Fontes: [GitHub: atrasos e descarte de schedules](https://docs.github.com/en/actions/how-tos/troubleshoot-workflows),
[Sentry: inicio/fim e timeout](https://www.sentry.help/en/articles/13963932-why-are-my-cron-monitors-marked-as-timed-out).
