create or replace function public.remover_conteudo_denunciado_transacional(
  p_alvo_tipo text,
  p_alvo_id uuid,
  p_observacao_admin text default ''::text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, auth, pg_temp
as $$
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
      'Somente administradores e moderadores podem remover conteudo denunciado.'
      using errcode = '42501';
  end if;

  if p_alvo_id is null then
    raise exception
      'O conteudo denunciado nao possui um identificador valido.'
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
      'Tipo de conteudo denunciado invalido: %.',
      coalesce(nullif(v_tipo, ''), '(vazio)')
      using errcode = '22023';
  end if;

  if char_length(v_observacao) > 1200 then
    raise exception
      'A observacao administrativa pode ter no maximo 1200 caracteres.'
      using errcode = '22001';
  end if;

  -- A remocao so pode ser autorizada por denuncia ativa e nao arquivada.
  -- FOR UPDATE serializa tentativas concorrentes sobre o mesmo alvo.
  perform 1
  from public.comunidade_denuncias denuncia
  where denuncia.alvo_tipo = v_tipo
    and denuncia.alvo_id::text = p_alvo_id::text
    and denuncia.status in ('pendente', 'em_analise')
    and not coalesce(denuncia.arquivada, false)
  for update;

  if not found then
    raise exception
      'Nenhuma denuncia ativa e nao arquivada foi encontrada para este conteudo.'
      using errcode = 'P0002';
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
      'O conteudo nao foi encontrado ou o banco recusou a remocao.'
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
    and alvo_id::text = p_alvo_id::text
    and status in ('pendente', 'em_analise')
    and not coalesce(arquivada, false);

  get diagnostics v_denuncias_resolvidas = row_count;

  if v_denuncias_resolvidas < 1 then
    raise exception
      'Nenhuma denuncia ativa e nao arquivada foi encontrada para resolucao.'
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
$$;

revoke all on function public.remover_conteudo_denunciado_transacional(
  text,
  uuid,
  text
) from public;

grant execute on function public.remover_conteudo_denunciado_transacional(
  text,
  uuid,
  text
) to authenticated;

comment on function public.remover_conteudo_denunciado_transacional(
  text,
  uuid,
  text
) is
  'Remove conteudo somente quando existe denuncia ativa e nao arquivada, resolvendo as denuncias ativas correspondentes na mesma transacao.';