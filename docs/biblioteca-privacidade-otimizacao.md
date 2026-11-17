# Biblioteca: leitura unica de preferencias (validacao isolada concluida; PR draft)

Base: main `77beb0e49f0b228c75ad841ce952bd5994628932`.
Branch: `perf/biblioteca-privacy-single-read`. Sem incorporacao da PR #2348.

## Escopo e equivalencia pretendida

A migration `20261117035853` substitui somente o corpo SQL de
`historietas_privado.usuario_pode_ver_registro_biblioteca(uuid,text,text)`.
Uma ancora de uma linha com LEFT JOIN pela PK `preferencias_privacidade(user_id)`
substitui as duas subconsultas escalares. Sem preferencias, as colunas resultam
NULL e conservam os mesmos COALESCE; nao substituir por INNER JOIN/EXISTS nem
normalizar o resultado inteiro para false. O retorno original pode ser NULL.
Nao ha cache de autorizacao entre statements ou mudanca de STABLE/DEFINER.

CREATE OR REPLACE preserva OID, owner e ACL. O guard compara todos os campos de
pg_proc, exceto prosrc, antes/depois e aborta a transacao se houver drift.
Comentario e schema privado permanecem; nenhum GRANT/REVOKE ou policy e alterado.
No Supabase local descartavel da CI #44017527508, a migration foi aplicada e o guard de propriedades passou. Nenhuma aplicacao ao banco remoto foi realizada.

Consumidores diretos: policies de favoritos, concluidas, obra_avaliacoes,
seguindo_obras e salvos_capitulos; contrato de metricas agregadas da migration
20260825225811. Dependencias: auth.uid, preferencias_privacidade,
usuario_pode_ver_aba_perfil, bloqueios e seguindo_usuarios. Catalogo, perfis,
Biblioteca e avaliacoes dependem indiretamente desses consumidores. A protecao
de referencias de favoritos da migration 20261116191723 permanece intacta.

## Evidencias anteriores e limites

Experimento: https://github.com/HistorietasFlow/Historietas/actions/runs/44012620755
em `b7e11bd57e86728d2e4095814b90864ab9a4abbc`, separado da PR #2348.
Relato: 23.520 comparacoes sem divergencias; medianas 1.273,11 -> 1.091,47 ms
(4.000 avaliacoes) e 6.358,42 -> 5.505,41 ms (20.000).

A leitura do harness confirmou uma limitacao importante: compareMatrix altera
request.jwt.claim.sub, mas executa como postgres; explainHelper tambem usa
postgres e aplica explicitamente a helper no WHERE. Isso mede a candidata,
mas NAO comprova a autorizacao real anon/authenticated ou o custo final da RLS.
Nao atribuir esses ganhos a esta migration sem nova medicao comparavel.

## Validacoes concluidas

A branch `perf/biblioteca-privacy-single-read`, no commit
`996a84997431d2f2bd9cd35efda9a0b13083e3ba`, foi validada em Supabase
local descartavel pelo [workflow #44017527508](https://github.com/HistorietasFlow/Historietas/actions/runs/44017527508).
Todos os passos desse workflow terminaram com sucesso:

- Captura da definicao original e comparacao das propriedades de `pg_proc`
  antes/depois da migration: aprovadas.
- pgTAP completo: **1.378 testes aprovados**, incluindo **36 assercoes novas**
  com **12.600 comparacoes de equivalencia** (350 x 9 contextos x 4 fases).
  O oraculo preserva `NULL` com `IS DISTINCT FROM`. Foram cobertos roles SQL
  `anon` e `authenticated`, proprietario, terceiros, seguidores/seguindo,
  bloqueios em ambas as direcoes, categorias, preferencias ausentes e revogacoes.
- Integracoes reais da Data API local: **Historias em Comum 8/8**,
  **Paginacao 22/22** e **Ranking Geral 5/5**, com Auth/Data API locais.
  A regressao do Ranking usou exclusivamente no runner uma copia da
  migration/testes da PR #2348, sem incorpora-los nesta branch.
- Verificacoes estaticas **4/4** e unitarios relacionados **19/19**
  reportados pelo Codex Local, alem de grants, sintaxe e whitespace aprovados.
  O workflow isolado comprova somente suas etapas executadas, nao substitui
  a CI obrigatoria da futura PR funcional.

O Docker Engine do notebook estava indisponivel (883 MiB livres na verificacao
anterior); por isso a validacao do banco foi realizada em runner remoto
descartavel. O workflow encerrou os containers ao final; nenhum volume do
notebook, migration remota ou deployment foi alterado.

## Benchmark comparativo na branch

Fonte: [#44017527508](https://github.com/HistorietasFlow/Historietas/actions/runs/44017527508).
As variantes original e candidata foram comparadas sob RLS `anon`, com
tabelas sinteticas equivalentes, duas rodadas de aquecimento e sete amostras
alternadas por variante. `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)`, sem elevar
o limite SQL de **8s**.

| Avaliacoes | Mediana original -> candidata | p95 amostral original -> candidata | Shared hits original -> candidata |
|---|---|---|---|
| 4.000 | 965,81 -> 960,79 ms (-0,52%) | 997,48 -> 1.001,62 ms | 16.593 -> 8.600 |
| 20.000 | 4.610,04 -> 4.571,92 ms (-0,83%) | 4.652,77 -> 4.679,71 ms | 76.709 -> 40.716 |

A mediana de blocos lidos do disco foi zero nas duas cargas. A candidata reduziu
os acessos a buffers em aproximadamente 47%-48%, mas **nao demonstrou ganho
relevante de latencia**: melhora inferior a 1%, com ligeira piora do p95
amostral (n=7, portanto o p95 observado e o maior valor da amostra).
O `same_results` do benchmark verifica contagem e soma, nao identidade completa
dos registros; a evidencia de equivalencia das autorizacoes vem principalmente
do pgTAP e das integracoes.

O experimento anterior #44012620755, descrito acima, nao e comparavel de
maneira controlada com este benchmark: operou como `postgres`, chamou a helper
explicitamente no `WHERE` da tabela real, enquanto o novo mediu a helper
via RLS `anon` sobre tabelas reduzidas. As distribuicoes e os conjuntos
de registros visiveis tambem diferiram. **Nao atribuir os ganhos de 13%-14%
anteriores a esta migration**; a causa quantitativa da diferenca nao foi isolada.

## Riscos restantes e parecer

- A equivalencia de todas as colecoes e seus contextos nao foi demonstrada
  por sessoes Auth reais para cada combinacao. O pgTAP simula claims e roles SQL;
  a Data API local cobre os fluxos indicados acima, sem matriz completa das
  cinco colecoes e das metricas agregadas.
- Colunas de flags de preferencias sao `NOT NULL` no schema atual; fixtures
  com esses flags nulos nao foram criadas. Preferencias ausentes, parametros
  nulos e visibilidades invalidas foram cobertos.
- O custo da funcao para usuarios autenticados/proprietarios nao foi medido.
  O `LEFT JOIN` pode acrescentar trabalho em caminhos que anteriormente
  retornavam antes de consultar preferencias; risco nao comprovado, e nao
  regressao funcional demonstrada.
- O ganho de buffers justifica revisao, mas a reducao de latencia inferior a
  1% ainda nao comprova beneficio suficiente para justificar merge.

**Parecer independente: APTO COM RESSALVAS para abertura de PR draft.**
Nenhuma falha funcional ou de seguranca foi comprovada nos cenarios testados.
A PR draft permite revisao, mas **nao autoriza merge**, aplicacao da migration
remota ou deploy. A PR #2348 permanece separada e intacta.
