-- Pausa operacional da prévia. A chave do Vault é administrada separadamente.
begin;
set local search_path = pg_catalog;
set local lock_timeout = '5s';
select pg_advisory_xact_lock(181126, 8);
do $operador$
begin
  if current_user <> 'postgres' then raise exception 'A pausa requer postgres.'; end if;
end $operador$;
delete from previa_assinatura.chave_ativa;
revoke execute on function public.previa_abertura_assinada(text) from anon, authenticated;
revoke execute on function previa_assinatura.prova_confere(text) from anon, authenticated;
revoke usage on schema previa_assinatura from anon, authenticated;
notify pgrst, 'reload schema';
commit;
