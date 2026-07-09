-- 20260623_historietas_rls_cleanup_rpc.sql
-- Arquivo auditado/corrigido para o fluxo atual do HISTORIETAS.
-- HISTORIETAS - RLS principal do app.
-- Objetivo:
-- - deixar leitura pública só onde o app precisa mostrar conteúdo público;
-- - manter dados privados por user_id/seguidor_id/denunciante_id;
-- - manter obras/capítulos públicos somente quando publicado = true;
-- - deixar notificações restritas ao dono.
--
-- Rode antes de 20260703_historietas_comunidade_rls_rpc.sql.

-- ============================================================
-- PROFILES
-- ============================================================

alter table if exists public.profiles enable row level security;

drop policy if exists "profiles_select_publico" on public.profiles;
drop policy if exists "profiles_insert_proprio" on public.profiles;
drop policy if exists "profiles_update_proprio" on public.profiles;
drop policy if exists "profiles_delete_proprio" on public.profiles;

create policy "profiles_select_publico"
  on public.profiles
  for select
  using (true);

create policy "profiles_insert_proprio"
  on public.profiles
  for insert
  with check (
    auth.uid() is not null
    and (
      id = auth.uid()
      or user_id = auth.uid()
    )
  );

create policy "profiles_update_proprio"
  on public.profiles
  for update
  using (
    auth.uid() is not null
    and (
      id = auth.uid()
      or user_id = auth.uid()
    )
  )
  with check (
    auth.uid() is not null
    and (
      id = auth.uid()
      or user_id = auth.uid()
    )
  );

create policy "profiles_delete_proprio"
  on public.profiles
  for delete
  using (
    auth.uid() is not null
    and (
      id = auth.uid()
      or user_id = auth.uid()
    )
  );

-- ============================================================
-- OBRAS
-- ============================================================

alter table if exists public.obras enable row level security;

drop policy if exists "obras_select_publicadas_ou_proprias" on public.obras;
drop policy if exists "obras_insert_proprias" on public.obras;
drop policy if exists "obras_update_proprias" on public.obras;
drop policy if exists "obras_delete_proprias" on public.obras;

create policy "obras_select_publicadas_ou_proprias"
  on public.obras
  for select
  using (
    coalesce(publicado, false) = true
    or user_id = auth.uid()
  );

create policy "obras_insert_proprias"
  on public.obras
  for insert
  with check (
    auth.uid() is not null
    and (
      user_id = auth.uid()
    )
  );

create policy "obras_update_proprias"
  on public.obras
  for update
  using (
    auth.uid() is not null
    and (
      user_id = auth.uid()
    )
  )
  with check (
    auth.uid() is not null
    and (
      user_id = auth.uid()
    )
  );

create policy "obras_delete_proprias"
  on public.obras
  for delete
  using (
    auth.uid() is not null
    and (
      user_id = auth.uid()
    )
  );

-- ============================================================
-- CAPITULOS
-- ============================================================

alter table if exists public.capitulos enable row level security;

drop policy if exists "capitulos_select_publicados_ou_proprios" on public.capitulos;
drop policy if exists "capitulos_insert_proprios" on public.capitulos;
drop policy if exists "capitulos_update_proprios" on public.capitulos;
drop policy if exists "capitulos_delete_proprios" on public.capitulos;

create policy "capitulos_select_publicados_ou_proprios"
  on public.capitulos
  for select
  using (
    (
      coalesce(publicado, false) = true
      and exists (
        select 1
        from public.obras o
        where o.id = capitulos.obra_id
          and coalesce(o.publicado, false) = true
      )
    )
    or user_id = auth.uid()
    or exists (
      select 1
      from public.obras o
      where o.id = capitulos.obra_id
        and (
          o.user_id = auth.uid()
        )
    )
  );

create policy "capitulos_insert_proprios"
  on public.capitulos
  for insert
  with check (
    auth.uid() is not null
    and (
      user_id = auth.uid()
      or exists (
        select 1
        from public.obras o
        where o.id = capitulos.obra_id
          and (
            o.user_id = auth.uid()
          )
      )
    )
  );

create policy "capitulos_update_proprios"
  on public.capitulos
  for update
  using (
    auth.uid() is not null
    and (
      user_id = auth.uid()
      or exists (
        select 1
        from public.obras o
        where o.id = capitulos.obra_id
          and (
            o.user_id = auth.uid()
          )
      )
    )
  )
  with check (
    auth.uid() is not null
    and (
      user_id = auth.uid()
      or exists (
        select 1
        from public.obras o
        where o.id = capitulos.obra_id
          and (
            o.user_id = auth.uid()
          )
      )
    )
  );

create policy "capitulos_delete_proprios"
  on public.capitulos
  for delete
  using (
    auth.uid() is not null
    and (
      user_id = auth.uid()
      or exists (
        select 1
        from public.obras o
        where o.id = capitulos.obra_id
          and (
            o.user_id = auth.uid()
          )
      )
    )
  );

-- ============================================================
-- INTERAÇÕES DE OBRA
-- ============================================================

alter table if exists public.obra_curtidas enable row level security;
alter table if exists public.obra_avaliacoes enable row level security;

drop policy if exists "obra_curtidas_select_publico" on public.obra_curtidas;
drop policy if exists "obra_curtidas_insert_proprio" on public.obra_curtidas;
drop policy if exists "obra_curtidas_delete_proprio" on public.obra_curtidas;

create policy "obra_curtidas_select_publico"
  on public.obra_curtidas
  for select
  using (true);

create policy "obra_curtidas_insert_proprio"
  on public.obra_curtidas
  for insert
  with check (auth.uid() is not null and user_id = auth.uid());

create policy "obra_curtidas_delete_proprio"
  on public.obra_curtidas
  for delete
  using (auth.uid() is not null and user_id = auth.uid());

drop policy if exists "obra_avaliacoes_select_publico" on public.obra_avaliacoes;
drop policy if exists "obra_avaliacoes_insert_proprio" on public.obra_avaliacoes;
drop policy if exists "obra_avaliacoes_update_proprio" on public.obra_avaliacoes;
drop policy if exists "obra_avaliacoes_delete_proprio" on public.obra_avaliacoes;

create policy "obra_avaliacoes_select_publico"
  on public.obra_avaliacoes
  for select
  using (true);

create policy "obra_avaliacoes_insert_proprio"
  on public.obra_avaliacoes
  for insert
  with check (auth.uid() is not null and user_id = auth.uid());

create policy "obra_avaliacoes_update_proprio"
  on public.obra_avaliacoes
  for update
  using (auth.uid() is not null and user_id = auth.uid())
  with check (auth.uid() is not null and user_id = auth.uid());

create policy "obra_avaliacoes_delete_proprio"
  on public.obra_avaliacoes
  for delete
  using (auth.uid() is not null and user_id = auth.uid());

-- ============================================================
-- AVALIAÇÕES DE AUTOR
-- ============================================================

create table if not exists public.autor_avaliacoes (
  id uuid primary key default gen_random_uuid(),
  autor_id uuid not null references auth.users(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  nota numeric(2, 1) not null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),

  constraint autor_avaliacoes_autor_user_unique unique (autor_id, user_id),
  constraint autor_avaliacoes_nota_check check (nota >= 0.5 and nota <= 5)
);

create index if not exists autor_avaliacoes_autor_id_idx
  on public.autor_avaliacoes (autor_id);

create index if not exists autor_avaliacoes_user_id_idx
  on public.autor_avaliacoes (user_id);

alter table if exists public.autor_avaliacoes enable row level security;

drop policy if exists "autor_avaliacoes_select_publico" on public.autor_avaliacoes;
drop policy if exists "autor_avaliacoes_insert_proprio" on public.autor_avaliacoes;
drop policy if exists "autor_avaliacoes_update_proprio" on public.autor_avaliacoes;
drop policy if exists "autor_avaliacoes_delete_proprio" on public.autor_avaliacoes;

create policy "autor_avaliacoes_select_publico"
  on public.autor_avaliacoes
  for select
  using (true);

create policy "autor_avaliacoes_insert_proprio"
  on public.autor_avaliacoes
  for insert
  with check (
    auth.uid() is not null
    and user_id = auth.uid()
  );

create policy "autor_avaliacoes_update_proprio"
  on public.autor_avaliacoes
  for update
  using (
    auth.uid() is not null
    and user_id = auth.uid()
  )
  with check (
    auth.uid() is not null
    and user_id = auth.uid()
  );

create policy "autor_avaliacoes_delete_proprio"
  on public.autor_avaliacoes
  for delete
  using (
    auth.uid() is not null
    and user_id = auth.uid()
  );

grant select on public.autor_avaliacoes to anon, authenticated;
grant insert, update, delete on public.autor_avaliacoes to authenticated;

-- ============================================================
-- INTERAÇÕES DE CAPÍTULO
-- ============================================================

alter table if exists public.curtidas_capitulos enable row level security;
alter table if exists public.salvos_capitulos enable row level security;
alter table if exists public.comentarios_capitulos enable row level security;
alter table if exists public.progresso_leitura enable row level security;

drop policy if exists "curtidas_capitulos_select_publico" on public.curtidas_capitulos;
drop policy if exists "curtidas_capitulos_insert_proprio" on public.curtidas_capitulos;
drop policy if exists "curtidas_capitulos_delete_proprio" on public.curtidas_capitulos;

create policy "curtidas_capitulos_select_publico"
  on public.curtidas_capitulos
  for select
  using (true);

create policy "curtidas_capitulos_insert_proprio"
  on public.curtidas_capitulos
  for insert
  with check (auth.uid() is not null and user_id = auth.uid());

create policy "curtidas_capitulos_delete_proprio"
  on public.curtidas_capitulos
  for delete
  using (auth.uid() is not null and user_id = auth.uid());

drop policy if exists "salvos_capitulos_select_proprio" on public.salvos_capitulos;
drop policy if exists "salvos_capitulos_select_publico" on public.salvos_capitulos;
drop policy if exists "salvos_capitulos_insert_proprio" on public.salvos_capitulos;
drop policy if exists "salvos_capitulos_delete_proprio" on public.salvos_capitulos;

create policy "salvos_capitulos_select_publico"
  on public.salvos_capitulos
  for select
  using (true);

create policy "salvos_capitulos_insert_proprio"
  on public.salvos_capitulos
  for insert
  with check (auth.uid() is not null and user_id = auth.uid());

create policy "salvos_capitulos_delete_proprio"
  on public.salvos_capitulos
  for delete
  using (auth.uid() is not null and user_id = auth.uid());

drop policy if exists "comentarios_capitulos_select_publico_ou_proprio" on public.comentarios_capitulos;
drop policy if exists "comentarios_capitulos_insert_proprio" on public.comentarios_capitulos;
drop policy if exists "comentarios_capitulos_update_proprio" on public.comentarios_capitulos;
drop policy if exists "comentarios_capitulos_delete_proprio" on public.comentarios_capitulos;

create policy "comentarios_capitulos_select_publico_ou_proprio"
  on public.comentarios_capitulos
  for select
  using (
    user_id = auth.uid()
    or exists (
      select 1
      from public.capitulos c
      join public.obras o on o.id = c.obra_id
      where c.id = comentarios_capitulos.capitulo_id
        and coalesce(c.publicado, false) = true
        and coalesce(o.publicado, false) = true
    )
  );

create policy "comentarios_capitulos_insert_proprio"
  on public.comentarios_capitulos
  for insert
  with check (auth.uid() is not null and user_id = auth.uid());

create policy "comentarios_capitulos_update_proprio"
  on public.comentarios_capitulos
  for update
  using (auth.uid() is not null and user_id = auth.uid())
  with check (auth.uid() is not null and user_id = auth.uid());

create policy "comentarios_capitulos_delete_proprio"
  on public.comentarios_capitulos
  for delete
  using (auth.uid() is not null and user_id = auth.uid());

drop policy if exists "progresso_leitura_select_proprio" on public.progresso_leitura;
drop policy if exists "progresso_leitura_insert_proprio" on public.progresso_leitura;
drop policy if exists "progresso_leitura_update_proprio" on public.progresso_leitura;
drop policy if exists "progresso_leitura_delete_proprio" on public.progresso_leitura;

create policy "progresso_leitura_select_proprio"
  on public.progresso_leitura
  for select
  using (auth.uid() is not null and user_id = auth.uid());

create policy "progresso_leitura_insert_proprio"
  on public.progresso_leitura
  for insert
  with check (auth.uid() is not null and user_id = auth.uid());

create policy "progresso_leitura_update_proprio"
  on public.progresso_leitura
  for update
  using (auth.uid() is not null and user_id = auth.uid())
  with check (auth.uid() is not null and user_id = auth.uid());

create policy "progresso_leitura_delete_proprio"
  on public.progresso_leitura
  for delete
  using (auth.uid() is not null and user_id = auth.uid());

-- ============================================================
-- BIBLIOTECA / LISTAS / SEGUINDO
-- ============================================================

alter table if exists public.favoritos enable row level security;
alter table if exists public.concluidas enable row level security;
alter table if exists public.seguindo_obras enable row level security;
alter table if exists public.seguindo_autores enable row level security;
alter table if exists public.seguindo_usuarios enable row level security;

drop policy if exists "favoritos_select_proprio" on public.favoritos;
drop policy if exists "favoritos_select_publico" on public.favoritos;
drop policy if exists "favoritos_insert_proprio" on public.favoritos;
drop policy if exists "favoritos_delete_proprio" on public.favoritos;

create policy "favoritos_select_publico"
  on public.favoritos
  for select
  using (true);

create policy "favoritos_insert_proprio"
  on public.favoritos
  for insert
  with check (auth.uid() is not null and user_id = auth.uid());

create policy "favoritos_delete_proprio"
  on public.favoritos
  for delete
  using (auth.uid() is not null and user_id = auth.uid());

drop policy if exists "concluidas_select_proprio" on public.concluidas;
drop policy if exists "concluidas_select_publico" on public.concluidas;
drop policy if exists "concluidas_insert_proprio" on public.concluidas;
drop policy if exists "concluidas_delete_proprio" on public.concluidas;

create policy "concluidas_select_publico"
  on public.concluidas
  for select
  using (true);

create policy "concluidas_insert_proprio"
  on public.concluidas
  for insert
  with check (auth.uid() is not null and user_id = auth.uid());

create policy "concluidas_delete_proprio"
  on public.concluidas
  for delete
  using (auth.uid() is not null and user_id = auth.uid());

drop policy if exists "seguindo_obras_select_proprio" on public.seguindo_obras;
drop policy if exists "seguindo_obras_select_publico" on public.seguindo_obras;
drop policy if exists "seguindo_obras_insert_proprio" on public.seguindo_obras;
drop policy if exists "seguindo_obras_delete_proprio" on public.seguindo_obras;

create policy "seguindo_obras_select_publico"
  on public.seguindo_obras
  for select
  using (true);

create policy "seguindo_obras_insert_proprio"
  on public.seguindo_obras
  for insert
  with check (auth.uid() is not null and user_id = auth.uid());

create policy "seguindo_obras_delete_proprio"
  on public.seguindo_obras
  for delete
  using (auth.uid() is not null and user_id = auth.uid());

do $$
begin
  if to_regclass('public.seguindo_autores') is not null then
    execute 'drop policy if exists "seguindo_autores_select_publico" on public.seguindo_autores';
    execute 'drop policy if exists "seguindo_autores_insert_proprio" on public.seguindo_autores';
    execute 'drop policy if exists "seguindo_autores_delete_proprio" on public.seguindo_autores';

    execute $policy$
      create policy "seguindo_autores_select_publico"
        on public.seguindo_autores
        for select
        using (true)
    $policy$;

    execute $policy$
      create policy "seguindo_autores_insert_proprio"
        on public.seguindo_autores
        for insert
        with check (auth.uid() is not null and user_id = auth.uid())
    $policy$;

    execute $policy$
      create policy "seguindo_autores_delete_proprio"
        on public.seguindo_autores
        for delete
        using (auth.uid() is not null and user_id = auth.uid())
    $policy$;
  end if;
end $$;

drop policy if exists "seguindo_usuarios_select_publico" on public.seguindo_usuarios;
drop policy if exists "seguindo_usuarios_insert_proprio" on public.seguindo_usuarios;
drop policy if exists "seguindo_usuarios_delete_proprio" on public.seguindo_usuarios;

create policy "seguindo_usuarios_select_publico"
  on public.seguindo_usuarios
  for select
  using (true);

create policy "seguindo_usuarios_insert_proprio"
  on public.seguindo_usuarios
  for insert
  with check (auth.uid() is not null and seguidor_id = auth.uid());

create policy "seguindo_usuarios_delete_proprio"
  on public.seguindo_usuarios
  for delete
  using (auth.uid() is not null and seguidor_id = auth.uid());

-- ============================================================
-- DIÁRIO
-- ============================================================

alter table if exists public.diario_atividades enable row level security;
alter table if exists public.diario_anotacoes enable row level security;
alter table if exists public.diario_anotacao_curtidas enable row level security;
alter table if exists public.diario_anotacao_comentarios enable row level security;

drop policy if exists "diario_atividades_select_visiveis" on public.diario_atividades;
drop policy if exists "diario_atividades_insert_proprio" on public.diario_atividades;
drop policy if exists "diario_atividades_update_proprio" on public.diario_atividades;
drop policy if exists "diario_atividades_delete_proprio" on public.diario_atividades;

create policy "diario_atividades_select_visiveis"
  on public.diario_atividades
  for select
  using (
    user_id = auth.uid()
    or coalesce(visibilidade, 'privado') in ('publico', 'parcial')
  );

create policy "diario_atividades_insert_proprio"
  on public.diario_atividades
  for insert
  with check (auth.uid() is not null and user_id = auth.uid());

create policy "diario_atividades_update_proprio"
  on public.diario_atividades
  for update
  using (auth.uid() is not null and user_id = auth.uid())
  with check (auth.uid() is not null and user_id = auth.uid());

create policy "diario_atividades_delete_proprio"
  on public.diario_atividades
  for delete
  using (auth.uid() is not null and user_id = auth.uid());

drop policy if exists "diario_anotacoes_select_visiveis" on public.diario_anotacoes;
drop policy if exists "diario_anotacoes_insert_proprio" on public.diario_anotacoes;
drop policy if exists "diario_anotacoes_update_proprio" on public.diario_anotacoes;
drop policy if exists "diario_anotacoes_delete_proprio" on public.diario_anotacoes;

create policy "diario_anotacoes_select_visiveis"
  on public.diario_anotacoes
  for select
  using (
    user_id = auth.uid()
    or coalesce(visibilidade, 'privado') in ('publico', 'parcial')
  );

create policy "diario_anotacoes_insert_proprio"
  on public.diario_anotacoes
  for insert
  with check (auth.uid() is not null and user_id = auth.uid());

create policy "diario_anotacoes_update_proprio"
  on public.diario_anotacoes
  for update
  using (auth.uid() is not null and user_id = auth.uid())
  with check (auth.uid() is not null and user_id = auth.uid());

create policy "diario_anotacoes_delete_proprio"
  on public.diario_anotacoes
  for delete
  using (auth.uid() is not null and user_id = auth.uid());

do $$
begin
  if to_regclass('public.diario_anotacao_curtidas') is not null then
    execute 'drop policy if exists "diario_anotacao_curtidas_select_visiveis" on public.diario_anotacao_curtidas';
    execute 'drop policy if exists "diario_anotacao_curtidas_insert_proprio" on public.diario_anotacao_curtidas';
    execute 'drop policy if exists "diario_anotacao_curtidas_delete_proprio" on public.diario_anotacao_curtidas';

    execute $policy$
      create policy "diario_anotacao_curtidas_select_visiveis"
        on public.diario_anotacao_curtidas
        for select
        using (
          user_id = auth.uid()
          or exists (
            select 1
            from public.diario_anotacoes a
            where a.id = diario_anotacao_curtidas.anotacao_id
              and (
                a.user_id = auth.uid()
                or coalesce(a.visibilidade, 'privado') in ('publico', 'parcial')
              )
          )
        )
    $policy$;

    execute $policy$
      create policy "diario_anotacao_curtidas_insert_proprio"
        on public.diario_anotacao_curtidas
        for insert
        with check (auth.uid() is not null and user_id = auth.uid())
    $policy$;

    execute $policy$
      create policy "diario_anotacao_curtidas_delete_proprio"
        on public.diario_anotacao_curtidas
        for delete
        using (auth.uid() is not null and user_id = auth.uid())
    $policy$;
  end if;
end $$;

do $$
begin
  if to_regclass('public.diario_anotacao_comentarios') is not null then
    execute 'drop policy if exists "diario_anotacao_comentarios_select_visiveis" on public.diario_anotacao_comentarios';
    execute 'drop policy if exists "diario_anotacao_comentarios_insert_proprio" on public.diario_anotacao_comentarios';
    execute 'drop policy if exists "diario_anotacao_comentarios_update_proprio" on public.diario_anotacao_comentarios';
    execute 'drop policy if exists "diario_anotacao_comentarios_delete_proprio" on public.diario_anotacao_comentarios';

    execute $policy$
      create policy "diario_anotacao_comentarios_select_visiveis"
        on public.diario_anotacao_comentarios
        for select
        using (
          user_id = auth.uid()
          or exists (
            select 1
            from public.diario_anotacoes a
            where a.id = diario_anotacao_comentarios.anotacao_id
              and (
                a.user_id = auth.uid()
                or coalesce(a.visibilidade, 'privado') in ('publico', 'parcial')
              )
          )
        )
    $policy$;

    execute $policy$
      create policy "diario_anotacao_comentarios_insert_proprio"
        on public.diario_anotacao_comentarios
        for insert
        with check (auth.uid() is not null and user_id = auth.uid())
    $policy$;

    execute $policy$
      create policy "diario_anotacao_comentarios_update_proprio"
        on public.diario_anotacao_comentarios
        for update
        using (auth.uid() is not null and user_id = auth.uid())
        with check (auth.uid() is not null and user_id = auth.uid())
    $policy$;

    execute $policy$
      create policy "diario_anotacao_comentarios_delete_proprio"
        on public.diario_anotacao_comentarios
        for delete
        using (auth.uid() is not null and user_id = auth.uid())
    $policy$;
  end if;
end $$;

-- ============================================================
-- NOTIFICAÇÕES
-- ============================================================

alter table if exists public.notificacoes enable row level security;

drop policy if exists "notificacoes_select_proprias" on public.notificacoes;
drop policy if exists "notificacoes_select_proprio" on public.notificacoes;
drop policy if exists "notificacoes_insert_autenticado" on public.notificacoes;
drop policy if exists "notificacoes_insert_proprias" on public.notificacoes;
drop policy if exists "notificacoes_insert_proprio" on public.notificacoes;
drop policy if exists "notificacoes_insert_autor_para_seguidor" on public.notificacoes;
drop policy if exists "notificacoes_update_proprias" on public.notificacoes;
drop policy if exists "notificacoes_update_proprio" on public.notificacoes;
drop policy if exists "notificacoes_delete_proprias" on public.notificacoes;
drop policy if exists "notificacoes_delete_proprio" on public.notificacoes;

create policy "notificacoes_select_proprio"
  on public.notificacoes
  for select
  to authenticated
  using (
    auth.uid() is not null
    and user_id::text = auth.uid()::text
  );

create policy "notificacoes_insert_proprio"
  on public.notificacoes
  for insert
  to authenticated
  with check (
    auth.uid() is not null
    and user_id::text = auth.uid()::text
  );

create policy "notificacoes_update_proprio"
  on public.notificacoes
  for update
  to authenticated
  using (
    auth.uid() is not null
    and user_id::text = auth.uid()::text
  )
  with check (
    auth.uid() is not null
    and user_id::text = auth.uid()::text
  );

create policy "notificacoes_delete_proprio"
  on public.notificacoes
  for delete
  to authenticated
  using (
    auth.uid() is not null
    and user_id::text = auth.uid()::text
  );

revoke all on public.notificacoes from public;
revoke all on public.notificacoes from anon;
grant select, insert, update, delete on public.notificacoes to authenticated;

-- ============================================================
-- FIM DA PARTE ANTERIOR
-- ============================================================

-- 20260623_cleanup_duplicate_rls_policies.sql
-- HISTORIETAS - limpeza de policies antigas/duplicadas.
-- Rode depois de 20260623_rls_core_policies_historietas.sql.
--
-- Motivo:
-- o PostgreSQL combina policies permissivas com OR. Policy antiga duplicada pode
-- abrir acesso mais do que a policy nova. Este script mantém só a lista aprovada.

begin;

create temp table rls_policies_keep (
  tabela text not null,
  policy_name text not null
) on commit drop;

insert into rls_policies_keep (tabela, policy_name)
values
  ('profiles', 'profiles_select_publico'),
  ('profiles', 'profiles_insert_proprio'),
  ('profiles', 'profiles_update_proprio'),
  ('profiles', 'profiles_delete_proprio'),
  ('obras', 'obras_select_publicadas_ou_proprias'),
  ('obras', 'obras_insert_proprias'),
  ('obras', 'obras_update_proprias'),
  ('obras', 'obras_delete_proprias'),
  ('capitulos', 'capitulos_select_publicados_ou_proprios'),
  ('capitulos', 'capitulos_insert_proprios'),
  ('capitulos', 'capitulos_update_proprios'),
  ('capitulos', 'capitulos_delete_proprios'),
  ('obra_curtidas', 'obra_curtidas_select_publico'),
  ('obra_curtidas', 'obra_curtidas_insert_proprio'),
  ('obra_curtidas', 'obra_curtidas_delete_proprio'),
  ('obra_avaliacoes', 'obra_avaliacoes_select_publico'),
  ('obra_avaliacoes', 'obra_avaliacoes_insert_proprio'),
  ('obra_avaliacoes', 'obra_avaliacoes_update_proprio'),
  ('obra_avaliacoes', 'obra_avaliacoes_delete_proprio'),
  ('autor_avaliacoes', 'autor_avaliacoes_select_publico'),
  ('autor_avaliacoes', 'autor_avaliacoes_insert_proprio'),
  ('autor_avaliacoes', 'autor_avaliacoes_update_proprio'),
  ('autor_avaliacoes', 'autor_avaliacoes_delete_proprio'),
  ('curtidas_capitulos', 'curtidas_capitulos_select_publico'),
  ('curtidas_capitulos', 'curtidas_capitulos_insert_proprio'),
  ('curtidas_capitulos', 'curtidas_capitulos_delete_proprio'),
  ('salvos_capitulos', 'salvos_capitulos_select_publico'),
  ('salvos_capitulos', 'salvos_capitulos_insert_proprio'),
  ('salvos_capitulos', 'salvos_capitulos_delete_proprio'),
  ('comentarios_capitulos', 'comentarios_capitulos_select_publico_ou_proprio'),
  ('comentarios_capitulos', 'comentarios_capitulos_insert_proprio'),
  ('comentarios_capitulos', 'comentarios_capitulos_update_proprio'),
  ('comentarios_capitulos', 'comentarios_capitulos_delete_proprio'),
  ('progresso_leitura', 'progresso_leitura_select_proprio'),
  ('progresso_leitura', 'progresso_leitura_insert_proprio'),
  ('progresso_leitura', 'progresso_leitura_update_proprio'),
  ('progresso_leitura', 'progresso_leitura_delete_proprio'),
  ('favoritos', 'favoritos_select_publico'),
  ('favoritos', 'favoritos_insert_proprio'),
  ('favoritos', 'favoritos_delete_proprio'),
  ('concluidas', 'concluidas_select_publico'),
  ('concluidas', 'concluidas_insert_proprio'),
  ('concluidas', 'concluidas_delete_proprio'),
  ('seguindo_obras', 'seguindo_obras_select_publico'),
  ('seguindo_obras', 'seguindo_obras_insert_proprio'),
  ('seguindo_obras', 'seguindo_obras_delete_proprio'),
  ('seguindo_autores', 'seguindo_autores_select_publico'),
  ('seguindo_autores', 'seguindo_autores_insert_proprio'),
  ('seguindo_autores', 'seguindo_autores_delete_proprio'),
  ('seguindo_usuarios', 'seguindo_usuarios_select_publico'),
  ('seguindo_usuarios', 'seguindo_usuarios_insert_proprio'),
  ('seguindo_usuarios', 'seguindo_usuarios_delete_proprio'),
  ('diario_atividades', 'diario_atividades_select_visiveis'),
  ('diario_atividades', 'diario_atividades_insert_proprio'),
  ('diario_atividades', 'diario_atividades_update_proprio'),
  ('diario_atividades', 'diario_atividades_delete_proprio'),
  ('diario_anotacoes', 'diario_anotacoes_select_visiveis'),
  ('diario_anotacoes', 'diario_anotacoes_insert_proprio'),
  ('diario_anotacoes', 'diario_anotacoes_update_proprio'),
  ('diario_anotacoes', 'diario_anotacoes_delete_proprio'),
  ('diario_anotacao_curtidas', 'diario_anotacao_curtidas_select_visiveis'),
  ('diario_anotacao_curtidas', 'diario_anotacao_curtidas_insert_proprio'),
  ('diario_anotacao_curtidas', 'diario_anotacao_curtidas_delete_proprio'),
  ('diario_anotacao_comentarios', 'diario_anotacao_comentarios_select_visiveis'),
  ('diario_anotacao_comentarios', 'diario_anotacao_comentarios_insert_proprio'),
  ('diario_anotacao_comentarios', 'diario_anotacao_comentarios_update_proprio'),
  ('diario_anotacao_comentarios', 'diario_anotacao_comentarios_delete_proprio'),
  ('notificacoes', 'notificacoes_select_proprio'),
  ('notificacoes', 'notificacoes_insert_proprio'),
  ('notificacoes', 'notificacoes_update_proprio'),
  ('notificacoes', 'notificacoes_delete_proprio');

do $$
declare
  policy_record record;
begin
  for policy_record in
    select
      schemaname,
      tablename,
      policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        select distinct tabela
        from rls_policies_keep
      )
  loop
    if not exists (
      select 1
      from rls_policies_keep k
      where k.tabela = policy_record.tablename
        and k.policy_name = policy_record.policyname
    ) then
      execute format(
        'drop policy if exists %I on %I.%I',
        policy_record.policyname,
        policy_record.schemaname,
        policy_record.tablename
      );
    end if;
  end loop;
end $$;

-- seguindo_obras precisa ser público para contagem/listas sociais.
-- A policy privada criada na primeira migration é removida e substituída pela pública.
drop policy if exists "seguindo_obras_select_proprio" on public.seguindo_obras;
drop policy if exists "seguindo_obras_select_publico" on public.seguindo_obras;

create policy "seguindo_obras_select_publico"
  on public.seguindo_obras
  for select
  using (true);

commit;


-- ============================================================
-- FIM DA PARTE ANTERIOR
-- ============================================================

-- 20260623_rpc_notificacoes_bulk.sql
-- HISTORIETAS - RPCs para operações em massa de notificações.
-- Rode depois das policies de RLS.
--
-- Objetivo:
-- - evitar várias requisições para marcar notificações como lidas;
-- - evitar várias requisições para excluir notificações lidas;
-- - manter tudo restrito ao auth.uid().

begin;

create or replace function public.marcar_notificacoes_lidas(
  notificacao_ids text[] default null,
  novo_estado boolean default true
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  total_afetadas integer := 0;
  tem_notificacao_id boolean := false;
  tem_updated_at boolean := false;
  tem_atualizado_em boolean := false;
  sql_update text;
begin
  if auth.uid() is null then
    raise exception 'Usuário não autenticado.';
  end if;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'notificacoes'
      and column_name = 'notificacao_id'
  ) into tem_notificacao_id;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'notificacoes'
      and column_name = 'updated_at'
  ) into tem_updated_at;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'notificacoes'
      and column_name = 'atualizado_em'
  ) into tem_atualizado_em;

  sql_update := 'update public.notificacoes set lida = $1';

  if tem_updated_at then
    sql_update := sql_update || ', updated_at = now()';
  end if;

  if tem_atualizado_em then
    sql_update := sql_update || ', atualizado_em = now()';
  end if;

  sql_update := sql_update || ' where user_id = auth.uid() and ($2 is null or cardinality($2) = 0 or id::text = any($2)';

  if tem_notificacao_id then
    sql_update := sql_update || ' or notificacao_id::text = any($2)';
  end if;

  sql_update := sql_update || ')';

  execute sql_update using novo_estado, notificacao_ids;

  get diagnostics total_afetadas = row_count;

  return total_afetadas;
end;
$$;

create or replace function public.excluir_notificacoes_lidas()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  total_excluidas integer := 0;
begin
  if auth.uid() is null then
    raise exception 'Usuário não autenticado.';
  end if;

  delete from public.notificacoes
  where user_id = auth.uid()
    and lida = true;

  get diagnostics total_excluidas = row_count;

  return total_excluidas;
end;
$$;

revoke all on function public.marcar_notificacoes_lidas(text[], boolean) from public;
revoke all on function public.marcar_notificacoes_lidas(text[], boolean) from anon;
revoke all on function public.excluir_notificacoes_lidas() from public;
revoke all on function public.excluir_notificacoes_lidas() from anon;

grant execute on function public.marcar_notificacoes_lidas(text[], boolean) to authenticated;
grant execute on function public.excluir_notificacoes_lidas() to authenticated;

commit;