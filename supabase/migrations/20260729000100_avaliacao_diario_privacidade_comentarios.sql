-- 20260729000100_avaliacao_diario_privacidade_comentarios.sql
-- Base segura para:
--   1) avaliação do Diário de usuários;
--   2) privacidade individual das anotações;
--   3) permissão individual de comentários e curtidas;
--   4) respostas e curtidas nos comentários do Diário.
--
-- Esta migration preserva os dados e as colunas já existentes.

begin;

create extension if not exists pgcrypto;

-- ============================================================
-- PRÉ-REQUISITOS
-- ============================================================

do $$
declare
  v_tabela text;
begin
  foreach v_tabela in array array[
    'preferencias_privacidade',
    'diario_anotacoes',
    'diario_anotacao_curtidas',
    'diario_anotacao_comentarios',
    'seguindo_usuarios',
    'usuarios_bloqueados'
  ]
  loop
    if to_regclass(format('public.%I', v_tabela)) is null then
      raise exception
        'A tabela public.% precisa existir antes desta migration.',
        v_tabela;
    end if;
  end loop;

  if to_regprocedure(
    'public.usuario_pode_ver_aba_perfil(uuid,text)'
  ) is null then
    raise exception
      'A função public.usuario_pode_ver_aba_perfil(uuid,text) precisa existir.';
  end if;

  if to_regprocedure('public.usuario_e_admin()') is null then
    raise exception
      'A função public.usuario_e_admin() precisa existir.';
  end if;
end
$$;

-- ============================================================
-- PREFERÊNCIAS DA AVALIAÇÃO DO DIÁRIO
-- ============================================================

alter table public.preferencias_privacidade
  add column if not exists mostrar_avaliacao_diario boolean,
  add column if not exists permitir_avaliacao_diario boolean,
  add column if not exists quem_pode_avaliar_diario text;

update public.preferencias_privacidade
set
  mostrar_avaliacao_diario = coalesce(mostrar_avaliacao_diario, true),
  permitir_avaliacao_diario = coalesce(permitir_avaliacao_diario, true),
  quem_pode_avaliar_diario = case
    when quem_pode_avaliar_diario in ('todos', 'seguidores', 'ninguem')
      then quem_pode_avaliar_diario
    else 'todos'
  end;

alter table public.preferencias_privacidade
  alter column mostrar_avaliacao_diario set default true,
  alter column mostrar_avaliacao_diario set not null,
  alter column permitir_avaliacao_diario set default true,
  alter column permitir_avaliacao_diario set not null,
  alter column quem_pode_avaliar_diario set default 'todos',
  alter column quem_pode_avaliar_diario set not null;

alter table public.preferencias_privacidade
  drop constraint if exists
    preferencias_privacidade_avaliacao_diario_check;

alter table public.preferencias_privacidade
  add constraint preferencias_privacidade_avaliacao_diario_check
  check (
    quem_pode_avaliar_diario in ('todos', 'seguidores', 'ninguem')
  );

comment on column
  public.preferencias_privacidade.mostrar_avaliacao_diario is
  'Define se a média pública da Avaliação do Diário pode ser exibida.';

comment on column
  public.preferencias_privacidade.permitir_avaliacao_diario is
  'Define se novas avaliações do Diário estão habilitadas.';

comment on column
  public.preferencias_privacidade.quem_pode_avaliar_diario is
  'Quem pode avaliar o Diário: todos, seguidores ou ninguem.';

-- ============================================================
-- PRIVACIDADE E INTERAÇÕES POR ANOTAÇÃO
-- ============================================================

alter table public.diario_anotacoes
  add column if not exists quem_pode_comentar text,
  add column if not exists visibilidade_comentarios text,
  add column if not exists permitir_curtidas boolean;

update public.diario_anotacoes
set
  visibilidade = case
    when visibilidade in ('publico', 'parcial', 'privado')
      then visibilidade
    else 'privado'
  end,
  quem_pode_comentar = case
    when quem_pode_comentar in (
      'herdar', 'todos', 'seguidores', 'ninguem'
    ) then quem_pode_comentar
    else 'herdar'
  end,
  visibilidade_comentarios = case
    when visibilidade_comentarios in (
      'herdar', 'publico', 'seguidores', 'somente_eu'
    ) then visibilidade_comentarios
    else 'herdar'
  end,
  permitir_curtidas = coalesce(permitir_curtidas, true);

alter table public.diario_anotacoes
  alter column visibilidade set default 'privado',
  alter column visibilidade set not null,
  alter column quem_pode_comentar set default 'herdar',
  alter column quem_pode_comentar set not null,
  alter column visibilidade_comentarios set default 'herdar',
  alter column visibilidade_comentarios set not null,
  alter column permitir_curtidas set default true,
  alter column permitir_curtidas set not null;

alter table public.diario_anotacoes
  drop constraint if exists diario_anotacoes_visibilidade_check,
  drop constraint if exists diario_anotacoes_quem_comenta_check,
  drop constraint if exists diario_anotacoes_visibilidade_comentarios_check,
  drop constraint if exists diario_anotacoes_texto_tamanho_check;

alter table public.diario_anotacoes
  add constraint diario_anotacoes_visibilidade_check
    check (visibilidade in ('publico', 'parcial', 'privado')),
  add constraint diario_anotacoes_quem_comenta_check
    check (
      quem_pode_comentar in (
        'herdar', 'todos', 'seguidores', 'ninguem'
      )
    ),
  add constraint diario_anotacoes_visibilidade_comentarios_check
    check (
      visibilidade_comentarios in (
        'herdar', 'publico', 'seguidores', 'somente_eu'
      )
    );

-- NOT VALID preserva possíveis registros legados maiores, mas a regra já é
-- aplicada a toda nova inserção ou atualização.
alter table public.diario_anotacoes
  add constraint diario_anotacoes_texto_tamanho_check
  check (
    char_length(btrim(coalesce(texto, ''))) between 1 and 700
  ) not valid;

comment on column public.diario_anotacoes.visibilidade is
  'publico: visitantes autorizados; parcial: seguidores; privado: somente o dono.';

comment on column public.diario_anotacoes.quem_pode_comentar is
  'Permissão da anotação: herdar, todos, seguidores ou ninguem.';

comment on column public.diario_anotacoes.visibilidade_comentarios is
  'Visibilidade dos comentários: herdar, publico, seguidores ou somente_eu.';

comment on column public.diario_anotacoes.permitir_curtidas is
  'Permite ou bloqueia novas curtidas nesta anotação.';

-- ============================================================
-- RESPOSTAS NOS COMENTÁRIOS
-- ============================================================

alter table public.diario_anotacao_comentarios
  add column if not exists parent_id uuid,
  add column if not exists atualizado_em timestamptz;

update public.diario_anotacao_comentarios
set atualizado_em = coalesce(atualizado_em, criado_em, now());

alter table public.diario_anotacao_comentarios
  alter column atualizado_em set default now(),
  alter column atualizado_em set not null;

-- A FK é criada separadamente para funcionar em bancos que já possuíam a
-- coluna parent_id, mas ainda não possuíam a restrição.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid =
      'public.diario_anotacao_comentarios'::regclass
      and conname =
        'diario_anotacao_comentarios_parent_id_fkey'
  ) then
    alter table public.diario_anotacao_comentarios
      add constraint diario_anotacao_comentarios_parent_id_fkey
      foreign key (parent_id)
      references public.diario_anotacao_comentarios(id)
      on delete cascade;
  end if;
end
$$;

alter table public.diario_anotacao_comentarios
  drop constraint if exists diario_comentarios_parent_diferente_check,
  drop constraint if exists diario_comentarios_texto_tamanho_check;

alter table public.diario_anotacao_comentarios
  add constraint diario_comentarios_parent_diferente_check
    check (parent_id is null or parent_id <> id);

alter table public.diario_anotacao_comentarios
  add constraint diario_comentarios_texto_tamanho_check
  check (
    char_length(btrim(coalesce(texto, ''))) between 1 and 700
  ) not valid;

create index if not exists diario_comentarios_anotacao_criado_idx
  on public.diario_anotacao_comentarios (
    anotacao_id,
    criado_em desc
  );

create index if not exists diario_comentarios_parent_idx
  on public.diario_anotacao_comentarios (parent_id)
  where parent_id is not null;

-- Impede resposta em outra anotação e limita a estrutura a um nível de
-- respostas, igual ao comportamento esperado nas outras áreas do site.
create or replace function public.validar_comentario_diario()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, auth, pg_temp
as $$
declare
  v_parent_anotacao_id uuid;
  v_parent_parent_id uuid;
begin
  new.texto := btrim(coalesce(new.texto, ''));
  new.atualizado_em := now();

  if new.texto = '' then
    raise exception 'Escreva um comentário antes de enviar.'
      using errcode = '22023';
  end if;

  if char_length(new.texto) > 700 then
    raise exception 'O comentário pode ter no máximo 700 caracteres.'
      using errcode = '22001';
  end if;

  if new.parent_id is not null then
    select
      comentario.anotacao_id,
      comentario.parent_id
    into
      v_parent_anotacao_id,
      v_parent_parent_id
    from public.diario_anotacao_comentarios comentario
    where comentario.id = new.parent_id
    limit 1;

    if not found then
      raise exception 'O comentário respondido não existe mais.'
        using errcode = 'P0002';
    end if;

    if v_parent_anotacao_id is distinct from new.anotacao_id then
      raise exception 'A resposta pertence a outra anotação.'
        using errcode = '22023';
    end if;

    if v_parent_parent_id is not null then
      raise exception 'Responda diretamente ao comentário principal.'
        using errcode = '22023';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists validar_comentario_diario_trigger
  on public.diario_anotacao_comentarios;

create trigger validar_comentario_diario_trigger
before insert or update of texto, anotacao_id, parent_id
on public.diario_anotacao_comentarios
for each row
execute function public.validar_comentario_diario();

revoke all on function public.validar_comentario_diario()
  from public, anon, authenticated;

-- ============================================================
-- CURTIDAS DOS COMENTÁRIOS
-- ============================================================

create table if not exists public.diario_comentario_curtidas (
  id uuid primary key default gen_random_uuid(),
  comentario_id uuid not null
    references public.diario_anotacao_comentarios(id)
    on delete cascade,
  user_id uuid not null
    references auth.users(id)
    on delete cascade,
  criado_em timestamptz not null default now(),

  constraint diario_comentario_curtidas_unique
    unique (comentario_id, user_id)
);

create index if not exists diario_comentario_curtidas_comentario_idx
  on public.diario_comentario_curtidas (comentario_id);

create index if not exists diario_comentario_curtidas_user_idx
  on public.diario_comentario_curtidas (user_id);

alter table public.diario_comentario_curtidas
  enable row level security;

-- ============================================================
-- FUNÇÕES DE VISIBILIDADE DO DIÁRIO
-- ============================================================

create or replace function public.diario_usuario_e_seguidor(
  p_seguidor_id uuid,
  p_seguido_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public, auth, pg_temp
as $$
  select
    p_seguidor_id is not null
    and p_seguido_id is not null
    and exists (
      select 1
      from public.seguindo_usuarios relacao
      where relacao.seguidor_id = p_seguidor_id
        and relacao.seguido_id = p_seguido_id
    );
$$;

create or replace function public.diario_usuarios_sem_bloqueio(
  p_usuario_a uuid,
  p_usuario_b uuid
)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public, auth, pg_temp
as $$
  select
    p_usuario_a is null
    or p_usuario_b is null
    or p_usuario_a = p_usuario_b
    or not exists (
      select 1
      from public.usuarios_bloqueados bloqueio
      where (
        bloqueio.bloqueador_id = p_usuario_a
        and bloqueio.bloqueado_id = p_usuario_b
      )
      or (
        bloqueio.bloqueador_id = p_usuario_b
        and bloqueio.bloqueado_id = p_usuario_a
      )
    );
$$;

create or replace function public.diario_sem_bloqueio_com_usuario_atual(
  p_outro_user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public, auth, pg_temp
as $$
  select public.diario_usuarios_sem_bloqueio(
    auth.uid(),
    p_outro_user_id
  );
$$;

create or replace function public.diario_pode_ver_anotacao(
  p_anotacao_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public, auth, pg_temp
as $$
  select coalesce(
    (
      select
        anotacao.user_id = auth.uid()
        or coalesce(public.usuario_e_admin(), false)
        or (
          public.diario_usuarios_sem_bloqueio(
            auth.uid(),
            anotacao.user_id
          )
          and public.usuario_pode_ver_aba_perfil(
            anotacao.user_id,
            coalesce(
              preferencias.visibilidade_diario,
              'publico'
            )
          )
          and case coalesce(anotacao.visibilidade, 'privado')
            when 'publico' then true
            when 'parcial' then public.diario_usuario_e_seguidor(
              auth.uid(),
              anotacao.user_id
            )
            else false
          end
        )
      from public.diario_anotacoes anotacao
      left join public.preferencias_privacidade preferencias
        on preferencias.user_id = anotacao.user_id
      where anotacao.id = p_anotacao_id
      limit 1
    ),
    false
  );
$$;

create or replace function public.diario_pode_ver_comentarios(
  p_anotacao_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public, auth, pg_temp
as $$
  select coalesce(
    (
      select
        public.diario_pode_ver_anotacao(anotacao.id)
        and (
          anotacao.user_id = auth.uid()
          or coalesce(public.usuario_e_admin(), false)
          or case coalesce(
            anotacao.visibilidade_comentarios,
            'herdar'
          )
            when 'somente_eu' then false
            when 'seguidores' then public.diario_usuario_e_seguidor(
              auth.uid(),
              anotacao.user_id
            )
            else true
          end
        )
      from public.diario_anotacoes anotacao
      where anotacao.id = p_anotacao_id
      limit 1
    ),
    false
  );
$$;

create or replace function public.diario_pode_comentar(
  p_anotacao_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public, auth, pg_temp
as $$
  select coalesce(
    (
      select
        auth.uid() is not null
        and public.diario_pode_ver_comentarios(anotacao.id)
        and public.diario_sem_bloqueio_com_usuario_atual(
          anotacao.user_id
        )
        and (
          anotacao.user_id = auth.uid()
          or case
            when coalesce(
              anotacao.quem_pode_comentar,
              'herdar'
            ) = 'herdar'
              then case coalesce(
                preferencias.quem_pode_comentar_diario,
                'todos'
              )
                when 'todos' then true
                when 'seguidores' then public.diario_usuario_e_seguidor(
                  auth.uid(),
                  anotacao.user_id
                )
                else false
              end
            when anotacao.quem_pode_comentar = 'todos' then true
            when anotacao.quem_pode_comentar = 'seguidores'
              then public.diario_usuario_e_seguidor(
                auth.uid(),
                anotacao.user_id
              )
            else false
          end
        )
      from public.diario_anotacoes anotacao
      left join public.preferencias_privacidade preferencias
        on preferencias.user_id = anotacao.user_id
      where anotacao.id = p_anotacao_id
      limit 1
    ),
    false
  );
$$;

revoke all
  on function public.diario_usuario_e_seguidor(uuid, uuid)
  from public, anon, authenticated;
revoke all
  on function public.diario_usuarios_sem_bloqueio(uuid, uuid)
  from public, anon, authenticated;
revoke all
  on function public.diario_sem_bloqueio_com_usuario_atual(uuid)
  from public, anon, authenticated;
revoke all
  on function public.diario_pode_ver_anotacao(uuid)
  from public, anon, authenticated;
revoke all
  on function public.diario_pode_ver_comentarios(uuid)
  from public, anon, authenticated;
revoke all
  on function public.diario_pode_comentar(uuid)
  from public, anon, authenticated;

-- As funções genéricas de dois usuários permanecem internas para não expor
-- relações privadas de bloqueio. As políticas usam somente o usuário atual.
grant execute
  on function public.diario_sem_bloqueio_com_usuario_atual(uuid)
  to anon, authenticated;
grant execute
  on function public.diario_pode_ver_anotacao(uuid)
  to anon, authenticated;
grant execute
  on function public.diario_pode_ver_comentarios(uuid)
  to anon, authenticated;
grant execute
  on function public.diario_pode_comentar(uuid)
  to anon, authenticated;

-- ============================================================
-- POLÍTICAS DAS ANOTAÇÕES E INTERAÇÕES
-- ============================================================

alter table public.diario_anotacoes enable row level security;
alter table public.diario_anotacao_curtidas enable row level security;
alter table public.diario_anotacao_comentarios enable row level security;

-- Anotações.
drop policy if exists "diario_anotacoes_select_visiveis"
  on public.diario_anotacoes;
drop policy if exists "diario_anotacoes_ler"
  on public.diario_anotacoes;
drop policy if exists "diario_anotacoes_insert_proprio"
  on public.diario_anotacoes;
drop policy if exists "diario_anotacoes_inserir"
  on public.diario_anotacoes;
drop policy if exists "diario_anotacoes_update_proprio"
  on public.diario_anotacoes;
drop policy if exists "diario_anotacoes_atualizar"
  on public.diario_anotacoes;
drop policy if exists "diario_anotacoes_delete_proprio"
  on public.diario_anotacoes;
drop policy if exists "diario_anotacoes_remover"
  on public.diario_anotacoes;

create policy "diario_anotacoes_select_visiveis"
  on public.diario_anotacoes
  for select
  to anon, authenticated
  using (public.diario_pode_ver_anotacao(id));

create policy "diario_anotacoes_insert_proprio"
  on public.diario_anotacoes
  for insert
  to authenticated
  with check (
    auth.uid() is not null
    and user_id = auth.uid()
  );

create policy "diario_anotacoes_update_proprio"
  on public.diario_anotacoes
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "diario_anotacoes_delete_proprio"
  on public.diario_anotacoes
  for delete
  to authenticated
  using (user_id = auth.uid());

-- Curtidas das anotações.
drop policy if exists "diario_anotacao_curtidas_select_visiveis"
  on public.diario_anotacao_curtidas;
drop policy if exists "diario_anotacao_curtidas_insert_proprio"
  on public.diario_anotacao_curtidas;
drop policy if exists "diario_anotacao_curtidas_delete_proprio"
  on public.diario_anotacao_curtidas;

create policy "diario_anotacao_curtidas_select_visiveis"
  on public.diario_anotacao_curtidas
  for select
  to anon, authenticated
  using (public.diario_pode_ver_anotacao(anotacao_id));

create policy "diario_anotacao_curtidas_insert_proprio"
  on public.diario_anotacao_curtidas
  for insert
  to authenticated
  with check (
    auth.uid() is not null
    and user_id = auth.uid()
    and exists (
      select 1
      from public.diario_anotacoes anotacao
      where anotacao.id = diario_anotacao_curtidas.anotacao_id
        and anotacao.permitir_curtidas
        and public.diario_pode_ver_anotacao(anotacao.id)
        and public.diario_sem_bloqueio_com_usuario_atual(
          anotacao.user_id
        )
    )
  );

create policy "diario_anotacao_curtidas_delete_proprio"
  on public.diario_anotacao_curtidas
  for delete
  to authenticated
  using (user_id = auth.uid());

-- Comentários.
drop policy if exists "diario_anotacao_comentarios_select_visiveis"
  on public.diario_anotacao_comentarios;
drop policy if exists "diario_anotacao_comentarios_insert_proprio"
  on public.diario_anotacao_comentarios;
drop policy if exists "diario_anotacao_comentarios_update_proprio"
  on public.diario_anotacao_comentarios;
drop policy if exists "diario_anotacao_comentarios_delete_proprio"
  on public.diario_anotacao_comentarios;

create policy "diario_anotacao_comentarios_select_visiveis"
  on public.diario_anotacao_comentarios
  for select
  to anon, authenticated
  using (
    user_id = auth.uid()
    or public.diario_pode_ver_comentarios(anotacao_id)
  );

create policy "diario_anotacao_comentarios_insert_proprio"
  on public.diario_anotacao_comentarios
  for insert
  to authenticated
  with check (
    auth.uid() is not null
    and user_id = auth.uid()
    and public.diario_pode_comentar(anotacao_id)
  );

create policy "diario_anotacao_comentarios_update_proprio"
  on public.diario_anotacao_comentarios
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and public.diario_pode_comentar(anotacao_id)
  );

create policy "diario_anotacao_comentarios_delete_proprio"
  on public.diario_anotacao_comentarios
  for delete
  to authenticated
  using (user_id = auth.uid());

-- Curtidas dos comentários.
drop policy if exists "diario_comentario_curtidas_select_visiveis"
  on public.diario_comentario_curtidas;
drop policy if exists "diario_comentario_curtidas_insert_proprio"
  on public.diario_comentario_curtidas;
drop policy if exists "diario_comentario_curtidas_delete_proprio"
  on public.diario_comentario_curtidas;

create policy "diario_comentario_curtidas_select_visiveis"
  on public.diario_comentario_curtidas
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.diario_anotacao_comentarios comentario
      where comentario.id = diario_comentario_curtidas.comentario_id
        and (
          comentario.user_id = auth.uid()
          or public.diario_pode_ver_comentarios(
            comentario.anotacao_id
          )
        )
    )
  );

create policy "diario_comentario_curtidas_insert_proprio"
  on public.diario_comentario_curtidas
  for insert
  to authenticated
  with check (
    auth.uid() is not null
    and user_id = auth.uid()
    and exists (
      select 1
      from public.diario_anotacao_comentarios comentario
      inner join public.diario_anotacoes anotacao
        on anotacao.id = comentario.anotacao_id
      where comentario.id =
        diario_comentario_curtidas.comentario_id
        and public.diario_pode_ver_comentarios(
          comentario.anotacao_id
        )
        and public.diario_sem_bloqueio_com_usuario_atual(
          comentario.user_id
        )
        and public.diario_sem_bloqueio_com_usuario_atual(
          anotacao.user_id
        )
    )
  );

create policy "diario_comentario_curtidas_delete_proprio"
  on public.diario_comentario_curtidas
  for delete
  to authenticated
  using (user_id = auth.uid());

-- ============================================================
-- AVALIAÇÃO DO DIÁRIO
-- ============================================================

create table if not exists public.diario_avaliacoes (
  id uuid primary key default gen_random_uuid(),
  diario_user_id uuid not null
    references auth.users(id)
    on delete cascade,
  avaliador_id uuid not null
    references auth.users(id)
    on delete cascade,
  nota numeric(2,1) not null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),

  constraint diario_avaliacoes_usuarios_diferentes_check
    check (diario_user_id <> avaliador_id),
  constraint diario_avaliacoes_nota_check
    check (
      nota >= 0.5
      and nota <= 5.0
      and nota * 2 = trunc(nota * 2)
    ),
  constraint diario_avaliacoes_usuario_avaliador_unique
    unique (diario_user_id, avaliador_id)
);

create index if not exists diario_avaliacoes_diario_user_idx
  on public.diario_avaliacoes (diario_user_id, atualizado_em desc);

create index if not exists diario_avaliacoes_avaliador_idx
  on public.diario_avaliacoes (avaliador_id, atualizado_em desc);

alter table public.diario_avaliacoes enable row level security;

-- As linhas individuais não são públicas. A média pública é entregue pelas
-- RPCs abaixo sem revelar quem avaliou cada Diário.
drop policy if exists "diario_avaliacoes_select_participantes"
  on public.diario_avaliacoes;
drop policy if exists "diario_avaliacoes_insert_direto_bloqueado"
  on public.diario_avaliacoes;
drop policy if exists "diario_avaliacoes_update_direto_bloqueado"
  on public.diario_avaliacoes;
drop policy if exists "diario_avaliacoes_delete_direto_bloqueado"
  on public.diario_avaliacoes;

create policy "diario_avaliacoes_select_participantes"
  on public.diario_avaliacoes
  for select
  to authenticated
  using (
    avaliador_id = auth.uid()
    or diario_user_id = auth.uid()
    or coalesce(public.usuario_e_admin(), false)
  );

create policy "diario_avaliacoes_insert_direto_bloqueado"
  on public.diario_avaliacoes
  for insert
  to authenticated
  with check (false);

create policy "diario_avaliacoes_update_direto_bloqueado"
  on public.diario_avaliacoes
  for update
  to authenticated
  using (false)
  with check (false);

create policy "diario_avaliacoes_delete_direto_bloqueado"
  on public.diario_avaliacoes
  for delete
  to authenticated
  using (false);

create or replace function public.diario_pode_avaliar(
  p_diario_user_id uuid,
  p_avaliador_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public, auth, pg_temp
as $$
  select
    p_diario_user_id is not null
    and p_avaliador_id is not null
    and p_diario_user_id <> p_avaliador_id
    and p_avaliador_id = auth.uid()
    and exists (
      select 1
      from auth.users usuario
      where usuario.id = p_diario_user_id
    )
    and public.diario_usuarios_sem_bloqueio(
      p_avaliador_id,
      p_diario_user_id
    )
    and public.usuario_pode_ver_aba_perfil(
      p_diario_user_id,
      coalesce(
        (
          select preferencias.visibilidade_diario
          from public.preferencias_privacidade preferencias
          where preferencias.user_id = p_diario_user_id
        ),
        'publico'
      )
    )
    and coalesce(
      (
        select preferencias.permitir_avaliacao_diario
        from public.preferencias_privacidade preferencias
        where preferencias.user_id = p_diario_user_id
      ),
      true
    )
    and case coalesce(
      (
        select preferencias.quem_pode_avaliar_diario
        from public.preferencias_privacidade preferencias
        where preferencias.user_id = p_diario_user_id
      ),
      'todos'
    )
      when 'todos' then true
      when 'seguidores' then public.diario_usuario_e_seguidor(
        p_avaliador_id,
        p_diario_user_id
      )
      else false
    end
    and exists (
      select 1
      from public.diario_anotacoes anotacao
      where anotacao.user_id = p_diario_user_id
        and public.diario_pode_ver_anotacao(anotacao.id)
    );
$$;

create or replace function public.carregar_avaliacao_diario(
  p_diario_user_id uuid
)
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, public, auth, pg_temp
as $$
declare
  v_usuario_atual uuid := auth.uid();
  v_mostrar boolean := true;
  v_permitir boolean := true;
  v_quem text := 'todos';
  v_pode_ver boolean := false;
  v_pode_avaliar boolean := false;
  v_media numeric(3,1) := 0;
  v_total integer := 0;
  v_minha_nota numeric(2,1) := 0;
begin
  if p_diario_user_id is null then
    raise exception 'O perfil do Diário não foi informado.'
      using errcode = '22023';
  end if;

  if not exists (
    select 1
    from auth.users usuario
    where usuario.id = p_diario_user_id
  ) then
    raise exception 'O perfil do Diário não existe mais.'
      using errcode = 'P0002';
  end if;

  select
    coalesce(preferencias.mostrar_avaliacao_diario, true),
    coalesce(preferencias.permitir_avaliacao_diario, true),
    coalesce(preferencias.quem_pode_avaliar_diario, 'todos')
  into v_mostrar, v_permitir, v_quem
  from public.preferencias_privacidade preferencias
  where preferencias.user_id = p_diario_user_id;

  if not found then
    v_mostrar := true;
    v_permitir := true;
    v_quem := 'todos';
  end if;

  v_pode_ver :=
    (
      v_usuario_atual = p_diario_user_id
      or coalesce(public.usuario_e_admin(), false)
      or (
        v_mostrar
        and public.diario_usuarios_sem_bloqueio(
          v_usuario_atual,
          p_diario_user_id
        )
        and public.usuario_pode_ver_aba_perfil(
          p_diario_user_id,
          coalesce(
            (
              select preferencias.visibilidade_diario
              from public.preferencias_privacidade preferencias
              where preferencias.user_id = p_diario_user_id
            ),
            'publico'
          )
        )
      )
    );

  if v_pode_ver then
    select
      coalesce(round(avg(avaliacao.nota)::numeric, 1), 0),
      count(*)::integer
    into v_media, v_total
    from public.diario_avaliacoes avaliacao
    where avaliacao.diario_user_id = p_diario_user_id;
  end if;

  if v_usuario_atual is not null then
    select coalesce(avaliacao.nota, 0)
    into v_minha_nota
    from public.diario_avaliacoes avaliacao
    where avaliacao.diario_user_id = p_diario_user_id
      and avaliacao.avaliador_id = v_usuario_atual
    limit 1;

    if not found then
      v_minha_nota := 0;
    end if;
  end if;

  v_pode_avaliar := public.diario_pode_avaliar(
    p_diario_user_id,
    v_usuario_atual
  );

  return jsonb_build_object(
    'visivel', v_pode_ver,
    'mostrar', v_mostrar,
    'permitir', v_permitir,
    'quem_pode_avaliar', v_quem,
    'pode_avaliar', v_pode_avaliar,
    'media', v_media,
    'total', v_total,
    'minha_nota', v_minha_nota
  );
end;
$$;

create or replace function public.salvar_avaliacao_diario(
  p_diario_user_id uuid,
  p_nota numeric
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, auth, pg_temp
as $$
declare
  v_avaliador_id uuid := auth.uid();
  v_nota numeric(2,1);
begin
  if v_avaliador_id is null then
    raise exception 'Entre na sua conta para avaliar este Diário.'
      using errcode = '42501';
  end if;

  if p_diario_user_id is null then
    raise exception 'O perfil do Diário não foi informado.'
      using errcode = '22023';
  end if;

  if p_nota is null
    or p_nota < 0.5
    or p_nota > 5.0
    or p_nota * 2 <> trunc(p_nota * 2)
  then
    raise exception 'A nota precisa estar entre 0,5 e 5 estrelas.'
      using errcode = '22023';
  end if;

  if not public.diario_pode_avaliar(
    p_diario_user_id,
    v_avaliador_id
  ) then
    raise exception 'Você não pode avaliar este Diário.'
      using errcode = '42501';
  end if;

  v_nota := p_nota::numeric(2,1);

  insert into public.diario_avaliacoes (
    diario_user_id,
    avaliador_id,
    nota,
    criado_em,
    atualizado_em
  ) values (
    p_diario_user_id,
    v_avaliador_id,
    v_nota,
    now(),
    now()
  )
  on conflict (diario_user_id, avaliador_id)
  do update set
    nota = excluded.nota,
    atualizado_em = now();

  return public.carregar_avaliacao_diario(p_diario_user_id);
end;
$$;

create or replace function public.remover_avaliacao_diario(
  p_diario_user_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, auth, pg_temp
as $$
declare
  v_avaliador_id uuid := auth.uid();
begin
  if v_avaliador_id is null then
    raise exception 'Entre na sua conta para remover sua avaliação.'
      using errcode = '42501';
  end if;

  delete from public.diario_avaliacoes avaliacao
  where avaliacao.diario_user_id = p_diario_user_id
    and avaliacao.avaliador_id = v_avaliador_id;

  return public.carregar_avaliacao_diario(p_diario_user_id);
end;
$$;

revoke all
  on function public.diario_pode_avaliar(uuid, uuid)
  from public, anon, authenticated;
revoke all
  on function public.carregar_avaliacao_diario(uuid)
  from public, anon, authenticated;
revoke all
  on function public.salvar_avaliacao_diario(uuid, numeric)
  from public, anon, authenticated;
revoke all
  on function public.remover_avaliacao_diario(uuid)
  from public, anon, authenticated;

grant execute
  on function public.carregar_avaliacao_diario(uuid)
  to anon, authenticated;
grant execute
  on function public.salvar_avaliacao_diario(uuid, numeric)
  to authenticated;
grant execute
  on function public.remover_avaliacao_diario(uuid)
  to authenticated;

-- ============================================================
-- GRANTS
-- ============================================================

grant select, insert, update, delete
  on public.diario_anotacoes
  to authenticated;
grant select
  on public.diario_anotacoes
  to anon;

grant select, insert, delete
  on public.diario_anotacao_curtidas
  to authenticated;
grant select
  on public.diario_anotacao_curtidas
  to anon;

grant select, insert, update, delete
  on public.diario_anotacao_comentarios
  to authenticated;
grant select
  on public.diario_anotacao_comentarios
  to anon;

grant select, insert, delete
  on public.diario_comentario_curtidas
  to authenticated;
grant select
  on public.diario_comentario_curtidas
  to anon;

grant select, insert, update, delete
  on public.diario_avaliacoes
  to authenticated;

commit;