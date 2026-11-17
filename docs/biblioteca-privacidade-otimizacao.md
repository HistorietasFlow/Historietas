# Biblioteca: leitura unica de preferencias (em preparacao)

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
O banco real ainda precisa confirmar essas propriedades na aplicacao local.

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

## Preparado e executado nesta branch

- pgTAP preparado: 36 assercoes, 12.600 comparacoes (350 x 9 contextos x 4 fases).
  Oraculo literal anterior; IS DISTINCT FROM inclui NULL. SET LOCAL ROLE real
  anon/authenticated; owner, terceiros, seguidores/seguindo, bloqueios em ambas
  as direcoes, categorias, argumentos invalidos/nulos, preferencias ausentes e
  revogacoes. Fixtures sinteticas e funcoes de teste ficam numa transacao rollback.
  **Nao executado**. Claims SQL nao substituem sessoes Auth reais na Data API.
- 4/4 testes estaticos da migration/oraculo aprovados em Node 22.23.4.
- 19/19 unitarios relacionados a Biblioteca/visibilidade de perfil aprovados,
  concorrencia 1, sem retries. Nao provam equivalencia do banco.
- check-public-table-grants aprovado; git diff --check aprovado.

## Bloqueio e validacoes obrigatorias pendentes

Em 17/11/2026, RAM livre 904.060 KiB (~883 MiB), total 8.016.284 KiB.
Docker info falhou: pipe dockerDesktopLinuxEngine inexistente. Docker/Supabase
nao iniciados; nenhum processo alheio encerrado e nenhum volume alterado.

Em ambiente local descartavel com recursos suficientes, antes de publicar:

1. Aplicar a main e o auxiliar ACL local habitual da CI; registrar pg_get_functiondef,
   pg_proc, owner, ACL e comentario da helper antes/depois. Aplicar somente a nova
   migration localmente e verificar ausencia de mudancas em policies/grants.
2. Executar pgTAP completo, incluindo equivalencia, favoritos_obras_elegiveis,
   catalogo, metricas e contratos de privacidade. Nenhum aumento de timeout.
3. Preparar/validar harness Data API com sessoes Auth reais e endpoints loopback:
   owner, terceiro, anon, seguidores/seguindo, bloqueios bidirecionais, revogacoes,
   cinco colecoes e metricas. Usar service role somente em fixtures. Harness
   dedicado ainda NAO preparado/executado; preservar todos os testes negativos.
4. Medir 4.000 e 20.000 avaliacoes sinteticas: duas execucoes de aquecimento e
   sete amostras por variante, alternando A/B e B/A, sob mesmos dados/configuracao.
   EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON), sem elevar limites. Comparar resultados
   completos, mediana, p95 amostral, buffers hit/read/temp e custo por avaliacao.
   Guardar planos sanitizados. Medir helper isolada E consultas reais com RLS;
   erro/timeout e resultado, nao motivo para retry ou aumento de limite.
   Harness/medicoes novas ainda pendentes; nenhum ganho certificado nesta branch.
5. Ranking Geral nao existe nesta main. Regressao exige ambiente de teste isolado
   de compatibilidade com #2348, sem modificar a PR nem incorporar sua migration
   nesta branch. Preservar formula, assinatura, paginacao, resultados e RLS.
6. Apenas apos equivalencia, regressoes e beneficio confirmados: revisar diff,
   publicar PR separada draft e consultar checks uma vez. Gates CI intactos.

Parecer: NAO APTO para revisao/homologacao enquanto as pendencias acima existirem.
Nao houve commit, push, PR, migration remota, merge ou deploy nesta preparacao.
