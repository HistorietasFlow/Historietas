-- 20260709000300_profiles_update_colunas_seguras.sql
-- Restringe UPDATE de public.profiles às colunas públicas/editáveis.
-- Bloqueia atualização direta de identificadores e campos administrativos.
-- Mantém user_id liberado por compatibilidade com os upserts do aplicativo,
-- mas a policy impede que ele seja associado a outro usuário.

begin;

do $$
declare
  v_colunas_seguras text[] := array[
    'user_id',
    'nome',
    'nome_usuario',
    'username',
    'display_name',
    'apelido',
    'avatar_url',
    'avatar',
    'foto_url',
    'imagem_url',
    'photo_url',
    'bio',
    'sobre_bio',
    'sobreBio',
    'sobre',
    'descricao',
    'mostrar_destaques',
    'atualizado_em',
    'updated_at'
  ];
  v_todas_colunas text;
  v_colunas_existentes text;
  v_tem_user_id boolean := false;
  v_tem_id boolean := false;
  v_policy record;
  v_expressao_proprietario text;
begin
  if to_regclass('public.profiles') is null then
    return;
  end if;

  alter table public.profiles enable row level security;

  select
    exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'profiles'
        and column_name = 'user_id'
    ),
    exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'profiles'
        and column_name = 'id'
    )
  into
    v_tem_user_id,
    v_tem_id;

  select string_agg(
    format('%I', coluna.column_name),
    ', ' order by coluna.ordinal_position
  )
  into v_todas_colunas
  from information_schema.columns coluna
  where coluna.table_schema = 'public'
    and coluna.table_name = 'profiles';

  -- Remove grants amplos e também possíveis grants antigos por coluna.
  execute
    'revoke update on table public.profiles from public, anon, authenticated';

  if v_todas_colunas is not null then
    execute format(
      'revoke update (%s) on table public.profiles from public, anon, authenticated',
      v_todas_colunas
    );
  end if;

  select string_agg(
    format('%I', coluna.column_name),
    ', ' order by coluna.ordinal_position
  )
  into v_colunas_existentes
  from information_schema.columns coluna
  where coluna.table_schema = 'public'
    and coluna.table_name = 'profiles'
    and coluna.column_name = any(v_colunas_seguras)
    and coluna.is_generated = 'NEVER'
    and coluna.is_identity = 'NO';

  if v_colunas_existentes is not null then
    execute format(
      'grant update (%s) on table public.profiles to authenticated',
      v_colunas_existentes
    );
  end if;

  -- Policies permissivas são combinadas com OR. Substitui todas as policies
  -- de UPDATE por uma única regra que mantém o perfil ligado ao auth.uid().
  for v_policy in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and cmd = 'UPDATE'
  loop
    execute format(
      'drop policy if exists %I on public.profiles',
      v_policy.policyname
    );
  end loop;

  if v_tem_user_id and v_tem_id then
    v_expressao_proprietario :=
      'auth.uid() is not null ' ||
      'and coalesce(user_id::text, id::text) = auth.uid()::text';
  elsif v_tem_user_id then
    v_expressao_proprietario :=
      'auth.uid() is not null ' ||
      'and user_id::text = auth.uid()::text';
  elsif v_tem_id then
    v_expressao_proprietario :=
      'auth.uid() is not null ' ||
      'and id::text = auth.uid()::text';
  else
    -- Sem uma coluna segura de proprietário, nenhum UPDATE é autorizado.
    return;
  end if;

  execute format(
    'create policy %I on public.profiles ' ||
    'for update to authenticated ' ||
    'using (%s) with check (%s)',
    'profiles_update_proprio',
    v_expressao_proprietario,
    v_expressao_proprietario
  );
end
$$;

commit;