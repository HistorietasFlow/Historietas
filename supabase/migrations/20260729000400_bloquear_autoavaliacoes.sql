-- 20260729000400_bloquear_autoavaliacoes.sql
-- Impede que o dono avalie a própria obra, o próprio perfil de autor
-- ou o próprio Diário. Também remove autoavaliações antigas.

begin;

-- ============================================================
-- LIMPEZA DE AUTOAVALIAÇÕES ANTIGAS
-- ============================================================

delete from public.obra_avaliacoes avaliacao
using public.obras obra
where obra.id = avaliacao.obra_id
  and obra.user_id = avaliacao.user_id;

delete from public.autor_avaliacoes
where autor_id = user_id;

delete from public.diario_avaliacoes
where diario_user_id = avaliador_id;

-- ============================================================
-- OBRA: BLOQUEIO BASEADO NO DONO REGISTRADO EM public.obras
-- ============================================================

create or replace function public.bloquear_autoavaliacao_obra()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, auth, pg_temp
as $$
declare
  v_autor_id uuid;
begin
  select obra.user_id
  into v_autor_id
  from public.obras obra
  where obra.id = new.obra_id
  limit 1;

  if v_autor_id is null then
    raise exception 'A obra informada não existe.'
      using errcode = '23503';
  end if;

  if new.user_id = v_autor_id then
    raise exception 'O autor não pode avaliar a própria obra.'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

revoke all
  on function public.bloquear_autoavaliacao_obra()
  from public, anon, authenticated;

drop trigger if exists impedir_autoavaliacao_obra
  on public.obra_avaliacoes;

create trigger impedir_autoavaliacao_obra
before insert or update of obra_id, user_id
on public.obra_avaliacoes
for each row
execute function public.bloquear_autoavaliacao_obra();

-- ============================================================
-- PERFIL DO AUTOR: autor_id NUNCA PODE SER IGUAL A user_id
-- ============================================================

alter table public.autor_avaliacoes
  drop constraint if exists autor_avaliacoes_sem_autoavaliacao_check;

alter table public.autor_avaliacoes
  add constraint autor_avaliacoes_sem_autoavaliacao_check
  check (autor_id <> user_id);

-- ============================================================
-- DIÁRIO: diario_user_id NUNCA PODE SER IGUAL A avaliador_id
-- ============================================================

alter table public.diario_avaliacoes
  drop constraint if exists diario_avaliacoes_sem_autoavaliacao_check;

alter table public.diario_avaliacoes
  add constraint diario_avaliacoes_sem_autoavaliacao_check
  check (diario_user_id <> avaliador_id);

-- ============================================================
-- PROTEÇÃO EXTRA PARA INSERT E UPDATE DIRETOS
-- ============================================================

drop policy if exists "obra_avaliacoes_insert_proprio"
  on public.obra_avaliacoes;

create policy "obra_avaliacoes_insert_proprio"
  on public.obra_avaliacoes
  for insert
  to authenticated
  with check (
    auth.uid() is not null
    and user_id = auth.uid()
    and exists (
      select 1
      from public.obras obra
      where obra.id = obra_avaliacoes.obra_id
        and obra.user_id <> auth.uid()
    )
  );

drop policy if exists "obra_avaliacoes_update_proprio"
  on public.obra_avaliacoes;

create policy "obra_avaliacoes_update_proprio"
  on public.obra_avaliacoes
  for update
  to authenticated
  using (
    auth.uid() is not null
    and user_id = auth.uid()
  )
  with check (
    auth.uid() is not null
    and user_id = auth.uid()
    and exists (
      select 1
      from public.obras obra
      where obra.id = obra_avaliacoes.obra_id
        and obra.user_id <> auth.uid()
    )
  );

drop policy if exists "autor_avaliacoes_insert_proprio"
  on public.autor_avaliacoes;

create policy "autor_avaliacoes_insert_proprio"
  on public.autor_avaliacoes
  for insert
  to authenticated
  with check (
    auth.uid() is not null
    and user_id = auth.uid()
    and autor_id <> auth.uid()
  );

drop policy if exists "autor_avaliacoes_update_proprio"
  on public.autor_avaliacoes;

create policy "autor_avaliacoes_update_proprio"
  on public.autor_avaliacoes
  for update
  to authenticated
  using (
    auth.uid() is not null
    and user_id = auth.uid()
  )
  with check (
    auth.uid() is not null
    and user_id = auth.uid()
    and autor_id <> auth.uid()
  );

commit;