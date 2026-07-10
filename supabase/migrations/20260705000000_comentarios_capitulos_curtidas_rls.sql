-- 20260705_comentarios_capitulos_curtidas_rls.sql
-- Cria/ajusta a tabela de curtidas em comentários de capítulos.
-- Compatível com app/ler-capitulo/page.tsx:
-- - tabela: comentarios_capitulos_curtidas
-- - colunas: comentario_id, usuario_id
-- - SELECT público para exibir contagem/lista de curtidas
-- - INSERT/DELETE somente do próprio usuário

begin;

do $$
begin
  if to_regclass('public.comentarios_capitulos') is not null then
    create table if not exists public.comentarios_capitulos_curtidas (
      id uuid primary key default gen_random_uuid(),
      comentario_id uuid not null references public.comentarios_capitulos(id) on delete cascade,
      usuario_id uuid not null references auth.users(id) on delete cascade,
      criado_em timestamptz not null default now(),

      constraint comentarios_capitulos_curtidas_unique unique (comentario_id, usuario_id)
    );

    create index if not exists comentarios_capitulos_curtidas_comentario_id_idx
      on public.comentarios_capitulos_curtidas (comentario_id);

    create index if not exists comentarios_capitulos_curtidas_usuario_id_idx
      on public.comentarios_capitulos_curtidas (usuario_id);

    -- Limpeza defensiva antes do índice único.
    delete from public.comentarios_capitulos_curtidas a
    using public.comentarios_capitulos_curtidas b
    where a.ctid < b.ctid
      and a.comentario_id = b.comentario_id
      and a.usuario_id = b.usuario_id;

    create unique index if not exists comentarios_capitulos_curtidas_comentario_usuario_uidx
      on public.comentarios_capitulos_curtidas (comentario_id, usuario_id);

    alter table public.comentarios_capitulos_curtidas enable row level security;

    drop policy if exists "comentarios_capitulos_curtidas_select_publico"
      on public.comentarios_capitulos_curtidas;

    drop policy if exists "comentarios_capitulos_curtidas_insert_proprio"
      on public.comentarios_capitulos_curtidas;

    drop policy if exists "comentarios_capitulos_curtidas_delete_proprio"
      on public.comentarios_capitulos_curtidas;

    drop policy if exists "comentarios_capitulos_curtidas_update_bloqueado"
      on public.comentarios_capitulos_curtidas;

    create policy "comentarios_capitulos_curtidas_select_publico"
      on public.comentarios_capitulos_curtidas
      for select
      to anon, authenticated
      using (true);

    create policy "comentarios_capitulos_curtidas_insert_proprio"
      on public.comentarios_capitulos_curtidas
      for insert
      to authenticated
      with check (
        auth.uid() is not null
        and usuario_id = auth.uid()
      );

    create policy "comentarios_capitulos_curtidas_delete_proprio"
      on public.comentarios_capitulos_curtidas
      for delete
      to authenticated
      using (
        auth.uid() is not null
        and usuario_id = auth.uid()
      );

    create policy "comentarios_capitulos_curtidas_update_bloqueado"
      on public.comentarios_capitulos_curtidas
      for update
      to authenticated
      using (false)
      with check (false);

    revoke all on public.comentarios_capitulos_curtidas from public;
    revoke all on public.comentarios_capitulos_curtidas from anon;
    revoke all on public.comentarios_capitulos_curtidas from authenticated;

    grant select on public.comentarios_capitulos_curtidas to anon, authenticated;
    grant insert, delete on public.comentarios_capitulos_curtidas to authenticated;
  end if;
end $$;

commit;