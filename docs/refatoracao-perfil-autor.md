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
