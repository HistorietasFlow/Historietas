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
