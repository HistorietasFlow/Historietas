-- 20260709_profiles_update_colunas_seguras.sql
-- Restringe UPDATE de profiles para colunas públicas/editáveis.
-- Bloqueia atualização de campos administrativos por usuário comum.
-- Versão corrigida: não quebra se public.profiles ainda não existir.

begin;

do $$
declare
  colunas_seguras text[] := array[
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
    'sobre',
    'descricao',
    'atualizado_em',
    'updated_at'
  ];
  colunas_existentes text;
begin
  if to_regclass('public.profiles') is null then
    return;
  end if;

  execute 'revoke update on public.profiles from public';
  execute 'revoke update on public.profiles from anon';
  execute 'revoke update on public.profiles from authenticated';

  select string_agg(format('%I', column_name), ', ')
  into colunas_existentes
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'profiles'
    and column_name = any(colunas_seguras);

  if colunas_existentes is not null then
    execute format(
      'grant update (%s) on public.profiles to authenticated',
      colunas_existentes
    );
  end if;
end $$;

commit;