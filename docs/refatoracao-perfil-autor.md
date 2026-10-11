# Refatoração de Perfil de Autor

## Fase 838 — modo desktop

- Extraiu o estado e o lifecycle responsivo para `usePerfilAutorDesktopMode`.
- Preservou estado inicial, atualização síncrona, breakpoint e listener de `resize`.

## Fase 839 — mensagem de ação

- Extraiu o estado e lifecycle de expiração para `usePerfilAutorActionMessage`.
- Manteve as mensagens de domínio, limpezas manuais e o toast na página.

## Fase 895 — helpers de publicações da comunidade

- Extraiu a normalização, URL, análise de enquetes e resumo das publicações para `profile-community-publication-utils`.
- Manteve as consultas Supabase e todos os consumidores de comunidade na página.

## Fase 896 — helpers de registros do diário

- Extraiu a data, visibilidade, regra de exibição e estado vazio para `profile-diary-record-utils`.
- Manteve as consultas Supabase, regras de privacidade e todos os consumidores na página.

## Fase 897 — helpers de ordenação e mesclagem do diário

- Extraiu ordenação, chaves de deduplicação e mesclagem de itens para `profile-diary-merge-utils`.
- Manteve as consultas Supabase, regras de privacidade e todos os consumidores do Diário na página.

## Fase 898 — helpers de construção e resolução de itens do diário

- Extraiu a construção de itens, metadados, URLs, mapas e resolução de obras para `profile-diary-item-utils`.
- Manteve as consultas Supabase, regras de privacidade e todos os consumidores do Diário na página.

## Fase 899 — helpers de armazenamento local

- Extraiu chaves por usuário, normalização, leitura e gravação de listas e JSON para `profile-local-storage-utils`.
- Manteve autenticação, identidade, consultas Supabase e todos os consumidores na página.

## Fase 900 — avaliações, perfis e Top 5 locais

- Extraiu avaliações e perfis locais para `profile-local-author-utils` e o Top 5 local para `profile-top-five-local-utils`.
- Manteve o isolamento por usuário, as chaves de armazenamento, as curtidas e todos os consumidores na página.

## Fase 901 — helpers de compartilhamento

- Extraiu a construção de URL, a cópia com fallback e a identificação de cancelamento para `profile-sharing-utils`.
- Manteve o fluxo de compartilhamento, os consumidores e os fallbacks de navegador na página.

## Fase 902 — helpers locais de montagem do Diário

- Extraiu a coleta de IDs, a formatação de datas e a montagem local do Diário para `profile-diary-local-utils`.
- Manteve as coleções, visibilidades, ordenação, limite de atividades e todos os consumidores na página.

## Fase 903 — carregadores de obras publicadas

- Extraiu os carregadores de obras publicadas e por IDs para `profile-published-works-loader`.
- Manteve consultas Supabase, paginação, capítulos, fallbacks e todos os consumidores na página.

## Fase 904 — carregadores de coleções do usuário

- Extraiu os carregadores de IDs de obras, autores seguidos e registros do Diário para `profile-user-collections-loader`.
- Manteve filtros por usuário, paginação, normalização, fallbacks e consumidores na página.

## Fase 905 — carregadores de métricas e interações

- Extraiu os carregadores de totais de métricas e interações de capítulos para `profile-interactions-loader`.
- Manteve deduplicação, métricas, paginação por lotes, filtros por usuário, fallbacks e consumidores na página.

## Fase 906 — carregadores do estado de seguidores

- Extraiu as contagens e a leitura do estado de seguimento para `profile-follow-state-loader`.
- Manteve as consultas `seguindo_usuarios`, os fallbacks, o perfil próprio e o consumidor na página.

## Fase 907 — helpers de notificações sociais

- Extraiu a atualização local, remoção e criação de notificações para `profile-social-notifications-utils`.
- Manteve consultas, RPC, filtros, fallbacks, eventos e consumidores da página.

## Fase 908 — curtidas Supabase do Top 5

- Extraiu o carregamento e a persistência de curtidas para `profile-top-five-supabase-utils`.
- Manteve o fallback local, consultas, ordem de escrita e guardas de troca de identidade.

## Fase 909 — carregador da comunidade

- Extraiu `carregarComunidadePerfilSupabase` para `profile-community-loader`.
- Manteve consultas, contagens, normalização, filtro de classificação e consumidores.

## Fase 910 — sincronização de coleções do usuário

- Extraiu `sincronizarTabelaUsuario` e `sincronizarAutorSeguidoSupabase` para `profile-user-collections-sync`.
- Manteve autenticação, ordem delete/insert, payloads, visibilidade, upsert/delete de autores e fallbacks locais.

## Fase 911 — carregador do estado do usuário

- Extraiu `carregarEstadoUsuarioSupabase` para `profile-user-state-loader`.
- Manteve autenticação, carregamento paralelo das coleções, contrato de identidade confirmada e fallback de falha.

## Fase 912 — carregador do perfil público

- Extraiu `carregarPerfilUsuarioSupabase` para `profile-public-profile-loader`.
- Manteve validação de ID, consulta por `user_id` com fallback por `id`, campos, normalização e propagação de erros.

## Fase 913 — rota de login do perfil

- Extraiu `criarLoginHrefPerfilAutor` para `profile-login-route-utils`.
- Manteve pathname, query string, validação contra destino iniciado por `//`, fallback para `/perfil-autor` e serialização de `redirectTo`.

## Fase 914 — sincronização do nome do autor nas obras

- Extraiu `sincronizarNomeAutorObrasSupabase` para `profile-author-works-sync`.
- Manteve trim, validação de ID, atualização de `autor`/`atualizado_em`, filtro por `user_id` e tratamento de erros.

## Fase 915 — upload do avatar do perfil

- Extraiu `enviarAvatarPerfilUsuarioSupabase` para `profile-avatar-upload`.
- Manteve validação de ID, tipo MIME, caminho, bucket, cache, upsert, URL pública versionada e tratamento de erros do Storage.

## Fase 916 — persistência do perfil do usuário

- Extraiu `salvarPerfilUsuarioSupabase` para `profile-profile-persistence`.
- Manteve validação de ID, normalização de username, truncamento de bios, sanitização de avatar local, busca por `user_id`/`id`, update/insert e tratamento de erros.

## Fase 917 — carregador remoto do Diário

- Extraiu `carregarDiarioPerfilSupabase` para `profile-diary-loader`.
- Manteve coleções, resolução de capítulos sem obra, carregamento de obras faltantes, classificação 18+, privacidade, progresso, avaliações, reviews e limite de atividades.

## Fase 918 — verificação da sessão autenticada

- Extraiu `usuarioEstaLogado` para `profile-auth-session-utils`.
- Manteve `supabase.auth.getUser()`, retorno booleano e fallback `false` em falhas.

## Fase 919 — navegação das abas do perfil

- Extraiu `selecionarAbaPerfil` para `usePerfilAutorTabNavigation`.
- Manteve atualização do estado, query string, pathname, hash e `history.replaceState`.

## Fase 920 — ações de sessão do perfil

- Extraiu `avisarLoginNecessario` e `sairDaConta` para `usePerfilAutorSessionActions`.
- Manteve mensagem e redirect de login, fechamento do menu, `supabase.auth.signOut()`, redirect para `/login` e fallback de erro.

## Fase 921 — persistência local das obras da Biblioteca

- Extraiu `salvarObrasBibliotecaPerfil` para `usePerfilAutorLibraryStorageActions`.
- Manteve atualização imediata do estado, persistência por usuário e fallback em memória quando o localStorage falha.

## Fase 922 — ações do editor de avatar

- Extraiu `selecionarAvatarAutor` e `removerAvatarAutor` para `usePerfilAutorAvatarEditorActions`.
- Manteve validação de formato/tamanho, preview via FileReader, estados do editor, mensagens e limpeza do input.

## Fase 923 — fluxo genérico de compartilhamento

- Extraiu `compartilharLinkPerfilAutor` para `usePerfilAutorShareActions`.
- Manteve URL absoluta, Web Share, cancelamento, fallback de cópia e mensagens de sucesso/erro.

## Fase 924 — cópia do username do cabeçalho

- Moveu `copiarUsernameCabecalho` para `usePerfilAutorShareActions`.
- Manteve normalização com `@`, cópia com fallback e mensagem apenas quando a cópia falha.

## Fase 925 — compartilhamento do perfil

- Moveu `copiarLinkPerfil` para `usePerfilAutorShareActions`.
- Manteve fechamento do menu, nome/username do perfil, URL atual e mensagens do fluxo de compartilhamento.

## Fase 926 — compartilhamento de obras no perfil

- Moveu `compartilharObraPerfilAutor` para `usePerfilAutorShareActions`.
- Manteve fechamento do menu da obra, link existente ou fallback por slug, textos e mensagens do compartilhamento.

## Fase 927 — ações de denúncia do perfil

- Extraiu `abrirDenunciaPerfil` e `abrirDenunciaConteudoPerfil` para `usePerfilAutorReportActions`.
- Manteve guardas do perfil próprio, validação de IDs, fechamento dos menus, mensagens e preparação dos modais.

## Fase 928 — ações da seção Sobre

- Extraiu `atualizarBioSobreAutor` e `alternarDestaquesPerfil` para `usePerfilAutorAboutActions`.
- Manteve limite da bio Sobre, avatar/nome/bio atuais e alternância de destaques antes de delegar para `salvarPerfilAutor`.

## Fase 929 — abertura e fechamento do editor de perfil

- Extraiu `abrirEditorPerfil` e `fecharEditorPerfil` para `usePerfilAutorProfileEditorActions`.
- Manteve preenchimento dos campos, guardas de permissão/salvamento, fechamento do menu e limpeza do input de avatar.

## Fase 930 — favoritos e concluídas da Biblioteca

- Extraiu `alternarFavoritoObra` e `alternarConcluidoObra` para `usePerfilAutorLibraryCollectionActions`.
- Manteve autenticação, mensagens de login, normalização das coleções, localStorage, sincronização Supabase e incremento da versão da Biblioteca.

## Fase 931 — salvos e Quero ler da Biblioteca

- Moveu `alternarSalvoCapituloBibliotecaPerfil` e `alternarObraSeguindoBibliotecaPerfil` para `usePerfilAutorLibraryCollectionActions`.
- Manteve autenticação, atualização dos capítulos, localStorage, sincronização privada/pública, mensagens e versão da Biblioteca.

## Fase 932 — remoção de itens da Biblioteca

- Moveu `removerItemBibliotecaPerfil` para `usePerfilAutorLibraryCollectionActions`.
- Manteve a prioridade entre capítulo salvo, Quero ler, favoritas, concluídas e fallback para remoção do histórico, sem mover ainda o fluxo remoto do histórico.

## Fase 933 — remoção do histórico de leitura da Biblioteca

- Moveu `removerHistoricoLeituraBibliotecaPerfil` para `usePerfilAutorLibraryCollectionActions`.
- Manteve guarda de login, limpeza local da obra/capítulos, fallback de usuário, deletes de `progresso_leitura` e `diario_atividades`, tolerância a falhas remotas, mensagem e incremento da versão da Biblioteca.


## Fase 934 — avaliação do autor

- Moveu `avaliarAutor` para `usePerfilAutorRatingActions`.
- Manteve guardas de identidade/sessão, nota local, arredondamento em meias estrelas, upsert/delete em `autor_avaliacoes`, tratamento de falhas e estados da avaliação.


## Fase 935 — avaliação do Diário

- Extraiu `avaliarDiarioPerfil` para `usePerfilAutorDiaryRatingActions`.
- Manteve guardas de identidade/sessão, estado otimista, RPCs `salvar_avaliacao_diario`/`remover_avaliacao_diario`, normalização da resposta e rollback em falhas.


## Fase 936 — bloqueio de perfil

- Extraiu `alternarBloqueioPerfil` para `usePerfilAutorBlockActions`.
- Manteve validação de perfil/usuário, confirmação, bloqueio/desbloqueio, mensagens, limpeza do relacionamento e permissões após bloqueio.


## Fase 937 — seguimento de perfil

- Extraiu `alternarSeguirAutor` para `usePerfilAutorFollowActions`.
- Manteve autenticação, seguir/deixar de seguir/cancelar solicitação, contador de seguidores, notificações sociais e fallback local por autor.


## Fase 938 — atividade recente do Sobre

- Extraiu a composição de `renderizarAtividadeRecenteSobrePerfil` para `ProfileAboutRecentActivity`.
- Manteve abertura/fechamento, loading, estado vazio, limite de 8 itens, links e datas da timeline.


## Fase 939 — curtida do TOP 5

- Extraiu `alternarCurtidaTopFivePerfil` para `usePerfilAutorTopFiveLikeActions`.
- Manteve identidade da sessão, estado otimista, persistência local, escrita Supabase, recarga do estado remoto e proteção contra trocas de conta.


## Fase 940 — persistência do perfil

- Extraiu `salvarPerfilAutor` para `usePerfilAutorProfileSaveActions`.
- Manteve limites de bio/sobre, persistência local por usuário, atualização do perfil remoto e fallback de mensagem quando o Supabase falha.


## Fase 941 — salvamento do editor de perfil

- Extraiu `salvarEdicaoPerfilAutor` para `usePerfilAutorProfileEditorSaveActions`.
- Manteve validações de identidade, upload/remoção de avatar, persistência de perfil, metadados Auth, sincronização do nome nas obras, fallbacks locais e mensagens finais.


## Fase 942 — sincronização local do TOP 5

- Extraiu o `useEffect` de sincronização local do TOP 5 para `usePerfilAutorTopFiveStorageSync`.
- Manteve o carregamento inicial por timer e os listeners de `focus`, `storage` e `visibilitychange`, incluindo a limpeza no unmount.


## Fase 943 — sincronização das curtidas do TOP 5

- Extraiu o `useEffect` que combina estado local e Supabase das curtidas do TOP 5 para `usePerfilAutorTopFiveLikesSync`.
- Manteve fallback local imediato, leitura remota, cancelamento, timer inicial e listeners de `focus` e `storage`.

## Fase 944 — sincronização da privacidade do perfil

- Extraiu o `useEffect` de carregamento das permissões das abas para `usePerfilAutorPrivacySync`.
- Manteve fallback para IDs inválidos, permissões do próprio perfil, leitura remota para visitantes, recarga por relacionamento e cancelamento no unmount.

## Fase 945 — correção da aba visível

- Extraiu o `useEffect` que corrige a aba ativa quando ela deixa de estar visível para `usePerfilAutorVisibleTabSync`.
- Manteve a validação das cinco abas, o fallback para a primeira aba permitida, o timer assíncrono e a limpeza no unmount.

## Fase 946 — sincronização da Comunidade do perfil

- Extraiu o `useEffect` de carregamento da Comunidade para `usePerfilAutorCommunitySync`.
- Manteve fallback para aba oculta ou ID inválido, estado de carregamento, leitura Supabase, tratamento de erro, timer inicial e cancelamento no unmount.

## Fase 947 — sincronização do estado de bloqueio

- Extraiu o `useEffect` que carrega o estado de bloqueio entre perfis para `usePerfilAutorBlockStateSync`.
- Manteve fallback para perfil inválido, usuário ausente ou próprio perfil, leitura remota, timer inicial e cancelamento no unmount.

## Fase 948 — sincronização do estado de seguimento

- Extraiu o `useEffect` que combina contagens de seguidores e estado de relacionamento para `usePerfilAutorFollowStateSync`.
- Manteve fallback para perfil inválido, leitura paralela, normalização de próprio perfil/seguindo, atualização das contagens, timer inicial e cancelamento no unmount.

## Fase 949 — sincronização da avaliação do Diário

- Extraiu o `useEffect` que carrega a avaliação pública do Diário para `usePerfilAutorDiaryRatingSync`.
- Manteve fallbacks para perfil ausente e ID inválido, visibilidade do próprio perfil, RPC `carregar_avaliacao_diario`, normalização, timer inicial e cancelamento no unmount.

## Fase 950 — sincronização da avaliação do autor

- Extraiu o `useEffect` que combina fallback local e métricas remotas da avaliação do autor para `usePerfilAutorRatingSync`.
- Manteve limpeza da avaliação no próprio perfil, leitura de sessão, métricas remotas, proteção contra sobrescrever estado em salvamento, timer inicial e cancelamento no unmount.

## Fase 951 — redirecionamento para login

- Extraiu o `useEffect` de redirecionamento para autenticação para `usePerfilAutorLoginRedirect`.
- Manteve a guarda por `redirecionandoParaLogin`, o uso de `router.replace` e o helper seguro `criarLoginHrefPerfilAutor`.

## Fase 952 — sincronização dos totais de interações

- Extraiu o `useEffect` que carrega os totais reais de interações das obras para `usePerfilAutorInteractionTotalsSync`.
- Manteve fallback vazio para lista sem obras, leitura remota pelo loader e cancelamento antes de aplicar uma resposta obsoleta.

## Fase 953 — sincronização do contador de notificações

- Extraiu o `useEffect` do contador de notificações não lidas para `usePerfilAutorNotificationCountSync`.
- Manteve fallback para usuário inválido, consultas de notificações e solicitações, deduplicação, realtime, polling, foco/visibilidade, debounce e limpeza do canal.

## Fase 954 — sincronização do Diário do perfil

- Extraiu o `useEffect` que monta e carrega o Diário para `usePerfilAutorDiarySync`.
- Manteve seleção da fonte do Diário, inclusão de itens privados, fallback local, leitura remota, mesclagem, aplicação de permissões, timer inicial e cancelamento no unmount.

## Fase 955 — sincronização da identidade autenticada

- Extraiu o `useEffect` que acompanha a sessão e a troca de conta para `usePerfilAutorAuthIdentitySync`.
- Manteve limpeza completa do estado da conta anterior, leitura inicial com `getUser`, guarda por versão, `onAuthStateChange`, atualização exclusiva de `usuarioIdLogado` e cancelamento/unsubscribe no unmount.

## Fase 956 — carregamento principal do perfil

- Extraiu o último `useEffect` restante da página para `usePerfilAutorProfileLoadSync`.
- Manteve parâmetros de rota, guardas contra troca de conta, carregamento de obras/perfil/estado do usuário, mesclagem de interações, complementação da Biblioteca, persistência local e commit final do estado.
- A página `app/perfil-autor/page.tsx` deixa de conter `useEffect` diretamente; os efeitos passam a ficar delegados aos hooks especializados.

## Fase 957 — seleção da aba Biblioteca

- Extraiu a escolha dos itens ativos das seis abas da Biblioteca para `selecionarItensBibliotecaPerfil`.
- Preservou referências das listas individuais, ordem da mesclagem na aba Tudo e dependências do `useMemo`.
- Adicionou cobertura em `test:session`, sem alterar schema, RLS ou UI.

## Fase 958 — derivações visuais da Biblioteca

- Extraiu a busca do item com menu aberto e o rótulo da aba ativa para `profile-library-display-utils.ts`.
- Preservou exatamente as chaves, retornos nulos e textos exibidos.
- Adicionou testes unitários e registro em `test:session`, sem alterar UI, schema, RLS ou Supabase.

## Fase 959 — links da Comunidade

- Extraiu a composição dos links gerais, Teorias e Reviews da Comunidade para `criarLinksComunidadePerfilAutor`.
- Preservou codificação do nome do autor e fallbacks quando o nome está ausente.
- Adicionou cobertura unitária e registro em `test:session`, sem alterar UI, schema, RLS ou Supabase.


## Fase 960 — composição interna dos links da Comunidade

- Centralizou a codificação da busca em `criarBuscaComunidadePerfilAutor`.
- Separou a montagem dos links tipados de Teoria e Review sem alterar URLs ou fallbacks.
- Ampliou a cobertura unitária já registrada em `test:session`, sem alterar UI, schema, RLS ou Supabase.


## Fase 961 — payloads de compartilhamento

- Moveu a composição dos dados de compartilhamento de obra e perfil para `profile-sharing-utils`.
- Centralizou a normalização do username copiável e removeu formatação duplicada do hook.
- Preservou Web Share, fallback de cópia, textos, URLs e mensagens existentes.


## Fase 962 — visibilidade das abas do perfil

- Extraiu a derivação de bloqueio, permissões, primeira aba visível e estado de conteúdo privado para `obterVisibilidadeAbasPerfilAutor`.
- Preservou a prioridade das abas, a regra de carregamento de privacidade e a contagem sem Atividades.
- Adicionou cobertura unitária e registro em `test:session`, sem alterar UI, schema, RLS ou Supabase.


## Fase 963 — resolução do perfil exibido

- Extraiu a resolução por ID, nome, usuário logado e perfil remoto para `resolverEstadoPerfilAutor`.
- Preservou autor não encontrado, ausência de parâmetros, redirecionamento para login e identificação de perfil próprio.
- Adicionou cobertura unitária e registro em `test:session`, sem alterar UI, schema, RLS ou Supabase.


## Fase 964 — estado derivado de seguimento

- Extraiu a composição de chaves, fallback local, estado remoto, contagens e links de seguimento para `obterEstadoSeguimentoPerfilAutor`.
- Preservou o comportamento para IDs válidos, perfis locais, solicitações pendentes e perfil próprio.
- Adicionou cobertura unitária e registro em `test:session`, sem alterar UI, schema, RLS ou Supabase.


## Fase 965 — dados derivados de exibição do perfil

- Extraiu a seleção do perfil salvo, perfil remoto ativo, bios, avatar e handle para `obterDadosExibicaoPerfilAutor`.
- Preservou a prioridade entre dados locais/remotos, fallbacks de bio e detecção da bio padrão do leitor.
- Adicionou cobertura unitária e registro em `test:session`, sem alterar UI, schema, RLS ou Supabase.


## Fase 966 — estado derivado de avaliação

- Extraiu a escolha entre avaliação do autor e avaliação do Diário para `obterEstadoAvaliacaoPerfilAutor`.
- Preservou visibilidade privada, visibilidade do próprio perfil, fallback sem perfil e seleção do resumo exibido.
- Adicionou cobertura unitária e registro em `test:session`, sem alterar UI, schema, RLS ou Supabase.


## Fase 967 — exibição das obras do perfil

- Extraiu a filtragem 18+, ordenação por data e montagem do TOP 5 para `profile-work-display-utils.ts`.
- Preservou a ordem selecionada dos destaques, deduplicação, limite de cinco itens e acesso do próprio autor a conteúdo 18+.
- Adicionou cobertura comportamental e registro em `test:session`, sem alterar UI, schema, RLS ou Supabase.


## Fase 968 — total de obras concluídas

- Moveu o cálculo de obras concluídas do perfil para `obterTotalObrasConcluidasPerfilAutor` em `profile-work-display-utils.ts`.
- Preservou a combinação entre métricas remotas e fallback local, usando o maior valor por obra sem duplicar conclusão local.
- Ampliou a cobertura comportamental já registrada em `test:session`, sem alterar UI, schema, RLS ou Supabase.


## Fase 969 — montagem das listas da Biblioteca

- Extraiu a montagem das listas Quero ler, Lendo agora, Favoritas, Concluídas, Histórico e Salvos para `montarItensBibliotecaPerfilAutor`.
- Preservou a guarda de visibilidade, os prefixos, o filtro de atividades de leitura e a fonte dos capítulos salvos.
- Adicionou cobertura comportamental e registro em `test:session`, sem alterar UI, schema, RLS ou Supabase.


## Fase 970 — totais derivados da Biblioteca

- Extraiu os totais de obras seguidas e concluídas para `obterTotaisBibliotecaPerfilAutor`.
- Preservou os fallbacks entre obras carregadas, itens da Biblioteca e total remoto de concluídas.
- Adicionou cobertura comportamental e registro em `test:session`, sem alterar UI, schema, RLS ou Supabase.


## Fase 971 — resumo de estatísticas do perfil

- Extraiu gêneros principais, total de visualizações, rascunhos e obras sem capítulos para `obterResumoEstatisticasPerfilAutor`.
- Preservou ordenação por frequência, desempate alfabético, limite de cinco gêneros e normalização numérica.
- Adicionou cobertura comportamental e registro em `test:session`, sem alterar UI, schema, RLS ou Supabase.


## Fase 972 — consolidação da aba Tudo do Diário

- Extraiu a consolidação das listas do Diário para `montarItensDiarioTudoPerfil` em `profile-diary-merge-utils.ts`.
- Preservou deduplicação por obra, prioridade dos tipos, escolha do item mais recente, fallback por slug e ordenação por data.
- Ampliou a cobertura unitária já registrada em `test:session`, sem alterar UI, schema, RLS ou Supabase.


## Fase 973 — seleção da obra com menu aberto

- Extraiu a resolução da obra associada ao menu de ações para `obterObraMenuAbertaPerfilAutor`.
- Preservou seleção por ID exato, retorno nulo sem seleção e retorno nulo para obra inexistente.
- Ampliou a cobertura unitária já registrada em `test:session`, sem alterar UI, schema, RLS ou Supabase.


## Fase 974 — agrupamento de obras por autor

- Extraiu a montagem de `perfisAutores` para `montarPerfisAutoresPorObras` em `profile-author-groups.ts`.
- Preservou agrupamento por ID/nome normalizado, fallback de autor, totais de capítulos/publicadas/curtidas/comentários e ordenação alfabética.
- Adicionou cobertura unitária e registro em `test:session`, sem alterar UI, schema, RLS ou Supabase.
