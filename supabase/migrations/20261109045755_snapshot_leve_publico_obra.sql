-- Fase 5C2A: contrato aditivo de leitura; ainda sem consumidor SSR/cliente.
begin;
set local search_path = '';

create function public.listar_capitulos_leves_projecao_publica(
  p_slug text, p_geracao uuid, p_revisao text,
  p_depois_ordem integer, p_depois_id uuid, p_limite integer
) returns jsonb language sql stable security invoker set search_path = '' as $$
  with obra as materialized (
    select o.id,o.slug,o.user_id,o.arquivo_url,o.arquivo_nome,o.arquivo_tipo,
      o.arquivo_tamanho,o.arquivo_categoria,r.geracao,r.revisao
    from public.obras o
    join historietas_privado.obra_projecao_revisoes r on r.obra_id=o.id
    where o.slug=p_slug and o.publicado
      and o.classificacao_indicativa in ('Livre','10+','12+','14+','16+')
      and r.geracao=p_geracao and r.revisao::text=p_revisao
      and p_limite between 1 and 500
      and ((p_depois_ordem is null and p_depois_id is null)
        or (p_depois_ordem >= 1 and p_depois_id is not null))
  ), paginas as materialized (
    select c.id,c.ordem,c.titulo,c.tipo_conteudo,c.criado_em,c.atualizado_em
    from public.capitulos c join obra o on o.id=c.obra_id and o.user_id=c.user_id
    where c.publicado and c.ordem >= 1
      and (p_depois_ordem is null or (c.ordem,c.id) > (p_depois_ordem,p_depois_id))
    order by c.ordem,c.id limit least(greatest(p_limite,1),500)
  )
  select jsonb_build_object(
    'valida',exists(select 1 from obra),
    'obraId',(select id from obra),'slug',(select slug from obra),
    'geracao',(select geracao from obra),'revisao',(select revisao::text from obra),
    -- Apenas metadados de exibicao. Caminho, bytes e URL assinada ficam fora.
    -- A autorizacao de acesso continua exclusivamente no assinador legado.
    'anexo',(select case when nullif(btrim(arquivo_url),'') is not null then
      jsonb_build_object('nome',arquivo_nome,'tipo',arquivo_tipo,
        'tamanho',arquivo_tamanho,'categoria',arquivo_categoria) else null end from obra),
    'capitulos',coalesce((select jsonb_agg(to_jsonb(p) order by p.ordem,p.id) from paginas p),'[]'::jsonb)
  );
$$;
revoke all on function public.listar_capitulos_leves_projecao_publica(text,uuid,text,integer,uuid,integer)
  from public,anon,authenticated,service_role;
grant execute on function public.listar_capitulos_leves_projecao_publica(text,uuid,text,integer,uuid,integer)
  to anon,authenticated;
comment on function public.listar_capitulos_leves_projecao_publica(text,uuid,text,integer,uuid,integer) is
  'Lista publica leve por cursor e revisao no mesmo snapshot. Invoker/RLS, sem textos, caminhos, URLs assinadas ou acesso a drafts/18+. Nao ativa reconciliacao cliente.';
notify pgrst, 'reload schema';
commit;
