-- ETAPA 3: helper administrativo de menor privilegio para auditar capas 18+.
-- Nao concede SELECT direto em public.obras para service_role.
-- A funcao retorna somente as obras 18+ que ainda possuem capa_url preenchida.

create or replace function public.listar_capas_obras_18_bloqueadas_admin()
returns table (
  obra_id uuid,
  user_id uuid,
  capa_url text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    o.id as obra_id,
    o.user_id,
    btrim(coalesce(o.capa_url, '')) as capa_url
  from public.obras as o
  where btrim(coalesce(o.classificacao_indicativa, '')) = '18+'
    and btrim(coalesce(o.capa_url, '')) <> ''
  order by o.id;
$$;

revoke all on function public.listar_capas_obras_18_bloqueadas_admin()
from public;

revoke all on function public.listar_capas_obras_18_bloqueadas_admin()
from anon;

revoke all on function public.listar_capas_obras_18_bloqueadas_admin()
from authenticated;

grant execute on function public.listar_capas_obras_18_bloqueadas_admin()
to service_role;

comment on function public.listar_capas_obras_18_bloqueadas_admin()
is 'Helper administrativo restrito a service_role para listar somente IDs, proprietarios e capa_url de obras 18+ durante o bloqueio global. Nao concede SELECT direto em public.obras.';
