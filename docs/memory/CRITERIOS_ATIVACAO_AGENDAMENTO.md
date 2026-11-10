# Criterios de ativacao do agendamento — consolidacao final

Base `main` `4ceb4fc4`, 10/11/2026. **NAO APTO para ativacao automatica.**
Este documento e uma proposta de aceite verificavel, NAO aprovacao de limites,
provisionamento ou autorizacao para ativar qualquer controle. Nenhum valor de
fixture ou maximo empirico e transformado em limite seguro de producao.

## Evidencias reaproveitadas, sem repetir auditorias aprovadas

Ver `CICLO_SEGURANCA_OPERACIONAL_OUTBOX.md`: pgTAP 914/914, integracoes 98/98,
unitarios 43/43, Lint/Typecheck/Build/audit de producao aprovados. CI, CodeQL e
Gitleaks do commit exato da main verdes. Sao resultados da rodada anterior,
nao novas execucoes deste documento. Playwright daquela rodada: 22/23, causa
da Obra autenticada inconclusiva; passe isolado 1/1 nao encerrou a pendencia.

Entrega pontual GitHub/Gmail ja comprovada pelo responsavel na 6D2. Nao foi
repetida nem elevada a prova de observacao periodica ou ausencia do verificador.
Acionador local 6D1 comprovado com gate falso, incluindo defaults e abortos;
template do provedor nao comprova a configuracao efetiva do projeto gerenciado.

## Nova verificacao da Obra autenticada: causa ainda inconclusiva

Rodada local instrumentada contra build de producao, Supabase descartavel,
Node 22.23.4, um worker e retries=0: **23/23** (Leitor canonico, agendamento/
Diario e Obra). O cenario autenticado passou nos contextos mobile, desktop e
visitante. A falha anterior nao reapareceu: nao atribuir causalidade a rede,
Supabase, autorizacao, hidratacao ou recursos apenas por esta rodada verde.

Na execucao saudavel, a requisicao da barreira iniciou/respondeu em 3.967/4.684 ms
no mobile, 2.412/3.077 ms no desktop autenticado e 1.618/1.755 ms no visitante,
relativos a cada abertura. Todas retornaram HTTP 200. Instrumentacao temporaria
server-only registrou 387 respostas upstream HTTP 200, sem erro de transporte
ou SQLSTATE observado. Sao dados de uma rodada local, nao medianas, comparacao
de desempenho ou diagnostico da ocorrencia anterior. Cancelamentos de fetch
RSC/documento observados nao demonstram falha da barreira.

Lacuna comprovada: o artefato da falha anterior nao tinha cronologia suficiente
para distinguir essas causas. Alteracao restrita a QA acrescenta, SOMENTE na
falha do cenario autenticado, anexo JSON sanitizado por contexto: tempos relativos,
classes de endpoint/status, erros por allowlist, estado publico do DOM e resumo
de long tasks. Nao le headers, cookies, corpos, armazenamento ou erros livres;
nao faz requisicoes, interceptacoes, esperas, retries ou mudancas de assercoes.

O buffer conserva os ultimos 120 eventos e informa descartes; isto limita memoria
de diagnostico, nao tentativas do produto. Um crash do worker/processo pode impedir
o anexo. O helper permanente observa o navegador, nao promete SQLSTATE upstream:
se houver novo 503, correlacionar o horario com o codigo upstream sanitizado do
servidor, sem registrar tokens ou conteudo. Ausencia de anexo nao prova sucesso.

Validacao do helper final: Playwright afetado **1/1**, sem retries; unitarios de
snapshot/diagnostico **12/12**, incluindo sanitizacao adversarial, buffer, cleanup
e falha do transporte do anexo sem substituir a excecao original. Lint, Typecheck,
Build e audit de producao (zero vulnerabilidades) aprovados. Pretestes estaticos
485/485, postestaticos 60/60, paginacao 37/37 e sessao 2002/2002 aprovados.
No workspace, estatica 198/199 apenas pela migration ACL auxiliar preexistente,
nao versionada; nao removida nem relaxada para passar. Copia isolada do index
versionado: **199/199**. Nenhum novo pgTAP ou teste
integrado de banco foi necessario para este diff exclusivamente QA/documentacao;
os 914/914 e 98/98 acima sao evidencias reutilizadas, nao nova certificacao.
Suite E2E completa, Lighthouse/k6/ZAP e certificacao gerenciada nao repetidos.

Descartavel parado com backup, runner/protocolo/orcamento desativados e saldo
consumido zero. Os mesmos onze containers antigos foram reiniciados; banco
confirma 14 eventos e runner=false. Ambiente E2E, config.toml e migration ACL
auxiliar preservados por hash; scripts/backup temporarios removidos. O log de
inicializacao do CLI mostrou chaves descartaveis locais durante o diagnostico;
o arquivo foi removido, os valores nao integram este diff nem os anexos de QA.

## Matriz de aceite: evidencia obrigatoria, nao so checklist de testes verdes

| ID | Criterio mensuravel | Evidencia exigida | Estado |
| --- | --- | --- | --- |
| QA-1 | Confirmacao publica, identidade/progresso e isolamento em mobile/desktop/anonimo; sem erros nao explicados | Captura na propria falha: documento, assets, Auth, barreira, codigos upstream por allowlist, estado e tempos; zero retry automatico | Em investigacao |
| CR-1 | Runtime dedicado, sem privilegios de scheduler/API/tabelas | Inventario do destino e homologacao do mesmo caminho: session_user dedicado, role=none, ACL/grantor, extensao/modo/HBA/defaults; negacoes anon/authenticated/service_role | Local aprovado; gerenciado pendente |
| CR-2 | Timeouts ja existentes armados antes da instrucao | Statement <=10 s, lock <=500 ms, idle-in-transaction <=5 s; abortos reais e rollback, nao SET no corpo como prova | Local aprovado; gerenciado pendente |
| OB-1 | Observacao de execucoes fora da transacao que pode abortar | Queda/timeout/resposta perdida, importacao idempotente, pausa duravel, recuperacao por CAS sem reativacao; nao perder historico ainda nao observado | Contratos locais aprovados; acionamento pendente |
| OB-2 | Atraso de deteccao/entrega e ausencia do proprio observador | Definir prazo aceito, medir injecao->deteccao->entrega; testar falha do banco, rede, canal e supressao de uma verificacao; responsavel/runbook definidos | Pendente |
| AT-1 | Horizonte, total de admissoes/tentativas e concorrencia finitos | Parametros aprovados + teste transacional de ultima vaga/aborto/replay; incluir vazios, tombstones, consultas recusadas e conexoes em espera | Pendente; saldo 6D10 nao cobre tudo |
| RE-1 | Evidencias cabem no horizonte sem apagar obrigacoes | Orcamento de bytes/linhas e procedimento de parada/exportacao; recibos/IDs/leases/tombstones preservados; nenhum ACK inventado | Pendente |
| PH-1 | Margem fisica real suficiente para trabalho em voo e parada | Fonte homologada, frescor/erro de medicao, limites de crescimento de TODOS os escritores/WAL/temporarios e reserva de recuperacao | Pendente; NAO APTA |

CR-2 trata de configuracao previa e abortos observados, nao de um prazo fisico
rigido para conexao, fila, IO ou resposta HTTP. O ensaio local de statement
timeout terminou em cerca de 10,001 s; idle-in-transaction nao limita uma query
ativa. Nao apresentar o orcamento cooperativo de 2 s como deadline de transacao.

Publicacao deve sempre satisfazer `commit_publicacao_UTC >= instante_programado`.
Para atraso maximo operacional, aprovar cadencia, prazo de recuperacao e backlog
admitido e medir `commit_publicacao_UTC - instante_programado` por classe de
falha. Sem capacidade minima de servico e chegada limitada, cadencia sozinha
nao prova atraso maximo durante indisponibilidade ou backlog crescente.

OB-2 precisa declarar se aceita monitoramento best-effort. GitHub documenta
atrasos, descarte de disparos e desativacao apos inatividade; schedule sozinho
nao satisfaz um prazo maximo rigido nem observa sua propria indisponibilidade.
O verificador atual e manual e autorizado=false na ultima leitura. Nao se cria
um job nem se presume quota/plano de heartbeat do Sentry ou de outro servico.
[Fonte oficial GitHub](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule).

Pausar apos tres falhas OBSERVADAS nao prova pausa antes da quarta execucao.
Se esse for o contrato exigido, e necessario provar serializacao/admissao entre
executor e observador. O monitor de leitura nao fornece essa barreira. Nao
ativar primeiro para descobrir depois qual garantia o ambiente oferece.

## Folha de aprovacao operacional — variaveis que nao podem ficar implicitas

Antes de configurar limites, registrar valor, unidade, fonte, responsavel,
revisao e validade para:

- `H`: horizonte finito de operacao ate revisao/parada obrigatoria.
- `A`: maximo acumulado de novas intencoes, inclusive vazias e tombstones.
- `X`: maximo de tentativas SQL/HTTP e concorrencia de sessoes do chamador.
- `E`: eventos existentes + publicacoes admitidas no horizonte, incluindo backlog.
- `B_evidencias`: bytes disponiveis para outbox, indices, recibos, vinculos,
  retomadas, revisoes/tombstones e historicos operacionais/Cron.
- `D`: atraso de deteccao/entrega aceito e limite de indisponibilidade do observador.
- `F`: idade/erro maximos aceitos da medicao fisica, com comportamento na ausencia.
- `M`: margem para recuperacao, manutencao e trabalho ja em voo, sem confundir
  disco livre, quota comercial do banco e quota de objetos Storage.

Nao foram escolhidos valores para essas variaveis. As cadencias/contagens dos
ensaios, os tetos logicos existentes e o tempo de teste nao as aprovam.

## Tentativas: dimensionar e testar o que o saldo realmente conta

O saldo 6D10 debita linhas reivindicadas confirmadas. Com ate cinco eventos por
lote, o numero de claims depende do lote efetivo e de quantas vezes um evento
volta a ser elegivel. Nao presumir cinco eventos novos por chamada, fila vazia
barata, nem limite de reclaims: a outbox continua pendente mesmo apos solicitada.

`N_intencoes = N_com_claim + N_vazias + N_encerradas_sem_claim`.
O debito de claims pode ser zero enquanto `N_intencoes` cresce. Um budget de
intencoes futuro deve contabilizar tambem reconciliacao de UUID ausente, sem
permitir contorno por tombstone. Esse controle ainda nao foi implementado.

Admissao duravel precede execucao; rollback desta nao apaga a pendencia. Isso
nao contabiliza cada tentativa que aborta antes de qualquer commit, nem cada
repeticao da mesma execucao. Para um teto de tentativas, o chamador precisa
limitar envios/concorrencia ANTES da tentativa, preservar UUID, nao repetir
execucao ambigua e reconciliar antes de nova admissao. Se precisar evidenciar
todos os abortos, a evidencia tem de sobreviver fora da transacao abortada.
Sem essa prova, nao chamar um contador transacional de limite total de WAL.

Aceite de um futuro controle: ultima unidade concorrente tem um vencedor;
debito e identidade nao sao reutilizados; replay de recibo nao cobra/renova lease;
aborto deixa incerteza fechada; CAS antigo nao reabre uma pausa nova. Testar
tambem espera por locks, lote vazio, quota saturada e reconciliacao sem UUID.

## WAL e capacidade: condicoes verificaveis, sem transformar amostra em teto

Separar `wal_bytes` cumulativo (com stats_reset), bytes de arquivos WAL ocupados,
bytes de banco/indices e espaco fisico disponivel. Rollback nao elimina WAL;
checkpoint, full-page images, manutencao e slots alteram crescimento/retencao.
O ensaio anterior de 11.348 bytes e uma amostra local, nao pior caso provado.
[Estatisticas PostgreSQL](https://www.postgresql.org/docs/17/monitoring-stats.html),
[WAL/checkpoints](https://www.postgresql.org/docs/17/wal-configuration.html).

Para um horizonte aprovado, a condicao fisica proposta e:

`livre_validado - erro_medicao > crescimento_dados + crescimento_WAL_retido +
temporarios/manutencao + trabalho_em_voo + margem_recuperacao`.

Somar apenas crescimento futuro a partir da mesma amostra, evitando contar WAL
ja ocupado duas vezes. Cobrir tambem a idade da amostra e o intervalo ate parar.
Aplicar SEPARADAMENTE a condicao de quota de dados do plano. Um maximo observado,
p95 ou taxa media nao e limite superior comprovado de cada termo.

Sem limites confiaveis para outros escritores (publicacao manual, progresso,
comentarios, Auth, outros notificadores, manutencao), a desigualdade nao esta
demonstrada. Apenas fechar o runner nao para esses escritores nem libera WAL.
Neste estado nao ha garantia fisica total pela arquitetura atual; nao inventar
percentual de seguranca ou considerar max_wal_size um teto rigido.

Supabase distingue quota de banco e disco fisico: a protecao read-only e
best-effort; escritas em voo/WAL podem continuar crescendo. A resposta segura
nao e contratar recursos neste escopo nem apagar eventos para liberar espaco.
[Contrato oficial do Supabase](https://supabase.com/docs/guides/platform/database-size).

A API oficial de disco exposta e GET `/v1/projects/{ref}/config/disk/util`,
com permissao minima `infra_disk_config_read` e campos `timestamp`,
`fs_size_bytes`, `fs_avail_bytes`, `fs_used_bytes`. Certificar no plano/projeto
alvo: permissao efetiva, unidades, timestamp do fornecedor, idade, latencia,
atualizacao, erro e tratamento de 401/403/429/500. Hora de recebimento nao
substitui hora de coleta. O schema publicado nao fornece SLA de atualizacao;
uma leitura bem-sucedida nao garante espaco futuro. Nao foi feita consulta de
producao nem utilizado PAT amplo para substituir a homologacao de menor privilegio.
[Referencia oficial da medicao](https://supabase.com/docs/reference/api/v1-get-disk-utilization).

## Retencao: preservar provas ou permanecer parado

Dimensionar `B_evidencias` com backlog atual e novas linhas/indices/bloat de todas
as tentativas admitidas no horizonte. Incluir cron.job_run_details, observacoes,
incidentes e recibos alem da outbox. Medir crescimento por classes de operacao,
mas nao extrapolar media de bytes/linha como reserva fisica.

Outbox sem ACK e UUID/tombstone sem janela finita de replay nao podem receber
TTL por idade. Exportar uma copia nao impede replay no banco ativo. Purga futura
exige barreira verificavel de geracao/replay e preservacao das referencias ou
prova de conclusao apropriada; nenhum contrato desse tipo foi autorizado aqui.

Se o horizonte acabar ou a capacidade de evidencias saturar sem descarte seguro,
parar novas admissoes e manter pendencias, nao zerar saldos nem retomar sozinho.
Retomada exige diagnostico, nova capacidade/orcamento aprovados e CAS. Nao
reabrir apenas por alerta de recuperacao ou por expiracao de lease.

## Proxima decisao indispensavel

Nao criar novas camadas SQL para declarar o sistema pronto. Primeiro completar
as evidencias de QA e homologacao gerenciada, definir o contrato de atraso e
aprovar horizonte/orcamento finitos com os termos fisicos conhecidos. Se nao
for possivel limitar outros escritores/retencao, manter capacidade fisica NAO
APTA ou revisar explicitamente o requisito operacional; nao fabricar garantia.

## Preparacao operacional posterior, sem ativacao

Ver [desbloqueio operacional](DESBLOQUEIO_OPERACIONAL_AGENDAMENTO.md): watchdog
separado e manual, prova de conclusao real (nao teste de e-mail), patch periodico
inerte, folha de aprovacao dos orcamentos e inventario Cron somente leitura.
Mantem pendentes a testemunha fora do GitHub, as evidencias do SU-546160 e a
certificacao fisica. Nenhum schedule, runner, controle SQL ou upload ativado.
