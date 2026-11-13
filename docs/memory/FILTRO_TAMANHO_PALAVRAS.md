# Filtro por tamanho — palavras no banco e no Explorar

Etapa 1: base `bb7685b3` (#2284). Etapa 2: base `a5ac96c7` (#2285).
Sem backfill remoto, ativacao ou certificacao de capacidade fisica.

## Etapa 2 — interface, cliente e confirmacao

Somente Obras: intervalo opcional “Palavras disponíveis”, minimo/maximo inclusivos,
0..9007199254740991. Vazio nao e zero. Parser compartilhado rejeita negativos,
fracao, expoentes, NaN/infinito, excesso, whitespace e intervalo invertido;
nao arredonda/trunca nem converte erro em neutro. RPC aceita somente numeros
seguros/null/undefined; strings pertencem apenas ao parser de UI/URL.

Inputs mantem rascunho de edicao local, labels, ajuda e erro associado/anunciado,
teclado numerico e aplicacao atomica por botao. Nenhuma RPC durante digitacao.
Texto explicativo PT/EN/ES informa a exclusao de anexos, mistos e contagens
desconhecidas; nao promete cobertura completa, paginas ou tempo exato.

URL: `palavrasMinimas`/`palavrasMaximas`, normalizacao decimal canonica valida.
Valores invalidos recebidos permanecem corrigiveis, bloqueiam consulta/resultados
amplos e nao viram ausencia silenciosa do filtro. Historico usa push para aplicar/
remover; handlers existentes de busca/tags preservam o intervalo. Autores neutraliza
limites, controles e indicador. Um chip removivel representa o par e conta uma vez;
remocao limpa somente o par e reutiliza o comportamento de foco da #2281.

`listarPaginaCatalogo` envia os 17 argumentos somente quando algum limite esta
ativo, incluindo status, filtros e cursor com NULL explicito. Neutro preserva
variantes 10–15. Sem mudanca de SQL, schema, RLS ou grants. Filtragem anterior
ao cursor/limite continua exclusivamente na RPC da Etapa 1, nao no navegador.

O hook paginado inclui limites na identidade memoizada, invalida cursor/respostas
antigas e exige confirmacao remota da consulta/usuario atuais. Cache nao certifica
palavras; troca de conta/logout invalida confirmacao. Falha mostra indisponibilidade/
retry, nao lista ampla nem vazio confirmado. O loader preserva cache sem consultar
uma amostra sem limites apos falha. Intervalo confirmado vazio usa “Nenhuma obra
encontrada”, mesmo sem amostra local; nao “Publique sua historia”.

Consultas: modo neutro mantem as seis RPCs iniciais. Link com intervalo pula a
selecao ampla e faz uma RPC filtrada pelo hook existente; aplicar/remover com
outros filtros ativos faz uma consulta normal, nao uma por limite. Renderizar,
digitar ou traduzir controles/chips nao consulta. Limpar para neutro reutiliza
as seis selecoes; paginacao explicita continua uma RPC por pagina solicitada.
Colecoes pessoais preservam seu percurso paginado anterior quando necessario.

### Validacao local da Etapa 2

Node 22.23.4/CLI 2.116.0; mesmo Supabase descartavel 62421/62422 da Etapa 1,
Database/Auth/Data API. Fixtures existentes preparadas pelo script local, com
config/credenciais geradas fora do commit. Nenhuma operacao remota.

- Unitarios/regressoes focados: **130/130**. Parser/URL (inclusive newline e
  valores malformados), argumentos exatos/variantes, renderizacao PT/EN/ES,
  contagem unica, guards de cache/identidade, resposta antiga, debounce, cursor,
  retry, carregamento inicial e ausencia de fallback amplo. Hashes estruturais
  afetados foram atualizados junto das regressoes executaveis, sem remover gates.
- pgTAP existente de palavras: **44/44**, transacoes revertidas. Inclui NULL
  legado/parcial, zero, limites, privacidade e contrato antes da paginacao.
- Novo teste do cliente real contra Data API: **1/1**, fixture propria com
  52 obras, cleanup somente dos proprios IDs/usuario. Alvo antigo fora da primeira
  pagina; 47 resultados em paginas de sete, sem duplicacao e com ordem exata;
  [0,0], inclusao, combinacoes/status, anon, draft, 18+, anexo e erro real 22023
  propagado sem repetir chamada ampla. Ligado ao gate de integracao existente.
- Playwright: **12 cenarios distintos aprovados**, desktop/mobile, next build +
  next start, workers=1/retries=0. Oito novos (quatro por dispositivo) e quatro
  regressoes dos indicadores/nota da #2281. HTTP controlado para UI/rede/corridas;
  dois casos de catalogo com RPC local real. Dois casos adicionais usam login,
  logout e troca autor/leitor reais em outra aba, com respostas de catalogo
  controladas e distinguiveis para comprovar descarte da identidade anterior.
  Cache de autor apos reload nao certifica erro. Sem registrar credenciais.
- Historico/reload, aplicacao/remocao/limpeza, Autores, traducao sem RPC, pares
  invalidos, paginacao/retry e respostas atrasadas. Teclado/foco restaurado,
  Tab/Shift+Tab, axe do dialogo sem violacoes graves/criticas e sem overflow.
  Uma RPC para link com intervalo; uma por aplicacao combinada; zero por
  digitacao/render/traducao; seis ao limpar para a selecao neutra existente.
- Lint focado, Typecheck, Build de producao e diff check aprovados. Suite completa
  permanece obrigatoria na CI; nao se repetiram suites amplas de Storage/agendamento.

Falhas iniciais foram diagnosticadas: preparo antes da API ficar saudavel;
fixture 18+ sem aviso exigido pela constraint; detector QA confundindo RPCs de
leitura/HEAD com mutacoes. O primeiro caso real vazio revelou a mensagem de
catalogo geral inadequada ao novo filtro: ajustada somente para palavras ativas.
O caminho inicial foi reduzido a uma consulta filtrada, sem aguardar seis selecoes
amplas antes dela. A assercao nova da limpeza aguardava apenas a primeira das
seis respostas e contou cinco no mobile; agora espera todas individualmente,
mantendo a exigencia exata de seis. Rodada de 12 teve 11 passes e essa falha;
os dois cenarios afetados passaram apos a correcao (2/2), sem retries artificiais.
Nao afirmar estabilidade absoluta por essas rodadas. Sem backfill historico,
homologacao remota ou medicao de capacidade fisica.

### Implantacao e cobertura historica — bloqueio de merge

Conforme informado pelo responsavel, a migration #2285 ja foi instalada como
`20261113063207`, enquanto o arquivo Git e `20261113053819`. Nao reaplicar nem
corrigir timestamps automaticamente. Nenhuma consulta remota foi feita nesta fase.
O preenchimento historico **nao foi executado**: NULL permanece desconhecido e
excluido sob filtro ativo, nunca zero. PR deve permanecer em **draft**, sem merge,
ate revisao de cobertura e autorizacao separada da estrategia de implantacao.
O helper administrativo nao foi executado remotamente nem agendado.

Status editorial da #2284 ja integrado; suas migrations foram informadas como
aplicadas pelo responsavel. Isso nao altera o bloqueio da transicao 18+ com capa
existente nem autoriza outras operacoes remotas. Uploads ilustrados e publicacao
automatica continuam bloqueados. Nenhuma dependência, servico ou workflow novo.

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

Suite integral permanece obrigatoria na CI. Na Etapa 1, sem Build/Playwright:
nenhuma UI, loader ou codigo funcional da aplicacao mudou naquela entrega.
A Etapa 2 acima integra tipos, controles, URL e confirmacao; palavras nao implementa paginas.
Uploads ilustrados, runner, Cron, publicacao automatica e bloqueio 18+ com capa
existente permanecem inalterados. Sem operacao remota, merge ou deploy manual.
Os quatro servicos do descartavel foram parados sem remover volumes; os onze
containers antigos foram restaurados, mantendo arquivos/dados locais.
