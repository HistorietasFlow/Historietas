-- Requer a prévia pausada. Preserva a migration anterior e os segredos no Vault.
begin;
set local search_path = pg_catalog;
set local lock_timeout = '5s';
select pg_advisory_xact_lock(181126, 8);
do $reversao$
begin
  if current_user <> 'postgres' or exists(select 1 from previa_assinatura.chave_ativa)
     or exists(select 1 from unnest(array['anon','authenticated']) r
       where has_function_privilege(r,'public.previa_abertura_assinada(text)','EXECUTE')) then
    raise exception 'Pausar a prévia e revisar as permissões antes da reversão.';
  end if;
end $reversao$;
drop function public.previa_abertura_assinada(text) restrict;
drop function previa_assinatura.prova_confere(text) restrict;
drop table previa_assinatura.chave_ativa restrict;
drop schema previa_assinatura restrict;
notify pgrst, 'reload schema';
commit;
