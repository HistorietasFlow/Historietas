# Refatoração incremental — Listas

## Fase 816 — Modo desktop de Listas

- Extraiu `useListasDesktopMode` para `app/listas/hooks/use-listas-desktop-mode.ts`.
- Preservou o estado inicial `false`, o breakpoint de 1024 px, o timer inicial de 0 ms e os listeners moderno e legado.
- Manteve na página todos os 11 consumidores visuais de `isDesktop`, incluindo o sheet de comentários, drag, tabs e estilos responsivos.
