-- ETAPA 3: remove o helper administrativo temporario usado apenas
-- para auditar capas de obras 18+ durante o bloqueio global.

drop function if exists public.listar_capas_obras_18_bloqueadas_admin();
