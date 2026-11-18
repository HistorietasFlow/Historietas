-- Operação separada da migration. O parâmetro psql id_segredo_vault contém apenas o UUID.
begin;
set local search_path = pg_catalog;
set local lock_timeout = '5s';
select pg_advisory_xact_lock(181126, 8);
select set_config('historietas.previa_id_vault', :'id_segredo_vault', true);
do $ativar$
declare
  id_alvo uuid := current_setting('historietas.previa_id_vault')::uuid;
begin
  if current_user <> 'postgres' or exists(select 1 from previa_assinatura.chave_ativa) then
    raise exception 'A ativação requer postgres e a prévia pausada.';
  end if;
  if not exists(select 1 from pg_extension where extname='supabase_vault')
     or to_regclass('vault.decrypted_secrets') is null then
    raise exception 'O Vault real é necessário para habilitar.';
  end if;
  if exists(select 1 from unnest(array['anon','authenticated']) r
            where has_any_column_privilege(r,'vault.decrypted_secrets','SELECT')
               or has_any_column_privilege(r,'previa_assinatura.chave_ativa','SELECT')) then
    raise exception 'Revisar privilégios do Vault e da referência privada.';
  end if;
  if not exists(select 1 from vault.decrypted_secrets v where v.id=id_alvo
    and v.name ~ '^historietas_previa_v1_[A-Za-z0-9-]{1,64}$'
    and v.decrypted_secret ~ '^[0-9a-f]{64}$') then
    raise exception 'Referência indisponível ou fora do contrato da prévia.';
  end if;
  insert into previa_assinatura.chave_ativa(unica,id_vault) values (true,id_alvo);
end $ativar$;
grant usage on schema previa_assinatura to anon, authenticated;
grant execute on function previa_assinatura.prova_confere(text) to anon, authenticated;
grant execute on function public.previa_abertura_assinada(text) to anon, authenticated;
notify pgrst, 'reload schema';
commit;
