-- 20260705_seguindo_usuarios_rls.sql
-- Cria/ajusta a tabela e as regras de segurança para seguir usuários.
-- O usuário autenticado só pode criar ou remover relações em que ele é
-- o seguidor. A leitura permanece pública para contagens e perfis.

begin;

create table if not exists public.seguindo_usuarios (
  id uuid primary key default gen_random_uuid(),
  seguidor_id uuid not null
    references auth.users(id)
    on delete cascade,
  seguido_id uuid not null
    references auth.users(id)
    on delete cascade,
  criado_em timestamptz not null default now()
);

-- Limpa registros inválidos de instalações antigas antes de aplicar
-- as restrições definitivas.
delete from public.seguindo_usuarios
where seguidor_id is null
   or seguido_id is null
   or seguidor_id = seguido_id;

delete from public.seguindo_usuarios a
using public.seguindo_usuarios b
where a.ctid < b.ctid
  and a.seguidor_id = b.seguidor_id
  and a.seguido_id = b.seguido_id;

alter table public.seguindo_usuarios
  alter column seguidor_id set not null,
  alter column seguido_id set not null,
  alter column criado_em set default now(),
  alter column criado_em set not null;

-- Remove a constraint antiga para manter uma única garantia de unicidade.
alter table public.seguindo_usuarios
  drop constraint if exists seguindo_usuarios_unique;

create unique index if not exists
  seguindo_usuarios_seguidor_seguido_uidx
  on public.seguindo_usuarios (seguidor_id, seguido_id);

create index if not exists
  seguindo_usuarios_seguidor_id_idx
  on public.seguindo_usuarios (seguidor_id);

create index if not exists
  seguindo_usuarios_seguido_id_idx
  on public.seguindo_usuarios (seguido_id);

alter table public.seguindo_usuarios
  drop constraint if exists seguindo_usuarios_nao_seguir_si_mesmo;

alter table public.seguindo_usuarios
  add constraint seguindo_usuarios_nao_seguir_si_mesmo
  check (seguidor_id <> seguido_id);

alter table public.seguindo_usuarios
  enable row level security;

-- Policies permissivas são combinadas com OR. Remove todas as regras antigas
-- para evitar que uma policy esquecida permita alterações indevidas.
do $$
declare
  v_policy record;
begin
  for v_policy in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'seguindo_usuarios'
  loop
    execute format(
      'drop policy if exists %I on public.seguindo_usuarios',
      v_policy.policyname
    );
  end loop;
end
$$;

create policy "seguindo_usuarios_select_publico"
  on public.seguindo_usuarios
  for select
  to anon, authenticated
  using (true);

create policy "seguindo_usuarios_insert_proprio"
  on public.seguindo_usuarios
  for insert
  to authenticated
  with check (
    auth.uid() is not null
    and seguidor_id = auth.uid()
    and seguido_id <> auth.uid()
  );

create policy "seguindo_usuarios_delete_proprio"
  on public.seguindo_usuarios
  for delete
  to authenticated
  using (
    auth.uid() is not null
    and seguidor_id = auth.uid()
  );

-- UPDATE não é necessário: para trocar a relação, o cliente deve excluir
-- o registro anterior e criar outro.
create policy "seguindo_usuarios_update_bloqueado"
  on public.seguindo_usuarios
  for update
  to authenticated
  using (false)
  with check (false);

revoke all
  on public.seguindo_usuarios
  from public, anon, authenticated;

grant select
  on public.seguindo_usuarios
  to anon, authenticated;

grant insert, delete
  on public.seguindo_usuarios
  to authenticated;

commit;