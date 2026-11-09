# Arquitetura e infraestrutura

## Aplicação

- Framework: Next.js 16.3.4
- React: 19.2.4
- TypeScript
- Node.js 22 para CI e desenvolvimento suportado
- Node.js `22.x` versionado em `package.json#engines`, inclusive para builds e
  funções Node.js na Vercel
- Instalação reproduzível com `npm ci`

### Leitura pública de capítulos

- `/obra/[slug]/capitulo/[numero]` é a rota canônica pública de capítulos publicados e responde com o leitor real, sem redirecionar para `/ler-capitulo`.
- O servidor consulta somente obra e capítulos públicos com o cliente anônimo/RLS, gera metadata própria e fornece o estado público inicial ao mesmo Client Component usado pelo leitor interno.
- O título e o texto do capítulo são renderizados no HTML inicial; após a hidratação, o lifecycle existente recarrega interações e estado da identidade autenticada sem substituir dados com respostas obsoletas.
- O sitemap cruza consultas públicas paginadas de obras e capítulos sem N+1, publica somente combinações permitidas e usa o valor persistido de `capitulos.ordem` na URL canônica.
- Combinações canônicas inválidas ou ausentes são verificadas antes do streaming pelo proxy com cliente público/RLS e recebem rewrite interno para `/_not-found` com HTTP 404; a página mantém `notFound()` como defesa adicional.
- Falhas de infraestrutura nessa verificação não viram ausência: a requisição segue para o loader server-side, que preserva o tratamento de erro normal.
- Obras públicas renderizam JSON-LD `CreativeWork` e capítulos públicos renderizam `Chapter` no HTML inicial; o capítulo referencia a obra por `isPartOf`, sempre com URLs canônicas absolutas e conteúdo serializado com neutralização de caracteres capazes de encerrar o script.
- `/ler-capitulo?obraId=...&capituloId=...` permanece disponível para fluxos internos, drafts e leituras por identificador.

### Comentários de obras e notificações

- Comentários e respostas em obras continuam sendo persistidos e autorizados pelos contratos existentes de Supabase/RLS.
- Notificações do tipo `comentario-obra` apontam para a rota pública da obra com `comentarios=1`; o cliente abre o mesmo comments sheet acessível usado pelo acionador visual, sem duplicar carregamento ou mutations.
- O deep link reage à navegação Back/Forward e não altera links de capítulos ou de outros tipos de notificação.

## Backend e dados

### Agendamento de capítulos — contratos e executor administrativo privado

- `20261108132533_infraestrutura_agendamento_capitulos.sql` mantém um registro por
  capítulo em `historietas_privado.capitulo_agendamentos`, com RLS sem acesso
  direto, autor, instante absoluto, fuso IANA, revisão, estado e resultado fixo.
- Wrappers públicos invoker chamam um núcleo privado definer com `search_path`
  vazio e grants mínimos somente para authenticated. Sessão ativa e propriedade
  são conferidas no banco. Agendar/reagendar exige draft de texto, obra publicada
  e aceites atuais; consultar/cancelar continuam possíveis após despublicar a obra
  ou revogar termos, mas nunca após perder sessão/propriedade.
- Operações autenticadas seguem sessão → obra → capítulo → agendamento. Revisão
  inicial zero; cada alteração da intenção avança a revisão. Retry com a revisão
  anterior só reconhece a última operação equivalente. O registro não é apagado ao cancelar/invalidar;
  exclusão real de capítulo/conta remove-o por FK, sem tarefa órfã.
- O trigger de edição só bloqueia o registro após o capítulo: título/texto ou
  vínculo alterados invalidam o pendente; mudar apenas timestamp não invalida.
  Publicação direta de pendente é recusada, inclusive junto com edição. Não há
  bypass por GUC nem alteração dos contratos de leitura/RLS/18+ existentes.
- A fase 2 (`20261108142104_executor_privado_agendamento_capitulos.sql`) adiciona
  executor e lote de 1–10 itens, invoker privados e sem EXECUTE para clientes ou
  service role. Somente SQL administrativo confiável pode chamá-los; não existe
  wrapper público, endpoint, Cron ou consumidor automático.
- Try-locks por capítulo e da notificação legada precedem locks de autor/perfil,
  obra, capítulo e intenção. Após os locks, o executor relê revisão/identidade e
  revalida autor ativo, propriedade real, termos, texto, obra publicada e prazo
  UTC. Cancelar/editar/reagendar serializa no capítulo, sem bypass por GUC/JWT.
- Publicação, resultado, notificações e `capitulo_publicacao_eventos` são uma
  transação. O recibo por capítulo/revisão reconhece resposta perdida. A variante
  interna estrita reutiliza destinatários, IDs e links da notificação existente,
  propaga falhas e usa o instante de publicação; a RPC legada permanece intacta.
  RLS de notificações/18+ continua vigente. Nenhum texto/título vem do chamador.
- Erro reverte os efeitos e mantém a revisão da intenção para retry manual com
  cooldown de um minuto; cancelar/editar também alcança estado `erro`. Transições
  concluídas avançam revisão. Timeout/deadlock externo pode abortar toda a chamada,
  sem publicação parcial. O lote não promete execução exata nem entrega contínua.
- A fase 3 (`20261108164909_diario_publicacao_capitulos_agendados.sql`) habilita
  apenas `publicou_capitulo` no CHECK e cria a atividade no AFTER INSERT do recibo,
  na mesma subtransação da publicação/notificações. A referência privada usa FK
  SET NULL se o autor remover a atividade; retry não a ressuscita. Sem backfill.
- O novo tipo tem policies restritivas de autoria/publicação/18+ e usa predicado
  privado definer para ler somente a decisão de privacidade. Não há SELECT de
  preferências concedido a anon. A expressão legada fica em helper invoker não
  inline, preservando a autorização anterior dos demais tipos.
- Fase 4 parcial: `capitulo_cache_outbox` preserva o snapshot lógico do recibo
  sem cascatas, com RLS, leases/SKIP LOCKED e sem acesso de clientes à tabela.
  O consumidor manual `/api/admin/cache-capitulos` exige sessão ativa e papel
  admin real no Auth; usa RPCs restritas ao servidor e não recebe destinos do
  navegador. Etiquetas por hash do slug cobrem também null e listas; invalida
  somente slugs original/atual, seus caminhos e sitemap. Não usa tags globais.
- **Sem ack final:** revalidateTag/Path retornam void e só enfileiram operações
  para o flush posterior do Next. Retorna 202/`solicitado_sem_confirmacao` e
  mantém a fila durável. Sem internals do Next em produção, Cron, UI ou ativação
  automática. Conclusão recuperável/escopo por implantação ainda bloqueiam o
  recurso; diagnóstico e critérios em `docs/agendamento-cache-publico.md`.

### Revisão da projeção pública — fase 5A, sem integração com cache

- `20261108195558_revisao_transacional_projecao_publica.sql` mantém ledger privado
  sem cascatas. Triggers de obras/capítulos avançam revisão na mesma transação,
  inclusive publicação manual/agendada, despublicação, slug, ordem e exclusão.
  Recriar UUID não reinicia contador; troca a geração. Métricas e edições de
  drafts de capítulos não causam churn. Tombstones devem ser preservados.
- RPC `obter_projecao_publica_obra` é invoker e retorna obra/capítulo solicitado
  e revisão no mesmo snapshot SQL, somente sob visibilidade pública/RLS/18+.
  Ledger permite apenas SELECT de identidade/geração/revisão de obras públicas;
  não há DML para clientes. Adapter server-only usa POST/no-store sem sessão.
- Ainda não há barreira nos caches, integração com outbox, geração de sitemap
  ou ativação automática. Ver `docs/agendamento-cache-publico.md`. Não confundir
  revisão transacional com ack do flush ou revogação de bytes já entregues.

### Barreira pública e sitemap — fase 5B

- Loaders usam identidade/geração/revisão da RPC pública, cache versionado e
  nova conferência POST/no-store antes de devolver. Listas do leitor exigem a
  revisão em cada página SQL; metadata/HTML compartilham só o render atual.
- Proxy consulta existência por POST leve. Páginas e sitemap são dinâmicos, com
  resposta no-store; o Data Cache explícito continua identificado por versão.
- Sitemap usa SHA-256 do manifesto público e pagina sem N+1, validando revisões
  antes/depois. Erros propagam, sem 404 falso nem XML parcial/antigo.
- Router Cache/histórico/abas já abertas e rollout ainda impedem afirmar barreira
  em toda navegação: ativação automática suspensa. Outbox continua sem ACK; todos
  os bloqueios ilustrados são preservados. Ver `docs/agendamento-cache-publico.md`.

### Leitor canônico — fase 5C1

- Recebe geração/revisão junto dos IDs públicos. Revalida por endpoint público
  server-only/no-store que reutiliza a barreira; não consulta conteúdo via loader
  GET/local legado. `/ler-capitulo` mantém o fluxo autenticado/drafts existente.
- Hidratação, navegação, histórico, retorno da aba e BFCache reconciliam conteúdo
  explicitamente. Promessas simultâneas são agrupadas por rota/identidade, sem
  cache global; respostas antigas são descartadas. Estado pessoal não integra o
  payload público e não é reinicializado por revisão/foco.
- Ausência confirmada remove conteúdo, erro temporário oferece retry sem 404.
  Sem polling: abas continuamente abertas não detectam mudanças imediatamente.
  A página de Obra continua fora desta fase; ativação automática permanece suspensa.

### Capítulos ilustrados — contrato inicial, ainda inativo

- A migration `20261107223400_infraestrutura_capitulos_ilustrados.sql` adiciona
  `capitulos.tipo_conteudo` (padrão `texto`) e `versao_paginas`, sem converter
  capítulos existentes. Clientes não podem ativar `imagens` nem alterar a versão.
- `capitulo_paginas` contém um manifesto ordenado: UUID, capítulo, caminho privado
  imutável, dimensões, bytes, MIME e descrição acessível. O contrato limita a dez
  páginas de até 2 MiB, 2.048 × 4.096 px e oito milhões de pixels por imagem;
  JPEG, PNG e WebP. As posições são únicas/contíguas no commit e mudanças avançam
  a versão do capítulo. Publicação ilustrada exige manifesto não vazio.
- A projeção pública exclui `storage_path`. RLS depende da visibilidade do
  capítulo/obra, autoria real, publicação e bloqueio 18+ vigente. Não há DML
  concedido a `anon`, `authenticated` ou `service_role` na tabela de páginas.
- Reservas de uploads e outbox ficam em `historietas_privado`, com RLS e sem
  permissões para clientes ou service role. Exclusões de páginas/reservas
  preservam caminhos na outbox, inclusive em cascatas; não removem bytes.
- **Não está pronta para uso:** não existem upload, finalizador autorizado,
  assinatura em lote, executor de limpeza ou renderização
  ilustrada. Nenhuma escrita de páginas ou upload direto deve ser concedido
  antes dessas garantias.
- `arquivos-obras` permanece privado; policies dos anexos e quotas não mudam.
  Policies restritivas adicionais bloqueiam INSERT/UPDATE/DELETE autenticados
  somente no novo namespace `<usuario>/capitulos/`, até uma fase de upload seguro.
  A migration aborta se esse namespace já contiver arquivos, evitando bloquear
  silenciosamente anexos preexistentes.
  Seu teto de 30 objetos por usuário é compartilhado por todas as obras e também
  precisa comportar arquivos antigos, substituições e uploads pendentes.

#### Fase 2A — validação binária isolada, sem ativação

- `lib/server/capitulos-ilustrados/validar-imagem-pagina.ts` aceita somente bytes,
  identifica JPEG/PNG/WebP pelo conteúdo e usa Sharp para decodificar/re-encodar
  todos os pixels. Rejeita APNG, WebP animado e JPEG MPO; cabeçalhos/metadados do
  navegador não comprovam formato, dimensões nem integridade.
- Antes do decoder, PNG com metadados comprimidos possui orçamento agregado
  de expansão de 1 MiB. O limite de pixels não protege contra bombas zTXt/iTXt/iCCP.
- Verifica os limites da fase 1 antes e depois da codificação. Não redimensiona:
  aplica orientação, remove metadados e mantém o formato. JPEG é re-encodado com
  qualidade 100/4:4:4; isso não promete identidade pixel a pixel. A futura prévia
  do autor precisa usar os bytes finais, não o original. Se a saída superar
  2 MiB, a validação falha em vez de ampliar quotas ou reduzir a imagem sozinha.
- Retorna hash SHA-256 e metadados dos bytes canônicos; somente cópias desses
  bytes são acessíveis. Limita a duas validações simultâneas por instância do
  módulo, sem fila ilimitada, com timeout nativo de processamento de cinco
  segundos. Isso não substitui limite do corpo HTTP, rate limit ou autenticação.
- Sharp 0.35.5 já estava travado como dependência do Next; foi declarado direto
  na mesma versão para não depender de um pacote transitivo opcional. Nenhuma
  versão foi atualizada. O módulo é server-only e não possui endpoint/consumidor
  de produção nesta etapa. Os testes executam o decoder real com Node 22.
- **Divisão da fase 2:** a próxima parte deve contabilizar reservas com os mesmos
  locks/limites dos objetos legados, sem duplicar contagens quando o objeto surgir.
  Upload via service role não pode simplesmente contornar as policies de quota.
  Depois: fronteira autenticada com propriedade verificada, finalização atômica
  por versão/idempotência, reordenação/substituição/remoção e executor de limpeza
  com lease e revalidação de referências. Não abrir o namespace nem a interface
  de publicação até completar e testar esse fluxo. A fase 2A não cria migrations.

#### Fase 2B — reserva de capacidade, ainda sem upload

- `20261107235846_reservar_capacidade_capitulos_ilustrados.sql` adiciona RPCs
  autenticadas de reserva/liberação, com wrappers `SECURITY INVOKER` e núcleo
  privado `SECURITY DEFINER`, `search_path` vazio e grants mínimos. Não recebe
  identidade, caminho ou tamanho do navegador: verifica `auth.uid()`, autoria
  real de obra e capítulo e versão do manifesto; gera UUID/caminho no banco.
- Cada reserva compromete 2 MiB e um objeto por 15 minutos, sem renovar no retry.
  Chave idempotente é isolada por usuário e vinculada a capítulo/versão/formato.
  Liberação é idempotente; a chave encerrada não reativa. Há no máximo dez
  pendências por capítulo e cem novas reservas por usuário em 24 horas para
  limitar churn de registros. Tombstones não são excluídos nesta fase; uma futura
  retenção deve manter a idempotência e as referências da outbox.
- O ledger privado une reservas ativas e objetos dos três buckets nas quotas
  legadas: 30 objetos por usuário em `arquivos-obras`, 100 objetos/100 MiB por
  usuário e 5.000 objetos/700 MiB no projeto, sem ampliar limites por bucket.
  Caminho com objeto e reserva conta uma vez, cobrando o maior tamanho; objetos
  ainda sem metadata mantêm a reserva conservadora máxima do bucket. Expiração
  ou liberação não elimina capacidade ocupada por objetos físicos.
- Reserva e uploads legados usam o MESMO advisory lock transacional
  `historietas:storage:cota:v1`; leituras posteriores ao lock usam snapshots
  atuais. Obra é bloqueada antes do capítulo, e capítulo antes da reserva, para
  preservar ordem com exclusões em cascata. Conflito de versão retorna `PT409`,
  não `40001` (PostgREST pode repetir automaticamente falhas de serialização).
- A reserva pode preparar um draft de texto sem convertê-lo. Texto publicado
  não pode ser reservado; capítulos ilustrados próprios podem preparar futuras
  substituições, contando arquivos antigos até a remoção real. Leitura/RLS/18+
  não mudam. A resposta não contém caminho, URL ou token de upload.
- Liberação guarda o caminho na outbox quando não referenciado pelo manifesto,
  sem apagar bytes. Expiração é lógica, sem cron: o ledger ignora a capacidade
  pendente vencida; os registros/caminhos continuam disponíveis para a futura
  limpeza recuperável. O worker futuro deverá descobrir expiradas e revalidar
  referências e leases antes de remover via Storage API.
- **Ainda bloqueados:** upload de páginas (inclusive com reserva), ativação na
  interface, finalização, assinatura e leitor ilustrado. A próxima fase deve
  confirmar novamente sessão/propriedade/validade da reserva, validar bytes no
  servidor e coordenar upload/finalização/limpeza sem bypass administrativo das
  quotas. Não deduzir aplicação em produção pelo merge desta migration.

Supabase é usado para autenticação, banco e fluxos de dados da aplicação.

#### Fase 2C1 — recepção autenticada e pré-validação, sem gravação

- Entrega parcial deliberada: `POST /api/capitulos-ilustrados/prevalidar-pagina`
  recebe bytes brutos (`application/octet-stream`) com Bearer JWT e headers
  `x-reserva-id`, `x-capitulo-id`, `x-versao-esperada`. Não recebe caminhos,
  identidade, dimensões ou MIME como autorização. Não há ativação na interface.
- O endpoint verifica o usuário no Auth e chama a RPC somente leitura
  `conferir_reserva_pagina_capitulo` antes da leitura e novamente após o decoder.
  Ela exige sessão ainda presente em `auth.sessions`, autoria real de obra e
  capítulo, reserva pertencente à identidade, versão atual, estado reservado e
  prazo válido. Não expõe caminho nem capacidade de upload. Wrappers invoker e
  núcleo definer privado com grants explícitos; service role não pode chamar.
- Usa o validador binário da fase 2A; resposta contém apenas metadados/hash
  canônicos e declara `estado=validado_sem_upload`, `uploadHabilitado=false`.
  Não retorna bytes, não persiste originais/canônicos, não altera reserva e não
  produz prova reutilizável para uma gravação futura. Repetir é só pré-validar.
- Limite de 2 MiB verificado no stream, não apenas no Content-Length; até 4.096
  chunks, prazo de recepção de dez segundos e duas recepções simultâneas por
  instância sem fila. Reutiliza o núcleo privado do rate limit persistente com
  30 por usuário/minuto, escopo e parâmetros fixos e identidade/sessão verificadas
  no banco, sem modificar grants da RPC genérica. Não usa service role.
  Nenhum token, imagem ou erro interno é registrado nas respostas/logs do código.
- **Motivo da divisão:** na fase 2B a quota de uma reserva vence e sua linha
  desaparece por FK/cascata; uma chamada de rede ao Storage pode chegar depois.
  RLS de quota não restringe service role. Um simples check seguido de upload
  administrativo permite capacidade liberada durante IO, escrita atrasada ou
  órfãos sem registro. A conferência desta fase não resolve essa janela.
- **Antes de escrever:** implementar tentativa durável independente das cascatas,
  capacidade fixada durante IO e resultados ambíguos, fence de sessão/versão e
  expiração, autorização Storage restrita ao servidor após validação, criação
  imutável sem upsert, recibo idempotente e registro durável para limpeza via API.
  Uma resposta perdida não comprova ausência do arquivo. Contabilizar caminho
  somente uma vez, inclusive após expiração/liberação/exclusão da reserva.
  Só então conectar gravação de bytes canônicos; nunca aceitar este hash vindo
  do navegador como atestado de validação. Esses controles ainda não existem.
- Migration `20261108004015_autorizar_prevalidacao_paginas_ilustradas.sql`
  acrescenta conferência e adaptador restrito do limitador. Não altera quotas, policies do Storage,
  manifesto, grants de tabelas ou bloqueios de upload/18+. Finalização,
  reordenação, assinatura e leitor ilustrado continuam fora da fase.

#### Fase 2C2a — tentativa durável e retenção de capacidade, ainda sem escritor

- `20261108012821_registrar_tentativas_upload_ilustrado.sql` cria o ledger privado
  `capitulo_upload_tentativas`, **sem FKs** para reserva, capítulo, obra, sessão ou
  conta. Guarda identidade, sessão, versão, caminho gerado pela reserva, chave
  idempotente, lease imutável no protocolo e metadados canônicos esperados.
- `preparar_tentativa_upload_pagina`, `iniciar_transferencia_pagina` e
  `encerrar_tentativa_upload_pagina` são somente contratos internos invoker, sem
  EXECUTE para anon/authenticated/service_role e sem wrappers públicos. Nenhum
  endpoint os chama. Não aceitar hash/metadados do navegador como atestado.
  O owner do banco nos testes não representa uma credencial disponível ao app.
- Preparação e início usam o mesmo advisory lock transacional das quotas dos
  anexos (`historietas:storage:cota:v1`), revalidam sessão ativa, propriedade,
  capítulo, versão e reserva pela conferência da 2C1. Uma reserva aceita uma só
  tentativa; retries da mesma sessão/chave retornam o mesmo lease sem renová-lo.
  Outra sessão, chave ou identidade não assume a tentativa.
- Estados: `preparada`, `transferindo`, `incerta`, `cancelada_sem_envio`.
  Só preparada pode iniciar, uma única vez, com lease válido de dois minutos e
  metadados dentro dos limites da 2A. Iniciar não concede permissão no Storage.
  Somente cancelar **antes** do início retira o compromisso da tentativa;
  a reserva original ainda conta enquanto ativa. Após início, qualquer falha
  vira incerta, inclusive timeout, cancelamento ou resposta ambígua. Registrar
  falha é possível após logout/cascata, pois apenas retira direitos e não libera
  capacidade. Erros são códigos fixos, nunca mensagens/tokens arbitrários.
- O ledger compartilhado agrega MAX por caminho entre reserva, tentativa e
  objeto: um só objeto, cobrando o maior tamanho. Todas as tentativas não
  canceladas mantêm 2 MiB/objeto **sem prazo automático de liberação**, mesmo
  após lease/reserva expirados, logout, exclusão ou ausência atual do objeto.
  Quotas, helper transacional e policies dos anexos legados permanecem iguais.
- Tentativas transferindo/incertas (ou leases vencidos) são registros duráveis
  de recuperação, não autorização de limpeza. A outbox antiga continua recebendo
  cascatas, mas nenhum executor pode remover caminhos com tentativa possivelmente
  em andamento nem tratar ausência momentânea como confirmação de quiescência.
- **Entrega parcial, não pronta para uso:** não há grants de escrita Storage,
  escritor HTTP, takeover de lease, recibo de sucesso, liberação pós-IO ou executor
  de reconciliação/limpeza. Não há tentativa automática nem retenção automática de
  tombstones. O custo conservador de manter capacidade indefinidamente só será
  aceitável no fluxo real com recuperação operacional comprovada. A próxima PR
  deve provar fencing no ponto real de escrita (não apenas antes de fetch),
  impedir que writers atrasados sobrevivam à liberação, confirmar bytes/recibo e
  reconciliar via Storage API sem excluir referências ativas. Só então conectar
  o validador/endpoint e habilitar qualquer upload. `escritaHabilitada=false`
  continua explícito; testes administrativos locais não equivalem a upload ativo.

#### Fase 2C2c — recibo de observacao e gate fechado, sem upload/publicacao

- `20261108085709_recibos_privados_paginas_ilustradas.sql` adiciona recibos
  privados sem FKs/cascatas, vinculados a tentativa, reserva, sessao, capitulo,
  versao, caminho, objeto/versao Storage e metadados/hash canonicos esperados.
  Registro interno idempotente confere igualdade com a tentativa e a metadata
  observada. Isso NAO verifica os bytes no Storage nem ausencia de escritores:
  a unica evidencia permitida e `observacao_sem_terminalidade`.
- Registro e conferencia de finalizacao sao invoker, sem EXECUTE para
  anon/authenticated/service_role, sem wrapper HTTP e sem consumidor. Podem
  registrar observacao tardia apos logout/cascata sem restituir autorizacao.
- A conferencia transacional reutiliza os locks de quota, sessao real,
  propriedade, capitulo/reserva e versao; verifica lease, estado, recibo,
  exclusao de conta e outbox. Retorna SEMPRE `publicacaoHabilitada=false` por
  terminalidade nao comprovada. Nao escreve manifesto, nao muda tipo/versao,
  nao libera capacidade e nao e uma permissao reutilizavel para outro commit.
- O assinador legado rejeita `<usuario>/capitulos/`, inclusive referencias
  codificadas, para impedir que `arquivo_url` contorne uma futura quarentena.
- O executor de exclusao consulta uma RPC administrativa que retorna somente
  booleano, antes da limpeza, nas renovacoes e antes da conclusao. Tentativas
  nao canceladas antes do envio bloqueiam a limpeza mesmo sem objeto listado.
  Uma operacao de exclusao ja registrada impede preparar/iniciar tentativas;
  recibos e ledger sobrevivem a cascatas. Falha de consulta falha fechada.
- **Entrega parcial:** o diagnostico local 2C2b demonstrou escrita apos revogacao
  no Storage; RLS de admissao nao equivale a fencing fisico. Ainda faltam writer
  restrito, verificacao efetiva dos bytes, prova de terminalidade, finalizador
  com DML atomico e recuperacao/limpeza via API. Nenhum upload, pagina publicada,
  liberacao pos-IO ou limpeza fisica foi habilitado. Aplicar a migration antes
  do app e requisito para o executor administrativo; merge nao aplica producao.

#### Fase 2C2d — conferência pontual de bytes, ainda sem terminalidade

- `conferir-pagina-armazenada.ts` é server-only e somente leitura: compara o
  SHA-256 dos bytes baixados, limites/decoder 2A e ID/versão/metadata antes e
  depois. Recebe recibo PRIVADO e fonte interna confiável; não há endpoint,
  credencial/grant novo, consumidor de produção ou migration nesta parte.
- Mesmo com match, não autoriza publicação, limpeza, liberação de capacidade
  ou encerramento. Não confundir observação física com autorização atual ou
  terminalidade do backend. Recibos, ledger, locks e gate 2C2c não mudam.
- Protocolo de recuperação, limites do Storage e testes estão em
  `docs/capitulos-ilustrados-verificacao-recuperacao.md`. O diagnóstico local
  392ee0f2 foi preservado. Upload real e limpeza/liberação pós-IO seguem bloqueados.

Regras importantes:

- RLS e GRANT são controles separados.
- Tabelas novas no schema `public`, em migrations datadas a partir de 2026-10-30, precisam de GRANT/REVOKE explícito quando forem expostas ou bloqueadas para Data API.
- CI valida essa regra com `qa/scripts/check-public-table-grants.mjs`.
- Testes de banco usam pgTAP contra Supabase local descartável.
- `avatars` e `capas-obras` permanecem buckets públicos para entrega por URL conhecida, mas a listagem de `storage.objects` é limitada ao prefixo do usuário autenticado; rotinas administrativas usam service role no servidor.

## Observabilidade e qualidade

- Sentry para captura de erros.
- Vercel Speed Insights para métricas reais de experiência/performance em deploys Vercel.
- Lighthouse CI para baseline de performance, acessibilidade, boas práticas e SEO.
- Playwright para E2E.
- CodeQL para análise de segurança.
- Dependabot para atualizações de dependências e GitHub Actions.

## CI

O workflow principal fica em `.github/workflows/ci.yml`.

Jobs principais:

- Lint
- Typecheck
- Tests
- Build

O job de testes inclui:

- testes estáticos;
- validação de GRANT/REVOKE;
- paginação;
- sessão;
- Supabase local;
- pgTAP;
- integrações Data API;
- build;
- Playwright;
- Lighthouse CI.

## Deploy

Produção é hospedada na Vercel.

Em 2026-11-03 o projeto estava protegido por **Vercel Authentication: All Deployments**. Isso permite continuar fazendo deploys sem deixar o domínio público acessível a visitantes comuns.

Os deployments automáticos da integração Git são controlados pelo `vercel.json` da raiz:

- `main` permanece habilitada como branch de deployment automático de produção;
- o padrão globstar `**` fica desabilitado, impedindo Preview Deployments automáticos inclusive em branches com `/`;
- os workflows do GitHub Actions continuam independentes dessa política.

## Ambiente de testes local — novembro de 2026

- Docker Desktop/WSL2 fornece Supabase local com CLI fixada em `2.116.0`; portas foram remapeadas devido às reservas de portas no Windows (API 54421, banco 54422, Studio 54423). Esses valores são **configuração da máquina**, não contrato de produção.
- A inicialização local pode exigir a migration auxiliar de normalização ACL já usada na CI; não versionar esses ajustes locais sem fase específica.
- Fixtures Playwright usam identidades descartáveis e Supabase de loopback. Preferir build de produção local (`next build`/`next start`) para testes E2E repetíveis.
- O limite de storage do plano Hobby não afeta a execução de build/testes locais ou GitHub Actions, mas pode bloquear novas publicações na Vercel.
