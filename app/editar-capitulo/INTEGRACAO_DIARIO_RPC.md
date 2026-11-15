# Integração do Diário com RPC — dependência da #2316

Esta branch deriva da #2307 e sua PR tem como base
`codex/editar-capitulo-recuperacao-texto`. Não modifica as branches #2307/#2316,
não contém migration, não ativa o gate e não executa SQL remoto.

## Escrita confirmada e compatibilidade

O PATCH de texto mantém os filtros CAS de autoria, obra, capítulo, tipo, timestamp,
ordem e publicação. A representação do próprio UPDATE usa `select("*")` para
receber a coluna opcional `diario_edicao_versao` sem exigir que ela exista antes
da migration. Não há probe de coluna, GET de token, segundo PATCH de fallback,
ou alteração de tipo/publicação. A referência persistida é projetada para os campos
de texto conhecidos, descartando colunas extras da representação.

Só uma representação validada com identidade/conteúdo/ordem/publicação corretos e
avanço de timestamp fornece um token. O token deve ser UUID válido, vir dessa
representação e corresponder a mudança efetiva de título/texto. GET, cache e no-op
não fornecem nova intenção de Diário. Token ausente, nulo ou inválido não impede
confirmar o capítulo salvo; não cria evento, token presumido ou backfill.

A coluna e a RPC são contratos de
[#2316](https://github.com/HistorietasFlow/Historietas/pull/2316).
Sua implementação continua sendo a autoridade para sessão, autoria, vínculos,
publicação, classificação, bloqueios, preferências e idempotência. Esta integração
não concede acesso, publica drafts ou habilita conteúdo ilustrado/18+.

## Recuperação por intenção

A chave por usuário/obra/capítulo da #2307 é preservada. O registro aceita campos
opcionais `diario` (lista de UUID/estado) e `escritaConfirmada` (referência derivada
de um PATCH confirmado, independente do estado do buffer). Cópias antigas continuam
legíveis; inválidas não são substituídas. A confirmação anterior não é apagada
quando uma nova tentativa falha antes da escrita. Uma escrita de capítulo incerta
continua bloqueada e nunca usa o token aparente para iniciar a RPC.

Cada token recebido é guardado antes da RPC, junto da recuperação privada da aba.
Versões de intenções anteriores permanecem na lista ao editar novamente. Não se
substitui um token antigo pelo token de um GET mais recente. A remontagem lê a
recuperação sem enviar RPC; somente uma ação explícita de Salvar pode tentar
`pendente`, `incerto` ou `indisponivel` novamente, uma vez por intenção nessa ação.
Uma edição já confirmada não faz outro PATCH, mesmo com GET inicial indisponível.
O cache local continua sujeito às guardas da #2307; uma versão local divergente
não é sobrescrita para recuperar o Diário. Se o GET disponível divergir da escrita
confirmada guardada, só a RPC antiga pode ser recuperada: não há novo PATCH nem
confirmação visual da versão atual, e o usuário precisa comparar as versões.

A RPC recebe somente `p_capitulo_id` e `p_versao`; sem user_id, título, texto,
href, slug ou metadata. INSERT direto e fallback simplificado foram removidos.
A conta é revalidada antes e depois da RPC. Logout, A→B→A, navegação e erros de
identidade não confirmam respostas antigas nem iniciam efeitos para outra conta.

- UUID de atividade válido com HTTP 200: `confirmado`; não repetir.
- Gate 55000 ou função ausente 42883/PGRST202: `indisponivel`; capítulo continua
  salvo, intenção permanece para tentativa manual pela mesma RPC.
- PT409/42501/22023: `conflito`; terminal nessa intenção, sem novo token ou PATCH.
- Rede, gateway, retorno inválido/204 ou `data=null`: `incerto`. O SDK não distingue
  JSON null (possível tombstone) de resposta 200 sem corpo; não declarar sucesso ou
  remoção presumida. Retry manual mantém os IDs; o recibo/tombstone de #2316 impede
  novo INSERT. NULL persistente exige conferência, não recriação.
- Draft de capítulo ou obra: token preservado como `inelegivel`, sem RPC ou aviso
  de falha de salvamento. Publicar depois não promove esse token antigo a evento.

A interface distingue capítulo confirmado de pendência do Diário: o texto pode
estar salvo enquanto um aviso informa que o evento não foi confirmado. Notificações
mantêm a função e os parâmetros existentes, uma vez no fluxo original. Recuperar
somente Diário não repete notificação. Após remontagem não se presume que uma
notificação anterior falhou para reenviá-la.

## Ordem segura de implantação (não executada nesta tarefa)

1. Homologar e revisar #2316 no backend local descartável, inclusive RLS, grants,
   concorrência, tombstone e rollback. Não integrar a aplicação a INSERT legado.
2. Após autorização própria, aplicar a migration de #2316 com **gate desligado**.
   Confirmar schema/cache da API e grants. Merge não significa migration aplicada.
3. Homologar #2307 + esta PR sobre o schema novo e o antigo. Esta aplicação pode
   ser disponibilizada antes da migration: sem coluna opcional, salva normalmente
   e pula o Diário. Não repetir edições antigas para obter tokens posteriormente.
   O caminho recomendado é schema desativado primeiro, aplicação depois.
4. Verificar via Data API/Playwright: PATCH único, conta/privacidade, duplo clique,
   edição durante await, resposta perdida, quota, reabertura, RPC ausente/gate off
   e recuperação sem PATCH/notificação repetidos. Revisar clientes antigos que
   ainda tentam INSERT; a RLS nova os rejeita, sem fallback de escrita.
5. Somente após homologação e autorização explícita, considerar ativar o gate.
   Nenhuma configuração, migration ou chamada de ativação está nesta branch.

Rollback operacional: desligar o gate pela operação administrativa já documentada
na #2316. Esta aplicação continua salvando e preservando intenções indisponíveis.
Não apagar recuperação/tombstones para liberar ações, não reverter ao INSERT
legado nem retirar o schema com recibos existentes. Reverter a aplicação para
versão antiga não preserva necessariamente os campos novos de recuperação:
exportar/preservar a cópia privada da aba antes de qualquer downgrade.

## Limites

sessionStorage depende de quota/disponibilidade e não oferece sincronização global
entre abas. Se a quota falhar após confirmação remota, o token fica em memória
para tentar persistir novamente sem PATCH. Se a aba se perder antes disso, a cópia
anterior permanece incerta: não buscar token por GET nem liberar novo envio por
suposição. Não se garante recuperação durável sob perda do armazenamento.

Esta entrega usa unitários dos módulos reais, React/auth simulados e SDK Supabase
real com fetch controlado. Não aplica a migration de #2316 nem homologa sua RPC
contra backend real. Data API/Playwright e ativação conjunta continuam pendentes.

## Evidências locais desta branch

Node 22.23.5; revisão final com **244/244 testes** de Editar Capítulo aprovados,
incluindo as regressões importadas pelo gate. Typecheck, ESLint focado e diff check
passaram. Os quatro testes estruturais antigos foram corrigidos para conferir a
delegação aos hooks e seus consumidores reais: callbacks de importação/exclusão,
confirmação por idioma e estilos desktop/mobile, sem exigir funções inline ou
contagem arbitrária de ocorrências de `isDesktop`.

A revisão reproduziu e corrigiu uma confirmação falsa: salvar A, confirmar B no
servidor e falhar no cache deixava a conclusão de A ativa. Voltar o formulário para
A podia indicar salvo sem novo PATCH, embora o servidor estivesse em B. A conclusão
anterior agora é invalidada imediatamente após confirmar qualquer nova versão,
antes de cache/Diário. Restaurar A passa a exigir uma nova escrita explícita, com
CAS baseado em B; resposta incerta continua bloqueada. A regressão conferiu três
PATCHs confirmados para as intenções A → B → A.

Comando ampliado aprovado:
`node --import ./qa/scripts/test-source-newlines.mjs --test qa/unit/editar-capitulo-*.test.mjs`.

```sh
node --import ./qa/scripts/test-source-newlines.mjs --test \
  qa/unit/editar-capitulo-local-save-mutation.test.mjs \
  qa/unit/editar-capitulo-notification-action.test.mjs \
  qa/unit/editar-capitulo-validation.test.mjs \
  qa/unit/editar-capitulo-local-work-storage.test.mjs \
  qa/unit/editar-capitulo-storage-utils.test.mjs
npm run typecheck
```
