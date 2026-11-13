begin;
set local lock_timeout = '5s';
set local statement_timeout = '30s';
set local search_path = '';

-- Sem default/backfill: tuplas anteriores conservam status e versao NULL.
alter table public.obras add column status_editorial_versao uuid;
comment on column public.obras.status_editorial_versao is
  'Token opaco de igualdade para CAS editorial; NULL legado confirmado. Gerado pelo banco, nao e segredo nem contador. UPDATE sem CAS continua possivel.';

create function historietas_privado.definir_versao_status_editorial()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    -- Sobrepoe inclusive UUID/NULL enviado pelo cliente e recriacao do mesmo ID.
    new.status_editorial_versao := pg_catalog.gen_random_uuid();
  elsif new.status_editorial is distinct from old.status_editorial then
    new.status_editorial_versao := pg_catalog.gen_random_uuid();
  else
    new.status_editorial_versao := old.status_editorial_versao;
  end if;
  return new;
end;
$$;
alter function historietas_privado.definir_versao_status_editorial() owner to postgres;
revoke all on function historietas_privado.definir_versao_status_editorial()
  from public, anon, authenticated, service_role;

-- Antes dos AFTER de revisao; sem UPDATE recursivo, grant ou consulta adicional.
-- Ordem alfabetica: guard de termos (e...), token (o...), timestamp (t...).
create trigger obras_status_editorial_versao
before insert or update on public.obras
for each row execute function historietas_privado.definir_versao_status_editorial();

-- SELECT existente expoe o token somente nas linhas permitidas por RLS.
-- Nenhum UPDATE da versao, RPC de escrita ou mudanca de leitura e concedido.
notify pgrst, 'reload schema';
commit;
