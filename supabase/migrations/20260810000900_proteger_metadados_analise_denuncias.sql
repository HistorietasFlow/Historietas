begin;

create or replace function public.proteger_metadados_analise_denuncia()
returns trigger
language plpgsql
set search_path to 'pg_catalog', 'public', 'auth', 'pg_temp'
as $$
declare
  v_usuario_atual uuid := auth.uid();
  v_service_role boolean :=
    coalesce(auth.role() = 'service_role', false);
begin
  if v_service_role then
    return new;
  end if;

  if new.status = 'pendente' then
    new.analisado_por := null;
    new.analisado_em := null;
  elsif new.status is distinct from old.status
    or old.analisado_em is null
  then
    new.analisado_por := v_usuario_atual;
    new.analisado_em := now();
  else
    new.analisado_por := old.analisado_por;
    new.analisado_em := old.analisado_em;
  end if;

  return new;
end;
$$;

revoke all on function public.proteger_metadados_analise_denuncia()
  from public, anon, authenticated;

drop trigger if exists b_comunidade_denuncias_proteger_analise
  on public.comunidade_denuncias;

create trigger b_comunidade_denuncias_proteger_analise
before update
on public.comunidade_denuncias
for each row
execute function public.proteger_metadados_analise_denuncia();

comment on function public.proteger_metadados_analise_denuncia() is
  'Impede que clientes adulterem analisado_por e analisado_em; mudancas reais de status sao carimbadas pelo banco e demais atualizacoes preservam os valores anteriores.';

commit;
