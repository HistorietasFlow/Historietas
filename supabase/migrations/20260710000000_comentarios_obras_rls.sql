-- 20260710_comentarios_obras_rls.sql
-- Comentários públicos das obras.
-- Compatível com app/obra/[slug]/ObraDinamicaClient.tsx:
-- - tabela: public.comentarios_obras
-- - colunas: id, obra_id, user_id, comentario, criado_em
-- - leitura pública somente para obras publicadas
-- - dono da obra pode visualizar comentários da própria obra não publicada
-- - escrita e remoção restritas ao usuário autenticado dono do comentário
-- - administradores/moderadores podem remover comentários

begin;

create extension if not exists pgcrypto;

do $$
begin
  if to_regclass('public.obras') is null then
    raise exception
      'A tabela public.obras precisa existir antes de public.comentarios_obras.';
  end if;

  if to_regprocedure('public.usuario_e_admin()') is null then
    raise exception
      'A função public.usuario_e_admin() precisa existir antes desta migration.';
  end if;
end
$$;

create table if not exists public.comentarios_obras (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null
    references public.obras(id)
    on delete cascade,
  user_id uuid not null
    references auth.users(id)
    on delete cascade,
  comentario text not null,
  criado_em timestamptz not null default now()
);

-- Confirma que uma instalação antiga possui todas as colunas necessárias.
do $$
declare
  v_coluna text;
begin
  foreach v_coluna in array array[
    'id',
    'obra_id',
    'user_id',
    'comentario',
    'criado_em'
  ]
  loop
    if not exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'comentarios_obras'
        and column_name = v_coluna
    ) then
      raise exception
        'A coluna public.comentarios_obras.% não existe.',
        v_coluna;
    end if;
  end loop;
end
$$;

alter table public.comentarios_obras
  alter column id set default gen_random_uuid(),
  alter column obra_id set not null,
  alter column user_id set not null,
  alter column comentario set not null,
  alter column criado_em set default now(),
  alter column criado_em set not null;

-- NOT VALID preserva possíveis registros legados inválidos, mas bloqueia
-- imediatamente novos comentários fora do limite.
alter table public.comentarios_obras
  drop constraint if exists comentarios_obras_comentario_tamanho_check;

alter table public.comentarios_obras
  add constraint comentarios_obras_comentario_tamanho_check
  check (
    char_length(btrim(comentario)) between 2 and 600
  )
  not valid;

create index if not exists comentarios_obras_obra_criado_em_idx
  on public.comentarios_obras (obra_id, criado_em desc);

create index if not exists comentarios_obras_user_id_idx
  on public.comentarios_obras (user_id);

alter table public.comentarios_obras
  enable row level security;

-- Policies permissivas são combinadas com OR. Remove todas as regras antigas
-- para impedir que uma policy esquecida reabra acesso indevido.
do $$
declare
  v_policy record;
begin
  for v_policy in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'comentarios_obras'
  loop
    execute format(
      'drop policy if exists %I on public.comentarios_obras',
      v_policy.policyname
    );
  end loop;
end
$$;

create policy "comentarios_obras_select_publicadas_ou_proprias"
  on public.comentarios_obras
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.obras obra
      where obra.id = comentarios_obras.obra_id
        and (
          coalesce(obra.publicado, false) = true
          or (
            auth.uid() is not null
            and obra.user_id = auth.uid()
          )
        )
    )
  );

create policy "comentarios_obras_insert_proprio"
  on public.comentarios_obras
  for insert
  to authenticated
  with check (
    auth.uid() is not null
    and user_id = auth.uid()
    and char_length(btrim(comentario)) between 2 and 600
    and exists (
      select 1
      from public.obras obra
      where obra.id = comentarios_obras.obra_id
        and (
          coalesce(obra.publicado, false) = true
          or obra.user_id = auth.uid()
        )
    )
  );

create policy "comentarios_obras_delete_proprio_ou_admin"
  on public.comentarios_obras
  for delete
  to authenticated
  using (
    auth.uid() is not null
    and (
      user_id = auth.uid()
      or public.usuario_e_admin()
    )
  );

-- Edição direta não é suportada. Para alterar o texto, o aplicativo deve
-- excluir o comentário e criar outro.
create policy "comentarios_obras_update_bloqueado"
  on public.comentarios_obras
  for update
  to authenticated
  using (false)
  with check (false);

revoke all
  on public.comentarios_obras
  from public, anon, authenticated;

grant select
  on public.comentarios_obras
  to anon, authenticated;

grant insert, delete
  on public.comentarios_obras
  to authenticated;

commit;