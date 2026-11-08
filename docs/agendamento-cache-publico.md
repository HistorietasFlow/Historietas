# Agendamento: Diário atômico e invalidação ainda sem confirmação

## Fase 5B — barreira no servidor, sem ativação automática

`20261108205505_barreira_revisao_cache_publico.sql` adiciona somente leituras
SQL STABLE/SECURITY INVOKER, com EXECUTE para anon/authenticated, sem novo DML
ou privilégio de tabela. Deve preceder o app no rollout autorizado; não foi
aplicada em produção. RLS e bloqueio 18+ continuam aplicados.

### Obra e capítulo

- Cada loader começa por `obter_projecao_publica_obra`, POST/no-store, cliente
  público sem sessão. Non-GET usa o primário no roteador Supabase; não configurar
  endpoint dedicado de réplica para esses loaders.
- Data Cache: namespace de código + UUID da obra + geração + revisão decimal +
  tipo do payload + número canônico. `revalidate: 60` rege revalidação, não
  garante atualização nem exclusão física em 60 s. Chaves de revisões antigas
  podem permanecer até a evicção da plataforma, mas não são reutilizadas pela
  barreira. Tags por slug permanecem compatíveis com a outbox.
- Metadata vem do snapshot da RPC. Cada página da lista do leitor exige a mesma
  geração/revisão: dados e conferência na mesma instrução SQL. Mudança entre
  páginas recusa a coleta. Normalização e contrato do leitor são preservados.
- Antes de devolver inclusive um cache hit, OUTRO POST/no-store confere revisão.
  Mudanças descartam o resultado: até três tentativas, sem loop ilimitado. Erros
  propagam indisponibilidade, nunca cache antigo ou null/404. Escritor atrasado
  só ocupa uma chave antiga; duas instâncias não precisam compartilhar memória.
- Slug desconhecido não tem geração: não persistir seu null. Capítulo ausente
  em obra pública só pode ter null cacheado sob a revisão dessa obra. Exclusão,
  rename, despublicação, 18+ e recriação resolvem a identidade atual.
- `React.cache` compartilha metadata/HTML somente na mesma requisição, com o
  snapshot já confirmado. O adaptador autoritativo e suas duas leituras NÃO são
  memoizados. Isso evita duplicar barreiras dentro do mesmo render.
- `revalidate = 0` nas páginas impede Full Route/HTML/RSC Cache do servidor de
  pular a barreira; respostas locais devem ter private/no-store. O proxy decide
  existência por POST/no-store leve, sem texto ou GET de réplica; erros seguem
  ao loader, não são classificados como ausência.

### Sitemap

O XML deixa de usar ISR 3600. `/sitemap.xml` passa a Route Handler explícito
(`app/sitemap.xml/route.ts`), preservando URLs/campos/formato e escapando XML.
O metadata route anterior, mesmo dinâmico, emitiu `public, max-age=0,
must-revalidate` no teste real. O handler agora declara private/no-store também
para CDN/Vercel-CDN, sem depender desse padrão de cache de resposta.
A barreira é SHA-256 dos trios públicos ordenados
`obraId:geracao:revisao`, calculado em um snapshot SQL. Não é MAX(revisão) ou
timestamp: inclusão e exclusão também mudam a impressão do conjunto.

Um hit faz duas pequenas RPCs, antes/depois do payload cacheado. No miss, o
manifesto e os capítulos paginam por UUID (500 itens), sem textos nem N+1. O
SHA do manifesto coletado deve coincidir com a barreira e cada capítulo com a
geração/revisão de sua obra. Uma conferência antes de armazenar e outra antes
de devolver recusam coletas mistas. Preservam-se rotas estáticas, ordem real,
publicação, RLS, 18+ e lastModified. Erro não retorna XML parcial/antigo como
sucesso. O cache agregado tem namespace/impressão próprios, sem limpar catálogo.

A agregação custa O(número de obras públicas) por barreira no primário, embora
transfira só 64 caracteres. O miss pagina os metadados públicos existentes. Não
há lock global de escrita, tabela de epoch, serviço pago ou quota ampliada.
Catálogos muito grandes exigem nova medição; o sitemap único conserva o limite
arquitetural anterior, não é uma solução ilimitada de escala.
Versionar chaves aumenta a quantidade de entradas durante edições/publicações.
O volume/retenção real do Data Cache gerenciado não foi medido nem limitado por
uma API nova. Revisar bytes, churn e política operacional antes de ativar:
não confundir revalidação, flush solicitado ou TTL com limpeza física confirmada.

### Limites e bloqueios

Garantia de snapshot confirmado no servidor não revoga bytes já entregues.
Router Cache do cliente, prefetch explícito anterior, Back/Forward e abas abertas
podem reutilizar RSC/HTML SEM requisição. `revalidate = 0` não elimina esse
comportamento. Não introduzir reload, polling, flag experimental ou alteração
do histórico do leitor para mascará-lo. **Ativação automática segue bloqueada**
até contrato/validação dessas navegações e rollout de todas as instâncias.
Os lifecycles clientes existentes (`useObraPublicWorkLoad` e
`useLerCapituloInitialLoad`) ainda recarregam conteúdo/interações após hidratação
e possuem fallbacks locais. Eles não consomem esta revisão; a entrega desta fase
não deve ser apresentada como barreira ponta a ponta desses caminhos ou como
substituição das regras autenticadas/drafts do leitor interno. Integrá-los exige
fase específica, sem remover guards de identidade ou misturar dados privados.
Caches externos, restore ou mudança de policies exigem revisão de namespace e
rollout; testes locais não são SLA multi-região nem revogação instantânea.

A outbox fica intacta: `solicitada_em` não é ACK e nenhum evento é confirmado ou
removido por esta barreira. Cron, UI e publicação automática seguem desativados.
Uploads/publicação ilustrada/limpeza e retenção de quotas permanecem suspensos;
o diagnóstico local `392ee0f2` é preservado.

Referências verificadas: [renderização dinâmica](https://nextjs.org/docs/app/api-reference/functions/connection),
[cache sem Cache Components](https://nextjs.org/docs/app/guides/caching-without-cache-components),
[Router Cache/histórico](https://nextjs.org/docs/app/api-reference/config/next-config-js/staleTimes)
e [primário/réplicas Supabase](https://supabase.com/docs/guides/platform/read-replicas).
Também foram conferidos os documentos distribuídos com Next 16.4.5.

### Medições locais da fase 5B

Build de produção + Supabase descartável 54421, mesma fixture pública; tempos
de resposta SSR completa (não LCP, nem latência Vercel). Antes: três amostras
aquecidas. Depois: três coletas válidas, nove amostras aquecidas agregadas; a
primeira resposta de cada coleta foi excluída. Não houve medição remota.

| Resposta | Mediana antes | Mediana depois | Bytes do corpo antes/depois |
| --- | --- | --- | --- |
| Obra | 44 ms | 52 ms | 167.717 / 168.372 |
| Capítulo | 71 ms | 73 ms | 183.627 / 184.282 |
| Sitemap | 11 ms | 87 ms | 463.292 / 449.939 |

Não inferir ganho do leitor por execuções isoladas: a variação é ambiental. O
sitemap tem custo adicional comprovado ao abandonar a resposta ISR sem barreira.
Contagem real sanitizada nos access logs locais, por resposta aquecida: obra
faz duas RPCs de projeção; capítulo duas mais uma de existência no proxy; sitemap
duas RPCs de impressão. No código anterior, hits de Data Cache/ISR podiam não
consultar o banco (o proxy do capítulo fazia um GET); isso é análise de contrato,
não uma contagem de rede retrospectiva medida. No miss, somam-se as páginas de
dados e conferências descritas acima. Não há novas consultas de hidratação.
O sitemap transfere menos XML por serialização compacta, sem remover URLs.
Scripts temporários de medição foram removidos; logs locais ignorados não são
artefatos públicos, prova de multi-região ou SLA de produção.

## Fase 5A — revisão transacional, ainda sem barreira nos caches

`20261108195558_revisao_transacional_projecao_publica.sql` mantém um ledger
privado por UUID de obra, com geração e revisão bigint monotônica. Sem FK/cascata:
exclusão conserva tombstone; recriar o mesmo UUID avança a revisão e troca a
geração. Reutilizar um slug resolve a identidade atual, não a obra antiga.
Não apagar esses registros nem restaurar contadores antigos isoladamente.

Triggers comuns às escritas manuais e agendadas atualizam o ledger na mesma
transação. Cobrem conteúdo/metadados da obra, slug, autoria, publicação,
classificação e capítulos publicados (conteúdo, ordem, vínculos, exclusão e
publicação/despublicação). Mudanças somente de métricas, timestamp automático
ou documento de busca derivado não avançam revisão; edições de drafts de
capítulos também não revelam atividade pelo contador. TRUNCATE administrativo
avança conservadoramente os registros, sem apagar o histórico. Backfill e
instalação dos triggers ocorrem sob locks que excluem escritas concorrentes.

Escritas serializam no registro do ledger; não fazem UPDATE da obra para refletir
alterações de capítulos. Rollback desfaz dados e revisão juntos. Como em outras
transações com múltiplos registros, deadlocks/serialização podem exigir retry da
transação inteira; nenhuma falha autoriza aplicar dados/revisão parcialmente.
Não usar timestamps, MAX de IDs, revisão do agendamento ou versão ilustrada como
substitutos deste contrato.

`obter_projecao_publica_obra(slug, numero opcional)` é SQL STABLE/SECURITY INVOKER:
uma única instrução/snapshot retorna identidade, geração, revisão decimal em
string, dados públicos da obra e somente o capítulo solicitado. Não agrega todos
os textos nem dados de conta, arquivos privados ou comentários. RLS existente
continua aplicada, junto do predicado público explícito: obra/capítulo publicados,
autoria consistente e classificações permitidas (18+ segue bloqueado inclusive
para o autor nesta RPC). Ausência, draft, despublicação e bloqueio retornam a
mesma indisponibilidade pública, sem vazar identidade ou revisão privadas.
Capítulo ausente em obra pública retorna `capitulo_indisponivel`, com a identidade
e revisão da obra; erros SQL/infraestrutura não são capturados como ausência.

O ledger tem RLS e SELECT apenas de três colunas para anon/authenticated, somente
quando a própria obra é publicamente legível sob RLS. Tombstones não são
legíveis e não há grants de escrita; service role não recebe acesso. O schema privado
continua fora da Data API. Os triggers definer internos têm search_path vazio,
owner postgres e nenhum EXECUTE concedido a clientes.

`lerProjecaoPublicaObra` é o adaptador server-only, com cliente público sem sessão,
POST RPC e fetch `no-store`. Cada invocação faz uma leitura nova, sem memoizar
barreiras. Bigint permanece string; falhas propagam. A leitura deve usar o
primário (não uma réplica atrasada). O snapshot é consistente no instante da
consulta, não bloqueia alterações posteriores nem apaga conteúdo já entregue.

**Ainda não resolve a confirmação do cache:** nenhum loader/cache Next, sitemap,
proxy, consumidor/outbox ou executor foi integrado a essa revisão nesta fase.
Listas paginadas/sitemap precisam de contratos próprios de snapshot/geração;
futura barreira deve conferir a revisão antes de servir o payload e evitar que
CDN/Full Route/Router Cache a pulem. Mudanças de policies, código de projeção ou
restore de banco também exigem nova versão/namespace de cache no rollout futuro.
Não dar ack do flush, ativar Cron, UI ou publicação automática. Uploads ilustrados,
publicação ilustrada e limpeza física permanecem suspensos.

## Fase 4 — entrega parcial e bloqueador de confirmação

Migration `20261108182554_outbox_cache_capitulos_agendados.sql`:

- `capitulo_cache_outbox` é privada, com RLS e sem acesso de tabela para anon,
  authenticated ou service role. AFTER INSERT do recibo cria o snapshot na mesma
  subtransação da publicação/Diário/notificações. Sem HTTP ou backfill.
  Recibos anteriores à fase 4 não recebem um snapshot histórico inventado.
- Capítulo/revisão identificam logicamente o recibo; obra, slug, ordem e instante
  são imutáveis. Não há FK com cascata: apagar capítulo, obra, Diário ou conta
  não pode apagar uma invalidação ainda pendente. Não contém texto nem sessão.
- Reivindicação exclusivamente server-side, lote de 1–5, SKIP LOCKED e lease de
  dois minutos. Não é lease de Storage nem liberação de quota. Expiração permite
  repetir a invalidação, nunca publicar novamente. Tentativas menos atendidas
  têm prioridade, evitando que um lote antigo esconda indefinidamente os novos.
- `solicitada_em` registra apenas que o consumidor chamou as APIs do Next.
  **Não existe ack, estado processado ou exclusão automática.** Falha tardia,
  resposta perdida ou lease vencido não eliminam a obrigação durável.

Os três loaders públicos mantêm cliente anônimo, filtros, consultas e TTLs,
mas recebem uma tag SHA-256 do slug conhecido ANTES de consultar o banco. Assim,
ausências também são etiquetadas; a mesma tag cobre metadata, resolução da rota
e todas as listas retornadas pelos capítulos da obra. As chaves foram versionadas
para não reaproveitar entradas antigas sem essa tag. Tags globais preexistentes
continuam declaradas, mas **não são invalidadas pelo consumidor**.
O versionamento causa um aquecimento inicial único desses loaders após deploy;
não é uma limpeza global disparada por cada publicação.

`POST /api/admin/cache-capitulos` é manual, sem caller na interface, job ou Cron:

1. Exige Origin com mesmo protocolo e Host real (sem confiar em forwarded-host), cookies de sessão válidos via
   `getUser` e gate SQL que confere sessão ativa e papel **admin atual no Auth**.
   Metadata editável, moderador, usuário comum, JWT de sessão removida ou papel
   revogado não autorizam. Nenhuma nova senha ou chave de automação foi criada.
2. Somente após autorização cria o cliente administrativo existente, que chama
   wrappers restritos ao service role. Não recebe IDs, slugs ou tags do cliente.
3. Solicita `revalidateTag(tagDoSlug, { expire: 0 })` para o slug imutável e o
   atual (caso renomeado), caminhos canônicos seguros e `/sitemap.xml`. Não
   invalida Home, Explorar, tags globais ou todo o catálogo. Sitemap é o único
   agregado necessariamente global, sem alteração de suas regras públicas.
4. Retorna HTTP **202**, `estado=solicitado_sem_confirmacao`, `confirmadas=0` e
   `publicacaoAutomaticaHabilitada=false`. Não retorna snapshots ou tokens.
   Exceções retornam erro genérico 503; a fila continua pendente.

### Por que não confirmar depois da chamada

No Next 16.4.5 instalado, `revalidateTag`/`revalidatePath` apenas acrescentam
`pendingRevalidatedTags` ao work store e retornam `void`. O App Route chama
`executeRevalidates` em `finalizeResponse`, **depois que o handler retornou**,
guardando a Promise em `pendingWaitUntil`. Um ack SQL dentro do handler seria
anterior à execução real e poderia perder uma invalidação que falha depois.

Teste executável usa o Next real com um backend de cache deliberadamente
falho: a chamada pública retorna normalmente sem executar o backend; o flush
posterior rejeita. Os imports internos existem APENAS nesse diagnóstico de QA,
nunca no consumidor de produção. `after()` também não fornece contrato público
documentado de flush anterior ao callback; não foi usado como suposta barreira.

**Bloqueador:** não há, nas APIs públicas auditadas do App Router atual, uma
Promise/recibo de conclusão do flush que permita confirmar duravelmente a outbox
sem depender de internals ou de uma suposição sobre o encerramento HTTP. Não
inventar ack com `await` sobre `void`, timeout, resposta 202 ou processo vivo.
Mesmo um ack de invalidação não garante atualização instantânea de abas já
abertas/Router Cache nem terminalidade de leituras antigas em andamento.

### Evidências e limites dos testes

- Unitários com backend controlado aquecem null de rota/leitura/metadata e listas
  positivas; verificam reconsulta, isolamento de outra obra, despublicação e 18+.
  São testes de contrato, não medição do Data Cache gerenciado da Vercel.
- pgTAP/Data API exercitam rollback após outbox, snapshot imutável, ausência de
  acesso, concorrência real, invisibilidade antes do commit, leases, retry e
  revogação. A fila sobrevive às exclusões e não duplica efeitos de publicação.
- Playwright aquece null real da metadata da obra, leitura/lista e sitemap no
  build de produção local e verifica os efeitos após acionamento manual em
  desktop/mobile (quatro cenários focados aprovados, sem retries). A resposta continua sem ack mesmo quando os efeitos locais
  são observáveis. O proxy impede aquecer null da leitura canônica por uma URL
  inexistente; esse caso permanece no teste de contrato, não é apresentado como
  invalidação negativa ponta a ponta de capítulo.

### Próximo passo, sem ativação nesta fase

Validar com o fornecedor um contrato público de conclusão/erro do backend de
cache, ou aprovar separadamente um modelo de gerações/barreira de leitura que
torne a confirmação verificável. Cache handler próprio, imports internos do Next
e autoconfirmação por webhook não são workarounds aprovados. Depois testar falha
entre flush e ack, resposta perdida, escritores de cache atrasados e ambientes
múltiplos/regiões. A fila atual é de uma única implantação; não pode haver um ack
global para caches independentes de desenvolvimento/preview/produção.
O teste serial de despublicação não comprova ausência de leituras antigas em
voo. Slugs original/atual são observados no claim; múltiplas renomeações
concorrentes e aliases intermediários também exigem contrato próprio antes
de prometer invalidação completa. Não apresentar os testes locais como SLA.

Sem prova de conclusão, o consumidor não descarta pendências nem promete entrega
automática. Retenção/crescimento e operação manual precisam de decisão antes de
ativar o agendamento. Nenhuma alteração foi aplicada em produção; uploads
ilustrados, publicação ilustrada e limpeza física continuam suspensos.

## Fase 3 — garantias preservadas

A migration `20261108164909_diario_publicacao_capitulos_agendados.sql` acrescenta
`publicou_capitulo` ao CHECK sem retirar os oito tipos anteriores. Não habilita
`publicou_obra`, outra incompatibilidade legada fora desta fase.

O trigger **AFTER INSERT** do recibo privado cria a atividade e vincula seu UUID.
Capítulo, notificações, recibo e Diário pertencem à mesma subtransação do
executor da #2229. Falha após criar a atividade desfaz todos os efeitos. Retry
reconhece o recibo e não reinsere atividades; remover voluntariamente uma
atividade zera a referência por FK e não autoriza sua recriação. Recibos antigos
não recebem backfill nem geram notificações/atividades retroativas.

Título, autor, capítulo, ordem real, URL e data vêm do banco, sem texto completo.
A atividade só é criada após publicação autorizada, não ao agendar ou cancelar.
O Perfil reconhece o novo tipo como “Publicou um capítulo.”, sem confiar em href
arbitrário da metadata.

Policies restritivas limitam o novo tipo à autoria real e impedem exposição a
terceiros de capítulos/obras não publicados, removidos ou 18+. A decisão de
privacidade do novo tipo lê as preferências reais por predicado privado definer,
sem conceder SELECT da tabela a anon. A expressão anterior é preservada em um
predicado privado **invoker**, não inline; mantém permissões/RLS e comportamento
dos tipos antigos. Isso é necessário porque CASE com subqueries diretas ainda
exige permissões ao preparar o SELECT. Não apresentar essa adaptação como uma
revisão geral das policies legadas do Diário.

O predicado é gerado com `search_path` vazio para que `pg_get_expr` qualifique as
relações antes de criar a função. A regressão executa também SELECT de tipos
legados, não apenas INSERT. Leitura anônima de tipos antigos continua sujeita à
limitação de permissões anterior; uma consulta mista pode falhar. Essa pendência
independente não foi contornada com grants nem apresentada como resolvida.

## Fase 3 — diagnóstico original do cache

O executor continua exclusivamente SQL administrativo, sem chamada Next.js,
endpoint, consumidor ou Cron. Não existe `revalidateTag`/`revalidatePath` no fluxo.

| Fonte | Cache atual | Consequência após commit SQL |
| --- | --- | --- |
| Obra/Diário/capítulos pela Data API | RLS e consulta direta | Publicação e atividade disponíveis conforme autorização |
| Metadata pública da obra | `unstable_cache`, 300 s | Não há invalidação pós-commit |
| Rota/leitura canônica | `unstable_cache`, 60 s | Lista antiga e resultados `null` podem continuar armazenados |
| Sitemap | ISR `revalidate = 3600` | Capítulo novo não entra imediatamente no documento já gerado |
| Verificação 404 do proxy | Consulta pública por requisição | URL antes ausente pode passar a 200 sem provar invalidação do Data Cache |

Os prazos são TTLs nominais, **não SLA de atualização**. Revalidação pode servir
valor antigo e ocorrer em background; falha de rede também impede renovação.
`unstable_cache` serializa `null` como um resultado válido. Invalidar apenas o
capítulo novo não renova listas de capítulos já incluídas em outras leituras.

Diagnóstico controlado com o Next 16.4.5 instalado e adaptador incremental em
memória: o loader retornou `null` uma vez; mudar a fonte para publicado não o
executou novamente, mantendo `null`. `revalidateTag` fora do contexto Next lançou
`static generation store missing`. É evidência do contrato da biblioteca, não
medição de produção nem prova de invalidação do servidor real.

O teste Playwright cobre 404 antes e 200/HTML inicial após publicar, com Diário
sem duplicação, em desktop/mobile. Ele não comprova remoção de uma entrada
negativa já persistida no Data Cache nem atualização imediata do sitemap.
Não alegar que a visibilidade de todas essas fontes está sincronizada.

## Fase 3 — proposta original, ainda sem confirmação final na fase 4

1. Usar uma outbox privada transacional vinculada ao recibo, com snapshot imutável
   de obra, slug, capítulo, ordem e revisão. O vínculo ao Diário editável/removível
   não substitui esse snapshot. Sem HTTP dentro da transação SQL.
2. Introduzir consumidor **server-only autorizado**, pós-commit, limitado e
   idempotente. Não abrir webhook público sem autenticação nem usar dados de
   navegador como prova de publicação. Sua forma de acionamento ainda exige
   aprovação; não instalar jobs nesta fase.
3. Acrescentar tags por obra/slug aos caches correspondentes, incluindo resultados
   negativos e listas retornadas por outras URLs da mesma obra. Hoje as tags são
   globais; não esvaziar todo o catálogo para publicar um capítulo.
4. Expirar imediatamente essas tags no contexto Next válido e invalidar o único
   agregado afetado, `/sitemap.xml`. Os loaders continuam anônimos/RLS; o consumidor
   não injeta dados privilegiados no cache público.
5. Confirmar processamento só depois da invalidação; em resposta perdida/falha,
   repetir sem publicar novamente, notificar novamente ou liberar rascunhos.
6. Testar cache positivo/negativo previamente aquecido, listas de outros capítulos,
   sitemap, concorrência, falha entre invalidação e ack, despublicação e 18+.

Essa ponte não pode compartilhar a atomicidade de uma transação PostgreSQL com
o cache Next. Uma outbox permite recuperação pós-commit, não commit distribuído.
Não está implementada nem comprovada nesta PR. Não ativar publicação automática
antes desse contrato e da definição operacional de latência/recuperação.

Referência: [revalidateTag](https://nextjs.org/docs/app/api-reference/functions/revalidateTag)
opera no servidor Next, em Server Functions/Route Handlers; não é uma função SQL.
Também foi inspecionado o código de `unstable_cache` do Next 16.4.5 instalado.
Uploads ilustrados e sua limpeza continuam suspensos.
