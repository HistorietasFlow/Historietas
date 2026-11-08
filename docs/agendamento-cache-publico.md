# Agendamento: Diário atômico e cache ainda sem consumidor

## Garantias desta fase

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

## Cache: diagnóstico, não solução entregue

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

## Proposta separada antes de ativar publicação automática

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
