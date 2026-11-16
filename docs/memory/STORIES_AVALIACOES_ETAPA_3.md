# Stories de avaliações — etapa 3

A página da obra mantém o fluxo de avaliação existente e acrescenta um botão
abaixo das estrelas. Somente uma confirmação server-side da avaliação pública
salva, da sessão proprietária e da obra pública habilita a ação. A nota confirmada
deve corresponder à nota exibida; cache/localStorage não autoriza o botão.

`POST /api/story-avaliacao` aceita somente slug, leitorId e ação confirmar/gerar.
O ID recebido é verificado pelo loader da etapa 1 contra Auth SSR/getUser.
Confirmação devolve apenas disponibilidade e nota. Geração usa exclusivamente
o gerador da etapa 2, inclusive revalidação após renderização. Origem externa
é recusada; respostas são privadas/no-store, variam por Cookie e não registram
credenciais, IDs ou dados privados. Não usa service role nem altera RLS.

O diálogo nativo usa título acessível, foco inicial, Escape e retorno do foco.
O ciclo Tab/Shift+Tab reutiliza `manterFocoNoDialogo`, pois o comportamento nativo
isolado não garantiu o retorno ao último controle no Chromium validado.
A prévia, download e File do compartilhamento usam os mesmos bytes PNG. Blob URLs
são revogadas no fechamento, troca de conta/nota e desmontagem. Solicitações antigas
são abortadas e descartadas por versão. Nenhuma imagem é guardada em localStorage.
O componente é remontado por identidade, versão, obra e nota; durante salvamento
não fica disponível. Eventos de troca de conta invalidam a imagem imediatamente.

Web Share é chamado diretamente no gesto do usuário com File image/png já gerado.
Ausência de suporte/erro oferece download; AbortError comunica cancelamento sem
download inesperado. Não há promessa de postagem no Instagram. Uma imagem já
entregue ao navegador/dispositivo não pode ser revogada remotamente.

Textos da interface são PT/EN/ES via provider existente. O PNG mantém integralmente
o design e rótulos aprovados da etapa 2. Nenhuma dependência nova, migration,
produção, proteção Vercel, merge ou deploy. Etapa 4 não iniciada.

QA focado: rota unitária e `qa/tests/story-share.spec.mjs`, desktop/mobile,
workers=1/retries=0, Supabase local com sessão SSR real e fixtures novas. A API
nativa do sistema é adaptada no navegador para verificar sucesso, cancelamento
e fallback; isso não certifica uma publicação real em aplicativo externo.
Resultados e capturas estão no relatório local `qa/reports/story-stage3/`.

A validação de origem usa protocolo da requisição e Host efetivo, sem confiar em
X-Forwarded-Host: Next normalizou a URL interna para localhost mesmo quando o
navegador usava 127.0.0.1. A comparação direta com request.url recusava o pedido
legítimo; há regressão unitária para essa situação e para origem externa.
O teste E2E aguarda a resposta concluída da RPC de métricas existente antes de
verificar a ação, preservando os timeouts originais e sem aceitar avaliação local
como confirmação do servidor.

Homologação local de 16/11/2026: 5/5 unitários da rota, lint focado e build com
TypeScript aprovados. Playwright final 7/8, workers=1/retries=0: fluxos principais,
segurança e foco passaram desktop/mobile; EN/ES passou desktop. Cenário de idiomas
mobile expirou antes da tradução, esperando resposta da RPC de métricas (15 s).
Auth 200, sem resposta de métricas nem chamada do Story nos diagnósticos. Causa
raiz não confirmada; pressão de memória observada não prova causalidade.
Parecer NÃO APTO para homologação completa até investigar essa pendência.

Atualização 16/11: investigação focada acrescentou somente diagnósticos ao teste
(início/fim/falha de requests, tempo relativo e identidade proprietária booleana).
Auth 200 precede a revalidação pública da obra, que também condiciona métricas.
Registros históricos não distinguem em qual dessas etapas houve a espera.
Sem defeito comprovado, aplicação e timeouts preservados. Após uma falha de
preparação por Storage ainda inicializando, serviços confirmados 200; idiomas
mobile isolado passou em 9,4 s e depois os oito cenários passaram em 58,8 s,
workers=1/retries=0. Idiomas mobile da rodada completa: 8,1 s, métricas concluídas
aos 3,346 s, identidades corretas. Parecer funcional APTO nessa rodada; causa
histórica não reproduzida, sem alegar correção definitiva de flakiness.
Evidências em qa/reports/story-stage3/CONCLUSAO-IDIOMAS.md.
