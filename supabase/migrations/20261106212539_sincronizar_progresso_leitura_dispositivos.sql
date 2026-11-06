-- Evita que uma resposta atrasada de outro dispositivo sobrescreva um estado
-- de leitura mais recente. Registros lido=false funcionam como tombstones para
-- que uma marcacao antiga nao ressuscite depois de uma desmarcacao mais nova.
create or replace function public.salvar_progresso_leitura(
  p_obra_id uuid,
  p_capitulo_id uuid,
  p_lido boolean,
  p_progresso integer,
  p_ocorrido_em timestamptz
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_linhas_afetadas integer := 0;
  v_estado_atual boolean;
begin
  if v_user_id is null then
    raise exception using
      errcode = '42501',
      message = 'Autenticacao obrigatoria para salvar progresso de leitura.';
  end if;

  if p_obra_id is null or p_capitulo_id is null then
    raise exception using
      errcode = '22023',
      message = 'Obra e capitulo sao obrigatorios para salvar progresso de leitura.';
  end if;

  if p_progresso is null or p_progresso < 0 or p_progresso > 100 then
    raise exception using
      errcode = '22023',
      message = 'Progresso de leitura invalido.';
  end if;

  if p_ocorrido_em is null or not isfinite(p_ocorrido_em) then
    raise exception using
      errcode = '22023',
      message = 'Momento da alteracao de leitura invalido.';
  end if;

  insert into public.progresso_leitura (
    user_id,
    obra_id,
    capitulo_id,
    progresso,
    lido,
    atualizado_em
  )
  values (
    v_user_id,
    p_obra_id,
    p_capitulo_id,
    p_progresso,
    p_lido,
    p_ocorrido_em
  )
  on conflict (user_id, obra_id, capitulo_id)
  do update set
    progresso = excluded.progresso,
    lido = excluded.lido,
    atualizado_em = excluded.atualizado_em
  where public.progresso_leitura.atualizado_em <= excluded.atualizado_em;

  get diagnostics v_linhas_afetadas = row_count;

  if v_linhas_afetadas > 0 then
    return true;
  end if;

  select progresso.lido
    into v_estado_atual
  from public.progresso_leitura as progresso
  where progresso.user_id = v_user_id
    and progresso.obra_id = p_obra_id
    and progresso.capitulo_id = p_capitulo_id;

  return coalesce(v_estado_atual = p_lido, false);
end;
$$;

revoke all on function public.salvar_progresso_leitura(
  uuid,
  uuid,
  boolean,
  integer,
  timestamptz
) from public, anon;

grant execute on function public.salvar_progresso_leitura(
  uuid,
  uuid,
  boolean,
  integer,
  timestamptz
) to authenticated;

comment on function public.salvar_progresso_leitura(
  uuid,
  uuid,
  boolean,
  integer,
  timestamptz
) is
  'Salva progresso do usuario autenticado com ordenacao por momento da acao, preservando alteracoes mais recentes entre dispositivos.';
