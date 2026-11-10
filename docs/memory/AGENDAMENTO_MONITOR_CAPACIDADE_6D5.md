# Agendamento — 6D5: observacao de capacidade, sem ativacao

Base: main `a09922ec` (#2255). Esta fase NAO certifica capacidade fisica.
Runner, Cron, publicacao automatica e uploads ilustrados permanecem bloqueados.

## Contrato e reutilizacao

A migration `20261110062820_monitorar_capacidade_agendamento.sql` estende o
snapshot privado v1 da 6D2 com `recursos`, em formato aditivo/versionado.
Preserva owner/ACL da unica fronteira definer existente e cria apenas um helper
invoker sem grants de API, service role, runner ou monitor. O papel de monitor
continua NOLOGIN, sem leitura direta de tabelas nem acesso generico a arquivos.
Nao ha tabela de amostras, novos escritores, endpoint, job ou credencial nova.

- Saldo 6D4: contadores/limites reais de linhas e payload, sem debito/reset.
  Alerta consultavel a 70%; esgotamento por qualquer um dos dois limites.
- Outbox/notificacoes/banco: reaproveita os agregados e limites da 6B3.
  Confere contagens/bytes, flags e data da medicao; solicitada_em nao e ACK.
- WAL: `sum(size)` de `pg_ls_waldir()` separado do acumulado `pg_stat_wal` e
  seu `stats_reset`. So retorna agregados, nunca nomes/caminhos/slots. Falha de
  permissao/fonte nao vira zero; timeout global aborta a leitura e e reportado.
- Disco livre/total: explicitamente indisponiveis, sem inferencia por
  pg_database_size, quota do plano, disco Docker ou max_wal_size.
- Nao existe orcamento fisico aprovado de WAL. Mesmo uma amostra nativa valida
  nao permite concluir ausencia de saturacao ou capacidade suficiente.

O classificador exige medidas numericas validas e timestamps de cada componente.
Mais de 60 s ou mais de 1 s no futuro produz aviso de medicao obsoleta; ausencia,
falha parcial e contrato desconhecido sao alertas, nao recuperacao. O prazo e
criterio de diagnostico, nao SLA nem garantia contra escritores concorrentes.
O envelope recebe `agora` somente DEPOIS da coleta, em instrucao separada; uma
consulta lenta nao faz timestamps atuais parecerem futuros. Duas assercoes
pgTAP conferem esta ordem. Coletas com mais de 60 s continuam obsoletas.
Reset antigo das estatisticas NAO envelhece uma leitura atual nem transforma WAL
gerado acumulado em bytes ocupados. Nao se extrapola taxa/WAL futuro.

O relatorio externo continua somente versao, horario e codigos allowlist. Usa o
mesmo transporte para a issue aprovada, deduplicacao, descarte de relatorio antigo
e reconciliacao de resposta perdida; sem POST retry cego. Nenhum agregado SQL,
ID, dado pessoal, credencial ou erro livre e publicado. Recuperacao nao abre
gate, confirma outbox ou remove pausas. Um unico escritor autorizado continua
obrigatorio; a serializacao do workflow existente nao e CAS global do GitHub.

## Limites e operacao

Sem ativacao do workflow manual ou alteracao de secrets/variaveis. A entrega
pontual 6D2 permanece historica; nao e prova de periodicidade, ausencia do proprio
verificador ou leitura homologada no gerenciado. Nenhum teste de canal remoto
precisa de nova publicacao para validar a mudanca no classificador/transporte.

WAL/disco desconhecidos permanecem alertas permanentes, deduplicados pelo canal.
Nao se emite atestado APTO mesmo apos desaparecer um alerta de saldo. Escritores
legados, bloat, operacoes em andamento, abortos e leases continuam fora da reserva
logica da 6D4. Medidas instantaneas nao reservam disco. A outbox e preservada
integralmente, inclusive com saturacao; nao ha ACK, TTL ou purga.

Custos: consultas e testes no banco existente/local e infraestrutura atual do
GitHub; nenhuma dependencia, servico pago ou aumento de quotas. Consulta de WAL
tem custo proporcional ao diretorio e fica sujeita aos timeouts existentes.

## Validacao

Node 22.23.4, CLI 2.116.0, Supabase novo/descartavel `6d5-verify`; nenhuma
migration/consulta de teste remota. Nao confundir estas provas locais com
disponibilidade/permissoes ou espaco livre do Supabase gerenciado.

- Unitarios/classificador/transporte: **18/18**. Cobrem limites exatos de linhas
  e bytes, alerta a 70%, fontes/horarios invalidos, dados ausentes, WAL acumulado
  distinto de ocupacao, falta de limite fisico, deduplicacao, recuperacao,
  resposta perdida e sanitizacao. Transporte de alerta simulado, sem novo envio
  remoto ou nova comprovacao de e-mail; o teste pontual anterior da 6D2 e mantido.
- pgTAP completo FINAL: **771/771, 27 arquivos**, sem omitir testes. Novas
  **29** assercoes do monitor e as 18 anteriores de permissoes aprovadas;
  somente whitelist exata da chave aditiva `recursos` mudou no teste legado.
- Integracoes amplas: **56/56** serial/sem retries (agendamento, executor,
  capacidade, saldo, outbox, projecao, snapshot e monitor). Apos o ajuste final
  de cronologia, as **4/4** do monitor passaram novamente com timeouts previos.
  Leitura restrita nao espera o lock do saldo nem ve debito nao confirmado;
  rollback/leituras repetidas preservam saldo, gates, eventos, IDs e leases.
- Nao executado harness Cron: nenhuma extensao/job foi instalada ou ativada.
- npm ci raiz e QA, Lint, Typecheck, Build, sessao **2.002**, paginacao **37**,
  pos-estatica **60** e audit de producao **zero vulnerabilidades** aprovados.
  Primeira consulta audit bloqueada por rede/cache do sandbox; acesso corrigido
  para consultar o registry, sem alterar dependencias.
- Auditoria estatica no workspace: **198/199**, guard conhecido da migration
  auxiliar ACL preexistente. Copia limpa com arquivos da fase: **199/199**, sem
  auxiliar e sem alterar o guard. Os 474 unitarios anteriores a auditoria passaram.
  A copia temporaria dentro de qa/reports interferiu no TypeScript do primeiro
  Build; removida apenas essa copia, o Typecheck/Build final passou. Nenhuma
  dependencia, tsconfig ou funcionalidade foi alterada para contornar isso.
- Regressoes amplas da Data API NAO ficaram verdes: primeira invocacao nao chegou
  aos testes devido ao spawn legado do CLI no Windows. Com variaveis locais
  explicitas houve 57014 em paginacao e divergencia na concorrencia de curtidas.
  A rodada isolada ainda teve timeout SQL e encontrou contadores anti-spam ativos
  da rodada anterior (mesma identidade de fixture, limite por janela). Nenhum
  contador, timeout, policy ou teste foi alterado para forcar passe. Nao e prova
  de regressao da 6D5, cujas rotinas somente de leitura nao estao nesses fluxos;
  requer triagem independente. Nao declarar Data API completa aprovada.
- Playwright em build local, workers=1/retries=0/max-failures=1: **18 aprovados,
  uma falha, 117 nao executados**. Timeout global de 45 s em
  `author-workflow.spec.mjs:46`, fluxo completo do autor; snapshot final no
  painel. Tambem houve a mensagem de interrupcao fora de um teste pelo limite
  maximo de falhas. Nao ha causa demonstrada que ligue este timeout ao monitor
  privado, que nao e chamado nessa jornada. Sem aumento de timeout/retry ou
  alteracao do fluxo/teste; nao declarar suite inteira aprovada. Baselines axe
  desktop/mobile executados antes da falha passaram. Triagem separada pendente.

Arquivos/configuracao/volumes anteriores preservados. Containers antigos foram
parados temporariamente com autorizacao e restaurados sem recriar imagens ou
volumes. Ambiente E2E anterior restaurado e conferido por hash; backup temporario
e logs de inicializacao removidos. Descartavel parado com backup, 14 eventos
preservados, runner=false, monitor NOLOGIN e pg_cron ausente. Nenhum artefato
com credenciais e versionado. diff --check sem erros.

## Bloqueadores restantes

Capacidade fisica continua **NAO APTO**: faltam fonte de espaco livre verificavel,
margem/envelope agregado aprovado e limites para carga/retencao dos demais
escritores e tentativas. Faltam tambem certificacao do acionador gerenciado e
observacao periodica independente/entrega sob indisponibilidade. Nenhum desses
contratos e resolvido apenas por este monitor.

Fontes primarias:

- [Supabase: banco versus disco/WAL](https://supabase.com/docs/guides/platform/database-size).
- [PostgreSQL 17: pg_ls_waldir](https://www.postgresql.org/docs/17/functions-admin.html#FUNCTIONS-ADMIN-GENFILE).
- [PostgreSQL 17: estatisticas cumulativas](https://www.postgresql.org/docs/17/monitoring-stats.html#MONITORING-PG-STAT-WAL-VIEW).
