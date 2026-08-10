begin;

create or replace function public.comunidade_enquete_resultados(
  p_post_ids uuid[]
)
returns table(
  post_id uuid,
  opcao text,
  total bigint,
  meu_voto boolean
)
language sql
stable
security definer
set search_path to 'pg_catalog', 'public', 'auth', 'pg_temp'
as $$
  select
    v.post_id,
    v.opcao,
    count(*)::bigint as total,
    bool_or(v.user_id = auth.uid()) as meu_voto
  from public.comunidade_enquete_votos v
  where v.post_id = any(p_post_ids)
    and public.comunidade_pode_ver_post(v.post_id)
  group by v.post_id, v.opcao
  order by v.post_id, v.opcao;
$$;

revoke all on function public.comunidade_enquete_resultados(uuid[])
  from public, anon;

grant execute on function public.comunidade_enquete_resultados(uuid[])
  to authenticated;

comment on function public.comunidade_enquete_resultados(uuid[]) is
  'Retorna resultados de enquetes somente para posts visiveis ao usuario atual.';

commit;
