# Historias em Comum — suite isolada de evidencia

Execucao diagnostica v3 em GitHub Actions, autorizada exclusivamente pelo push de criacao da branch qa/historias-comum-etapa1-diagnostico-v3. NAO e funcionalidade de produto, RPC, alteracao de RLS ou autorizacao de producao.

## Correcao do harness v3

A execucao 43933853022 aprovou bootstrap/schema (91 registros), mas retornou HTTP 403 na fixture depois de uma conta/sessao e SQLSTATE 42883 no setup; 44 verificacoes ficaram bloqueadas. O resumo anterior nao identifica a operacao HTTP nem a funcao SQL exata, portanto nao comprova sozinho a origem dessas falhas.

Prefer agora e especifico por operacao: count=exact em GET/HEAD PostgREST, return=minimal em escritas de tabela, resolution=merge-duplicates somente no UPSERT explicito de preferencias. Auth e RPC nao recebem Prefer. O INSERT de perfil deixa de solicitar UPDATE via UPSERT; nenhum grant ou policy foi alterado.

Falhas da fixture registram somente fixture_stage em allowlist (Auth create/login/confirm, perfil, aceite, preferencias, obras, favoritos), HTTP e motivo sanitizado. O probe registra pgtap_available_before (0/1) consultando to_regprocedure('no_plan()'), habilita pgTAP com CREATE EXTENSION IF NOT EXISTS dentro de BEGIN/ROLLBACK e mantem as duas assercoes e quatro EXPLAINs. Essa disponibilidade tambem e preservada se uma etapa SQL posterior falhar. A confirmacao real depende da execucao v3.

## Base e origem verificadas

- Base imutavel: main `5b8d439f5bd50d14ab53e0fdddfe8f84d30a5f86`.
- `expected-schema.json`: nomes e SHA256 dos 90 SQLs dessa main e do auxiliar ACL existente na CI. `verifySource()` exige correspondencia completa antes de iniciar o stack.
- Correcao v2: os 91 hashes foram regenerados dos Buffers retornados por git show desse SHA, sem conversao de quebras de linha. Os hashes anteriores correspondiam a CRLF; os blobs originais e o checkout Linux usam LF. A verificacao em runtime permanece estrita sobre bytes, sem normalizacao ou excecoes.
- Bootstrap reutilizado da CI desse SHA: CLI 2.116.0, `supabase init`, copia do auxiliar `qa/integration/supabase/20260826000637_normalizar_acl_baseline_local.sql`, `supabase start`. Nenhum SQL existente e editado.
- O runtime novo tera 90 migrations da main + 1 auxiliar LOCAL da CI (91 registros), todos conferidos. Isso NAO e o historico antigo de 88 e nao o substitui. Nenhum dos 88 SQLs do ZIP historico e usado aqui.
- Diferencas deliberadas em relacao ao job completo da CI: uma unica tentativa, sem seed ampla, pooler de monitor, dashboard, analytics ou interface de email. Nao executa build, npm install/ci, testes gerais ou Playwright. O bootstrap nao e apresentado como ja executado nesta preparacao.
- ZIP recuperado conferido antes do trabalho: SHA256 `2059ac3d445d1b956160dab5aff0d73881ef75fbaeb952f9ed72d09cdeccf7e6`; 108 entradas e os 107 hashes do manifesto correspondem. O ZIP anterior permanece intacto.

## Arquivos para futura disponibilizacao autorizada

1. `.github/workflows/historias-comum-manual.yml`: push restrito a branch diagnostica; job exige repositorio exato, criacao da branch e run_attempt=1. Pushes posteriores e reruns nao executam o diagnostico. contents:read, runner Linux VM, 30 minutos de orcamento do job, execucao serial e zero retries.
2. `core.mjs`: transporte REST/Auth, guards, candidata de intersecao, verificacao exata de linhas/count e allowlist de planos.
3. `data-api.mjs`: fixtures exclusivas do job e 47 checks registrados, incluindo fixture e cleanup.
4. `runner.mjs`: bootstrap, conferencia de schema, execucao serial de HTTP/SQL, persistencia sanitizada e encerramento do stack.
5. `pending.sql`: somente duas assercoes pendentes e quatro EXPLAINs, com setup sintetico transacional.
6. `expected-schema.json`: hashes da base.
7. `static.test.mjs` e `orchestration.test.mjs`: verificacoes offline com transporte/modelo falso; NAO sao testes de Supabase real.

Esta pasta ocupa `qa/historias-comum` e o workflow `.github/workflows/` na branch diagnostica autorizada. O workflow faz checkout do harness do push e checkout SEPARADO da main imutavel para o schema. O vercel.json da main permanece intacto: deploymentEnabled desabilita branches fora da main. Nenhum deploy manual e autorizado.

## Execucao planejada

O job utiliza um runtime novo em RUNNER_TEMP, com project_id unico por run/attempt; nao leva config.toml, .temp, seed, vinculacao remota ou ambientes locais do repositorio. O checkout da base e esparso, limitado aos 90 SQLs e ao auxiliar CI.

Antes de qualquer start, exige GITHUB_ACTIONS=true, RUNNER_ENVIRONMENT=github-hosted, HISTORIAS_DISPOSABLE=1 e RAM livre >=3 GiB. Depois do start e antes dos planos exige ao menos 1 GiB livre. Sao margens operacionais, nao prova universal de capacidade. Em falha de registry/start/RAM, nao tenta novamente. O job retorna FAIL/BLOCKED, nunca sucesso parcial.

O bootstrap consulta --version/--help da CLI antes de executar comandos. stdout/stderr da CLI/Docker ficam capturados em memoria; nao sao publicados. O estado do banco exige as 91 versoes esperadas, RLS/grants de leitura, indices existentes e os timeouts atuais authenticated=8s/anon=3s antes de executar o probe. Nao eleva timeouts para aprovar.

## Cobertura Data API automatizada (execucao real ainda pendente)

- Quatro contas exclusivamente sinteticas criadas no Auth local: A, B, terceiro C e autor D. Senhas aleatorias em memoria. As sessoes sao realmente emitidas por `/auth/v1/token?grant_type=password`; cada login aguarda o corpo e depois `/auth/v1/user` HTTP 200 com o ID da conta esperada.
- Leituras de seguranca usam somente chave publica + sessao real, ou anonimo sem sessao. Service role e limitado no transporte a criar/remover contas sinteticas e inserir favoritos de fixture, inclusive referencias legadas a obras ocultas. Nunca e usado para validar permissoes.
- Uma requisicao de intersecao por pagina: obras com dois aliases favoritos!inner, filtro publico nos DOIS favoritos e filtros de publicacao/classificacao da obra. Resposta e count exatos comparados contra IDs conhecidos apenas em memoria.
- A/B, B/A, terceiro e anonimo; privados e parciais individuais ficam fora dos resultados. Leituras diretas negativas de favoritos privados tambem exigem count=0.
- Biblioteca somente_eu e mostrar_favoritos de cada lado, consultados por A/B/C/anon. O lado do proprio chamador NAO recebe excecao de seguranca por ser proprietario: os gates negativos exigem zero.
- Biblioteca seguidores/seguindo: relacao ausente, autorizacao, terceiro/anon negados e remocao da relacao com revogacao na proxima requisicao.
- Bloqueios A->B e B->A, bem como C->A e A->C para a protecao do terceiro. Remocao confirmada em nova requisicao. Interesses ja publicos de A/B continuam sendo observados como publicos por terceiros nao envolvidos no bloqueio; isso nao e uma promessa de sigilo do par.
- Revogacao apos escritas HTTP concluidas: publico->privado, publico->parcial e exclusao de favorito em ambos os lados; mostrar_favoritos/Biblioteca; obra despublicada ou alterada para 18+. Mesmas sessoes, sem refresh artificial de tokens.
- Troca A->B num slot de cliente: encerra somente a sessao desse slot, faz login B, aguarda getUser correto e consulta A com Biblioteca privada para detectar identidade A indevidamente retida. As demais sessoes permanecem independentes.
- 23 correspondencias publicas elegiveis mais casos privados/parciais/draft/18+, inclusive draft e 18+ de autoria do proprio A. Paginas keyset de sete, pagina final vazia, ausencia de duplicatas/perdas, offset=20, HEAD com count e cursor malformado rejeitado.
- Cleanup de sessoes e contas e independente: falha de um recurso nao impede tentar os demais. IDs de exclusao sao somente os retornados na criacao dessa execucao. Nada de truncate/reset/exclusao por prefixo.

## SQL pendente automatizado (ainda nao executado)

`pending.sql` foi reaproveitado do material conferido. Unica adaptacao de consulta: FORMAT JSON nos quatro EXPLAINs, mantendo ANALYZE, BUFFERS e os mesmos filtros. As duas assercoes sao min(id::text) da segunda pagina e count anonimo de escala=1003. As 43 assercoes anteriores NAO estao nesta suite e nao sao reexecutadas.

O probe SQL testa os papeis de banco por SET LOCAL ROLE/claims, como no original; isso NAO substitui a prova Auth real da camada HTTP. As fixtures SQL estao em BEGIN/ROLLBACK. O parser exige exatamente dois ok, finish `1..2`, ausencia de not ok e quatro planos JSON com Execution Time. Depois verifica zero fixtures SQL restantes e historico inalterado. Exit code 0 do psql sozinho nao basta.

## Diagnosticos publicados

Somente summary.json, schema.json e plans.json sao permitidos no upload. O resumo registra IDs de casos predefinidos, status, motivo/fase enumerados, HTTP, SQLSTATE em allowlist, duracao e contagens. E atualizado apos cada check e distingue execucao parcial de passed=true. FAIL ou BLOCKED torna o job nao aprovado. Mensagens SQL livres nao sao publicadas.

Planos publicam apenas metricas numericas, tipos de no/tabelas/indices em allowlist; filtros, expressoes, Output, query, valores de parametros e contextos SQL sao removidos. Nenhuma senha, token, cookie, email, ID de usuario/sessao, corpo Auth, erro remoto livre, screenshot ou trace e exportado. Os testes offline exercitam a exclusao desses campos.

## Riscos e o que nao fica comprovado automaticamente

1. A primeira execucao real deste bootstrap/harness, o registry e os resultados SQL/HTTP estao PENDENTES. Testes com mocks nao homologam RLS/Auth.
2. Ha gates negativos que podem reprovar o contrato existente: owner bypass de Biblioteca/categoria e referencias ocultas diretamente em favoritos. O harness nao enfraquece a expectativa nem classifica esses comportamentos como PASS para obter verde. A correcao de produto/RLS nao faz parte desta etapa.
3. Nao existe um campo independente `obra_privada` comprovado no schema analisado. Aqui obra nao divulgavel e representada por nao publicada (incluindo autoria do chamador) e 18+. Uma regra adicional de privacidade de obra/perfil precisa de definicao/revisao propria; nao foi inventada nem declarada coberta.
4. Os testes garantem filtros da consulta candidata, nao criam uma barreira nova na Data API: um cliente pode fazer outras consultas permitidas pela RLS atual. Uma futura RPC restrita continua sendo decisao de arquitetura separada.
5. Nao ha SLO de latencia ou criterio de plano aprovado. O workflow coleta planos/custos reais e respeita timeouts existentes; a aceitacao de desempenho, necessidade de indices e adequacao a volumes maiores ainda exigem revisao tecnica. Nao se presume que uma RPC seria mais rapida.
6. Nao cobre UI, cookies SSR, eventos de autenticacao no navegador, cache de aplicacao nem concorrencia de commits. Sao integracoes HTTP novas depois de escritas concluidas, sem retries.
7. `actionlint` nao foi executado localmente; YAML e checks estruturais nao substituem a validacao do servidor GitHub. Resultados reais devem ser consultados na primeira execucao remota, nunca inferidos dos testes offline.

Dependencias de runtime: Node 22.23.4 (somente builtins/fetch), Docker, Supabase CLI 2.116.0 e imagens do stack com pgTAP. Sem nova dependencia npm, build de aplicacao ou credenciais remotas.

Referencias primarias consultadas para o transporte, sem substituir a validacao real:

- https://github.com/supabase/auth/blob/master/README.md (password grant e GET /user)
- https://docs.postgrest.org/en/stable/references/api/resource_embedding.html (relacionamentos aliased e inner)

Parecer de preparacao: APTO para uma primeira execucao isolada de DIAGNOSTICO pelo push autorizado. NAO APTO como homologacao concluida ou autorizacao de implementacao/producao.
