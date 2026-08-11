begin;

create or replace function public.bloquear_avaliacao_autor_usuarios_bloqueados()
returns trigger
language plpgsql
security definer
set search_path to 'pg_catalog', 'public', 'auth', 'pg_temp'
as $$
begin
  if new.autor_id = new.user_id then
    raise exception 'Um usuario nao pode avaliar o proprio perfil.'
      using errcode = '42501';
  end if;

  if exists (
    select 1
    from public.usuarios_bloqueados bloqueio
    where (
      bloqueio.bloqueador_id = new.user_id
      and bloqueio.bloqueado_id = new.autor_id
    )
    or (
      bloqueio.bloqueador_id = new.autor_id
      and bloqueio.bloqueado_id = new.user_id
    )
  ) then
    raise exception 'Nao e permitido avaliar um usuario quando existe bloqueio entre os perfis.'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

revoke all on function public.bloquear_avaliacao_autor_usuarios_bloqueados() from public;
revoke all on function public.bloquear_avaliacao_autor_usuarios_bloqueados() from anon;
revoke all on function public.bloquear_avaliacao_autor_usuarios_bloqueados() from authenticated;

drop trigger if exists bloquear_avaliacao_autor_usuarios_bloqueados
  on public.autor_avaliacoes;

create trigger bloquear_avaliacao_autor_usuarios_bloqueados
before insert or update
on public.autor_avaliacoes
for each row
execute function public.bloquear_avaliacao_autor_usuarios_bloqueados();

delete from public.autor_avaliacoes avaliacao
where exists (
  select 1
  from public.usuarios_bloqueados bloqueio
  where (
    bloqueio.bloqueador_id = avaliacao.user_id
    and bloqueio.bloqueado_id = avaliacao.autor_id
  )
  or (
    bloqueio.bloqueador_id = avaliacao.autor_id
    and bloqueio.bloqueado_id = avaliacao.user_id
  )
);

create or replace function public.bloquear_usuario(p_bloqueado_id uuid)
returns boolean
language plpgsql
security definer
set search_path to 'pg_catalog', 'public', 'auth', 'pg_temp'
as $$
declare
  v_bloqueador_id uuid := auth.uid();
begin
  if v_bloqueador_id is null then
    raise exception 'Entre na sua conta para bloquear este usuario.'
      using errcode = '42501';
  end if;

  if p_bloqueado_id is null then
    raise exception 'Usuario invalido.'
      using errcode = '22023';
  end if;

  if v_bloqueador_id = p_bloqueado_id then
    raise exception 'Voce nao pode bloquear o proprio perfil.'
      using errcode = '22023';
  end if;

  if not exists (
    select 1
    from auth.users usuario
    where usuario.id = p_bloqueado_id
  ) then
    raise exception 'Usuario nao encontrado.'
      using errcode = 'P0002';
  end if;

  insert into public.usuarios_bloqueados (
    bloqueador_id,
    bloqueado_id
  )
  values (
    v_bloqueador_id,
    p_bloqueado_id
  )
  on conflict (bloqueador_id, bloqueado_id)
  do nothing;

  delete from public.seguindo_usuarios relacao
  where (
    relacao.seguidor_id = v_bloqueador_id
    and relacao.seguido_id = p_bloqueado_id
  )
  or (
    relacao.seguidor_id = p_bloqueado_id
    and relacao.seguido_id = v_bloqueador_id
  );

  delete from public.solicitacoes_seguidores solicitacao
  where (
    solicitacao.solicitante_id = v_bloqueador_id
    and solicitacao.destinatario_id = p_bloqueado_id
  )
  or (
    solicitacao.solicitante_id = p_bloqueado_id
    and solicitacao.destinatario_id = v_bloqueador_id
  );

  delete from public.autor_avaliacoes avaliacao
  where (
    avaliacao.user_id = v_bloqueador_id
    and avaliacao.autor_id = p_bloqueado_id
  )
  or (
    avaliacao.user_id = p_bloqueado_id
    and avaliacao.autor_id = v_bloqueador_id
  );

  return true;
end;
$$;

revoke all on function public.bloquear_usuario(uuid) from public;
revoke all on function public.bloquear_usuario(uuid) from anon;
grant execute on function public.bloquear_usuario(uuid) to authenticated;

commit;
