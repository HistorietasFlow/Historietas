-- Aceite obrigatório dos Termos, Diretrizes e ciência da Política de Privacidade.
-- A versão deve ser atualizada sempre que houver mudança material nos documentos.

begin;

alter table public.profiles
  add column if not exists termos_uso_versao text,
  add column if not exists termos_uso_aceitos_em timestamptz,
  add column if not exists diretrizes_comunidade_versao text,
  add column if not exists diretrizes_comunidade_aceitas_em timestamptz,
  add column if not exists politica_privacidade_versao text,
  add column if not exists politica_privacidade_ciente_em timestamptz;

comment on column public.profiles.termos_uso_versao is
  'Versão dos Termos de Uso aceita pelo usuário.';
comment on column public.profiles.termos_uso_aceitos_em is
  'Data e hora em que o usuário aceitou os Termos de Uso.';
comment on column public.profiles.diretrizes_comunidade_versao is
  'Versão das Diretrizes da Comunidade aceita pelo usuário.';
comment on column public.profiles.diretrizes_comunidade_aceitas_em is
  'Data e hora em que o usuário aceitou as Diretrizes da Comunidade.';
comment on column public.profiles.politica_privacidade_versao is
  'Versão da Política de Privacidade apresentada ao usuário.';
comment on column public.profiles.politica_privacidade_ciente_em is
  'Data e hora em que o usuário confirmou ciência da Política de Privacidade.';

create or replace function public.usuario_aceitou_termos_publicacao(
  p_user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.profiles perfil
    where (perfil.user_id = p_user_id or perfil.id = p_user_id)
      and perfil.termos_uso_versao = '2026-08-05'
      and perfil.termos_uso_aceitos_em is not null
      and perfil.diretrizes_comunidade_versao = '2026-08-05'
      and perfil.diretrizes_comunidade_aceitas_em is not null
      and perfil.politica_privacidade_versao = '2026-08-05'
      and perfil.politica_privacidade_ciente_em is not null
  );
$$;

revoke all on function public.usuario_aceitou_termos_publicacao(uuid) from public;

create or replace function public.status_aceite_termos_publicacao()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select
    auth.uid() is not null
    and public.usuario_aceitou_termos_publicacao(auth.uid());
$$;

revoke all on function public.status_aceite_termos_publicacao() from public;
grant execute on function public.status_aceite_termos_publicacao() to authenticated;

create or replace function public.aceitar_termos_publicacao(
  p_termos_versao text,
  p_diretrizes_versao text,
  p_politica_versao text
)
returns boolean
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user_id uuid := auth.uid();
  v_agora timestamptz := now();
begin
  if v_user_id is null then
    raise exception 'É necessário estar autenticado para aceitar os termos.'
      using errcode = '42501';
  end if;

  if p_termos_versao is distinct from '2026-08-05'
     or p_diretrizes_versao is distinct from '2026-08-05'
     or p_politica_versao is distinct from '2026-08-05' then
    raise exception 'A versão dos documentos não é a versão atual.'
      using errcode = '22023';
  end if;

  update public.profiles
  set
    termos_uso_versao = p_termos_versao,
    termos_uso_aceitos_em = v_agora,
    diretrizes_comunidade_versao = p_diretrizes_versao,
    diretrizes_comunidade_aceitas_em = v_agora,
    politica_privacidade_versao = p_politica_versao,
    politica_privacidade_ciente_em = v_agora
  where user_id = v_user_id or id = v_user_id;

  if not found then
    raise exception 'Perfil não encontrado. Saia da conta, entre novamente e tente outra vez.'
      using errcode = 'P0002';
  end if;

  return true;
end;
$$;

revoke all on function public.aceitar_termos_publicacao(text, text, text) from public;
grant execute on function public.aceitar_termos_publicacao(text, text, text) to authenticated;

create or replace function public.exigir_aceite_termos_antes_de_publicar()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  -- Operações administrativas/servidor sem JWT não são bloqueadas por este gatilho.
  if auth.uid() is null then
    return new;
  end if;

  if not public.usuario_aceitou_termos_publicacao(auth.uid()) then
    raise exception 'ACEITE_TERMOS_PUBLICACAO_OBRIGATORIO'
      using
        errcode = 'P0001',
        hint = 'Aceite os Termos de Uso e as Diretrizes da Comunidade antes de publicar.';
  end if;

  return new;
end;
$$;

revoke all on function public.exigir_aceite_termos_antes_de_publicar() from public;

do $$
declare
  v_tabela text;
begin
  foreach v_tabela in array array['obras', 'capitulos', 'comunidade_posts']
  loop
    if to_regclass(format('public.%I', v_tabela)) is not null then
      execute format(
        'drop trigger if exists exigir_aceite_termos_publicacao on public.%I',
        v_tabela
      );
      execute format(
        'create trigger exigir_aceite_termos_publicacao before insert on public.%I for each row execute function public.exigir_aceite_termos_antes_de_publicar()',
        v_tabela
      );
    end if;
  end loop;
end;
$$;

commit;
