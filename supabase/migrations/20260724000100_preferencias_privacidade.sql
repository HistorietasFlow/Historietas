-- Preferências públicas de privacidade usadas pelo perfil e pelo Diário.
-- Cada usuário só altera a própria linha. A leitura é pública para que o
-- perfil consiga respeitar as escolhas antes de mostrar atividades.

begin;

create table if not exists public.preferencias_privacidade (
  user_id uuid primary key references auth.users(id) on delete cascade,
  mostrar_diario_perfil boolean not null default true,
  anotacoes_privadas_padrao boolean not null default true,
  mostrar_atividades_leitura boolean not null default true,
  mostrar_progresso_leitura boolean not null default false,
  mostrar_avaliacoes boolean not null default true,
  mostrar_favoritos boolean not null default true,
  mostrar_concluidas boolean not null default true,
  mostrar_quero_ler boolean not null default false,
  mostrar_historico_leitura boolean not null default false,
  quem_pode_comentar_diario text not null default 'todos',
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint preferencias_privacidade_comentarios_check
    check (quem_pode_comentar_diario in ('todos', 'seguidores', 'ninguem'))
);

alter table public.preferencias_privacidade
  add column if not exists mostrar_diario_perfil boolean not null default true,
  add column if not exists anotacoes_privadas_padrao boolean not null default true,
  add column if not exists mostrar_atividades_leitura boolean not null default true,
  add column if not exists mostrar_progresso_leitura boolean not null default false,
  add column if not exists mostrar_avaliacoes boolean not null default true,
  add column if not exists mostrar_favoritos boolean not null default true,
  add column if not exists mostrar_concluidas boolean not null default true,
  add column if not exists mostrar_quero_ler boolean not null default false,
  add column if not exists mostrar_historico_leitura boolean not null default false,
  add column if not exists quem_pode_comentar_diario text not null default 'todos',
  add column if not exists criado_em timestamptz not null default now(),
  add column if not exists atualizado_em timestamptz not null default now();

alter table public.preferencias_privacidade enable row level security;

grant select on table public.preferencias_privacidade to anon, authenticated;
grant insert, update, delete on table public.preferencias_privacidade to authenticated;

drop policy if exists "preferencias_privacidade_select_publico"
  on public.preferencias_privacidade;
drop policy if exists "preferencias_privacidade_insert_proprio"
  on public.preferencias_privacidade;
drop policy if exists "preferencias_privacidade_update_proprio"
  on public.preferencias_privacidade;
drop policy if exists "preferencias_privacidade_delete_proprio"
  on public.preferencias_privacidade;

create policy "preferencias_privacidade_select_publico"
  on public.preferencias_privacidade
  for select
  using (true);

create policy "preferencias_privacidade_insert_proprio"
  on public.preferencias_privacidade
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "preferencias_privacidade_update_proprio"
  on public.preferencias_privacidade
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "preferencias_privacidade_delete_proprio"
  on public.preferencias_privacidade
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- O Diário inteiro respeita a chave principal também no banco, não apenas
-- na interface. As preferências específicas filtram atividades automáticas.
drop policy if exists "diario_atividades_select_visiveis"
  on public.diario_atividades;

create policy "diario_atividades_select_visiveis"
  on public.diario_atividades
  for select
  using (
    user_id = auth.uid()
    or (
      coalesce(visibilidade, 'privado') in ('publico', 'parcial')
      and coalesce(
        (
          select preferencias.mostrar_diario_perfil
          from public.preferencias_privacidade preferencias
          where preferencias.user_id = diario_atividades.user_id
        ),
        true
      )
      and coalesce(
        (
          select preferencias.mostrar_atividades_leitura
          from public.preferencias_privacidade preferencias
          where preferencias.user_id = diario_atividades.user_id
        ),
        true
      )
      and case
        when tipo in ('leu_capitulo', 'comecou_ler') then coalesce(
          (
            select preferencias.mostrar_historico_leitura
            from public.preferencias_privacidade preferencias
            where preferencias.user_id = diario_atividades.user_id
          ),
          false
        )
        when tipo = 'favoritou_obra' then coalesce(
          (
            select preferencias.mostrar_favoritos
            from public.preferencias_privacidade preferencias
            where preferencias.user_id = diario_atividades.user_id
          ),
          true
        )
        when tipo = 'concluiu_obra' then coalesce(
          (
            select preferencias.mostrar_concluidas
            from public.preferencias_privacidade preferencias
            where preferencias.user_id = diario_atividades.user_id
          ),
          true
        )
        when tipo in ('avaliou_obra', 'publicou_review') then coalesce(
          (
            select preferencias.mostrar_avaliacoes
            from public.preferencias_privacidade preferencias
            where preferencias.user_id = diario_atividades.user_id
          ),
          true
        )
        when tipo = 'salvou_obra' then coalesce(
          (
            select preferencias.mostrar_quero_ler
            from public.preferencias_privacidade preferencias
            where preferencias.user_id = diario_atividades.user_id
          ),
          false
        )
        else true
      end
    )
  );

drop policy if exists "diario_anotacoes_select_visiveis"
  on public.diario_anotacoes;

create policy "diario_anotacoes_select_visiveis"
  on public.diario_anotacoes
  for select
  using (
    user_id = auth.uid()
    or (
      coalesce(visibilidade, 'privado') in ('publico', 'parcial')
      and coalesce(
        (
          select preferencias.mostrar_diario_perfil
          from public.preferencias_privacidade preferencias
          where preferencias.user_id = diario_anotacoes.user_id
        ),
        true
      )
    )
  );

-- Comentários também respeitam a escolha Todos / Seguidores / Ninguém.
drop policy if exists "diario_anotacao_comentarios_insert_proprio"
  on public.diario_anotacao_comentarios;

create policy "diario_anotacao_comentarios_insert_proprio"
  on public.diario_anotacao_comentarios
  for insert
  to authenticated
  with check (
    auth.uid() is not null
    and user_id = auth.uid()
    and exists (
      select 1
      from public.diario_anotacoes anotacao
      left join public.preferencias_privacidade preferencias
        on preferencias.user_id = anotacao.user_id
      where anotacao.id = diario_anotacao_comentarios.anotacao_id
        and (
          anotacao.user_id = auth.uid()
          or coalesce(preferencias.quem_pode_comentar_diario, 'todos') = 'todos'
          or (
            coalesce(preferencias.quem_pode_comentar_diario, 'todos') = 'seguidores'
            and exists (
              select 1
              from public.seguindo_usuarios relacao
              where relacao.seguidor_id = auth.uid()
                and relacao.seguido_id = anotacao.user_id
            )
          )
        )
    )
  );

commit;