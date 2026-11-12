# PH-1 — capacidade fisica e WAL, reducao parcial sem ativacao

Base `main d7194237`, 11/11/2026. **NAO APTO para capacidade fisica.**
Reutiliza 6D3/6D4/6D5/6D10 e a desigualdade de PH-1; nao recria fan-out,
monitor, saldo ou camada de admissao. Nenhum SQL/ensaio de carga em producao,
mudanca GitHub/Sentry, ativacao, ACK, purga ou aumento de quotas.

## Fontes oficiais e limites da medicao

| Grandeza | Fonte e significado | Nao comprova |
| --- | --- | --- |
| Banco | pg_database_size; dados, TOAST, indices e espaco interno dos arquivos | Espaco livre do filesystem ou WAL |
| Relacao/indices | pg_total_relation_size inclui tabela/TOAST/indices; pg_indexes_size separa indices | Somar isso novamente ao tamanho do banco contaria bytes duas vezes |
| WAL acumulado | pg_stat_wal.wal_bytes, acompanhado de stats_reset | WAL ainda retido, ocupado ou espaco livre |
| WAL ocupado | sum(size) de pg_ls_waldir(), apenas agregado e com privilegio apropriado | Apenas WAL indispensavel: inclui arquivos reciclaveis/prealocados |
| Retencao por slot | restart_lsn e distancia ao LSN atual, quando autorizados | Soma de espaco fisico por slot: varios slots podem reter os mesmos segmentos |
| Temporarios | pg_stat_database.temp_bytes e acumulado; arquivos ativos sao outra medida | Pico futuro de spills, tabelas TEMP ou margem de manutencao |
| Espaco disponivel | GET /v1/projects/{ref}/config/disk/util: timestamp e metrics.fs_size_bytes/fs_avail_bytes/fs_used_bytes | Reserva exclusiva, SLA de atualizacao ou limite para outros escritores |

A documentacao oficial distingue quota comercial de banco (500 MB) de disco
Free fixo (2 GB), sem autoscaling. O read-only em 95% e best-effort: trabalho
em voo e WAL ainda podem esgotar o disco. Metricas do painel sao diarias.
Nao subtrair apenas o tamanho do banco de 2 GB para inferir margem.
[Supabase: banco/disco](https://supabase.com/docs/guides/platform/database-size).

A Management API exige infra_disk_config_read e documenta 200/401/403/429/500,
sem SLA de coleta no schema. SUPABASE_ACCESS_TOKEN esta ausente nesta sessao;
nenhuma chamada remota foi feita nem credencial ampla usada como substituta.
Disponibilidade efetiva no projeto Free, unidades/frescor/atualizacao/erro e
latencia continuam NAO HOMOLOGADOS, nao sao valores zero.
[Contrato oficial](https://supabase.com/docs/reference/api/v1-get-disk-utilization).

Alternativa oficial para obter dados: Metrics API (beta) e exemplo do proprio
Supabase incluem node_filesystem_avail_bytes, free_bytes, size_bytes,
device_error, readonly e sucesso do collector. Disponivel e diferente de livre
para root. Identificar filesystem que contem os dados, projeto e servico; nao
usar outro mount nem os zeros do exemplo como medicao. Timestamp de recebimento
nao prova idade da coleta. A fonte gerenciada nao pode ser homologada pelo Docker.
O endpoint usa chave secreta; nao ampliar o privilegio do monitor SQL ou instalar
outro coletor. Nenhuma integracao foi ativada nesta fase.
[Metrics API](https://supabase.com/docs/guides/observability/metrics),
[series oficiais de exemplo](https://github.com/supabase/supabase-grafana/blob/main/docs/metrics.md).

max_wal_size nao e teto fisico rigido. temp_file_limit e por processo e nao
inclui tabelas TEMP explicitas; nao limita todos os escritores ou o cluster.
Rollback nao apaga WAL gerado. Checkpoint, full-page images, retencao e vacuum
afetam as amostras. Nao alterar esses parametros nem remover slots para forcar
um resultado. [WAL](https://www.postgresql.org/docs/17/wal-configuration.html),
[temporarios](https://www.postgresql.org/docs/17/runtime-config-resource.html#GUC-TEMP-FILE-LIMIT),
[estatisticas](https://www.postgresql.org/docs/17/monitoring-stats.html).

## Escritores e protecoes ja existentes

| Caminho real | Protecao reutilizada | Crescimento ainda sem envelope fisico global |
| --- | --- | --- |
| Publicacao agendada | 6D4: audiencia unica limitada, saldo transacional, rollback integral, recibo idempotente | Heap/indices/WAL e manutencao nao reservados fisicamente |
| Publicacao manual | actions registrar-notificacoes-novo-capitulo-supabase / atualizar-notificacao-capitulo chamam criar_notificacoes_capitulo | Notificador legado nao usa saldo 6D4; impor o mesmo teto mudaria funcionalidade |
| Comunidade | 20260909011109: rate limits existentes por identidade/janelas, RLS e limites de entrada | Novas identidades, comentarios, curtidas e notificacoes nao tem teto agregado PH-1 |
| Interacoes/progresso | Unicidade, autorizacao e protocolo 20261106212539 de concorrencia entre dispositivos | Escritas legitimas, indices, revisoes e WAL; nao suprimir atualizacao de progresso por heuristica |
| Outbox/operacoes | 6B3, #2257, saldo 6D10 e intencao/recibo/gate 6D12/13 | Leases, abortos, intencoes vazias/tombstones e retencao sem ACK; saldo de claims nao mede todos os bytes |
| Plataforma | Auth, logs, checkpoints/autovacuum e outros bancos/processos gerenciados | Aplicativo nao reserva nem interrompe todos esses escritores |

Os limites permanecem identicos: 6D4 (100 destinatarios, 8 KiB/linha,
256 KiB/capitulo, saldo 1.000 linhas/2 MiB); outbox (10.000 eventos e amostras
de 16/64/400 MiB); 6D10 desativado/sem limite numerico aprovado. Nao interpretar
medicoes instantaneas como admissao atomica de bytes. Outbox, IDs, recibos e
pendencias nao sao removidos para criar capacidade.

## Mudanca pequena comprovada

A funcao privada admitir_notificacoes_capitulo atualizava o singleton mesmo
para plano valido com zero linhas e zero debito. A migration dedicada
`20261112013209_evitar_reescrita_saldo_notificacoes_vazio.sql` insere somente
`if n=0 then return true; end if;` DEPOIS de todas as validacoes/limites e dos
mesmos advisory/row locks. Plano invalido, audiencia excessiva e saldo excedido
nao sao liberados pelo atalho. Com linhas, UPDATE/debito/barreira RR sao identicos.
Definicao existente e reutilizada; guard de contrato e verificacao de owner/ACL.
Nenhuma alteracao de RLS, grants, schema de tabelas, quotas, runner ou monitor.

Supabase local novo `ph1-physical-capacity`, CLI 2.116.0/Postgres 17.6, Node
22.23.4. Dois ensaios explicitos com EXPLAIN (ANALYZE, WAL, BUFFERS), 100 chamadas
em cada transacao e ROLLBACK, na tabela REAL (nao clone TEMP/unlogged):

| Amostra | Versao fisica CTID | Registros WAL | FPI | Bytes WAL |
| --- | --- | ---: | ---: | ---: |
| Main, antes | (0,1) -> (1,4), saldo zero | 202 | 2 | 17.908 |
| Correcao | (0,1) -> (0,1), saldo zero | 1 | 0 | 54 |

Sao amostras, NAO medianas, pior caso, bytes por operacao ou reserva de margem.
FPI/cache diferem: nao atribuir toda a diferenca de bytes a um fator universal.
A garantia estrutural e evitar UPDATE/novas versoes de linha sem debito; os locks
permanecem e ainda podem gerar WAL. Nao prometer WAL zero. No primeiro ensaio,
ROLLBACK restaurou o saldo/CTID visivel mas nao apagou os registros WAL.

## Validacoes locais e limites

- Instalacao de todas as migrations, inclusive a nova, em banco novo separado
  `ph1-pgtap-clean`: pgTAP COMPLETO, 34 arquivos e **954/954**, nenhum omitido.
- Integracao afetada de notificacoes/Data API: **8/8**, concorrencia pela ultima
  capacidade, audiencia congelada, resposta perdida, RR obsoleto, rollback,
  statement_timeout, retry e novos casos de debito zero. Sem retries do runner.
- Lint, Typecheck, Build, auditoria estatica, paginacao e sessao passaram. npm audit
  de producao: zero vulnerabilidades. npm ci com Node 22.23.4 e lockfiles.
- Playwright no build de producao local: **8/8**, desktop/mobile, um worker e
  --retries=0 (auth-ui e authenticated-pages). Fixtures exclusivas na porta
  56421. Nao e uma execucao da suite E2E inteira: cenarios de limpeza que
  excluem outbox/recibos nao foram usados nesta tarefa de preservacao.
- Antispam/Data API: quatro cenarios aprovados. Integracao geral de paginacao:
  falhou ao carregar comentarios da Comunidade por statement_timeout (57014);
  os outros contratos de RPC passaram. Nao aumentar timeout, remover RLS ou
  atribuir a causa ao PH-1 sem evidencia; permanece uma validacao pendente.

A primeira rodada de pgTAP/integracao foi invalidada por erro de orquestracao:
as suites compartilhavam o banco simultaneamente. CREATE POLICY aguardava uma
transacao de integracao; DDL/fixtures e limites globais interferiram entre si.
O comando bloqueado foi cancelado, o trigger QA remanescente foi removido e as
transacoes encerraram. Nao houve alteracao de producao nem purga de eventos.
O resultado valido e o pgTAP em banco novo isolado e a integracao isolada acima,
nao aquela rodada concorrente. As fixtures confirmadas, recibos, debitos e
outbox foram preservados; teardown nao exclui obra/conta em cascata.

Ao encerrar o PH-1, havia 11 eventos de outbox e 11 recibos confirmados no
descartavel de integracao, runner=false. Os dois descartaveis foram parados
com backup=true, sem remover volumes. Os onze containers antigos historietas
foram reiniciados, sem recriacao ou SQL nesse ambiente. Scripts/config de
medicao, config.toml e auxiliar ACL locais nao integram a PR.

## Proxima correcao indispensavel e alternativa segura

Antes de qualquer guard novo, homologar a fonte fisica no projeto com leitura
oficial autorizada e credencial minima, sem SQL/carga de producao: timestamp,
unidade, atualizacao, erros e idade aceitavel. Isso nao autoriza mudar o monitor.
Depois, aprovar H/A/X/F/M e um envelope que inclua TODOS os escritores e o
trabalho em voo, usando a desigualdade ja existente em CRITERIOS_ATIVACAO.
Nao escolher percentual ou teto de tentativas a partir desta microamostra.

Uma admissao global para notificacao manual/Comunidade/progresso seria mudanca
de contrato e exige projeto/testes/aprovacao separados; nao e segura como ajuste
oportunista. Uma amostra de disco, mesmo fresca, tambem nao reserva espaco.
Sem medicao confiavel/envelope, a alternativa viavel no escopo gratuito e manter
publicacao automatica suspensa, preservando os fluxos manuais existentes e os
freios atuais; isso NAO certifica o risco fisico geral do projeto. Se for exigida
garantia rigida contra todos os escritores gerenciados, falta contrato/controle
do provedor, nao mais um contador SQL. **PH-1 permanece NAO APTO.**
