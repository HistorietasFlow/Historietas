# Filtro por tamanho — Etapa 1, banco

Base `bb7685b3` (#2284). Somente infraestrutura local; sem interface,
backfill remoto, ativacao ou certificacao de capacidade fisica.

## Contrato

Migration `20261113053819_contar_palavras_catalogo.sql`, criada pela CLI
2.116.0. `capitulos.palavras_contadas BIGINT` nullable, CHECK nao negativo,
sem default ou preenchimento automatico do historico. Upgrade testado sem
rewrite, alteracao de tuplas existentes ou mudanca de defaults/ACL/corpos das
seis variantes antigas. NULL = nao medido/nao textual, zero = vazio medido.

Convencao v1 aprovada: sequencias nao vazias separadas por whitespace ECMAScript.
O trigger usa regexp_count com lista explicita e collation C: U+0009–000D,
0020, 00A0, 1680, 2000–200A, 2028, 2029, 202F, 205F, 3000 e FEFF. NBSP e BOM
sao separadores; U+0085/U+200B nao sao. Acentos, hifens, apostrofos, numeros,
HTML/Markdown literais, emojis e pontuacao isolados preservam a convencao JS.
Nao e segmentacao linguistica universal; nao contar titulo/sinopse/tags.

Trigger privado invoker, sem EXECUTE para roles da API, UPDATE recursivo ou
consulta adicional. INSERT sobrepoe contador enviado; mudanca de texto/tipo
ou tentativa de alterar somente o contador recalcula NEW.texto. Outros campos
preservam a medicao anterior, inclusive NULL legado. Imagens mantem NULL.
Nenhum RLS, grant de tabela, politica ilustrada ou anexos foi alterado.

Nova variante de **17 argumentos**, mais `p_palavras_minimas` e
`p_palavras_maximas`. Recebe NUMERIC para rejeitar decimais antes de cast que
arredondaria; aceita inteiros 0..9007199254740991 (limite tecnico de representacao
exata em JavaScript, nao faixa editorial). Negativos, NaN, infinitos, fracao,
intervalo invertido e excesso recebem 22023. NULL/NULL e neutro. Sem defaults,
PUBLIC/EXECUTE, definer, indice ou contador redundante de obra; EXECUTE somente
para anon/authenticated/service_role, como o catalogo anterior.

A soma reutiliza o agregado existente, sem ler textos em buscas. Somente
capitulos publicados, permitidos por RLS e com autoria correspondente. Filtro
ativo exige todos medidos/textuais e ausencia de anexo; nao expor soma parcial
como total. Anexo, imagens, misto ou NULL tornam a cobertura desconhecida e
excluida quando ativo. Um capitulo textual vazio medido pode satisfazer [0,0].
Obra sem conteudo continua sujeita aos criterios legados do catalogo.
Predicado antes de ranking/cursor/limite, combinavel com demais filtros.
Seis assinaturas de 10–15 argumentos intactas e neutro equivalente.
CRLF do prosrc Windows e normalizado somente na copia da nova funcao.

## Preenchimento administrativo — nao executar em producao nesta etapa

`historietas_privado.preencher_palavras_capitulos(p_limite integer)` e invoker,
privado e sem EXECUTE para PUBLIC/anon/authenticated/service_role. Somente o
proprietario administrativo existente pode operar. Nao cria endpoint ou job.
Lotes de 1 a 25 linhas textuais ausentes, ordenadas por UUID, FOR UPDATE SKIP
LOCKED. O UPDATE usa um sentinela; o trigger mede o corpo atual sob o lock,
nunca aceita um calculo antigo do operador. Retorna apenas IDs efetivamente
tratados. Repeticao nao atualiza linhas ja medidas. Nenhuma publicacao e feita.

Procedimento futuro, condicionado a autorizacao administrativa propria:

1. Confirmar destino, quantidade de NULL textuais e maximo de octet_length(texto).
   Nao imprimir corpos, arquivos, senhas ou tokens. Textos manuais podem exceder
   o tamanho das importacoes; limite de linhas nao limita bytes ou tempo.
2. Comecar por uma linha; definir lock_timeout/statement_timeout na transacao
   antes da chamada, conforme ambiente e autorizacao, sem ajustes globais.
3. Executar um lote por transacao, confirmar IDs/contagens e commit. Registrar
   tempo, linhas, bytes considerados, WAL e impacto de revisoes antes de ampliar.
4. Em timeout/deadlock/rollback, nao presumir commit. Reconsultar NULL e repetir
   somente trabalho ainda ausente. Resposta perdida apos commit nao reescreve.
5. Retorno vazio nao prova conclusao: pode haver linhas bloqueadas. Confirmar
   ausencia de NULL em consulta independente, depois de resolver concorrencia.
6. Pausar se houver pressao de recursos. Sem Cron, fila, limpeza de evidencias
   ou lote ilimitado. Esta entrega nao autoriza executar isso remotamente.

O backfill pode atualizar timestamp e revisao publica pelos triggers existentes.
Rollback restaura ambos; capitulos em rascunho nao revelam revisao publica.
Nao altera titulo/texto, nao invalida agendamento nem cria Diario/notificacao/
recibo/outbox. Nao acrescenta locks na linha da obra ou contador agregado.

## Evidencias locais

Supabase descartavel `work-word-count-database`, API 62421/DB 62422,
PostgreSQL 17, Node 22.23.4 e CLI 2.116.0. Sem instalar dependencias novas.

- pgTAP novo: 44/44. Regressao de catalogo/status: sete arquivos / **208/208**,
  incluindo tags, exclusoes, nota, editorial e token. Agendamento, executor,
  revisao e cache: quatro arquivos / **193/193**. Total focado: **401/401**,
  sem omitir asserts ou rodar toda a suite.
- Gate Data API/paginacao: **21/21**, serial, sem retries. Inclui a bateria
  nova (seis subcenarios mais container de teste), seis assinaturas anteriores,
  70 obras com alvo fora da primeira pagina e 69 resultados em paginas de sete,
  alem da regressao existente com 1.201 obras/limite Data API de 1.000.
- Confirmacao final com helper JS real: **7/7** (mesma bateria nova, nao somar
  como cobertura distinta). Versao anterior equivalente do teste ja compunha
  o gate 21/21; nenhuma alteracao no banco depois dessas rodadas.
- Equivalencia usa o helper JS real de publicar; todos os 25 separadores,
  literalidade, decomposicao Unicode e tentativas de falsificacao exercitados.
- Duas conexoes SQL reais: edicao retendo a linha, backfill SKIP LOCKED, segundo
  backfill, lock_timeout intencional, rollback e repeticao apos commit cujo
  resultado foi descartado. Edicao posterior recalcula. Revisao nao avanca
  apos rollback nem depois de repetir preenchimento concluido.
- Lint SQL publico sem erros; plpgsql_check das duas funcoes privadas novas,
  em transacao revertida, sem erros. Lint JS focado e grants publicos aprovados;
  auditoria estatica **199/199**, mantendo auxiliar ACL somente local.

Medicao do gate com seed existente, EXPLAIN ANALYZE/BUFFERS/WAL e delta de LSN:

| Linhas | Bytes textuais lidos | Tempo SQL local | WAL observado no intervalo |
| --- | --- | --- | --- |
| 1 | 160 | 2,532 ms | 1.336 bytes |
| 10 | 1.600 | 6,003 ms | 6.688 bytes |
| 25 | 4.000 | 6,711 ms | 47.680 bytes |
| 1 | 920.000 | 41,500 ms | 560 bytes |
| 10 | 9.200.000 | 422,382 ms | 8.032 bytes |
| 25 | 23.000.000 | 1.087,545 ms | 23.144 bytes |

Dados sinteticos compressiveis; WAL pode incluir full-page images e atividade
do intervalo. Medicao feita apos preparar a fixture e antes do rollback, nao
inclui todo o custo de criacao/commit/recuperacao. Nao extrapolar a producao,
disco livre ou margem fisica. O teto de 25 limita a operacao administrativa
com base nesses lotes locais, nao e recomendacao automatica para producao.
O plano externo da RPC e Function Scan; nao constitui analise completa dos
planos internos ou prova de indice necessario. Nenhum indice acrescentado.

## Diagnosticos de validacao e limites

Inicio local exigiu storage.enabled=true para criar o schema usado nas migrations
legadas, mesmo excluindo a API de Storage. Nao habilita uploads. A copia da RPC
precisou normalizar CRLF para localizar os pontos de agregacao no Windows.
As primeiras fixtures falharam por eventos deferred antes de ALTER TABLE,
CTE de UPDATE fora do nivel superior e anexo fora do lote: corrigidas somente
nas fixtures, sem relaxar assercoes. Misto e representado antes das constraints
deferred em transacao revertida; nao simula finalizacao ilustrada autorizada.

O fallback CLI antigo de paginacao usa execFileSync('supabase') e nao resolve
.cmd no Windows; a rodada final forneceu SUPABASE_TEST_URL/ANON_KEY em memoria
a partir do status local, depois de preparar o seed existente. Sem alterar
aquele contrato ou imprimir credenciais. A falha anterior permanece explicada,
nao atribuida a regressao do banco. Config/helper ACL/cli-latest nao versionados.

Suite integral permanece obrigatoria na CI. Sem Build/Playwright: nenhuma UI,
loader ou codigo funcional da aplicacao mudou. Etapa 2 pendente: tipos do cliente,
controles PT/EN/ES, URL, chips, foco, debounce, confirmacao por identidade, cache
seguro, retry, desktop/mobile e axe. Palavras nao implementa paginas.
Uploads ilustrados, runner, Cron, publicacao automatica e bloqueio 18+ com capa
existente permanecem inalterados. Sem operacao remota, merge ou deploy manual.
Os quatro servicos do descartavel foram parados sem remover volumes; os onze
containers antigos foram restaurados, mantendo arquivos/dados locais.
