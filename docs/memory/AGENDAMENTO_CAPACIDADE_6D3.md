# Agendamento — 6D3: capacidade física e segurança operacional

Data: 10/11/2026. Base: main `58c73686` (#2253), sincronizada com origin/main.
**Conclusão: NÃO APTO para capacidade da publicação automática.** Não foi
implementado nenhum guard novo ou alterada uma migration para declarar aptidão.
Esta fase registra evidências e propõe os controles indispensáveis seguintes.

## Histórico 6D2 atualizado

[Execução 42746976242](https://github.com/HistorietasFlow/Historietas/actions/runs/42746976242)
confirmada como workflow_dispatch bem-sucedido na main. O
[comentário 6757784994](https://github.com/HistorietasFlow/Historietas/issues/2252#issuecomment-6757784994)
foi publicado por github-actions[bot], com TESTE_ENTREGA. O responsável confirmou
o recebimento no Gmail e a restauração de AGENDAMENTO_MONITOR_AUTORIZADO=false.
Não foi acessada sua caixa de e-mail nem alterada a variável nesta auditoria.
**Entrega pontual validada; periodicidade e leitura SQL gerenciada não certificadas.**
Detalhes em [6D2](AGENDAMENTO_MONITOR_EXTERNO.md).

## Limites reais da #2250

Migration `20261109215507_protecao_capacidade_outbox_capitulos.sql`:

| Controle | Garantia demonstrada | O que não garante |
| --- | --- | --- |
| Até 10.000 eventos | Trigger no INSERT, lock transacional e escrita da barreira; inclui eventos já solicitados | Espaço físico máximo ou retenção infinita |
| Outbox 16 MiB | Medida de tabela, TOAST e índices antes dos itens | Reserva de bytes; limitação de atualizações de lease |
| Notificações 64 MiB | Amostra física antes do item | Teto de destinatários ou de escrita pelo item/por outros caminhos |
| Banco 400 MiB | pg_database_size do banco inteiro | Disco livre, WAL, temporários ou margem de segurança garantida |
| Alerta em 70% | Sinal consultável pela saúde existente | Entrega periódica ou interrupção antes de uma escrita já iniciada |
| Pausa e retomada | Estado persistente, revisão/CAS e retomada sem habilitar runner | Interrupção de todos os escritores do projeto |

RLS, revokes, grants mínimos, enums e ausência de wrapper público foram
revalidados pelo pgTAP existente, sem mudar as asserções. Não elevar os limites,
usar TTL, interpretar solicitada_em como ACK ou apagar eventos para abrir vagas.

## Plano e leitura agregada de produção

A API de gestão confirmou plano **Free** e projeto saudável, PostgreSQL
17.6.1.121. Uma única consulta SELECT de agregados/catálogos, sem dados pessoais
ou qualquer escrita, retornou:

| Medida | Bytes | MiB aproximados |
| --- | ---: | ---: |
| Banco | 22.981.779 | 21,917 |
| Outbox, incluindo índices | 32.768 | 0,031 |
| Notificações, incluindo índices | 204.800 | 0,195 |
| WAL gerado acumulado desde 07/05/2026 | 157.904.633 | 150,590 |

O último valor é pg_stat_wal.wal_bytes, **não WAL retido nem disco ocupado/livre**.
Não foi consultado sistema de arquivos remoto nem executado teste de carga em
produção. O tamanho físico livre e o WAL retido do destino continuam pendentes.

A documentação do Supabase distingue quota comercial nominal de banco de
500 MB e disco Free fixo de 2 GB, sem autoscaling. O modo read-only em 95% é
best-effort: operações já iniciadas e WAL podem continuar consumindo disco.
WAL pode ultrapassar max_wal_size, que não é teto físico estrito. Não deduzir
espaço livre subtraindo apenas pg_database_size nem prometer 100 MiB de margem
entre 400 MiB e uma quota descrita em MB. As métricas/fair-use do painel e o
espaço efetivo precisam de conferência antes de ativar.

## Testes locais e resultados

Supabase **novo e descartável** `6d3-clean`, somente PostgreSQL, CLI 2.116.0,
Node 22.23.4, imagem postgres:17.6.1.165; migrations versionadas mais a auxiliar
local preservada. Não é medição de latência do gerenciado. Sem pg_cron, runner
sempre false; nenhuma publicação automática ou upload habilitado.

| Cenário | Resultado observado |
| --- | --- |
| pgTAP existente capitulo_runner_capacidade.test.sql | **35/35**, sem omitir testes ou enfraquecer asserts |
| Última vaga com transação mantida por barreira de lock | Segundo escritor rejeitado 55P03; após rollback do primeiro, retry válido; após preencher a vaga, 54000 |
| Snapshot REPEATABLE READ anterior a outra admissão | 40001, sem contornar o limite |
| Timeout após inserir evento | Rollback integral, vaga/locks liberados |
| União de audiências do notificador estrito real | 20, 1.200 e 3.000 destinatários distintos; retry do mesmo capítulo criou zero duplicatas |
| Escritor independente com lock de capacidade mantido | Ultrapassou o orçamento de notificações da fixture; não compartilha o lock de admissão |
| Rollback de 1.000 notificações | Quantidade de linhas restaurada; intervalo do cluster gerou 4.971.544 bytes de WAL |
| 10.000 eventos e cinco atualizações de leases | Mesma quantidade e dados imutáveis; crescimento físico e WAL abaixo |
| Consumidor real, após expiração natural dos leases | 2.000 lotes de cinco, 10.000 reivindicações, nenhum evento removido |

### Fan-out e escritores independentes

`historietas_privado.notificar_capitulo_agendado` reutiliza a união de
seguindo_obras, favoritos e seguindo_usuarios (seguidores do autor). Remove
duplicatas e o próprio autor, mas não impõe teto global de destinatários.
Os LIMIT 1 da função localizam obra/capítulo/metadados; não limitam a audiência.
Também existem os caminhos legados de capítulo, interação de capítulo, social
e Comunidade que escrevem notificações sem usar o lock de capacidade do runner.
Isso não é uma falha de autorização: são escritores legítimos independentes.

| Destinatários da fixture | Notificações antes → depois (bytes) | WAL do EXPLAIN | Execução local |
| ---: | ---: | ---: | ---: |
| 20 | 98.304 → 196.608 | 31.478 | 154,816 ms |
| 1.200 | 196.608 → 1.474.560 | 2.150.406 | 461,687 ms |
| 3.000 | 1.474.560 → 4.497.408 | 5.416.584 | 2.701,186 ms |

São amostras com títulos/metadata de fixture, **não tetos por destinatário**.
Um único notificador já excedeu o orçamento cooperativo de 2 s do runner nesse
ambiente; isso não prova o mesmo tempo em produção. O orçamento é verificado
entre itens, não interrompe um item. O statement_timeout limita tempo, não
bytes gerados antes de um aborto.

Prova de concorrência: somente na fixture, limite de notificações reduzido para
4.628.480 bytes, com 128 KiB livres. A transação A recebeu capacidade disponível
e manteve seus locks. A transação B chamou o notificador de outro capítulo:
4.497.408 → 7.618.560 bytes, **2.990.080 bytes acima do orçamento**, sem esperar
o lock. A leitura posterior detectou notificacoes_bytes. Não se testou encher
64 MiB ou o disco: a escala reduzida demonstra a ausência de reserva, não um
esgotamento ocorrido em produção. O orçamento original da fixture foi restaurado.

### Outbox, leases e WAL

Na nova fixture, a outbox atingiu exatamente 10.000 eventos e recusou o próximo
INSERT. Tamanho após preenchimento: **2.965.504 bytes (2,828 MiB)**. Após cinco
rodadas de atualização de leases/tentativas: **14.729.216 bytes (14,047 MiB)**.
O intervalo de preenchimento/atualizações gerou **36.470.504 bytes de WAL** do
cluster local. Não atribuir esse intervalo como custo exato universal da função.

Com leases naturalmente vencidos, o consumidor real reivindicou 10.000 eventos
em lotes de cinco: 14.737.408 → **15.228.928 bytes (14,523 MiB)** e intervalo de
WAL de 5.774.056 bytes. **Não ultrapassou 16 MiB nessa rodada.** Não inferir
um teto permanente: vacuum/reutilização, snapshots longos, índices e TOAST
influenciam o resultado. Uma medição posterior foi 15.253.504 bytes; medidas
físicas são instantâneas. Todos os IDs/dados imutáveis e 10.000 eventos ficaram
preservados. Reivindicar/solicitar não libera vaga nem confirma flush.

Havia 96 MiB de arquivos WAL alocados localmente após preenchimento/atualizações,
antes do ensaio do consumidor real, sem slots de replicação. Isso não é espaço
livre nem medida do WAL retido em produção.
Rollback não desfaz WAL já escrito nem devolve instantaneamente espaço físico.
Não foi provocado disco cheio, desativado checkpoint/autovacuum ou criado slot
para reter WAL. Não extrapolar este ensaio para uma garantia de não esgotamento.

### Limitações/instrumentação

As primeiras tentativas de copiar o banco com pg_restore esbarraram em ownership
de event trigger e CREATE de schema sob SET SESSION AUTHORIZATION. As cópias
incompletas foram removidas; banco original e seus 14 eventos ficaram idênticos.
Não foram concedidos privilégios extras ou desabilitados triggers para forçar
a restauração. Optou-se por stack novo inicializado pelas migrations.

No harness temporário, corrigidas captura de stderr e fixture de rollback que
omitia notificacao_id NOT NULL. A operação inválida foi revertida; executados
somente os cenários restantes após a correção, sem repetir os já aprovados.
São limitações do instrumento, não regressões do produto. Scripts temporários
não compõem a aplicação/PR. Logs locais sanitizados em qa/reports.

Não reexecutadas suites completas de UI, build ou integrações de jornadas:
esta PR altera apenas documentação; não modifica o executor ou seus contratos.
O pgTAP focado, os cenários acima e diff --check são as evidências desta fase,
não uma declaração de CI/Playwright completos aprovados.

## Proteção recomendada, em fases separadas da ativação

1. **Próxima implementação mínima: orçamento transacional de fan-out agendado.**
   Materializar uma única seleção elegível limitada a N+1 destinatários antes
   de publicar/gravar efeitos. Se houver até N, ela representa o conjunto
   completo; acima de N, suspender o item
   inteiro por capacidade, sem notificar somente um prefixo, perder eventos ou
   consumir retries técnicos indevidamente. Revalidar contra concorrência sem
   contar um conjunto e inserir outro. N e o limite de payload precisam de
   aprovação baseada em capacidade; nenhum valor foi arbitrariamente aprovado.
   Isso limita a amplificação lógica, **não certifica sozinho disco/WAL**.
2. **Envelope operacional completo.** Exigir inventário de espaço físico/WAL,
   margem para operações em andamento, orçamento por lote/período e limites
   dos demais escritores. Cobrir notificações, payload, índices, temporários,
   bloat e logs do Cron/monitor. Uma leitura ausente/antiga deve impedir novo
   disparo; não conceder leitura ampla de arquivos do servidor ao monitor.
   Medir somente banco ou um contador cumulativo de WAL não atende ao requisito.
3. **Parada conservadora e recuperação.** Manter os limites atuais e a outbox
   integral. Capacidade ocupada esgota a admissão, não os dados. Retomada somente
   administrativa por revisão, depois de tratar a causa; alerta recuperado não
   habilita runner. Não executar VACUUM FULL, purga ou exclusão de slots como
   solução automática de emergência. Não contar com rollback para liberar disco.
4. **Retenção finita explicitamente aceita.** Sem ACK verificável, 10.000 eventos
   exigem parada planejada; não há operação ilimitada com armazenamento finito.
   Fórmula idealizada de vagas: (10.000 − eventos atuais) / publicações diárias;
   bytes/outros recursos podem esgotar antes. Não é previsão com dados reais.

Critérios de aceitação seguintes: limites de fan-out/payload justificados,
idempotência/rollback e audiências exatas; corrida com alteração de seguidores;
nenhuma notificação parcial; classificação de capacidade sem retry indevido;
orçamento agregado e fonte física atual verificáveis; comportamento sob backlog,
WAL/temporários e outros escritores limitado; canal operacional independente e
latência aceitos. Até então, manter runner/Cron desativados.

## Custos, preservação e conclusão

Sem contratação, ampliação de quotas ou novos serviços. Houve apenas consumo
temporário de CPU/disco do Docker; o teste 6D2 utilizou Actions padrão público.
Isso não elimina os limites nem o risco de indisponibilidade do plano Free.

Os stacks/volumes anteriores, config.toml e migration auxiliar foram preservados.
O novo stack mantém seus eventos de auditoria e deve ficar parado após o ensaio.
Nenhuma migration desta fase, alteração funcional, configuração Vercel, ACK,
limpeza de pendências, Cron ou ativação foi implementada. Em produção houve
somente leitura agregada. Corrida do Storage e uploads ilustrados suspensos
permanecem independentes.

**NÃO APTO para capacidade.** A contagem transacional é comprovada; o orçamento
físico global não é. Entrega pontual de alerta não corrige esse limite.

Fontes primárias:

- [Supabase: tamanho do banco/disco, Free e WAL](https://supabase.com/docs/guides/platform/database-size).
- [PostgreSQL: parâmetros WAL](https://www.postgresql.org/docs/17/runtime-config-wal.html).
- [PostgreSQL: estatísticas WAL cumulativas](https://www.postgresql.org/docs/17/monitoring-stats.html#MONITORING-PG-STAT-WAL-VIEW).
- [PostgreSQL: vacuum e reutilização de espaço](https://www.postgresql.org/docs/17/routine-vacuuming.html).
- Migrations locais #2229, #2231 e #2250, pgTAP de capacidade e contratos atuais
  de notificação/consumidor são as fontes de verdade das garantias da aplicação.
