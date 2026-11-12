# Estado atual

Atualizado em: 2026-11-12

### Prévia integral de capítulos de texto

Adicionar/Editar já possuíam prévia local, mas limitada visualmente a duas
linhas, inclusive no desktop. O painel existente agora permite expandir e
recolher o corpo completo com teclado e estado acessível, preservando parágrafos
e espaços internos como no Leitor (`pre-wrap`, texto simples escapado).
A prévia usa somente o buffer do formulário: não salva, publica, consulta ou
altera o capítulo remoto. A expansão é local à obra/capítulo e o modo compacto
continua sendo o inicial. Conteúdo autoral do corpo não é traduzido pelo bridge.
Sem mudanças em rascunhos, RLS, agendamento, Leitor ou capítulos ilustrados.
A prévia da criação inicial de obra (`/publicar`) continua resumindo o arquivo
importado; não foi ampliada nesta alteração de Adicionar/Editar capítulo.
Validação: quatro cenários novos Playwright passaram no build de produção local,
desktop/mobile, workers=1/retries=0, com axe, teclado, EN/ES, texto literal,
ausência de consultas adicionais e rascunho privado inalterado na Data API.
Audit de produção, Lint, Typecheck, Build, gates static/pagination/session e
antispam local passaram. As suítes Node dos gates rodaram em série por memória.
Limitações independentes: paginação integrada voltou a atingir statement timeout
na segunda página de comentários da Comunidade, já registrado neste descartável.
O fluxo E2E longo de publicar/editar/excluir excedeu 45s (menu do painel consumiu
14,7s na execução instrumentada); no build anterior, de código equivalente à
main, esse fluxo falhou antes da prévia, no login. Isso não comprova causa comum
nem autoriza declarar a regressão ampla aprovada. Nenhum timeout, retry,
asserção ou fluxo de produção foi alterado para obter aprovação.

### Painel do autor — conversas sem resposta

O menu da obra publicada passa a oferecer `Ver comentários`, reutilizando
`comentarios=1` e o sheet atual, sem prefetch adicional. Conversas iniciadas por
leitores recebem `Sem resposta do autor` somente para a identidade proprietária
e após leitura remota confirmada da obra/versão de identidade atuais.
Respostas do autor em qualquer nível contam, inclusive recolhidas; nomes iguais
não comprovam autoria. Cache/fallback e comentários locais não certificam ausência.
Não existe contador global nem varredura do catálogo: a indicação abrange apenas
as conversas paginadas já carregadas. Novas respostas/remoções locais recalculam
o marcador; alterações externas exigem nova leitura pelo fluxo existente.
Comentários de capítulos, spoilers, RLS e agendamento não foram alterados.
O deep link aguarda identidade e barreira pública antes de abrir: a limpeza
inicial de conta fechava o sheet autenticado prematuramente. Reconfirmações não
reabrem um sheet já fechado manualmente; Voltar/Avançar mantém a intenção da URL.
Validação local: Playwright 9/9 (5 novos e 4 existentes), desktop/mobile,
workers=1/retries=0, incluindo axe; autorização Data API 5/5 e auditoria estática
199/199; unitários focados 27/27, Typecheck e Build passaram. Não houve
migration, mudança de RLS ou nova consulta.
Integrações amplas no descartável reutilizado não ficaram verdes: paginação
57014 e antispam 28/60 curtidas aceitas; nenhuma regra/limite foi relaxado.
Não atribuir essas falhas ao frontend nem declarar a suíte completa aprovada.
Detalhes dos demais gates e limitações constam na PR correspondente.

### PR #2273 — isolamento QA de notificacoes

Run `43140137033`: primeira falha real em capacidade:167, notificacoes 0/2.
Fixture anterior deixou capitulo vencido em erro; runner global publicou esse
capitulo antes dos alvos da suite. Reproduzido em banco inicialmente vazio:
13/17, mesma assercao, com captura de estados/notificacoes na ocorrencia.
Correcao QA cancela somente agendamentos ativos proprios pela RPC autenticada
e revisao/CAS, preservando obra, outbox, recibos, debitos e limites. Nenhuma
alteracao adicional em migration, producao, locks/RLS ou controles administrativos.
Em outro descartavel: pgTAP completo 954/954; sequencia notificacoes ->
capacidade 18/18, serial e sem retries, mantendo todas as assercoes anteriores.
Ver `QA_AGENDAMENTO_OUTBOX.md` e checks da propria PR para os gates completos.

### PH-1 — capacidade fisica/WAL, reducao parcial

Base `d7194237`. Fonte de disco gerenciada continua nao homologada; sem token
de menor privilegio disponivel, nenhuma consulta/SQL/carga em producao.
API oficial oferece timestamp/fs_avail; Metrics API tem series de filesystem,
mas exemplo/HTTP recente nao certificam coleta nem reserva. PH-1 NAO APTO.
Encontrado UPDATE sem debito na admissao privada 6D4. Migration dedicada
`20261112013209_evitar_reescrita_saldo_notificacoes_vazio.sql` evita somente
reescrita de plano vazio, apos validacoes e mesmos locks; nao recria saldo nem
altera limites, grants/RLS, monitoramento, runner ou gates.
Ensaio local de 100 chamadas: CTID variava antes e ficou estavel depois;
WAL 202 registros/17.908 bytes (2 FPI) antes, 1/54 (0 FPI) depois. Amostras
com cache/FPI diferentes, nao teto/percentual garantido. Rollback nao apaga WAL.
Ver `AGENDAMENTO_CAPACIDADE_PH1.md`: fontes, demais escritores, evidencias,
limites e proxima homologacao. Sem ativacao, ACK, purga ou mudanca de producao.
Validacao isolada: pgTAP completo 954/954, integracao afetada 8/8 e smoke
Playwright desktop/mobile 8/8 sem retries; Lint/Typecheck/Build/static/sessao
e paginacao unitarias passaram. Integracao geral de paginacao ficou pendente
por timeout na consulta de comentarios; nao mascarado. Volumes preservados e
onze containers antigos restaurados. Detalhes/limites no relatorio PH-1.

### Ressincronizacao SQL proposta, sem merge

Apos #2271 na `main`, o cron SQL apareceu habilitado no GitHub, mas sem runs
`schedule` nos horarios verificados. Preparada PR draft para trocar sintaxe
`10,25,40,55 * * * *` por `10/15 * * * *`, com os mesmos quatro minutos UTC,
para tentar ressincronizar o scheduler. Causa externa nao comprovada; nao
prometer que mudanca corrige atraso. Watchdog permanece desautorizado
(`false` informado pelo responsavel); cron watchdog e SQL v2 preservados.
Sem merge autorizado nesta etapa, sem publicacao/runner/pg_cron.

### Ensaio monitor SQL e Sentry — PR draft de cron, SEM MERGE

Conferencia visual em 11/11: Sentry Developer gratuito, teste Business 5 dias,
1/300 Cron Monitors (299 temporarios), gasto adicional US$ 0 e sem meio de
pagamento. Developer inclui 1 monitor permanente; reutilizar o existente.
Monitor `*/15` UTC, margem 10 min, runtime 3 min, limiares 1/1; alerta ativo,
mas primeiro check-in/e-mail ainda nao comprovados.
Branch draft prepara os crons SQL 10/25/40/55 e watchdog */15 em arquivos de
workflow, sem tocar `main` nem gates remotos. Cron GitHub sera disparado apos
merge, por isso ambos os gates devem ser conferidos false ANTES de autorizacao
de merge; a PR NAO e autorizacao de ativacao. SQL v2, TLS, permissao read-only,
alertas de capacidade e WAL preservados. Ensaio autorizado nos parametros:
janela SQL 30 min e duracao 72 horas, execucao condicionada a preparacao
administrativa e autorizacao separada. Nao habilitar runner, pg_cron ou publicacao.

### Homologacao final Sentry/GitHub — preparacao, sem ativacao

Base `aaf693fc`. Run real #43089501994, attempt 1: preflight/etapa v2 success,
transporte de teste skipped. Job 19:41:17Z–19:41:27Z, SQL/entrega 19:41:21Z–24Z.
Autenticacao SQL gerenciada aprovada; nao repetir auditoria de senha/ACL.
Responsavel confirmou gate do monitor false. Sem novo SQL remoto/check-in.
Proposta no patch INERTE: SQL 10/25/40/55 UTC, watchdog */15 (cadencia aprovada),
janela SQL 30 min e ensaio 72 h sujeitos a aprovacao. Workflows reais manuais.
Run manual nao mede fila periodica: GitHub pode atrasar/descartar; nao ha SLA.
Plano unico, matriz de sucesso/falha/ausencia/timeout/recuperacao/e-mail e acoes
administrativas em `docs/operacao/sentry-watchdog-homologacao.md`.
Sentry ok significa SQL real fresco + entrega, nao saude/capacidade/WAL/runner.
Periodicidade e recebimento reais seguem PENDENTES. Cron/runner/publicacao e
uploads continuam bloqueados; nenhuma configuracao/secrets alterados.

Validacao local Node 22.23.4/npm ci: 63/63 testes focados (CA/TLS loopback,
monitor, watchdog e Sentry), auditoria estatica 199/199, paginacao/sessao,
Lint, Typecheck, Build e audit de producao (zero vulnerabilidades) aprovados.
git apply --check confirma o patch sem aplica-lo. Sem mudanca em app, SQL ou
workflows ativos; pgTAP/Data API/Playwright amplos nao foram repetidos nesta
preparacao de documentacao/QA. Testes locais nao certificam entrega remota.

### TLS do monitor SQL — CA oficial explicita, 11/11/2026

Base `0554750b`. O pooler real apresentou cadeia Supabase Root 2021 CA, ausente
dos trust stores padrao testados (SELF_SIGNED_CERT_IN_CHAIN/UntrustedRoot).
Versionada a CA publica obtida por HTTPS da URL publicada no codigo oficial
do painel, tambem conferida com o download fornecido pelo responsavel.
Workflow usa arquivo exclusivo, pin SHA-256 DER, assinatura e validade no
preflight; TLS verify-full, hostname e LOGIN dedicado permanecem obrigatorios.
Sem download em runtime, trust global, novo secret, senha ou ativacao.
Ver `qa/certificates/README.md` e `docs/operacao/monitor-sql-login.md`.
Validacao focada: 61/61 (CA, monitor, watchdog e Sentry), incluindo TLS real
loopback com PKI sintetica apenas de teste. Pooler real: CA oficial aceita
(TLS 1.3); CA invalida/ausente e hostname errado rejeitados. Psql Linux 17.6
com verify-full repetiu os quatro casos: CA correta chegou apenas a exigencia
de senha (`no password supplied`); demais casos falharam na CA/hostname.
Nenhuma senha, autenticacao bem-sucedida, SQL remoto ou check-in foi enviado.
Node 22.23.4/npm ci reproduzivel: Lint, Typecheck, Build, YAML, auditoria estatica
199/199, paginacao/sessao e audit de producao (zero) aprovados. O primeiro Lint
foi iniciado antes de terminar npm ci e encontrou modulo ainda incompleto;
apos a instalacao terminar, o mesmo Lint passou sem alteracao de dependencias.
O npm ci apontou advisories de desenvolvimento no lockfile existente; nao
executado audit fix. Sem mudanca de app/SQL, pgTAP, Data API e Playwright amplos
nao foram repetidos localmente nesta correcao TLS; checks da nova PR sao separados.
Autenticacao SQL/entrega real v2 e homologacao Sentry continuam pendentes;
um handshake sem credenciais nao comprova esses contratos.

### Monitor SQL — identidade de conexao dedicada, 11/11/2026

Base `main` `50dcd318`. Inventario remoto autorizado anterior confirmou que o
papel usado pelo workflow era NOLOGIN. Preparado LOGIN separado, sem senha,
sem heranca de privilegios e somente SET ROLE para o grupo do snapshot, que
permanece NOLOGIN. Guard de ACL efetiva considera PUBLIC sem revogacoes globais.
Workflow manual usa Shared Session pooler, usuario com project ref e TLS
verify-full; consulta fixa comprova identidade, READ ONLY e timeouts.
Provisionamento/segredos/rotacao e homologacao gerenciada exigem etapa propria;
ver `docs/operacao/monitor-sql-login.md`. Resultados locais registrados na PR.
Nenhuma credencial real, migration remota, schedule, runner, Cron ou upload ativado.

Validacao local Node 22.23.4/CLI 2.116.0: pgTAP completo 936/936 (22 novos),
unidades monitor/watchdog/Sentry 57/57, integracao LOGIN/TLS/Supavisor 9/9,
snapshot/concorrencia 4/4 e anti-spam Data API 5/5. Lint, Typecheck, Build,
test:static (199/199), paginacao/sessao unitarias e audit de producao (zero)
aprovados. A primeira consulta do snapshot atingiu o timeout sob execucoes
locais concorrentes; falhou fechada. Medicao isolada 2,70 s e integracao serial
posterior aprovada, sem elevar os limites. Data API de paginacao teve timeout
na pagina 6 de comentarios na primeira rodada; apos instalar a migration final
em novo descartavel, os gates seriais passaram 14/14 + 5/5, sem alterar consultas
ou timeouts. A rodada final usou core DB/Auth/Data API/pooler: Storage API teve
healthcheck indisponivel na primeira inicializacao e nao e usado pelo ensaio SQL.
Playwright amplo: 134 aprovados, duas falhas e seis nao executados, zero retries;
timeout do conteudo final da Home e CLI ausente no PATH do runner local. Nenhuma
mudanca de aplicacao/seletor/timeout foi feita para ocultar essas ocorrencias.
Complemento com PATH correto, mesmo Build/configuracao publica e migration final:
21/23, zero retries, nenhum skipped; os cenarios de agendamento/Diario e consumidor
passaram. Persistiram timeouts de acessibilidade em Home (45 s) e Explorar
(indicador final em 12 s), sem diagnostico de violacao axe nesses erros. App,
loaders e testes dessas paginas estao identicos a main; a suite ampla nao e
declarada integralmente aprovada nem os timeouts declarados corrigidos nesta PR.
`db lint` apontou cinco referencias dinamicas a tabelas Cron ausentes em
funcoes preexistentes/guardadas. O snapshot real funciona sem a extensao;
nao instalar Cron para silenciar o verificador estatico. Homologacao do
pooler gerenciado e dos alertas permanece separada das provas locais.

Seguranca: canario TEMP reproduziu HSC01 antes do endurecimento. A migration
qualifica pg_catalog.pg_extension no snapshot e no verificador da fonte,
preservando assinatura/owner/ACL. O canario nao e executado apos a correcao.
Supavisor local reteve autenticacao da senha anterior; a fixture agora reinicia
somente seu pooler antes/depois, sem retry de login. Rotacao/revogacao no
gerenciado continua exigindo procedimento autorizado e prova de invalidacao.

### CI #2267 — instalacao do Chromium, 11/11/2026

Duas falhas de DNS no mirror Azure e outra no archive Ubuntu impediram o APT.
Usar mirrors alternativos nao resolveu e o ajuste foi retirado. O navegador
passa a usar a imagem oficial Playwright 1.62.1/Noble por digest, com todas as
dependencias, servidor restrito a loopback e smoke obrigatorio antes do banco.
Testes/app/Supabase continuam no host; nenhum gate ou scan removido.
Testes focados 74/74; instalacao Linux/E2E dependem da CI do novo commit.
Ver `PROBLEMS_AND_SOLUTIONS.md`. Nenhum controle Sentry/SQL foi alterado.

### Sentry/watchdog — preparacao de homologacao, 11/11/2026

Base `cda7e996`. Responsavel confirmou criacao de monitor/alerta Sentry e secret
GitHub; nao inspecionados nem usados nesta etapa. Cadencia aprovada de 15 min UTC
registrada somente no patch inerte; workflows reais continuam manuais.
Monitor SQL depende de papel NOLOGIN provisionado separadamente, TLS, gates e
janela de observacao aprovada. Na continuacao da #2267, a etapa v2 separa prova
de leitura SQL valida/entrega confirmada da saude. Alertas de capacidade/WAL e
runner desligado permanecem; `ok` do Sentry nao significa saude nem ativa gates.
Erros SQL, evidencia invalida/obsoleta e entrega incerta continuam negando prova.
Dispatch/teste de e-mail nao produz check-in falso. Homologacao remota pendente. Ver
`docs/operacao/sentry-watchdog-homologacao.md` e
`DESBLOQUEIO_OPERACIONAL_AGENDAMENTO.md`. Nenhum check-in, schedule ou gate ativado.

### Agendamento — fase 6B3, freios privados sem ativacao

Migration `20261109215507_protecao_capacidade_outbox_capitulos.sql`: limite
transacional de 10.000 eventos e freios instantaneos de 16 MiB outbox, 64 MiB
notificacoes e 400 MiB banco, com alerta consultavel em 70%. Orcamentos iniciais
para revisao, nao aprovacao de capacidade gerenciada. Medir antes de cada item;
pausa duravel e retomada administrativa por revisao, sem habilitar runner. Ate
100 incidentes preservados, sem purga. Outbox permanece integral, sem ACK/TTL.

Local inicial: pgTAP focado 225/225 (34 novos); integracao de capacidade 9/9; Data API
paginacao 14/14 e anti-spam 5/5. Ultima vaga concorrente e snapshot antigo
comprovados sem excesso; timeout/rollback, backlog e retries cobertos. Harness
conserva pendencias sinteticas e eventos anteriores. Ajustadas tres assercoes
legadas que presumiam tabelas/contadores vazios. A repeticao inicialmente bloqueada
foi autorizada e concluida na PR #2250: **pgTAP completo 681/681 em 24 arquivos**,
Supabase Docker novo/isolado, sem omitir TRUNCATE CASCADE. Encontrado e corrigido
defeito CRLF/LF na instalacao: normalizar somente a definicao do runner antes
dos mesmos guards estruturais. Nova regressao eleva capacidade a 35 assercoes.
Runner final falso, Cron ausente e outbox nova vazia apos rollback. Ambiente
temporario removido; Supabase anterior e seus 14 eventos preservados.
Build, Lint, Typecheck, auditoria estatica, sessao (2.002), paginacao (37) e audit
de producao (zero vulnerabilidades) passaram. Playwright pertinente 22/22 em build
local, serial e sem retries, com desktop/mobile, axe e progresso entre dispositivos.
Suite E2E inteira e nova execucao Cron nao realizadas nesta fase.

Medicao TEMP com mesmos indices: 10.000 eventos 2,95 MiB; apos cinco atualizacoes
de lease, 15,30 MiB. 10.000 notificacoes 13,79 MiB (~1,45 KB/destinatario), sem
medir WAL. Plano Free identificado. Medicao agregada de producao fornecida pelo
responsavel: banco 21,79 MiB; outbox 0,03 MiB; notificacoes 0,20 MiB. Sem nova
consulta/escrita remota nesta validacao; nao sao garantia de capacidade futura.
**NAO APTO para ativacao:** freios de bytes NAO reservam disco; fan-out ilimitado,
outros escritores, leases e WAL podem exceder o espaco restante. Faltam ainda
capacidade/retencao aprovadas, observacao independente e alertas entregues.
Ver medidas/contrato em `docs/agendamento-cache-publico.md`. Runner falso,
Cron ausente e uploads ilustrados suspensos; nenhuma mudanca em producao.

### Agendamento — fase 6B2, observador privado sem ativacao

Migration `20261109194305_observabilidade_privada_runner_capitulos.sql` prepara
observacao administrativa independente do historico real do Cron, pausa
persistente apos tres falhas consecutivas observadas e retomada por revisao
que NAO habilita gate/job. Saude agrega backlog, atraso, tentativas esgotadas e
incidentes sem dados pessoais. Retencao limitada conserva falhas/incidentes;
saturacao exige intervencao, nunca perda silenciosa de evidencia. Outbox intacta.
Ainda sem job de observacao, alerta ou prova de completude durante indisponibilidade
ou purga do historico. Nao garante pausa antes da quarta execucao. Ativacao segue
bloqueada; ver limites e contrato em `docs/agendamento-cache-publico.md`.

Validacao local: pgTAP 646/646; Cron real 9/9 (tres timeouts consecutivos,
pausa/retomada, rollback, resposta perdida e retencao); outras integracoes de
agendamento/projecao 37/37; paginacao Data API 14/14 e anti-spam 5/5. Lint,
Typecheck, Build, auditoria estatica, sessao (2.002), paginacao e audit de
producao (zero vulnerabilidades) aprovados.
Playwright completo serial sem retries: 134/135. Pendencia separada em
`accessibility.spec.mjs:84`: dois roots da Obra no seletor durante verificacao;
na unica execucao isolada, axe encontrou `document-title (serious)`.
Investigacao posterior da #2249 (09/11): o frontend, dependencias e testes
originais sao identicos aos da main `50cb0841`. MutationObserver no build local
comprovou root visivel junto de root oculto em segmento de streaming (29 ms no
mobile) e titulo temporariamente vazio entre metadata no body e hidratacao no
head (327 ms no desktop). Nao e evidencia de fixture incompleta nem de titulo
permanentemente ausente. O baseline agora exige raiz unica, confirmada/interativa
e titulo correto no head antes do axe integral, em desktop/mobile, sem mudar
timeouts, retries ou regras. Nenhuma alteracao de producao ou do runner.
CI anterior `42690781924` verde, mas com um flaky independente no smoke da Obra
(`smoke-routes.spec.mjs:106`, main de loading + main da obra); tratar esse seletor
separadamente, sem confundir passe em retry com estabilidade comprovada.
Revalidacao local apos o ajuste: baseline axe 11/11 (Obra desktop/mobile) e
cenarios criticos da Obra 9/9, todos sem retries; Lint, Typecheck e Build aprovados.
A rodada ampla teve 127 passes, cinco falhas e quatro nao executados: quatro
falhas por reutilizar a fixture consumida (24 comentarios, E2E 01 ausente) e
uma por CLI ausente no PATH do harness. Com fixtures recriadas e CLI 2.116.0,
os tres arquivos revalidados ficaram 24/25. A falha restante dessa rodada:
`scheduled-chapter-diary.spec.mjs:190` encontra dois spans do texto do Leitor
no desktop (strict mode), apos confirmar publicacao/HTTP 200; mobile passou.
Investigacao seguinte na #2249 comprovou o problema do seletor: em reproducao
instrumentada, entre 410 e 460 ms coexistiram um span visivel e uma copia oculta
sob `div#S:1`. Depois da hidratacao restou uma unica ocorrencia; teste e frontend
originais identicos a main `50cb0841`. Nao e duplicacao persistente do conteudo.
O teste agora aguarda a resposta da barreira publica, uma unica raiz do Leitor
e verifica titulo/texto exatos dentro dela, incluindo contagem unica do texto.
Sem first(), alteracao de timeout/retry, nova consulta ou codigo de producao.
Instrumentacao removida; agendamento/Diario passou 5/5 desktop/mobile no build
local, serial e sem retries. As rodadas amplas historicas acima nao sao uma
suite integralmente verde nem autorizacao para ativar agendamento.
Validacao relacionada final: 31/31 (agendamento/Diario 5, rota canonica 6,
reconciliacao/progresso entre dispositivos 9, acessibilidade 11), com fixtures
novas, build de producao local, workers=1 e retries=0. Lint, Typecheck, Build
e diff --check aprovados. Runner false e pg_cron ausente no banco local.

### Agendamento — fase 6B1, entrada operacional sem ativacao

Migration `20261109183045_entrada_sql_restrita_runner_capitulos.sql` prepara
papel NOLOGIN e entrada SQL privada fixa (3 itens/2 s), sem grants para API,
sem extensao ou job. Timeouts pertencem a nova conexao do papel. A entrada
antecipa somente o constraint invoker do manifesto para validar sob autoridade
durante a operacao; nao amplia SELECT nem altera RLS. Runner continua false.
Testes de Cron usam exclusivamente ambiente local descartavel e restauram
NOLOGIN/gate false, removendo os jobs e a extensao instalados pelo harness.
Observacao de abortos globais, alertas, pausa/retomada, credenciais do ambiente
gerenciado e politica sustentavel de outbox ainda impedem ativacao. Sem ACK,
Cron de producao, publicacao automatica ou uploads ilustrados. Detalhes em
`docs/agendamento-cache-publico.md`.

Validacao local 6B1: pgTAP 629, integracao de agendamento 45, demais checks
de codigo/build aprovados. Playwright completo nao ficou verde: smoke legado
da Obra usa main ambiguo durante loading. Os cinco E2E de agendamento passaram
apos corrigir somente o PATH do CLI. Pendencia de seletor fora deste escopo;
nenhuma alteracao de aplicacao ou permissao para contorna-la.

### Agendamento — fase 6A, runner privado desativado

Migration `20261109171652_runner_privado_agendamento_capitulos.sql`: runner
SQL invoker sem grants de API, gate privado false na instalação, lote até cinco,
orçamento cooperativo e timeouts prévios obrigatórios. Reutiliza o executor
transacional; try-lock global dura até commit/rollback. Backoff limitado por
revisão e métricas agregadas privadas preparam recuperação, não ativação.
Timeout global reverte todo o lote; abortos não ficam nos contadores SQL e
exigem observação pelo futuro acionador. Nenhum Cron/job/endpoint foi criado.
Outbox permanece sem ACK e retida indefinidamente enquanto não houver contrato
verificável de conclusão; nenhum purge ou exclusão de pendências por idade.
Acionador, cadência, alertas e capacidade/retenção ainda exigem autorização e
validação antes de habilitar. Detalhes em `docs/agendamento-cache-publico.md`.
Uploads ilustrados e sua limpeza/publicação continuam suspensos. Nenhuma
migration foi aplicada remotamente e o gate deve permanecer false.

### QA local — ACL das visualizações

O helper `qa/integration/supabase/20260826000637_normalizar_acl_baseline_local.sql`
revogava também o EXECUTE de service_role nas duas RPCs de visualização, apesar
do contrato server-only da migration `20260825204845`. A normalização passa a
restaurar somente essas duas assinaturas para service_role. Clientes anon,
authenticated e PUBLIC continuam sem execução; RPCs legadas continuam negadas.
Não é migration de produção nem revisão de RLS. Bancos locais já preparados
precisam receber somente esse delta ou ser recriados pelo procedimento de QA;
não reaplicar o helper pré-baseline inteiro sobre um banco já migrado.

Separadamente, o 503 de `/api/leitura-publica` observado na validação anterior
permanece inconclusivo: a reprodução isolada e o arquivo completo passaram sem
retries, mas isso não explica a falha original. Não confundir com o 42501 das
visualizações. Numa nova ocorrência, correlacionar horário/ID de execução,
endpoint sem query, status HTTP, papel anon/authenticated/service_role e código
upstream SQLSTATE/PGRST ou de transporte por allowlist. Usar instrumentação
temporária local no fetch do servidor e response no navegador; nunca registrar
headers, cookies, tokens, corpos, URLs completas ou mensagens/detalhes livres.
O log atual `erro remoto` não contém esse código; esta correção não modifica
o endpoint público nem declara resolvido o 503 original.

### Obra — sincronização pública, fase 5C2B (em revisão)

Snapshot leve compartilhado no SSR/metadata e confirmação por eventos via
endpoint público server-only/no-store. Conteúdo não depende mais de fallback
local; preserva referências por revisão, ordem real e anexos pelo assinador.
Progresso/estado pessoal permanecem isolados por identidade e geração.
Ausência remove conteúdo; falha oferece retry. Sem polling nem revogação de
bytes já entregues. Publicação automática e uploads ilustrados seguem bloqueados.
Medições finais: requests Supabase cliente 5→2, conteúdo útil estável e CLS
próximo de zero. Lighthouse é descritivo (baseline não totalmente isolado,
LCP mobile ~3% acima); não comprova ganho causal de performance. Comparação em
`docs/agendamento-cache-publico.md`; manter a entrega em draft para revisão/CI.

### Obra — snapshot público leve, fase 5C2A (infraestrutura na #2235)

RPC aditiva e loader server-only com capítulos sem textos, ordem canônica real,
revisão por página e barreira final. Anexos somente como metadados, sem caminhos
ou URLs assinadas. A entrega 5C2A não conectava SSR/cliente; a integração está
descrita na fase 5C2B acima. Migration não aplicada em produção por esta tarefa.
Cron, publicação automática e uploads ilustrados permanecem suspensos.

### Leitor canônico — fase 5C1 (em revisão)

Reconciliação cliente por geração/revisão na hidratação, navegação, Back/Forward,
retorno da aba e BFCache, usando a barreira pública server-only/no-store existente.
Conteúdo confirmado ausente é removido; falhas temporárias permitem retry sem
404 ou fallback local apresentado como atualizado. Interações privadas e leitor
interno continuam separados. Sem polling: abas continuamente abertas não detectam
mudanças remotas imediatamente sem eventos. Obra, Cron, agendamento automático,
ACK da outbox e uploads ilustrados continuam pendentes/bloqueados. Detalhes e
limites em `docs/agendamento-cache-publico.md`; validações na PR desta fase.

## Infraestrutura e ferramentas

Concluídos:

- Sentry
- GitHub CodeQL
- Dependabot
- Supabase Advisors + pgTAP/RLS baseline
- Playwright
- Lighthouse CI
- Vercel Speed Insights
- Knip (diagnóstico de código/dependências não utilizados; inicialmente não bloqueante)
- Gitleaks (scan bloqueante de segredos no histórico Git, com allowlists específicas para falsos positivos conhecidos)
- Dependency Cruiser (baseline de dependências circulares em `app/`, `components/` e `lib/`)
- OWASP ZAP (baseline passivo contra o app local da CI; sem scan ativo em produção)
- k6 (baseline leve de carga/desempenho contra rotas públicas do app local da CI)

### Triagem final de segurança — 07/11/2026

- A árvore de produção foi atualizada para `@sentry/nextjs 11.11.0`, que resolve
  `glob 14.0.4` e `minimatch 11.0.5`. Com isso, `npm audit --omit=dev` passou de
  cinco vulnerabilidades moderadas transitivas para zero.
- Os alertas CodeQL legados ainda abertos foram revisados: #1 é fluxo de dados
  impreciso sobre um helper que persiste somente listas locais, sem senha, token
  ou sessão; #2 e #4 apontam exclusivamente para assertions de QA com entradas
  constantes. Não há exposição de runtime comprovada nesses três alertas.
- O audit completo ainda inclui avisos de ferramentas de desenvolvimento
  (`eslint-config-next`/`typescript-eslint`/`minimatch` e `zod`). Eles não entram
  no bundle de produção e não justificam downgrade ou atualização major forçada.

Os testes locais no Windows usam Node 22, normalizam CRLF somente nas leituras
textuais dos testes estruturais e executam listas extensas pelo `spawn` do Node,
sem delegar a linha de comando ao `cmd.exe`. O preparo E2E grava credenciais
descartáveis em `qa/.env.e2e.generated`, ignorado pelo Git, e o runner local
gerencia `next start` diretamente. Fora da CI, Playwright usa um worker e zero
retries; os parâmetros Linux da CI permanecem inalterados.

## Produção Vercel

O deploy do commit que adicionou Speed Insights foi concluído com sucesso após o projeto ser retomado.

PR correspondente:

- #2147 — `feat(vercel): adicionar Speed Insights`

O projeto havia sido pausado pelo Spend Management, fazendo deploys retornarem `Deployment was blocked` e visitantes receberem `503 DEPLOYMENT_PAUSED`.

Após retomar o projeto, o deploy voltou a funcionar.

O projeto está temporariamente protegido com:

- Vercel Authentication
- All Deployments

Objetivo: continuar desenvolvimento e deploys sem deixar o site público.

O projeto voltou a ser pausado pelo Spend Management após consumo elevado de Build CPU, Function Storage e Deployment Storage.

Para reduzir esse consumo quando o projeto for retomado, os deployments automáticos por Git estão configurados em `vercel.json` assim:

- `main`: habilitado, mantendo o deployment automático de produção;
- demais branches e PRs: desabilitados, sem Preview Deployment automático.

Essa política não altera os workflows do GitHub Actions nem as configurações de Vercel Authentication e domínio.

O runtime Node.js também é versionado no `package.json` como `22.x`. Esse
contrato prevalece sobre o valor selecionado no painel da Vercel e mantém os
builds/funções alinhados ao Node 22 usado no desenvolvimento e na CI, sem
alterar a proteção **Vercel Authentication: All Deployments**.

## Pendências conhecidas

### Capítulos públicos canônicos

A rota `/obra/[slug]/capitulo/[numero]` entrega o leitor compartilhado com HTTP 200, metadata de capítulo, canonical próprio e título/texto no HTML inicial para capítulos públicos válidos. Capítulos publicados permitidos também entram no sitemap usando sua `ordem` real, enquanto combinações inexistentes ou inválidas respondem HTTP 404 sem redirect.

As páginas públicas de obras e capítulos incluem JSON-LD semântico no HTML inicial, usando respectivamente `CreativeWork` e `Chapter`, URLs canônicas absolutas e serialização segura contra fechamento de `<script>`.

O leitor interno por query (`/ler-capitulo`) continua disponível.

### Dependency Cruiser — ciclos do DenunciaModal

Os tipos compartilhados de denúncia foram extraídos de `components/DenunciaModal.tsx` para `components/denuncia-types.ts`.

Os hooks `use-denuncia-submit-action.ts` e `use-denuncia-modal-lifecycle.ts` deixam de importar o componente do modal, removendo os 2 ciclos associados ao `DenunciaModal` sem alterar comportamento.

A compatibilidade de imports externos é preservada porque `DenunciaModal.tsx` continua reexportando os mesmos tipos.


### OWASP ZAP — headers de segurança de baixo risco

Foi criada uma fase dedicada para os headers apontados pelo baseline do ZAP, começando apenas pelos de baixo risco:

- `X-Content-Type-Options: nosniff`;
- `X-Frame-Options: SAMEORIGIN`;
- `Permissions-Policy: camera=(), microphone=(), geolocation=(), browsing-topics=()`.

A configuração é global via `next.config.ts` e possui validação Playwright no app real, incluindo rota protegida com redirect para login.

CSP e Cross-Origin-Embedder-Policy permanecem fora desta fase por poderem quebrar scripts inline, Sentry, Supabase ou outros recursos sem uma política calibrada.

O aviso `Content-Type Header Missing` observado em rotas protegidas está associado a respostas de redirect e não é forçado artificialmente nesta fase.


### OWASP ZAP — Potential XSS revisado

O alerta `User Controllable HTML Element Attribute (Potential XSS)` do baseline foi revisado e classificado como falso positivo no estado atual.

- URL observada: `/login?redirectTo=%2Fpublicar`;
- o ZAP associou o valor `/publicar` ao `href` fixo da bottom nav em `app/layout.tsx`;
- o parâmetro `redirectTo` não é interpolado nesse link;
- redirects do login passam por `obterRedirectToSeguro`, que restringe o destino a caminhos internos e normaliza caracteres perigosos;
- foi adicionada cobertura de regressão para esquemas perigosos, origens externas e tentativa de quebra de atributo HTML.

Não houve alteração funcional no app para esse alerta.


### Supabase Storage

Capítulos ilustrados possuem apenas uma infraestrutura inicial versionada na
migration `20261107223400_infraestrutura_capitulos_ilustrados.sql`: novos campos
de tipo/versão, manifesto com leitura sob RLS e contratos privados de reservas e
limpeza. Não há escrita de páginas pela Data API, upload, assinatura ou leitor
ilustrado habilitados. A outbox registra referências removidas, mas ainda não
possui executor. A fase 2A adiciona somente um validador binário server-only,
com decode real, rejeição de animações, re-encode sem metadados, limites e hash.
Ele não possui endpoint nem habilita upload. A fase 2B acrescenta reserva de
capacidade por RPC autenticada, com propriedade/versão verificadas no banco,
quota compartilhada com anexos legados e idempotência/expiração/liberação.
Finalização atômica, upload e limpeza física continuam pendentes. Sharp foi
declarado direto na mesma versão 0.35.5 já travada, sem atualizar a árvore.
Não há nova migration na fase 2A; as quotas e bloqueios da fase 1 permanecem.
A fase 2B usa `20261107235846_reservar_capacidade_capitulos_ilustrados.sql`:
reserva 2 MiB/objeto por 15 minutos, sem duplicar arquivos já contabilizados,
sob o mesmo lock das quotas existentes. Expiradas/liberadas não liberam bytes
de arquivos físicos. O namespace permanece fechado mesmo após reservar;
assinatura, renderização e publicação ilustrada continuam indisponíveis.
A fase 2C foi dividida por segurança: a parte 2C1 adiciona somente recepção
autenticada e pré-validação binária em `/api/capitulos-ilustrados/prevalidar-pagina`,
com conferência de sessão ativa, propriedade, reserva, versão e validade antes
e depois do decoder. Retorna `validado_sem_upload`; não grava nenhum arquivo.
A migration `20261108004015_autorizar_prevalidacao_paginas_ilustradas.sql` cria
uma RPC de conferência e adaptador autenticado do limitador existente, sem
service role no endpoint e sem liberar Storage. Escrita segura depende
de tentativa durável com capacidade retida durante IO, inclusive após expiração
e cascatas, fence de autorização e recibo/limpeza idempotentes. Essa continuação
permanece pendente; não apresentar o upload ilustrado como implementado.
A continuação 2C2a cria `capitulo_upload_tentativas` sem cascatas e contratos
privados de preparação/início/falha. O ledger compartilhado mantém capacidade
de tentativas pendentes/incertas mesmo após expiração, logout e exclusão, sem
contagem dupla por caminho. Leases não renovam no retry e não liberam capacidade
automaticamente. Somente cancelamento comprovadamente anterior ao início pode
retirar esse compromisso; a reserva ativa continua contando. Migration:
`20261108012821_registrar_tentativas_upload_ilustrado.sql`.
**Upload real continua bloqueado:** nenhum consumidor, wrapper público ou grant
ao cliente/service_role foi adicionado. Fencing no Storage real, recibo de
sucesso, liberação pós-IO e recuperação/limpeza via API ainda precisam de fase
própria antes da ativação. Testes com SQL/Storage administrativos são fixtures
exclusivamente locais, não um caminho de upload em produção.
Merge da PR não implica aplicação da migration em produção.

A fase 2C2c acrescenta somente recibos internos de observacao (sem prova de
terminalidade), conferencia transacional que continua negando publicacao,
bloqueio do namespace ilustrado no assinador legado e consulta do ledger pela
exclusao de conta. A migration `20261108085709_recibos_privados_paginas_ilustradas.sql`
deve preceder o app. Upload, manifesto, verificacao dos bytes armazenados,
recuperacao e limpeza fisica permanecem bloqueados; quotas continuam retidas.

A fase 2C2d adiciona somente um motor interno de conferência de bytes pela
Storage API, sem consumidor de produção ou migration. Confere hash real,
decoder e identidade/versão observadas, mas sempre nega terminalidade,
publicação, limpeza e liberação de quota. Recuperação automática permanece
bloqueada; ver `docs/capitulos-ilustrados-verificacao-recuperacao.md`.

**Decisão após #2227 — 08/11/2026:** a ativação dos uploads ilustrados está
suspensa por falta de garantia verificável de encerramento das transferências
no Storage gerenciado. Toda a infraestrutura existente será preservada; upload,
publicação e limpeza continuam bloqueados, sem liberação de quota por timeout,
logout ou lease vencido. A retomada depende de garantias do backend e testes
reproduzíveis, não de novas camadas de aplicação que presumam terminalidade.

A listagem de metadados dos buckets públicos `avatars` e `capas-obras` foi
restrita ao prefixo do usuário autenticado. URLs públicas conhecidas continuam
acessíveis, mas usuários anônimos não enumeram os buckets e uma conta não lista
objetos de outra.

O `SELECT` do proprietário deve ser preservado porque o upload de avatar usa
`upsert: true`, que depende de `SELECT` e `UPDATE`. A cobertura local valida
listagem, URL pública, escrita própria, isolamento entre contas, quotas, MIME,
tamanho e limpeza administrativa com service role.

### Supabase Auth

Leaked Password Protection estava indisponível no plano Supabase observado durante a configuração. Reavaliar caso o plano/capacidade mude.

A RPC de aceite dos termos recupera atomicamente o perfil mínimo da própria
identidade autenticada quando uma conta confirmada ficou sem `public.profiles`.
Perfis existentes continuam sendo apenas atualizados, sem sobrescrever dados
legítimos; a recuperação não cria trigger em `auth.users`.

### Progresso de leitura entre dispositivos

O Leitor persiste marcações e desmarcações por uma RPC condicional baseada no
momento da ação. Respostas antigas não sobrescrevem eventos mais recentes,
desmarcações deixam tombstones `lido=false` e o isolamento por conta continua
sob RLS. A cobertura local valida concorrência, retries, troca de identidade e
sincronização do Leitor com Home e Biblioteca em contextos desktop/mobile.

### Gestão de comentários pelo autor

O autor de uma obra pode remover comentários recebidos tanto na página da obra
quanto nos capítulos. A autorização continua sendo validada pelo RLS: somente o
próprio comentarista, o autor da obra ou um administrador pode excluir o
comentário. Localização por notificações, respostas, denúncia e moderação
administrativa permanecem nos fluxos existentes.

### Comentários de capítulos protegidos pelo progresso

O Leitor consulta a confirmação de leitura da identidade atual e a propriedade
da obra ao abrir a discussão. Visitantes, capítulos não lidos e indisponibilidade
da confirmação mantêm os textos protegidos, com revelação manual temporária.
Comentários/respostas só são carregados após desbloqueio; o carregamento geral
de interações não antecipa seus textos. Trocas de conta/capítulo invalidam o
desbloqueio, e retorno à página revalida o progresso entre dispositivos sem
polling. RLS, bloqueio 18+, métricas e comentários gerais da obra não mudam.
Notificações legadas de comentários de capítulo são normalizadas para texto
genérico antes de cache, busca e exibição.

### Seguidores por obra no Painel do Autor

Os cards do Painel do Autor exibem a contagem agregada de seguidores de cada obra
permitida pela política de visibilidade, reutilizando
`interacoesDiretas.seguidores` da RPC de métricas já consultada.
Nenhuma consulta adicional ou identidade individual de seguidor é exposta.

### Explorar — catálogo de autores

A aba Autores reutiliza a paginação por cursor do catálogo público e permite
carregar páginas adicionais, sem limitar a descoberta à amostra inicial de
obras. A busca da RPC `listar_obras_catalogo` também considera o nome atual em
`profiles_publicos`, mantendo filtros, RLS e deduplicação por identidade.

### Explorar — formato das obras

O painel de filtros disponibiliza os formatos já usados na publicação. A seleção
é compartilhável por `formato` na URL, restaurada em recarga e Voltar/Avançar e
usa `p_formato` da RPC paginada existente, inclusive ao carregar mais resultados.
Valores desconhecidos voltam para todos os formatos; formatos personalizados
continuam aparecendo na opção geral. Não há mudança de schema ou RLS.

Status editorial (em andamento, concluída ou pausada) ainda não é um dado
persistido de obras. O booleano `publicado` não representa esse status, e a
coleção pessoal `Concluídas` representa leitura do usuário, não conclusão da obra.

### Explorar — diversidade em publicações recentes

A seção existente `Publicações recentes` seleciona no máximo uma obra por
`autorId`, escolhendo a mais recente e desempatando por ID descendente. Mantém
até 12 cards, sem repetir autores para preencher vagas. Obras sem identidade de
autor permanecem independentes: nomes iguais não comprovam a mesma autoria.
A seleção usa somente a base já filtrada, sem novas consultas, mudanças de RPC,
cursores ou rankings das demais seções. A diversidade se limita à amostra
carregada; não representa garantia de exposição para todo o catálogo.

### Explorar — descoberta por quantidade de capítulos

A aba Obras oferece a ordenação `Mais capítulos`, compartilhável por
`ordenacao=mais-capitulos`. Ela reutiliza a contagem de capítulos publicados e o
cursor da RPC existente, com grade única e carregamento incremental mesmo sem
busca ou categoria. Ao entrar em Autores, essa ordenação volta para relevância.
Não representa tamanho em palavras, páginas ou tempo de leitura.

### Explorar — filtro por tag

O painel permite informar uma tag completa, compartilhável por `tag` na URL.
A comparação é literal, ignora caixa, acentos portugueses e espaços ASCII
repetidos; `%`, `_` e pontuação não são operadores. A variante da RPC com tag
aplica o predicado antes do cursor/limite, preservando publicação e RLS.
A assinatura antiga permanece intacta; o cliente só usa a variante quando há
tag e envia todos os argumentos, inclusive cursores nulos na primeira página,
evitando sobrecargas ambíguas. O deploy do app depende da aplicação prévia da
migration correspondente pelo responsável; merge não implica aplicação.

Busca full-text continua independente. Faixas de tamanho ainda não têm
parâmetros na RPC; não devem ser implementadas sobre a amostra local.

### Explorar — avaliação mínima

A aba Obras oferece `Avaliação mínima` (0,5 a 5 estrelas), opcional e
compartilhável por `notaMinima`. A nova variante de 12 argumentos da RPC
reutiliza a média real sem arredondamento, depois da agregação e antes do
cursor/limite. Notas do próprio autor continuam desconsideradas. Obras sem
avaliações só são excluídas com o filtro ativo; assinaturas de 10 e 11
argumentos permanecem intactas, inclusive a variante com tag.

O cliente só considera aprovados os IDs confirmados pela consulta e identidade
atuais e invalida essa confirmação ao mudar filtros ou conta. Cache sem métricas verificadas
não comprova nota mínima: em falha, permanece o aviso/retry, sem certificar
uma amostra ampla. O filtro é desativado no modo Autores, pois representa
notas de obras, não notas de perfis. Aplicar a migration correspondente é
pré-requisito de deploy do app, mediante autorização do responsável; não
deduzir aplicação pelo merge.

### Explorar — exclusão de tag

Na aba Obras, `Excluir tag` oculta uma tag completa, com a mesma normalização
literal do filtro de inclusão. É compartilhável por `tagExcluida`, combina com
tag, formato, nota mínima e ordenação e é removido ao entrar em Autores.
A variante de 13 argumentos do catálogo aplica `NOT EXISTS` em `obras_filtradas`,
antes das agregações, cursor e limite; preserva as variantes de 10, 11 e 12
argumentos, RLS e bloqueio 18+. O pós-filtro local repete a exclusão e somente IDs
confirmados pela consulta/identidade atuais são exibidos, pois tags antigas do
cache não comprovam ausência da tag. Falhas preservam cache, mas não o certificam
como resultado atual. Incluir e excluir a mesma tag
produz vazio legítimo. A migration deve ser aplicada pelo responsável antes
do deploy; merge não implica aplicação em produção.

### Explorar — exclusão de gênero

Na aba Obras, o select `Excluir gênero` usa `generoExcluido` na URL e reconhece
termos completos normalizados, inclusive gêneros compostos e os aliases de
Ficção (`sci-fi`/`sci fi`). Drama não exclui Melodrama; Romance exclui
`Fantasia, Romance`. Tags continuam independentes do campo de gênero.
Incluir e excluir a mesma categoria produz vazio legítimo.
A variante de 14 argumentos aplica o filtro antes das agregações, cursor e
limite, preservando integralmente as variantes de 10–13 argumentos e RLS.
O cliente exige IDs confirmados pela consulta/identidade atuais e também aplica
a proteção local; cache antigo não comprova ausência de gênero. O filtro é
removido em Autores e combina com os filtros anteriores. A migration
`20261107190827_adicionar_exclusao_genero_catalogo.sql` deve ser aplicada pelo
responsável antes do deploy; merge não implica aplicação em produção.

### Agendamento de capítulos — executor privado, sem ativação automática

A migration `20261108132533_infraestrutura_agendamento_capitulos.sql` cria um
registro privado por capítulo e RPCs autenticadas para consultar, agendar,
reagendar e cancelar. Aceita somente drafts de texto em obras publicadas, com
sessão ativa, autoria real e termos vigentes. Não despublica capítulos existentes.
O instante é absoluto (`timestamptz`), acompanhado do fuso IANA informado.

Revisões monotônicas serializam alterações e permitem retry da última operação
equivalente, sem reativar cancelamentos ou invalidações. Editar título/texto
invalida o agendamento no banco; publicação direta de um registro pendente é
bloqueada até cancelamento. Sem chamada administrativa explícita, o capítulo
permanece não publicado, inclusive quando o horário vence. A tabela tem RLS e
nenhum acesso direto de clientes/service role.

`20261108142104_executor_privado_agendamento_capitulos.sql` adiciona operações
invoker exclusivamente em `historietas_privado`, sem grants para clientes ou
service role. O lote administrativo aceita 1–10 capítulos. Revalida autor ativo,
perfil/termos, propriedade, obra publicada, texto, revisão, cancelamento e prazo
UTC sob locks; publicação, notificações idempotentes e recibo privado são atômicos.
Falhas desfazem os efeitos e permitem retry manual após um minuto; edição e
cancelamento também invalidam uma intenção em erro. Nenhum JWT é impersonado.

**Ainda não é um recurso automático utilizável:** não há interface, endpoint,
Cron, job ou consumidor do executor. A fase 3 integra `publicou_capitulo` ao
CHECK e ao recibo por trigger transacional/idempotente, com privacidade e bloqueio
18+ no banco. Tipos antigos permanecem aceitos; recibos antigos não são preenchidos
retroativamente. Retry não recria atividade removida voluntariamente.
A expressão legada continua invoker: consultas anônimas mistas com tipos antigos
podem falhar pela permissão anterior de preferências. Não é uma correção geral
da leitura/privacidade do Diário; essa limitação independente está documentada.
**Fase 4 parcial:** há outbox privada transacional com snapshots imutáveis e
consumidor manual server-only, autorizado por sessão administrativa atual.
Solicita invalidação por slug (inclui null/listas/metadata) e do sitemap, sem
esvaziar o catálogo. Retorna 202/`solicitado_sem_confirmacao`: o Next enfileira
as operações e não fornece recibo público de conclusão; não existe ack/remoção
automática da pendência. Retrys usam leases, sem repetir publicação ou efeitos.
**Ativação ainda bloqueada** por falta de confirmação segura do flush e de
contrato operacional por implantação. Ver `docs/agendamento-cache-publico.md`.
TTL não é SLA; não usar `await` sobre `void` como prova de invalidação.
**Fase 5A:** revisão pública por obra é atualizada por triggers transacionais,
com tombstones/gerações que sobrevivem à exclusão e RPC invoker de snapshot
público consistente. O adaptador server-only usa POST/no-store e propaga falhas.
Ainda sem integração com caches Next, sitemap, outbox ou ativação automática;
esse contrato sozinho não resolve o bloqueador de cache. Ver o documento acima.
**Fase 5B:** loaders públicos selecionam cache por obra/geração/revisão/capítulo,
com POST/no-store ao primário antes e depois. Páginas/sitemap não usam cache de
resposta do servidor; sitemap usa impressão pública e coleta paginada consistente.
Falhas não autorizam cache antigo ou 404. HTML/RSC já entregue ao Router Cache,
Back/Forward e abas abertas não é revogado; esse limite e o rollout mantêm a
ativação automática bloqueada. Outbox sem ACK e uploads ilustrados suspensos.
Loaders clientes pós-hidratação/fallbacks ainda não consomem essa revisão;
esta entrega protege o caminho servidor, não todos os estados já no navegador.
Merge não aplica migrations em produção;
uploads ilustrados, publicação ilustrada e limpeza física continuam suspensos.

### Lighthouse baseline

Primeiro baseline observado:

- Home: performance 53, accessibility 83
- Explorar: performance 65, accessibility 93
- Login: performance 97, accessibility 94, SEO 66

Usar esses números como ponto de partida, não como contrato permanente. Confirmar medições atuais antes de priorizar otimizações.

## Próxima regra operacional

Antes de sugerir ou iniciar um novo passo de refatoração, verificar no GitHub o estado real da PR/branch atual e não depender apenas deste arquivo.

## Ciclo de melhorias funcionais — 06/11/2026

- PRs #2192–#2198: Explorar ganhou filtros compartilháveis na URL, busca full-text sem refiltro indevido, estados de erro/retry, coleções pessoais paginadas, foco acessível dos filtros e descoberta paginada de autores com nome público atual; gêneros de autores e obras seguem a mesma regra.
- PRs #2199–#2200: Home, Biblioteca e Leitor usam a ordem persistida dos capítulos para continuar a leitura, com fallback para dados legados e capítulos com lacunas.
- PR #2201: sincronização de progresso entre dispositivos usa RPC condicional e tombstones de desmarcação. Migration aplicada à produção com checagem de permissões e `SECURITY INVOKER`; PR integrada à main.
- Gestão de comentários para autores: notificações de comentários e respostas em obras abrem diretamente o comments sheet da obra por `?comentarios=1`, preservando o mesmo fluxo acessível, paginação, respostas e RLS existentes.
- Proteção contra spoilers: fallbacks de notificações para comentários/respostas da Comunidade, capítulos e Diário, além de reviews, usam mensagens genéricas; o texto criado pelo usuário permanece no contexto de destino e não entra no estado nem na busca das Notificações.
- Histórico de moderação: o painel administrativo consulta sob demanda o log imutável de denúncias de conteúdo e perfil, com paginação, decisão, transição de estado, responsável e observação interna. O acesso continua limitado a administradores/moderadores pela RLS; usuários comuns não veem o painel nem os eventos.
- A migration de autores da #2197 também foi aplicada em produção. Não deduzir que toda futura migration foi aplicada apenas pelo merge.

### Ambiente local e consumo de recursos

- Docker Desktop com Supabase CLI **2.116.0** e portas locais adaptadas para o Windows; a configuração `supabase/config.toml` e a migration auxiliar de normalização ACL são **locais, não versionadas**.
- Testes de integração e Playwright devem usar Supabase local descartável. Para E2E, preferir `next build` + `next start`, com `--retries=0`; não atingir produção.
- No Windows foram observadas falhas ambientais preexistentes em `test:static` (auditoria 196/197 pela migration auxiliar) e `test:session` (251/279 pela resolução de imports). A CI Linux é a referência para distinguir ambiente de regressão, sem ignorar falhas novas.
- A conta Vercel foi alterada de **Pro para Hobby**. Snapshot informado em 06/11: **Deployment Storage 67,52 GB / 10 GB**; existe risco de bloqueio de novos deploys. A retenção foi configurada pelo responsável em **Canceled 7 dias / Errored 7 dias / Pre-Production 30 dias / Production 30 dias**. Não afirmar que a limpeza já reduziu o consumo sem nova medição.
- Permanecem habilitados deployments automáticos somente na `main` e **Vercel Authentication: All Deployments**. Continuar trabalho e QA local sem exigir deploy para cada PR; não excluir deployments nem modificar a proteção de produção sem autorização.

### Estado do ciclo

O ciclo funcional iniciado pelas melhorias de Explorar, continuidade de leitura,
gestão de comentários para autores, proteção contra spoilers e histórico de
moderação está concluído no código. Novas melhorias devem partir de uma nova
priorização, sem reabrir essas frentes sem evidência de regressão.
