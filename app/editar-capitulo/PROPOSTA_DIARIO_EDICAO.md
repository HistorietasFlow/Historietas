# Dependência de schema da #2307 — proposta, não aplicada

O CHECK `diario_atividades_tipo_check` da baseline permite oito eventos de
leitura/coleção. A migration `20261108164909` preserva esse CHECK e acrescenta
somente `publicou_capitulo`. Nenhuma permite `editou_capitulo`. O INSERT de edição
é, portanto, rejeitado com `23514`; retirar metadata não corrige esse erro.
Publicação e edição são eventos diferentes: não substituir por `publicou_capitulo`
ou por atividade de leitura. O salvamento do capítulo pode estar confirmado mesmo
quando esse efeito posterior falha; não repetir UPDATE, Diário ou notificação.

Nesta revisão, rejeições retornadas pelo SDK deixam de desaparecer silenciosamente:
são reportadas pelo warning existente, inclusive no fallback de coluna. Não há
retry para CHECK, permissão, rede ou resposta incerta. O evento permanece bloqueado
pelo banco atual. Isso NÃO conclui a homologação funcional do Diário.

## Proposta separada para autorização e revisão

Preparar uma migration transacional que capture `pg_get_expr` do CHECK existente
e adicione exclusivamente `or tipo = 'editou_capitulo'`, preservando os eventos
anteriores. Sem backfill, sem reapresentar edições antigas e sem executar nada
remotamente. Não criar essa migration na correção de salvamento que foi autorizada
com escopo exclusivo e sem migrations.

Antes de habilitar o evento, revisar também a privacidade: o payload atual deriva
visibilidade da obra, enquanto um capítulo pode continuar em rascunho. A migração
separada precisa garantir autoria de obra/capítulo nas escritas e impedir que
metadata/href/título de capítulo privado, removido ou bloqueado 18+ sejam expostos
publicamente. Não ampliar políticas existentes; especificar políticas restritivas
e tratamento das preferências de Diário/bloqueios antes da ativação.

## Critérios de aceitação da dependência

Em Supabase LOCAL descartável: confirmar CHECK efetivo, aceitar o novo evento e
preservar todos os tipos antigos, rejeitar tipo desconhecido e autoria divergente,
validar privacidade de rascunho/18+/bloqueios e rollback. Via Playwright: salvar texto,
clique duplo, editar durante envio, conflito de timestamp, logout/A→B→A, resposta
incerta e recuperação; verificar quantidade de UPDATEs e INSERTs. Nenhum retry de
resultado incerto, nenhum reenvio de efeito posterior apenas por remontar a página.

Ambiente desta revisão: Docker instalado, sem containers em execução e sem CLI
Supabase no PATH. Não foi iniciado Docker/Supabase, conforme a restrição original;
nenhuma validação de backend real ou Playwright foi realizada. A #2307 deve
permanecer draft e dependente dessa homologação antes de integração funcional.
