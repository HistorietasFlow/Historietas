-- 20260730000200_moderacao_exclusao_transacional.sql
-- Exclui o conteúdo denunciado e resolve as denúncias correspondentes
-- dentro da mesma transação do PostgreSQL.

begin;

-- ============================================================
-- PRÉ-REQUISITOS
-- ============================================================

do $migration$
declare
  v_tabela text;
begin
  foreach v_tabela in array array[
    'comunidade_denuncias',
    'comunidade_posts',
    'comunidade_comentarios',
    'comentarios_capitulos',
    'obras',
    'capitulos',
    'comentarios_obras',
    'diario_anotacoes',
    'diario_anotacao_comentarios'
  ]
  loop
    if to_regclass(format('public.%I', v_tabela)) is null then
      raise exception
        'A tabela public.% precisa existir antes desta migration.',
        v_tabela;
    end if;
  end loop;

  if to_regprocedure('public.usuario_e_admin()') is null then
    raise exception
      'A função public.usuario_e_admin() precisa existir antes desta migration.';
  end if;
end
$migration$;

-- ============================================================
-- EXCLUSÃO E RESOLUÇÃO ATÔMICAS
-- ============================================================

create or replace function public.remover_conteudo_denunciado_transacional(
  p_alvo_tipo text,
  p_alvo_id uuid,
  p_observacao_admin text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, auth, pg_temp
as $function$
declare
  v_moderador_id uuid := auth.uid();
  v_tipo text := lower(btrim(coalesce(p_alvo_tipo, '')));
  v_observacao text := btrim(coalesce(p_observacao_admin, ''));
  v_conteudos_removidos integer := 0;
  v_denuncias_resolvidas integer := 0;
  v_analisado_em timestamptz := now();
begin
  if v_moderador_id is null
    or not coalesce(public.usuario_e_admin(), false)
  then
    raise exception
      'Somente administradores e moderadores podem remover conteúdo denunciado.'
      using errcode = '42501';
  end if;

  if p_alvo_id is null then
    raise exception
      'O conteúdo denunciado não possui um identificador válido.'
      using errcode = '22023';
  end if;

  if v_tipo not in (
    'post',
    'comentario',
    'comentario_capitulo',
    'obra',
    'capitulo',
    'comentario_obra',
    'diario_anotacao',
    'comentario_diario'
  ) then
    raise exception
      'Tipo de conteúdo denunciado inválido: %.',
      coalesce(nullif(v_tipo, ''), '(vazio)')
      using errcode = '22023';
  end if;

  if char_length(v_observacao) > 1200 then
    raise exception
      'A observação administrativa pode ter no máximo 1200 caracteres.'
      using errcode = '22001';
  end if;

  case v_tipo
    when 'post' then
      delete from public.comunidade_posts
      where id = p_alvo_id;

    when 'comentario' then
      delete from public.comunidade_comentarios
      where id = p_alvo_id;

    when 'comentario_capitulo' then
      delete from public.comentarios_capitulos
      where id = p_alvo_id;

    when 'obra' then
      delete from public.obras
      where id = p_alvo_id;

    when 'capitulo' then
      delete from public.capitulos
      where id = p_alvo_id;

    when 'comentario_obra' then
      delete from public.comentarios_obras
      where id = p_alvo_id;

    when 'diario_anotacao' then
      delete from public.diario_anotacoes
      where id = p_alvo_id;

    when 'comentario_diario' then
      delete from public.diario_anotacao_comentarios
      where id = p_alvo_id;
  end case;

  get diagnostics v_conteudos_removidos = row_count;

  if v_conteudos_removidos <> 1 then
    raise exception
      'O conteúdo não foi encontrado ou o banco recusou a remoção.'
      using errcode = 'P0002';
  end if;

  update public.comunidade_denuncias
  set
    status = 'resolvida',
    observacao_admin = v_observacao,
    analisado_por = v_moderador_id,
    analisado_em = v_analisado_em,
    atualizado_em = v_analisado_em
  where alvo_tipo = v_tipo
    and alvo_id::text = p_alvo_id::text;

  get diagnostics v_denuncias_resolvidas = row_count;

  if v_denuncias_resolvidas < 1 then
    raise exception
      'Nenhuma denúncia correspondente foi encontrada para resolução.'
      using errcode = 'P0002';
  end if;

  return jsonb_build_object(
    'alvo_tipo', v_tipo,
    'alvo_id', p_alvo_id,
    'conteudos_removidos', v_conteudos_removidos,
    'denuncias_resolvidas', v_denuncias_resolvidas,
    'analisado_por', v_moderador_id,
    'analisado_em', v_analisado_em
  );
end;
$function$;

comment on function public.remover_conteudo_denunciado_transacional(
  text,
  uuid,
  text
) is
  'Remove um conteúdo denunciado e resolve suas denúncias em uma única transação.';

revoke all
  on function public.remover_conteudo_denunciado_transacional(
    text,
    uuid,
    text
  )
  from public, anon, authenticated;

grant execute
  on function public.remover_conteudo_denunciado_transacional(
    text,
    uuid,
    text
  )
  to authenticated;

commit;