begin;
set local lock_timeout = '5s';
set local statement_timeout = '30s';
set local search_path = '';

-- Histórias em Comum, fase 2: somente interesses explicitamente públicos.
-- O solicitante é sempre auth.uid(); não há parâmetro para um segundo terceiro.
-- Os dois lados precisam ter Biblioteca pública, mostrar favoritos e perfil público.
-- A RLS continua aplicável aos dois favoritos e às obras (SECURITY INVOKER).
-- Não retornar totais: apenas página de itens divulgáveis.
create function public.listar_historias_em_comum(
  p_outro_usuario uuid,
  p_apos_obra uuid default null,
  p_limite integer default 12
)
returns table (
  obra_id uuid,
  slug text,
  titulo text,
  autor text,
  capa_url text
)
language sql
stable
security invoker
set search_path = ''
as $func$
  with solicitante as materialized (
    select (select auth.uid()) as user_id
  ),
  publico_outro as materialized (
    select
      public.carregar_preferencias_privacidade_publicas(p_outro_usuario) as preferencias,
      public.carregar_estado_bloqueio_usuario(p_outro_usuario) as bloqueio
  )
  select
    obra.id,
    obra.slug,
    obra.titulo,
    obra.autor,
    obra.capa_url
  from solicitante
  join public.preferencias_privacidade propria_privacidade
    on propria_privacidade.user_id = solicitante.user_id
  cross join publico_outro
  join public.favoritos meu_favorito
    on meu_favorito.user_id = solicitante.user_id
    and meu_favorito.visibilidade = 'publico'
  join public.favoritos favorito_outro
    on favorito_outro.obra_id = meu_favorito.obra_id
    and favorito_outro.user_id = p_outro_usuario
    and favorito_outro.visibilidade = 'publico'
  join public.obras obra
    on obra.id = meu_favorito.obra_id
  where solicitante.user_id is not null
    and p_outro_usuario is not null
    and p_outro_usuario <> solicitante.user_id
    and p_limite between 1 and 20
    and propria_privacidade.visibilidade_biblioteca = 'publico'
    and propria_privacidade.mostrar_favoritos is true
    and propria_privacidade.perfil_privado is false
    and publico_outro.preferencias ->> 'visibilidade_biblioteca' = 'publico'
    and publico_outro.preferencias ->> 'perfil_privado' = 'false'
    and publico_outro.bloqueio ->> 'existeBloqueio' = 'false'
    and obra.publicado is true
    and obra.classificacao_indicativa in ('Livre', '10+', '12+', '14+', '16+')
    and (p_apos_obra is null or obra.id > p_apos_obra)
  order by obra.id asc
  limit least(greatest(coalesce(p_limite, 0), 0), 20);
$func$;

-- No Supabase, EXECUTE é público por padrão. Liberar só authenticated.
revoke all on function public.listar_historias_em_comum(uuid,uuid,integer)
  from public, anon, authenticated, service_role;
grant execute on function public.listar_historias_em_comum(uuid,uuid,integer)
  to authenticated;

comment on function public.listar_historias_em_comum(uuid,uuid,integer) is
  'Lista somente obras compartilhadas com favoritos públicos dos dois participantes, sem contagem total, com snapshot e RLS invoker; não revela Biblioteca ou perfil privado.';

notify pgrst, 'reload schema';
commit;
