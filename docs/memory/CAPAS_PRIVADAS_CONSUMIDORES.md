# Inventário de consumidores e fronteiras de capas

Snapshot da base `98be8c31`, em 13/11/2026. Nenhum destes consumidores foi
migrado nesta preparação. A ativação depende de todos os caminhos relevantes
adotarem o discriminador privado sem fallback público.

## Mapa funcional e responsabilidade de integração

| Fluxo | Fronteiras e cuidados antes de ativar |
| --- | --- |
| Publicar / Editar Obra | Seleção/prévia blob local continua transitória; substituir envio público por portas privadas somente após PR 1/2. Persistir referência após recibo confirmado. Manter guard 18+ legado, termos, propriedade, CAS e recuperação. |
| Home / Explorar / Em Alta / Em Breve | RPCs/loaders/normalizadores, catálogo local e remoto, hero/cards e CSS recebem discriminador. Placeholder em falha privada; não preencher com `capa_url` ou obra local antiga. |
| Obra e Leitor | Snapshot/loader remoto e mescla local propagam identidade. Hero `next/image` e CSS exigem entrega controlada; otimização, preload e cache não podem contornar autorização. Leitor canônico e interno também transportam capa. |
| Metadata / redes sociais / JSON-LD | `obra-page-metadata-utils`, metadata de capítulo, páginas canônicas e `lib/cache/obrasPublicas` não podem materializar URL pública/assinada de asset privado. Omitir imagem até contrato específico da entrega; metadados públicos não são autorização de bytes. |
| Perfil / Top 5 / Listas / Diário / Seguindo | Normalizadores, caches, mesclas, itens salvos e renderizadores de cards/CSS mantêm modo privado mesmo com campo vazio/erro; evitar restauração da capa pública antiga por fallback. |
| Notificações | Loader e normalizadores mesclam `capa_url`, `capaUrl`, `capa` e valor existente. Preservar modo privado durante enriquecimento, evitando fallback do registro anterior. |
| Painel / Adicionar e Editar Capítulo | Conversores de obra e backups locais transportam capa; não tratá-la como URL/caminho removível. Card/painel usa entrega controlada. Exclusão de obra não autoriza remover asset privado apenas por prefixo do usuário. |
| Cache e persistência | Projeção/snapshot públicos, cache Next, `localStorage`, coleções/favoritos/backup/login precisam manter discriminador e versão. URL antiga persistida não é fallback aceitável para privado. Sem alteração das chaves/serialização nesta preparação. |
| Storage / quotas / exclusão de conta | Helpers legados geram URL pública; não aceitar referência privada nesses helpers. SQL ainda conta três buckets. Exclusão de conta/admin ainda inventaria três buckets; integrar evidência durável e retenção conservadora antes de habilitar privado. |

## Inventário de fontes

Busca reproduzível (inclui tipos, traduções, estilos e termos estáticos, além
dos consumidores executáveis):

```sh
rg -n -i --pcre2 'capa|(?<![a-z])cover' app components lib \
  --glob '*.{ts,tsx,mjs}' --glob '!lib/private-covers/**'
rg -n 'capas-obras|upload_storage_dentro_cota' supabase/migrations lib/server
```

As linhas abaixo são pontos de entrada do snapshot, não IDs estáveis nem prova
de migração. `cover` em estilo genérico e textos legais não implica leitura de
capa; estão incluídos para tornar o levantamento conservador. Revisar também
as dependências transitivas dos renderizadores ao integrar a entrega.

### `app/adicionar-capitulo`

| Arquivo | Primeiras linhas encontradas |
| --- | --- |
| [app/adicionar-capitulo/hooks/useAdicionarCapituloInitialLoad.ts](../../app/adicionar-capitulo/hooks/useAdicionarCapituloInitialLoad.ts) | 109 |
| [app/adicionar-capitulo/lib/adicionar-capitulo-local-work-storage.ts](../../app/adicionar-capitulo/lib/adicionar-capitulo-local-work-storage.ts) | 23 |
| [app/adicionar-capitulo/lib/adicionar-capitulo-notification-utils.ts](../../app/adicionar-capitulo/lib/adicionar-capitulo-notification-utils.ts) | 4, 8 |
| [app/adicionar-capitulo/lib/adicionar-capitulo-storage-preparation.ts](../../app/adicionar-capitulo/lib/adicionar-capitulo-storage-preparation.ts) | 2, 16 |
| [app/adicionar-capitulo/lib/adicionar-capitulo-supabase-work-normalizer.ts](../../app/adicionar-capitulo/lib/adicionar-capitulo-supabase-work-normalizer.ts) | 31, 32, 74, 75 … |
| [app/adicionar-capitulo/lib/adicionar-capitulo-work-normalizer.ts](../../app/adicionar-capitulo/lib/adicionar-capitulo-work-normalizer.ts) | 9, 77, 78 |
| [app/adicionar-capitulo/page.tsx](../../app/adicionar-capitulo/page.tsx) | 111 |

### `app/ajuda`

| Arquivo | Primeiras linhas encontradas |
| --- | --- |
| [app/ajuda/lib/ajuda-content.ts](../../app/ajuda/lib/ajuda-content.ts) | 207, 208, 212, 213 … |

### `app/comunidade`

| Arquivo | Primeiras linhas encontradas |
| --- | --- |
| [app/comunidade/components/community-comment-avatar.tsx](../../app/comunidade/components/community-comment-avatar.tsx) | 52 |
| [app/comunidade/components/community-comments-input-avatar.tsx](../../app/comunidade/components/community-comments-input-avatar.tsx) | 38 |
| [app/comunidade/components/community-post-author-avatar.tsx](../../app/comunidade/components/community-post-author-avatar.tsx) | 42 |
| [app/comunidade/components/community-posts-loader.ts](../../app/comunidade/components/community-posts-loader.ts) | 51, 96 |
| [app/comunidade/components/community-supabase-user-search.ts](../../app/comunidade/components/community-supabase-user-search.ts) | 7, 21 |
| [app/comunidade/components/community-user-search-avatar.tsx](../../app/comunidade/components/community-user-search-avatar.tsx) | 22 |

### `app/configuracoes`

| Arquivo | Primeiras linhas encontradas |
| --- | --- |
| [app/configuracoes/components/configuracoes-account-deletion-modal.tsx](../../app/configuracoes/components/configuracoes-account-deletion-modal.tsx) | 130, 131 |
| [app/configuracoes/lib/configuracoes-blocked-users-styles.ts](../../app/configuracoes/lib/configuracoes-blocked-users-styles.ts) | 24 |

### `app/diretrizes-da-comunidade`

| Arquivo | Primeiras linhas encontradas |
| --- | --- |
| [app/diretrizes-da-comunidade/lib/diretrizes-da-comunidade-content.ts](../../app/diretrizes-da-comunidade/lib/diretrizes-da-comunidade-content.ts) | 216, 361, 362, 378 … |

### `app/editar-capitulo`

| Arquivo | Primeiras linhas encontradas |
| --- | --- |
| [app/editar-capitulo/hooks/useEditarCapituloInitialLoad.ts](../../app/editar-capitulo/hooks/useEditarCapituloInitialLoad.ts) | 106 |
| [app/editar-capitulo/lib/editar-capitulo-supabase-mappers.ts](../../app/editar-capitulo/lib/editar-capitulo-supabase-mappers.ts) | 53, 54, 83, 84 … |
| [app/editar-capitulo/lib/editar-capitulo-work-normalizer.ts](../../app/editar-capitulo/lib/editar-capitulo-work-normalizer.ts) | 33, 34, 55, 56 … |

### `app/editar-obra`

| Arquivo | Primeiras linhas encontradas |
| --- | --- |
| [app/editar-obra/components/EditarObraAssetUploads.tsx](../../app/editar-obra/components/EditarObraAssetUploads.tsx) | 2, 16, 17, 18 … |
| [app/editar-obra/components/EditarObraLanguageBridge.tsx](../../app/editar-obra/components/EditarObraLanguageBridge.tsx) | 21, 22, 129, 138 … |
| [app/editar-obra/components/EditarObraPreview.tsx](../../app/editar-obra/components/EditarObraPreview.tsx) | 2, 7, 20, 37 … |
| [app/editar-obra/hooks/use-editar-obra-asset-actions.ts](../../app/editar-obra/hooks/use-editar-obra-asset-actions.ts) | 4, 15, 17, 18 … |
| [app/editar-obra/hooks/use-editar-obra-initial-load.ts](../../app/editar-obra/hooks/use-editar-obra-initial-load.ts) | 59, 60, 61, 62 … |
| [app/editar-obra/hooks/use-editar-obra-save-action.ts](../../app/editar-obra/hooks/use-editar-obra-save-action.ts) | 47, 48, 49, 50 … |
| [app/editar-obra/lib/editar-obra-cover-style-utils.ts](../../app/editar-obra/lib/editar-obra-cover-style-utils.ts) | 4, 5, 7, 8 … |
| [app/editar-obra/lib/editar-obra-current-assets-preparation.ts](../../app/editar-obra/lib/editar-obra-current-assets-preparation.ts) | 14, 15, 33, 34 … |
| [app/editar-obra/lib/editar-obra-form-config.ts](../../app/editar-obra/lib/editar-obra-form-config.ts) | 3 |
| [app/editar-obra/lib/editar-obra-form-preparation.ts](../../app/editar-obra/lib/editar-obra-form-preparation.ts) | 24, 25, 90, 91 |
| [app/editar-obra/lib/editar-obra-local-update.ts](../../app/editar-obra/lib/editar-obra-local-update.ts) | 17, 18, 33, 34 … |
| [app/editar-obra/lib/editar-obra-remote-storage.ts](../../app/editar-obra/lib/editar-obra-remote-storage.ts) | 10, 16, 50 |
| [app/editar-obra/lib/editar-obra-save-assets-preparation.ts](../../app/editar-obra/lib/editar-obra-save-assets-preparation.ts) | 14, 19, 20, 25 … |
| [app/editar-obra/lib/editar-obra-save-preparation.ts](../../app/editar-obra/lib/editar-obra-save-preparation.ts) | 38, 55 |
| [app/editar-obra/lib/editar-obra-save-work-ownership.ts](../../app/editar-obra/lib/editar-obra-save-work-ownership.ts) | 8, 9, 45 |
| [app/editar-obra/lib/editar-obra-storage-path-utils.ts](../../app/editar-obra/lib/editar-obra-storage-path-utils.ts) | 22 |
| [app/editar-obra/lib/editar-obra-storage-preparation.ts](../../app/editar-obra/lib/editar-obra-storage-preparation.ts) | 7, 13, 15, 24 |
| [app/editar-obra/lib/editar-obra-supabase-work-normalizer.ts](../../app/editar-obra/lib/editar-obra-supabase-work-normalizer.ts) | 45, 46, 74, 75 … |
| [app/editar-obra/lib/editar-obra-update-payload.ts](../../app/editar-obra/lib/editar-obra-update-payload.ts) | 18, 19, 33, 34 … |
| [app/editar-obra/lib/editar-obra-work-loader.ts](../../app/editar-obra/lib/editar-obra-work-loader.ts) | 16, 17, 38 |
| [app/editar-obra/lib/editar-obra-work-normalizer.ts](../../app/editar-obra/lib/editar-obra-work-normalizer.ts) | 24, 25, 99, 100 |
| [app/editar-obra/page.tsx](../../app/editar-obra/page.tsx) | 93, 94, 95, 96 … |
| [app/editar-obra/styles/editar-obra-page-css.ts](../../app/editar-obra/styles/editar-obra-page-css.ts) | 6, 30 |
| [app/editar-obra/types.ts](../../app/editar-obra/types.ts) | 36, 37 |

### `app/em-alta`

| Arquivo | Primeiras linhas encontradas |
| --- | --- |
| [app/em-alta/components/em-alta-ranking-card.tsx](../../app/em-alta/components/em-alta-ranking-card.tsx) | 114 |
| [app/em-alta/lib/em-alta-local-ranking-utils.ts](../../app/em-alta/lib/em-alta-local-ranking-utils.ts) | 104, 105 |
| [app/em-alta/lib/em-alta-models.ts](../../app/em-alta/lib/em-alta-models.ts) | 32, 33, 63, 64 … |
| [app/em-alta/lib/em-alta-ranking-position-theme.ts](../../app/em-alta/lib/em-alta-ranking-position-theme.ts) | 11, 13, 39, 41 … |
| [app/em-alta/lib/em-alta-ranking-visual-style-utils.ts](../../app/em-alta/lib/em-alta-ranking-visual-style-utils.ts) | 930, 936, 949, 955 … |
| [app/em-alta/lib/em-alta-supabase-work-normalizer.ts](../../app/em-alta/lib/em-alta-supabase-work-normalizer.ts) | 150, 151 |
| [app/em-alta/lib/em-alta-supabase-works-loader.ts](../../app/em-alta/lib/em-alta-supabase-works-loader.ts) | 51 |

### `app/em-breve`

| Arquivo | Primeiras linhas encontradas |
| --- | --- |
| [app/em-breve/lib/em-breve-styles.ts](../../app/em-breve/lib/em-breve-styles.ts) | 282, 541, 547, 548 |
| [app/em-breve/lib/em-breve-work-normalizers.ts](../../app/em-breve/lib/em-breve-work-normalizers.ts) | 11, 30, 56 |
| [app/em-breve/loaders/carregar-obras-reais-em-breve.ts](../../app/em-breve/loaders/carregar-obras-reais-em-breve.ts) | 23 |

### `app/excluir-conta`

| Arquivo | Primeiras linhas encontradas |
| --- | --- |
| [app/excluir-conta/page.tsx](../../app/excluir-conta/page.tsx) | 94 |

### `app/explorar`

| Arquivo | Primeiras linhas encontradas |
| --- | --- |
| [app/explorar/components/explorar-obra-publicada-card.tsx](../../app/explorar/components/explorar-obra-publicada-card.tsx) | 65, 66, 74 |
| [app/explorar/lib/explorar-content-styles.ts](../../app/explorar/lib/explorar-content-styles.ts) | 33, 39, 43, 49 … |
| [app/explorar/lib/explorar-derived-utils.ts](../../app/explorar/lib/explorar-derived-utils.ts) | 216 |
| [app/explorar/lib/explorar-remote-loader.ts](../../app/explorar/lib/explorar-remote-loader.ts) | 370 |
| [app/explorar/lib/explorar-work-normalizers.ts](../../app/explorar/lib/explorar-work-normalizers.ts) | 44, 45, 75, 76 … |

### `app/layout.tsx`

| Arquivo | Primeiras linhas encontradas |
| --- | --- |
| [app/layout.tsx](../../app/layout.tsx) | 64, 888, 899 |

### `app/ler-capitulo`

| Arquivo | Primeiras linhas encontradas |
| --- | --- |
| [app/ler-capitulo/components/ler-capitulo-comment-item.tsx](../../app/ler-capitulo/components/ler-capitulo-comment-item.tsx) | 84 |
| [app/ler-capitulo/lib/ler-capitulo-work-normalization.ts](../../app/ler-capitulo/lib/ler-capitulo-work-normalization.ts) | 39, 40, 63, 64 … |
| [app/ler-capitulo/lib/ler-capitulo-work-read-loader.ts](../../app/ler-capitulo/lib/ler-capitulo-work-read-loader.ts) | 21 |

### `app/lib`

| Arquivo | Primeiras linhas encontradas |
| --- | --- |
| [app/lib/home-author-card-styles.ts](../../app/lib/home-author-card-styles.ts) | 64 |
| [app/lib/home-author-list-utils.ts](../../app/lib/home-author-list-utils.ts) | 23 |
| [app/lib/home-catalog-utils.ts](../../app/lib/home-catalog-utils.ts) | 5, 6, 7, 13 … |
| [app/lib/home-cover-hero-style-utils.ts](../../app/lib/home-cover-hero-style-utils.ts) | 4, 8, 14, 23 … |
| [app/lib/home-discovery-utils.ts](../../app/lib/home-discovery-utils.ts) | 16, 43 |
| [app/lib/home-hero-favorite-action.ts](../../app/lib/home-hero-favorite-action.ts) | 35, 36, 50 |
| [app/lib/home-hero-selection-utils.ts](../../app/lib/home-hero-selection-utils.ts) | 20 |
| [app/lib/home-hero-view-utils.ts](../../app/lib/home-hero-view-utils.ts) | 20, 21, 22 |
| [app/lib/home-hero-visual-style-utils.ts](../../app/lib/home-hero-visual-style-utils.ts) | 25, 44 |
| [app/lib/home-hero-work-utils.ts](../../app/lib/home-hero-work-utils.ts) | 25, 51, 52, 74 … |
| [app/lib/home-local-work-list-utils.ts](../../app/lib/home-local-work-list-utils.ts) | 27 |
| [app/lib/home-local-work-normalizers.ts](../../app/lib/home-local-work-normalizers.ts) | 30, 31, 144, 145 |
| [app/lib/home-page-models.ts](../../app/lib/home-page-models.ts) | 32, 33, 34, 49 … |
| [app/lib/home-recommendation-list-utils.ts](../../app/lib/home-recommendation-list-utils.ts) | 29 |
| [app/lib/home-search-list-utils.ts](../../app/lib/home-search-list-utils.ts) | 17 |
| [app/lib/home-supabase-work-normalizers.ts](../../app/lib/home-supabase-work-normalizers.ts) | 29, 30, 55, 56 … |
| [app/lib/home-supabase-works-loader.ts](../../app/lib/home-supabase-works-loader.ts) | 35, 36, 61, 62 … |
| [app/lib/home-user-library-list-utils.ts](../../app/lib/home-user-library-list-utils.ts) | 31 |
| [app/lib/home-work-card-styles.ts](../../app/lib/home-work-card-styles.ts) | 56 |
| [app/lib/sitemap-public-xml.ts](../../app/lib/sitemap-public-xml.ts) | 3, 11, 12, 13 |

### `app/listas`

| Arquivo | Primeiras linhas encontradas |
| --- | --- |
| [app/listas/components/listas-profile-work-item.tsx](../../app/listas/components/listas-profile-work-item.tsx) | 68, 99, 143 |
| [app/listas/components/listas-profile-work-row.tsx](../../app/listas/components/listas-profile-work-row.tsx) | 24, 44, 60 |
| [app/listas/components/listas-public-work-row.tsx](../../app/listas/components/listas-public-work-row.tsx) | 15, 24, 34 |
| [app/listas/hooks/use-listas-page-renderers.tsx](../../app/listas/hooks/use-listas-page-renderers.tsx) | 7, 10, 13, 18 |
| [app/listas/hooks/use-listas-profile-item-renderer.tsx](../../app/listas/hooks/use-listas-profile-item-renderer.tsx) | 13, 118 |
| [app/listas/lib/listas-diary-comments-styles.ts](../../app/listas/lib/listas-diary-comments-styles.ts) | 11, 28 |
| [app/listas/lib/listas-profile-state-utils.ts](../../app/listas/lib/listas-profile-state-utils.ts) | 37, 89, 119 |
| [app/listas/lib/listas-public-catalog-loader.ts](../../app/listas/lib/listas-public-catalog-loader.ts) | 16 |
| [app/listas/lib/listas-published-works-loader.ts](../../app/listas/lib/listas-published-works-loader.ts) | 7 |
| [app/listas/lib/listas-row-media-utils.ts](../../app/listas/lib/listas-row-media-utils.ts) | 3, 11, 12, 37 … |
| [app/listas/page.tsx](../../app/listas/page.tsx) | 95, 549 |
| [app/listas/types.ts](../../app/listas/types.ts) | 50 |

### `app/notificacoes`

| Arquivo | Primeiras linhas encontradas |
| --- | --- |
| [app/notificacoes/lib/notificacoes-display-utils.ts](../../app/notificacoes/lib/notificacoes-display-utils.ts) | 27 |
| [app/notificacoes/lib/notificacoes-local-normalizers.ts](../../app/notificacoes/lib/notificacoes-local-normalizers.ts) | 96, 97 |
| [app/notificacoes/lib/notificacoes-models.ts](../../app/notificacoes/lib/notificacoes-models.ts) | 23, 24 |
| [app/notificacoes/lib/notificacoes-record-normalizers.ts](../../app/notificacoes/lib/notificacoes-record-normalizers.ts) | 42, 43, 136, 137 |
| [app/notificacoes/lib/notificacoes-supabase-work-loader.ts](../../app/notificacoes/lib/notificacoes-supabase-work-loader.ts) | 26, 122 |
| [app/notificacoes/lib/notificacoes-work-fallback-utils.ts](../../app/notificacoes/lib/notificacoes-work-fallback-utils.ts) | 102, 103 |

### `app/obra`

| Arquivo | Primeiras linhas encontradas |
| --- | --- |
| [app/obra/[slug]/ObraDinamicaClient.tsx](../../app/obra/[slug]/ObraDinamicaClient.tsx) | 47, 73, 83, 755 … |
| [app/obra/[slug]/capitulo/[numero]/lib/obra-chapter-metadata-utils.ts](../../app/obra/[slug]/capitulo/[numero]/lib/obra-chapter-metadata-utils.ts) | 34, 36 |
| [app/obra/[slug]/capitulo/[numero]/page.tsx](../../app/obra/[slug]/capitulo/[numero]/page.tsx) | 102 |
| [app/obra/[slug]/components/obra-comment-composer.tsx](../../app/obra/[slug]/components/obra-comment-composer.tsx) | 50 |
| [app/obra/[slug]/components/obra-comment-item.tsx](../../app/obra/[slug]/components/obra-comment-item.tsx) | 77 |
| [app/obra/[slug]/components/obra-hero-cover.tsx](../../app/obra/[slug]/components/obra-hero-cover.tsx) | 5, 6, 16, 17 … |
| [app/obra/[slug]/lib/obra-cover-utils.ts](../../app/obra/[slug]/lib/obra-cover-utils.ts) | 1, 2, 6, 11 … |
| [app/obra/[slug]/lib/obra-data-utils.ts](../../app/obra/[slug]/lib/obra-data-utils.ts) | 28, 29, 56, 57 … |
| [app/obra/[slug]/lib/obra-page-metadata-utils.ts](../../app/obra/[slug]/lib/obra-page-metadata-utils.ts) | 15, 29, 39, 49 … |
| [app/obra/[slug]/lib/obra-ssr-responsive-css.ts](../../app/obra/[slug]/lib/obra-ssr-responsive-css.ts) | 5, 20, 36 |
| [app/obra/[slug]/lib/obra-style-utils.ts](../../app/obra/[slug]/lib/obra-style-utils.ts) | 326, 334, 371, 1481 … |
| [app/obra/[slug]/lib/obra-supabase-work-utils.ts](../../app/obra/[slug]/lib/obra-supabase-work-utils.ts) | 7 |
| [app/obra/[slug]/page.tsx](../../app/obra/[slug]/page.tsx) | 39, 107 |

### `app/painel-autor`

| Arquivo | Primeiras linhas encontradas |
| --- | --- |
| [app/painel-autor/components/painel-autor-work-card.tsx](../../app/painel-autor/components/painel-autor-work-card.tsx) | 10, 12, 13, 80 … |
| [app/painel-autor/hooks/use-painel-autor-delete-work.ts](../../app/painel-autor/hooks/use-painel-autor-delete-work.ts) | 96, 104, 139, 140 … |
| [app/painel-autor/hooks/use-painel-autor-filter-state.ts](../../app/painel-autor/hooks/use-painel-autor-filter-state.ts) | 11, 28, 29 |
| [app/painel-autor/lib/painel-autor-cover-style-utils.ts](../../app/painel-autor/lib/painel-autor-cover-style-utils.ts) | 3, 12, 22, 23 … |
| [app/painel-autor/lib/painel-autor-deleted-work-storage-cleanup.ts](../../app/painel-autor/lib/painel-autor-deleted-work-storage-cleanup.ts) | 4 |
| [app/painel-autor/lib/painel-autor-file-storage-path-utils.ts](../../app/painel-autor/lib/painel-autor-file-storage-path-utils.ts) | 2 |
| [app/painel-autor/lib/painel-autor-supabase-work-converter.ts](../../app/painel-autor/lib/painel-autor-supabase-work-converter.ts) | 39, 40, 63, 64 … |
| [app/painel-autor/lib/painel-autor-supabase-works-loader.ts](../../app/painel-autor/lib/painel-autor-supabase-works-loader.ts) | 14, 15, 36 |
| [app/painel-autor/lib/painel-autor-types.ts](../../app/painel-autor/lib/painel-autor-types.ts) | 41, 42 |
| [app/painel-autor/lib/painel-autor-work-card-layout-style-utils.ts](../../app/painel-autor/lib/painel-autor-work-card-layout-style-utils.ts) | 37, 52 |
| [app/painel-autor/lib/painel-autor-work-filtering.ts](../../app/painel-autor/lib/painel-autor-work-filtering.ts) | 29, 72 |
| [app/painel-autor/lib/painel-autor-work-normalizer.ts](../../app/painel-autor/lib/painel-autor-work-normalizer.ts) | 18, 19, 48, 49 … |
| [app/painel-autor/page.tsx](../../app/painel-autor/page.tsx) | 99, 100, 293, 315 … |

### `app/perfil-autor`

| Arquivo | Primeiras linhas encontradas |
| --- | --- |
| [app/perfil-autor/components/diary-summary-card.tsx](../../app/perfil-autor/components/diary-summary-card.tsx) | 4, 23 |
| [app/perfil-autor/components/library-item-card.tsx](../../app/perfil-autor/components/library-item-card.tsx) | 4, 45 |
| [app/perfil-autor/components/profile-highlight-item.tsx](../../app/perfil-autor/components/profile-highlight-item.tsx) | 6, 12, 18 |
| [app/perfil-autor/components/profile-work-grid-item.tsx](../../app/perfil-autor/components/profile-work-grid-item.tsx) | 4, 5, 6, 7 … |
| [app/perfil-autor/hooks/use-perfil-autor-highlight-renderer.tsx](../../app/perfil-autor/hooks/use-perfil-autor-highlight-renderer.tsx) | 3, 15 |
| [app/perfil-autor/hooks/use-perfil-autor-work-item-renderer.tsx](../../app/perfil-autor/hooks/use-perfil-autor-work-item-renderer.tsx) | 6, 38 |
| [app/perfil-autor/lib/data-normalizers.ts](../../app/perfil-autor/lib/data-normalizers.ts) | 234, 235, 304, 305 |
| [app/perfil-autor/lib/profile-published-works-loader.ts](../../app/perfil-autor/lib/profile-published-works-loader.ts) | 26, 116 |
| [app/perfil-autor/lib/work-normalizers.ts](../../app/perfil-autor/lib/work-normalizers.ts) | 154, 155 |
| [app/perfil-autor/styles.ts](../../app/perfil-autor/styles.ts) | 261, 989, 1760, 2483 … |
| [app/perfil-autor/top-5/components/top5-selected-list.tsx](../../app/perfil-autor/top-5/components/top5-selected-list.tsx) | 10, 46 |
| [app/perfil-autor/top-5/components/top5-works-grid.tsx](../../app/perfil-autor/top-5/components/top5-works-grid.tsx) | 7, 49 |
| [app/perfil-autor/top-5/lib/top5-cover-styles.ts](../../app/perfil-autor/top-5/lib/top5-cover-styles.ts) | 15, 26, 27, 29 … |
| [app/perfil-autor/top-5/lib/top5-page-css.ts](../../app/perfil-autor/top-5/lib/top5-page-css.ts) | 6, 8, 16, 18 |
| [app/perfil-autor/top-5/lib/top5-supabase-works-loader.ts](../../app/perfil-autor/top-5/lib/top5-supabase-works-loader.ts) | 13 |
| [app/perfil-autor/top-5/lib/top5-types.ts](../../app/perfil-autor/top-5/lib/top5-types.ts) | 32, 33 |
| [app/perfil-autor/top-5/lib/top5-work-merge.ts](../../app/perfil-autor/top-5/lib/top5-work-merge.ts) | 24, 25 |
| [app/perfil-autor/top-5/lib/top5-work-normalizers.ts](../../app/perfil-autor/top-5/lib/top5-work-normalizers.ts) | 156, 157, 195, 196 |
| [app/perfil-autor/translations.tsx](../../app/perfil-autor/translations.tsx) | 1894 |
| [app/perfil-autor/types.ts](../../app/perfil-autor/types.ts) | 35, 36 |

### `app/politica-de-privacidade`

| Arquivo | Primeiras linhas encontradas |
| --- | --- |
| [app/politica-de-privacidade/lib/politica-de-privacidade-content.ts](../../app/politica-de-privacidade/lib/politica-de-privacidade-content.ts) | 162, 163 |

### `app/publicar`

| Arquivo | Primeiras linhas encontradas |
| --- | --- |
| [app/publicar/components/PublicarContentFileUpload.tsx](../../app/publicar/components/PublicarContentFileUpload.tsx) | 10, 11, 12, 169 … |
| [app/publicar/components/PublicarCoverUpload.tsx](../../app/publicar/components/PublicarCoverUpload.tsx) | 7, 8, 9, 25 … |
| [app/publicar/components/PublicarPublicationForm.tsx](../../app/publicar/components/PublicarPublicationForm.tsx) | 41, 42, 43, 44 … |
| [app/publicar/components/PublicarWorkPreview.tsx](../../app/publicar/components/PublicarWorkPreview.tsx) | 6, 56, 74, 95 … |
| [app/publicar/hooks/use-publicar-cover-upload.ts](../../app/publicar/hooks/use-publicar-cover-upload.ts) | 6, 15, 16, 17 … |
| [app/publicar/hooks/use-publicar-form-controller.ts](../../app/publicar/hooks/use-publicar-form-controller.ts) | 9, 32, 40, 69 … |
| [app/publicar/hooks/use-publicar-form-validation.ts](../../app/publicar/hooks/use-publicar-form-validation.ts) | 28, 46, 141 |
| [app/publicar/lib/publicar-form-upload-styles.ts](../../app/publicar/lib/publicar-form-upload-styles.ts) | 101, 108, 117, 281 … |
| [app/publicar/lib/publicar-local-work-utils.ts](../../app/publicar/lib/publicar-local-work-utils.ts) | 123, 124, 171 |
| [app/publicar/lib/publicar-models.ts](../../app/publicar/lib/publicar-models.ts) | 35, 36, 60 |
| [app/publicar/lib/publicar-preview-styles.ts](../../app/publicar/lib/publicar-preview-styles.ts) | 127, 136, 137, 144 … |
| [app/publicar/lib/publicar-static-options.ts](../../app/publicar/lib/publicar-static-options.ts) | 5 |
| [app/publicar/lib/publicar-storage-operations.ts](../../app/publicar/lib/publicar-storage-operations.ts) | 11, 38 |
| [app/publicar/lib/publicar-submission-action.ts](../../app/publicar/lib/publicar-submission-action.ts) | 43, 44, 72, 73 … |
| [app/publicar/lib/publicar-translations.ts](../../app/publicar/lib/publicar-translations.ts) | 12, 13, 14, 74 … |
| [app/publicar/page.tsx](../../app/publicar/page.tsx) | 73, 74, 75, 76 … |

### `app/seguindo`

| Arquivo | Primeiras linhas encontradas |
| --- | --- |
| [app/seguindo/components/seguindo-work-card.tsx](../../app/seguindo/components/seguindo-work-card.tsx) | 16, 55 |
| [app/seguindo/lib/seguindo-card-base-styles.ts](../../app/seguindo/lib/seguindo-card-base-styles.ts) | 33, 44, 54 |
| [app/seguindo/lib/seguindo-image-style-utils.ts](../../app/seguindo/lib/seguindo-image-style-utils.ts) | 20, 28, 31, 37 … |
| [app/seguindo/lib/seguindo-page-types.ts](../../app/seguindo/lib/seguindo-page-types.ts) | 24, 25 |
| [app/seguindo/lib/seguindo-saved-work-utils.ts](../../app/seguindo/lib/seguindo-saved-work-utils.ts) | 98, 99 |
| [app/seguindo/lib/seguindo-work-converter-utils.ts](../../app/seguindo/lib/seguindo-work-converter-utils.ts) | 33, 34, 62, 63 … |
| [app/seguindo/lib/seguindo-work-presentation-utils.ts](../../app/seguindo/lib/seguindo-work-presentation-utils.ts) | 12, 41 |
| [app/seguindo/lib/seguindo-work-query-utils.ts](../../app/seguindo/lib/seguindo-work-query-utils.ts) | 131, 132, 159 |

### `app/termos-de-uso`

| Arquivo | Primeiras linhas encontradas |
| --- | --- |
| [app/termos-de-uso/lib/termos-de-uso-content.ts](../../app/termos-de-uso/lib/termos-de-uso-content.ts) | 125, 126, 127, 141 … |

### `components`

| Arquivo | Primeiras linhas encontradas |
| --- | --- |
| [components/HomeCatalogWorkCard.tsx](../../components/HomeCatalogWorkCard.tsx) | 12, 45, 46, 50 |
| [components/HomeHero.tsx](../../components/HomeHero.tsx) | 62 |
| [components/HomeLocalWorkCard.tsx](../../components/HomeLocalWorkCard.tsx) | 6, 24, 65, 117 … |

### `lib`

| Arquivo | Primeiras linhas encontradas |
| --- | --- |
| [lib/cache/obrasPublicas.ts](../../lib/cache/obrasPublicas.ts) | 21, 54, 68, 69 … |
| [lib/server/exclusaoConta.ts](../../lib/server/exclusaoConta.ts) | 6 |
| [lib/storageUploads.ts](../../lib/storageUploads.ts) | 3, 10 |
| [lib/supabase/database.types.ts](../../lib/supabase/database.types.ts) | 1317, 1318, 1343, 1344 … |

## Banco e configurações fora do inventário TypeScript

- `supabase/migrations/20260806000400_storage_baseline.sql`: bucket público legado.
- `20260826162505_proteger_storage_contra_esgotamento_cota.sql`: limites e policies de quotas.
- `20261104225029_restringir_listagem_storage_ao_proprietario.sql`: listagem não protege URL pública.
- `20261107235846_reservar_capacidade_capitulos_ilustrados.sql` e
  `20261108012821_registrar_tentativas_upload_ilustrado.sql`: ledger e holds, ainda três buckets.
- Projeção/snapshot públicos e RPCs do catálogo nas migrations: contrato de campo de capa ainda legado.
- `next.config.ts`: remotePatterns/otimizador devem ser reavaliados pela entrega;
  configuração de host permitida não equivale a autorização por obra.
- `lib/server/exclusaoConta.ts`: inventário e limpeza administrativos; não remover
  evidência/holds por logout, expiração ou cascata.

Contrato e bloqueadores completos em [CAPAS_PRIVADAS_INTEGRACAO.md](CAPAS_PRIVADAS_INTEGRACAO.md).
