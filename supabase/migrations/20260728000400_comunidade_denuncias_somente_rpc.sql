-- 20260728000400_comunidade_denuncias_somente_rpc.sql
-- Obriga o envio de denúncias a passar pela RPC segura criar_denuncia(...).
--
-- Pré-requisitos:
--   20260728000200_comunidade_denuncias_validacoes.sql
--   20260728000300_criar_denuncia_rpc_segura.sql

begin;

do $$
begin
  if to_regclass('public.comunidade_denuncias') is null then
    raise exception
      'A tabela public.comunidade_denuncias precisa existir antes desta migration.';
  end if;

  if to_regprocedure('public.criar_denuncia(text,uuid,text,text)') is null then
    raise exception
      'A função public.criar_denuncia(text, uuid, text, text) precisa existir antes desta migration.';
  end if;
end
$$;

-- Remove as policies que permitiam INSERT direto pelo cliente.
drop policy if exists "comunidade_denuncias_insert_propria"
  on public.comunidade_denuncias;

drop policy if exists "comunidade_denuncias_insert_proprio"
  on public.comunidade_denuncias;

-- Remove o privilégio de INSERT direto de todas as funções cliente.
revoke insert
  on public.comunidade_denuncias
  from public;

revoke insert
  on public.comunidade_denuncias
  from anon;

revoke insert
  on public.comunidade_denuncias
  from authenticated;

-- Reafirma que somente usuários autenticados podem chamar a RPC segura.
revoke all
  on function public.criar_denuncia(text, uuid, text, text)
  from public;

revoke all
  on function public.criar_denuncia(text, uuid, text, text)
  from anon;

grant execute
  on function public.criar_denuncia(text, uuid, text, text)
  to authenticated;

comment on function public.criar_denuncia(text, uuid, text, text) is
  'Único ponto permitido ao cliente autenticado para criar denúncias da Comunidade.';

commit;