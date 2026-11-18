begin;
set local lock_timeout = '5s';
set local search_path = pg_catalog;

create schema arquivos_obra_interno authorization postgres;
revoke all on schema arquivos_obra_interno from public, anon, authenticated, service_role;
grant usage on schema arquivos_obra_interno to anon, authenticated;

-- Não devolve arquivo_url nem concede SELECT da coluna a visitantes.
create function arquivos_obra_interno.conferir_referencia(
  p_obra_id uuid, p_proprietario_id uuid, p_referencia_sha256 text
) returns boolean
language plpgsql stable security definer
set search_path = ''
as $referencia$
declare
  leitor uuid := auth.uid();
begin
  if leitor is not null and not previa_interno.sessao_atual_ativa() then
    raise sqlstate 'PT401' using message = 'Sessão inválida.';
  end if;

  return exists (
    select 1
    from public.obras as obra
    where obra.id = p_obra_id and obra.user_id = p_proprietario_id
      and (obra.user_id = leitor or (
        obra.publicado is true
        and obra.classificacao_indicativa in ('Livre', '10+', '12+', '14+', '16+')
        and public.usuario_pode_ver_perfil(obra.user_id)
        and (public.carregar_permissoes_abas_perfil(obra.user_id) ->> 'obras') = 'true'
      ))
      and p_referencia_sha256 = pg_catalog.encode(
        pg_catalog.sha256(pg_catalog.convert_to(obra.arquivo_url, 'UTF8')), 'hex')
  );
end;
$referencia$;

revoke all on function arquivos_obra_interno.conferir_referencia(uuid, uuid, text)
  from public, anon, authenticated, service_role;
grant execute on function arquivos_obra_interno.conferir_referencia(uuid, uuid, text)
  to anon, authenticated;

-- Autorização e confirmação da referência acontecem no mesmo snapshot da RPC.
create function public.autorizar_leitura_arquivo_obra(
  p_obra_id uuid, p_proprietario_id uuid, p_referencia_sha256 text
) returns boolean
language plpgsql stable security invoker
set search_path = ''
as $autorizar$
begin
  if current_user = 'authenticated' then
    if auth.uid() is null or not previa_interno.sessao_atual_ativa() then
      raise sqlstate 'PT401' using message = 'Sessão inválida.';
    end if;
  elsif current_user <> 'anon' then
    raise insufficient_privilege;
  end if;

  return exists (
    select 1 from public.obras as obra
    where obra.id = p_obra_id and obra.user_id = p_proprietario_id
      and arquivos_obra_interno.conferir_referencia(obra.id, obra.user_id, p_referencia_sha256)
  );
end;
$autorizar$;

revoke all on function public.autorizar_leitura_arquivo_obra(uuid, uuid, text)
  from public, anon, authenticated, service_role;
grant execute on function public.autorizar_leitura_arquivo_obra(uuid, uuid, text)
  to anon, authenticated;
commit;
