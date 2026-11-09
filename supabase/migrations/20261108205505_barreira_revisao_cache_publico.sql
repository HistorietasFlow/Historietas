-- Fase 5B: paginas de snapshots publicos; sem DML, novos privilegios ou jobs.
begin;
set local search_path = '';

-- O proxy so precisa da existencia, nao deve transferir texto para decidir 404.
create function public.existe_capitulo_projecao_publica(p_slug text,p_numero integer)
returns boolean language sql stable security invoker set search_path = '' as $$
  select exists(select 1 from public.obras o
    join historietas_privado.obra_projecao_revisoes r on r.obra_id=o.id
    join public.capitulos c on c.obra_id=o.id and c.user_id=o.user_id
    where o.slug=p_slug and o.publicado and c.publicado and c.ordem=p_numero
      and o.classificacao_indicativa in ('Livre','10+','12+','14+','16+'));
$$;
revoke all on function public.existe_capitulo_projecao_publica(text,integer) from public,anon,authenticated,service_role;
grant execute on function public.existe_capitulo_projecao_publica(text,integer) to anon,authenticated;

-- Cada pagina traz dados e identidade/revisao no MESMO snapshot SQL. O leitor
-- exige a mesma versao em todas as paginas e confere a barreira depois do cache.
create function public.listar_capitulos_projecao_publica(
  p_slug text, p_geracao uuid, p_revisao text, p_inicio integer, p_limite integer
) returns jsonb language sql stable security invoker set search_path = '' as $$
  with obra as materialized (
    select o.id,o.user_id,o.link,r.geracao,r.revisao from public.obras o
    join historietas_privado.obra_projecao_revisoes r on r.obra_id=o.id
    where o.slug=p_slug and o.publicado
      and o.classificacao_indicativa in ('Livre','10+','12+','14+','16+')
      and r.geracao=p_geracao and r.revisao::text=p_revisao
      and p_inicio >= 0 and p_limite between 1 and 500
  ), paginas as materialized (
    select c.id,c.titulo,c.texto,c.ordem,c.publicado,c.visualizacoes,c.criado_em
    from public.capitulos c join obra o on o.id=c.obra_id and o.user_id=c.user_id
    where c.publicado order by c.ordem,c.id
    offset greatest(p_inicio,0) limit least(greatest(p_limite,1),500)
  )
  select jsonb_build_object('valida',exists(select 1 from obra),'link',(select link from obra),
    'capitulos',coalesce((select jsonb_agg(to_jsonb(p) order by p.ordem,p.id) from paginas p),'[]'::jsonb));
$$;
revoke all on function public.listar_capitulos_projecao_publica(text,uuid,text,integer,integer) from public,anon,authenticated,service_role;
grant execute on function public.listar_capitulos_projecao_publica(text,uuid,text,integer,integer) to anon,authenticated;

-- Manifesto paginado leve: sem textos e sem N+1. Duas coletas iguais cercam a
-- leitura do payload; revisoes monotonicas/geracoes impedem ABA e cache antigo.
create function public.listar_revisoes_sitemap_publico(p_depois_id uuid, p_limite integer)
returns table(id uuid,slug text,geracao uuid,revisao text,atualizado_em timestamptz,
  classificacao_indicativa text,publicado boolean)
language sql stable security invoker set search_path = '' as $$
  select o.id,o.slug,r.geracao,r.revisao::text,o.atualizado_em,o.classificacao_indicativa,o.publicado
  from public.obras o join historietas_privado.obra_projecao_revisoes r on r.obra_id=o.id
  where o.publicado and o.classificacao_indicativa in ('Livre','10+','12+','14+','16+')
    and (p_depois_id is null or o.id>p_depois_id) and p_limite between 1 and 500
  order by o.id limit least(greatest(p_limite,1),500);
$$;
revoke all on function public.listar_revisoes_sitemap_publico(uuid,integer) from public,anon,authenticated,service_role;
grant execute on function public.listar_revisoes_sitemap_publico(uuid,integer) to anon,authenticated;

-- Barreira agregada sem lock global nem transferencia de todo o manifesto em
-- cada hit. SHA-256 de identidades/geracoes/revisoes ordenadas detecta inclusive
-- exclusao, insercao e reutilizacao de slug (nao usar MAX(revisao)).
create function public.obter_revisao_sitemap_publico()
returns text language sql stable security invoker set search_path = '' as $$
  select encode(sha256(convert_to(coalesce(string_agg(
    o.id::text||':'||r.geracao::text||':'||r.revisao::text,E'\n' order by o.id),''),'UTF8')),'hex')
  from public.obras o join historietas_privado.obra_projecao_revisoes r on r.obra_id=o.id
  where o.publicado and o.classificacao_indicativa in ('Livre','10+','12+','14+','16+');
$$;
revoke all on function public.obter_revisao_sitemap_publico() from public,anon,authenticated,service_role;
grant execute on function public.obter_revisao_sitemap_publico() to anon,authenticated;

create function public.listar_capitulos_sitemap_publico(p_depois_id uuid,p_limite integer)
returns table(id uuid,obra_id uuid,ordem integer,atualizado_em timestamptz,publicado boolean,geracao uuid,revisao text)
language sql stable security invoker set search_path = '' as $$
  select c.id,c.obra_id,c.ordem,c.atualizado_em,c.publicado,r.geracao,r.revisao::text
  from public.capitulos c join public.obras o on o.id=c.obra_id and o.user_id=c.user_id
  join historietas_privado.obra_projecao_revisoes r on r.obra_id=o.id
  where c.publicado and o.publicado and o.classificacao_indicativa in ('Livre','10+','12+','14+','16+')
    and (p_depois_id is null or c.id>p_depois_id) and p_limite between 1 and 500
  order by c.id limit least(greatest(p_limite,1),500);
$$;
revoke all on function public.listar_capitulos_sitemap_publico(uuid,integer) from public,anon,authenticated,service_role;
grant execute on function public.listar_capitulos_sitemap_publico(uuid,integer) to anon,authenticated;
notify pgrst,'reload schema';
commit;
