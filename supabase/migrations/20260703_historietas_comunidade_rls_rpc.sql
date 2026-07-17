-- 20260703_historietas_comunidade_rls_rpc.sql
-- HISTORIETAS - complemento de produção para Comunidade, denúncias, TOP 5 e RPCs.
-- Rode depois de 20260623_historietas_rls_cleanup_rpc.sql.

begin;

create extension if not exists pgcrypto;

-- ============================================================
-- BASE: OBRAS / MÉTRICAS PÚBLICAS
-- ============================================================

alter table if exists public.obras
  add column if not exists visualizacoes integer default 0;

update public.obras
set visualizacoes = 0
where visualizacoes is null;

alter table if exists public.obras
  alter column visualizacoes set default 0;

alter table if exists public.obras
  alter column visualizacoes set not null;

create index if not exists obras_visualizacoes_idx
  on public.obras (visualizacoes desc);

-- ============================================================
-- RPC: ADMIN
-- ============================================================

create or replace function public.usuario_e_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    lower(coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '')) in ('admin', 'moderador', 'moderator')
    or lower(coalesce(auth.jwt() -> 'app_metadata' ->> 'cargo', '')) in ('admin', 'moderador', 'moderator')
    or lower(coalesce(auth.jwt() -> 'app_metadata' ->> 'tipo_usuario', '')) in ('admin', 'moderador', 'moderator')
    or lower(coalesce(auth.jwt() -> 'app_metadata' ->> 'admin', '')) in ('true', '1', 'yes')
    or lower(coalesce(auth.jwt() -> 'app_metadata' ->> 'is_admin', '')) in ('true', '1', 'yes')
    or lower(coalesce(auth.jwt() -> 'app_metadata' ->> 'moderator', '')) in ('true', '1', 'yes')
    or coalesce(auth.jwt() -> 'app_metadata' -> 'roles', '[]'::jsonb) ?| array['admin', 'moderador', 'moderator'],
    false
  );
$$;

revoke all on function public.usuario_e_admin() from public;
grant execute on function public.usuario_e_admin() to authenticated;

-- ============================================================
-- RPC: VISUALIZAÇÕES DE OBRAS
-- ============================================================

-- Registra no máximo uma visualização por visitante, obra e dia.
-- Usuários autenticados são identificados por auth.uid().
-- Visitantes anônimos usam um hash do IP encaminhado pelo proxy e user-agent.
create table if not exists public.obra_visualizacoes_unicas (
  obra_id uuid not null references public.obras(id) on delete cascade,
  chave_visitante text not null,
  dia date not null default current_date,
  criada_em timestamptz not null default now(),
  primary key (obra_id, chave_visitante, dia)
);

create index if not exists obra_visualizacoes_unicas_dia_idx
  on public.obra_visualizacoes_unicas (dia desc);

alter table public.obra_visualizacoes_unicas enable row level security;

-- A tabela é interna. Somente o RPC SECURITY DEFINER pode gravar nela.
revoke all on table public.obra_visualizacoes_unicas
  from public, anon, authenticated;

drop function if exists public.incrementar_visualizacao_obra(uuid);

create or replace function public.incrementar_visualizacao_obra(
  obra_id_param uuid
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  total_visualizacoes integer := 0;
  linhas_inseridas integer := 0;
  usuario_id uuid := auth.uid();
  cabecalhos jsonb := '{}'::jsonb;
  ip_visitante text := null;
  user_agent text := null;
  chave_visitante text := null;
begin
  if obra_id_param is null then
    return 0;
  end if;

  select coalesce(o.visualizacoes, 0)
  into total_visualizacoes
  from public.obras o
  where o.id = obra_id_param
    and coalesce(o.publicado, false) = true
  limit 1;

  if not found then
    return 0;
  end if;

  if usuario_id is not null then
    chave_visitante := 'usuario:' || usuario_id::text;
  else
    begin
      cabecalhos := coalesce(
        nullif(current_setting('request.headers', true), '')::jsonb,
        '{}'::jsonb
      );
    exception
      when others then
        cabecalhos := '{}'::jsonb;
    end;

    ip_visitante := nullif(
      trim(
        coalesce(
          cabecalhos ->> 'cf-connecting-ip',
          split_part(coalesce(cabecalhos ->> 'x-forwarded-for', ''), ',', 1),
          cabecalhos ->> 'x-real-ip',
          ''
        )
      ),
      ''
    );

    user_agent := nullif(
      trim(coalesce(cabecalhos ->> 'user-agent', '')),
      ''
    );

    -- Sem uma identificação mínima confiável, retorna o total atual
    -- sem permitir incremento anônimo ilimitado.
    if ip_visitante is null then
      return total_visualizacoes;
    end if;

    chave_visitante :=
      'anon:' ||
      encode(
        digest(
          ip_visitante || '|' || coalesce(user_agent, ''),
          'sha256'
        ),
        'hex'
      );
  end if;

  insert into public.obra_visualizacoes_unicas (
    obra_id,
    chave_visitante,
    dia
  )
  values (
    obra_id_param,
    chave_visitante,
    current_date
  )
  on conflict (obra_id, chave_visitante, dia) do nothing;

  get diagnostics linhas_inseridas = row_count;

  if linhas_inseridas = 0 then
    return total_visualizacoes;
  end if;

  update public.obras
  set visualizacoes = coalesce(visualizacoes, 0) + 1
  where id = obra_id_param
    and coalesce(publicado, false) = true
  returning coalesce(visualizacoes, 0)
  into total_visualizacoes;

  return coalesce(total_visualizacoes, 0);
end;
$$;

revoke all on function public.incrementar_visualizacao_obra(uuid)
  from public;

revoke all on function public.incrementar_visualizacao_obra(uuid)
  from anon;

revoke all on function public.incrementar_visualizacao_obra(uuid)
  from authenticated;

grant execute on function public.incrementar_visualizacao_obra(uuid)
  to anon, authenticated;

-- ============================================================
-- TABELAS: COMUNIDADE
-- ============================================================

create table if not exists public.comunidade_posts (
  id uuid primary key default gen_random_uuid(),
  autor_id uuid not null references auth.users(id) on delete cascade,
  autor_nome text not null default '',
  categoria text not null default 'Geral',
  tipo_publicacao text default 'Discussão',
  tem_spoiler boolean not null default false,
  texto text not null,
  obra_relacionada text,
  criado_em timestamptz not null default now(),
  fixado boolean not null default false,
  fixado_em timestamptz,
  fixado_por uuid references auth.users(id) on delete set null
);

alter table if exists public.comunidade_posts add column if not exists autor_id uuid;
alter table if exists public.comunidade_posts add column if not exists autor_nome text default '';
alter table if exists public.comunidade_posts add column if not exists categoria text default 'Geral';
alter table if exists public.comunidade_posts add column if not exists tipo_publicacao text default 'Discussão';
alter table if exists public.comunidade_posts add column if not exists tem_spoiler boolean default false;
alter table if exists public.comunidade_posts add column if not exists texto text;
alter table if exists public.comunidade_posts add column if not exists obra_relacionada text;
alter table if exists public.comunidade_posts add column if not exists criado_em timestamptz default now();
alter table if exists public.comunidade_posts add column if not exists fixado boolean default false;
alter table if exists public.comunidade_posts add column if not exists fixado_em timestamptz;
alter table if exists public.comunidade_posts add column if not exists fixado_por uuid;

create table if not exists public.comunidade_comentarios (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.comunidade_posts(id) on delete cascade,
  autor_id uuid not null references auth.users(id) on delete cascade,
  autor_nome text not null default '',
  texto text not null,
  criado_em timestamptz not null default now()
);

alter table if exists public.comunidade_comentarios add column if not exists post_id uuid;
alter table if exists public.comunidade_comentarios add column if not exists autor_id uuid;
alter table if exists public.comunidade_comentarios add column if not exists autor_nome text default '';
alter table if exists public.comunidade_comentarios add column if not exists texto text;
alter table if exists public.comunidade_comentarios add column if not exists criado_em timestamptz default now();

create table if not exists public.comunidade_curtidas (
  post_id uuid not null references public.comunidade_posts(id) on delete cascade,
  usuario_id uuid not null references auth.users(id) on delete cascade,
  criado_em timestamptz not null default now(),
  primary key (post_id, usuario_id)
);

alter table if exists public.comunidade_curtidas add column if not exists post_id uuid;
alter table if exists public.comunidade_curtidas add column if not exists usuario_id uuid;
alter table if exists public.comunidade_curtidas add column if not exists criado_em timestamptz default now();

create table if not exists public.comunidade_comentario_curtidas (
  comentario_id uuid not null references public.comunidade_comentarios(id) on delete cascade,
  usuario_id uuid not null references auth.users(id) on delete cascade,
  criado_em timestamptz not null default now(),
  primary key (comentario_id, usuario_id)
);

alter table if exists public.comunidade_comentario_curtidas add column if not exists comentario_id uuid;
alter table if exists public.comunidade_comentario_curtidas add column if not exists usuario_id uuid;
alter table if exists public.comunidade_comentario_curtidas add column if not exists criado_em timestamptz default now();

create table if not exists public.comunidade_enquete_votos (
  post_id uuid not null references public.comunidade_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  opcao text not null,
  criado_em timestamptz not null default now(),
  primary key (post_id, user_id)
);

alter table if exists public.comunidade_enquete_votos add column if not exists post_id uuid;
alter table if exists public.comunidade_enquete_votos add column if not exists user_id uuid;
alter table if exists public.comunidade_enquete_votos add column if not exists opcao text;
alter table if exists public.comunidade_enquete_votos add column if not exists criado_em timestamptz default now();


create table if not exists public.comunidade_salvos (
  post_id uuid not null references public.comunidade_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  criado_em timestamptz not null default now(),
  primary key (post_id, user_id)
);

alter table if exists public.comunidade_salvos add column if not exists post_id uuid;
alter table if exists public.comunidade_salvos add column if not exists user_id uuid;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'comunidade_salvos'
      and column_name = 'usuario_id'
  ) then
    execute 'update public.comunidade_salvos set user_id = usuario_id where user_id is null and usuario_id is not null';
  end if;
end $$;
alter table if exists public.comunidade_salvos add column if not exists criado_em timestamptz default now();

create table if not exists public.comunidade_post_salvos (
  post_id uuid not null references public.comunidade_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  criado_em timestamptz not null default now(),
  primary key (post_id, user_id)
);

alter table if exists public.comunidade_post_salvos add column if not exists post_id uuid;
alter table if exists public.comunidade_post_salvos add column if not exists user_id uuid;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'comunidade_post_salvos'
      and column_name = 'usuario_id'
  ) then
    execute 'update public.comunidade_post_salvos set user_id = usuario_id where user_id is null and usuario_id is not null';
  end if;
end $$;
alter table if exists public.comunidade_post_salvos add column if not exists criado_em timestamptz default now();

create or replace function public.sincronizar_comunidade_salvos_user_id()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.user_id is null and new.usuario_id is not null then
    new.user_id := new.usuario_id;
  end if;

  if new.usuario_id is null and new.user_id is not null then
    new.usuario_id := new.user_id;
  end if;

  return new;
end;
$$;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'comunidade_salvos'
      and column_name = 'usuario_id'
  ) then
    drop trigger if exists comunidade_salvos_sync_user_id on public.comunidade_salvos;
    create trigger comunidade_salvos_sync_user_id
    before insert or update on public.comunidade_salvos
    for each row
    execute function public.sincronizar_comunidade_salvos_user_id();
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'comunidade_post_salvos'
      and column_name = 'usuario_id'
  ) then
    drop trigger if exists comunidade_post_salvos_sync_user_id on public.comunidade_post_salvos;
    create trigger comunidade_post_salvos_sync_user_id
    before insert or update on public.comunidade_post_salvos
    for each row
    execute function public.sincronizar_comunidade_salvos_user_id();
  end if;
end $$;


create table if not exists public.comunidade_comentarios_salvos (
  comentario_id uuid not null references public.comunidade_comentarios(id) on delete cascade,
  usuario_id uuid not null references auth.users(id) on delete cascade,
  criado_em timestamptz not null default now(),
  primary key (comentario_id, usuario_id)
);

alter table if exists public.comunidade_comentarios_salvos add column if not exists comentario_id uuid;
alter table if exists public.comunidade_comentarios_salvos add column if not exists usuario_id uuid;
alter table if exists public.comunidade_comentarios_salvos add column if not exists criado_em timestamptz default now();

create table if not exists public.comunidade_denuncias (
  id uuid primary key default gen_random_uuid(),
  alvo_tipo text not null,
  alvo_id text not null,
  denunciante_id uuid not null references auth.users(id) on delete cascade,
  motivo text not null default 'Conteúdo inadequado',
  detalhe text not null default '',
  status text not null default 'pendente',
  arquivada boolean not null default false,
  observacao_admin text not null default '',
  analisado_por uuid references auth.users(id) on delete set null,
  analisado_em timestamptz,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

alter table if exists public.comunidade_denuncias add column if not exists alvo_tipo text;
alter table if exists public.comunidade_denuncias add column if not exists alvo_id text;
alter table if exists public.comunidade_denuncias add column if not exists denunciante_id uuid;
alter table if exists public.comunidade_denuncias add column if not exists motivo text default 'Conteúdo inadequado';
alter table if exists public.comunidade_denuncias add column if not exists detalhe text default '';
alter table if exists public.comunidade_denuncias add column if not exists status text default 'pendente';
alter table if exists public.comunidade_denuncias add column if not exists arquivada boolean default false;
alter table if exists public.comunidade_denuncias add column if not exists observacao_admin text default '';
alter table if exists public.comunidade_denuncias add column if not exists analisado_por uuid;
alter table if exists public.comunidade_denuncias add column if not exists analisado_em timestamptz;
alter table if exists public.comunidade_denuncias add column if not exists criado_em timestamptz default now();
alter table if exists public.comunidade_denuncias add column if not exists atualizado_em timestamptz default now();

-- ============================================================
-- TABELAS: PERFIS / TOP 5
-- ============================================================

create table if not exists public.top5_curtidas (
  perfil_user_id uuid not null references auth.users(id) on delete cascade,
  usuario_id uuid not null references auth.users(id) on delete cascade,
  criado_em timestamptz not null default now(),
  primary key (perfil_user_id, usuario_id)
);

alter table if exists public.top5_curtidas add column if not exists perfil_user_id uuid;
alter table if exists public.top5_curtidas add column if not exists usuario_id uuid;
alter table if exists public.top5_curtidas add column if not exists criado_em timestamptz default now();

create table if not exists public.denuncias_perfis (
  id uuid primary key default gen_random_uuid(),
  denunciante_id uuid not null references auth.users(id) on delete cascade,
  denunciado_id uuid not null references auth.users(id) on delete cascade,
  perfil_nome text not null default '',
  perfil_url text not null default '',
  motivo text not null default 'outro',
  descricao text not null default '',
  status text not null default 'pendente',
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

alter table if exists public.denuncias_perfis add column if not exists denunciante_id uuid;
alter table if exists public.denuncias_perfis add column if not exists denunciado_id uuid;
alter table if exists public.denuncias_perfis add column if not exists perfil_nome text default '';
alter table if exists public.denuncias_perfis add column if not exists perfil_url text default '';
alter table if exists public.denuncias_perfis add column if not exists motivo text default 'outro';
alter table if exists public.denuncias_perfis add column if not exists descricao text default '';
alter table if exists public.denuncias_perfis add column if not exists status text default 'pendente';
alter table if exists public.denuncias_perfis add column if not exists criado_em timestamptz default now();
alter table if exists public.denuncias_perfis add column if not exists atualizado_em timestamptz default now();

-- ============================================================
-- ÍNDICES / CONSTRAINTS SEM QUEBRAR TABELAS EXISTENTES
-- ============================================================


-- Limpeza defensiva antes dos índices únicos. Evita migration quebrar
-- se já existir dado duplicado de versões antigas/fallbacks.
delete from public.comunidade_curtidas a
using public.comunidade_curtidas b
where a.ctid < b.ctid
  and a.post_id = b.post_id
  and a.usuario_id = b.usuario_id;

delete from public.comunidade_comentario_curtidas a
using public.comunidade_comentario_curtidas b
where a.ctid < b.ctid
  and a.comentario_id = b.comentario_id
  and a.usuario_id = b.usuario_id;

delete from public.comunidade_enquete_votos a
using public.comunidade_enquete_votos b
where a.ctid < b.ctid
  and a.post_id = b.post_id
  and a.user_id = b.user_id;

delete from public.comunidade_salvos a
using public.comunidade_salvos b
where a.ctid < b.ctid
  and a.post_id = b.post_id
  and a.user_id = b.user_id;

delete from public.comunidade_post_salvos a
using public.comunidade_post_salvos b
where a.ctid < b.ctid
  and a.post_id = b.post_id
  and a.user_id = b.user_id;

delete from public.comunidade_comentarios_salvos a
using public.comunidade_comentarios_salvos b
where a.ctid < b.ctid
  and a.comentario_id = b.comentario_id
  and a.usuario_id = b.usuario_id;

delete from public.comunidade_denuncias a
using public.comunidade_denuncias b
where a.ctid < b.ctid
  and a.alvo_tipo = b.alvo_tipo
  and a.alvo_id = b.alvo_id
  and a.denunciante_id = b.denunciante_id;

delete from public.denuncias_perfis a
using public.denuncias_perfis b
where a.ctid < b.ctid
  and a.denunciante_id = b.denunciante_id
  and a.denunciado_id = b.denunciado_id;

delete from public.top5_curtidas a
using public.top5_curtidas b
where a.ctid < b.ctid
  and a.perfil_user_id = b.perfil_user_id
  and a.usuario_id = b.usuario_id;

create index if not exists comunidade_posts_criado_em_idx on public.comunidade_posts (criado_em desc);
create index if not exists comunidade_posts_autor_id_idx on public.comunidade_posts (autor_id);
create index if not exists comunidade_posts_fixado_idx on public.comunidade_posts (fixado, fixado_em desc);

create index if not exists comunidade_comentarios_post_id_idx on public.comunidade_comentarios (post_id);
create index if not exists comunidade_comentarios_autor_id_idx on public.comunidade_comentarios (autor_id);
create index if not exists comunidade_curtidas_post_id_idx on public.comunidade_curtidas (post_id);
create index if not exists comunidade_comentario_curtidas_comentario_id_idx on public.comunidade_comentario_curtidas (comentario_id);
create index if not exists comunidade_enquete_votos_post_id_idx on public.comunidade_enquete_votos (post_id);
create index if not exists comunidade_salvos_post_id_idx on public.comunidade_salvos (post_id);
create index if not exists comunidade_post_salvos_post_id_idx on public.comunidade_post_salvos (post_id);
create index if not exists comunidade_comentarios_salvos_comentario_id_idx on public.comunidade_comentarios_salvos (comentario_id);

create unique index if not exists comunidade_curtidas_unica_idx on public.comunidade_curtidas (post_id, usuario_id);
create unique index if not exists comunidade_comentario_curtidas_unica_idx on public.comunidade_comentario_curtidas (comentario_id, usuario_id);
create unique index if not exists comunidade_enquete_votos_unico_idx on public.comunidade_enquete_votos (post_id, user_id);
drop index if exists public.comunidade_salvos_unico_idx;
create unique index if not exists comunidade_salvos_unico_idx on public.comunidade_salvos (post_id, user_id);
drop index if exists public.comunidade_post_salvos_unico_idx;
create unique index if not exists comunidade_post_salvos_unico_idx on public.comunidade_post_salvos (post_id, user_id);
create unique index if not exists comunidade_comentarios_salvos_unico_idx on public.comunidade_comentarios_salvos (comentario_id, usuario_id);
create unique index if not exists comunidade_denuncias_unica_idx on public.comunidade_denuncias (alvo_tipo, alvo_id, denunciante_id);

create index if not exists denuncias_perfis_status_idx on public.denuncias_perfis (status, criado_em desc);
create index if not exists denuncias_perfis_denunciante_idx on public.denuncias_perfis (denunciante_id);
create index if not exists denuncias_perfis_denunciado_idx on public.denuncias_perfis (denunciado_id);
create unique index if not exists denuncias_perfis_unica_idx on public.denuncias_perfis (denunciante_id, denunciado_id);

create index if not exists top5_curtidas_perfil_user_id_idx on public.top5_curtidas (perfil_user_id);
create unique index if not exists top5_curtidas_unica_idx on public.top5_curtidas (perfil_user_id, usuario_id);

-- ============================================================
-- TRIGGER: FIXAÇÃO DE POSTS
-- ============================================================

create or replace function public.definir_fixacao_comunidade_post()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' and new.fixado is distinct from old.fixado then
    if coalesce(new.fixado, false) = true then
      new.fixado_em := coalesce(new.fixado_em, now());
      new.fixado_por := coalesce(new.fixado_por, auth.uid());
    else
      new.fixado_em := null;
      new.fixado_por := null;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists comunidade_posts_definir_fixacao on public.comunidade_posts;
create trigger comunidade_posts_definir_fixacao
before update of fixado on public.comunidade_posts
for each row
execute function public.definir_fixacao_comunidade_post();

-- ============================================================
-- RLS
-- ============================================================

alter table public.comunidade_posts enable row level security;
alter table public.comunidade_comentarios enable row level security;
alter table public.comunidade_curtidas enable row level security;
alter table public.comunidade_comentario_curtidas enable row level security;
alter table public.comunidade_enquete_votos enable row level security;
alter table public.comunidade_salvos enable row level security;
alter table public.comunidade_post_salvos enable row level security;
alter table public.comunidade_comentarios_salvos enable row level security;
alter table public.comunidade_denuncias enable row level security;
alter table public.top5_curtidas enable row level security;
alter table public.denuncias_perfis enable row level security;

-- comunidade_posts

drop policy if exists "comunidade_posts_select_publico" on public.comunidade_posts;
drop policy if exists "comunidade_posts_insert_proprio" on public.comunidade_posts;
drop policy if exists "comunidade_posts_update_proprio" on public.comunidade_posts;
drop policy if exists "comunidade_posts_update_admin" on public.comunidade_posts;
drop policy if exists "comunidade_posts_delete_proprio_ou_admin" on public.comunidade_posts;

create policy "comunidade_posts_select_publico"
  on public.comunidade_posts
  for select
  using (true);

create policy "comunidade_posts_insert_proprio"
  on public.comunidade_posts
  for insert
  with check (
    auth.uid() is not null
    and autor_id::text = auth.uid()::text
    and coalesce(fixado, false) = false
    and fixado_em is null
    and fixado_por is null
  );

create policy "comunidade_posts_update_proprio"
  on public.comunidade_posts
  for update
  using (
    auth.uid() is not null
    and autor_id::text = auth.uid()::text
    and coalesce(fixado, false) = false
    and fixado_em is null
    and fixado_por is null
  )
  with check (
    auth.uid() is not null
    and autor_id::text = auth.uid()::text
    and coalesce(fixado, false) = false
    and fixado_em is null
    and fixado_por is null
  );

create policy "comunidade_posts_update_admin"
  on public.comunidade_posts
  for update
  using (public.usuario_e_admin())
  with check (public.usuario_e_admin());

create policy "comunidade_posts_delete_proprio_ou_admin"
  on public.comunidade_posts
  for delete
  using (
    public.usuario_e_admin()
    or (
      auth.uid() is not null
      and autor_id::text = auth.uid()::text
      and coalesce(fixado, false) = false
      and fixado_em is null
      and fixado_por is null
    )
  );

-- comunidade_comentarios

drop policy if exists "comunidade_comentarios_select_publico" on public.comunidade_comentarios;
drop policy if exists "comunidade_comentarios_insert_proprio" on public.comunidade_comentarios;
drop policy if exists "comunidade_comentarios_update_proprio_ou_admin" on public.comunidade_comentarios;
drop policy if exists "comunidade_comentarios_delete_proprio_ou_admin" on public.comunidade_comentarios;

create policy "comunidade_comentarios_select_publico"
  on public.comunidade_comentarios
  for select
  using (true);

create policy "comunidade_comentarios_insert_proprio"
  on public.comunidade_comentarios
  for insert
  with check (auth.uid() is not null and autor_id::text = auth.uid()::text);

create policy "comunidade_comentarios_update_proprio_ou_admin"
  on public.comunidade_comentarios
  for update
  using (
    public.usuario_e_admin()
    or (auth.uid() is not null and autor_id::text = auth.uid()::text)
  )
  with check (
    public.usuario_e_admin()
    or (auth.uid() is not null and autor_id::text = auth.uid()::text)
  );

create policy "comunidade_comentarios_delete_proprio_ou_admin"
  on public.comunidade_comentarios
  for delete
  using (
    public.usuario_e_admin()
    or (auth.uid() is not null and autor_id::text = auth.uid()::text)
  );

-- comunidade_curtidas

drop policy if exists "comunidade_curtidas_select_publico" on public.comunidade_curtidas;
drop policy if exists "comunidade_curtidas_insert_proprio" on public.comunidade_curtidas;
drop policy if exists "comunidade_curtidas_delete_proprio" on public.comunidade_curtidas;

create policy "comunidade_curtidas_select_publico"
  on public.comunidade_curtidas
  for select
  using (true);

create policy "comunidade_curtidas_insert_proprio"
  on public.comunidade_curtidas
  for insert
  with check (auth.uid() is not null and usuario_id::text = auth.uid()::text);

create policy "comunidade_curtidas_delete_proprio"
  on public.comunidade_curtidas
  for delete
  using (auth.uid() is not null and usuario_id::text = auth.uid()::text);

-- comunidade_comentario_curtidas

drop policy if exists "comunidade_comentario_curtidas_select_publico" on public.comunidade_comentario_curtidas;
drop policy if exists "comunidade_comentario_curtidas_insert_proprio" on public.comunidade_comentario_curtidas;
drop policy if exists "comunidade_comentario_curtidas_delete_proprio" on public.comunidade_comentario_curtidas;

create policy "comunidade_comentario_curtidas_select_publico"
  on public.comunidade_comentario_curtidas
  for select
  using (true);

create policy "comunidade_comentario_curtidas_insert_proprio"
  on public.comunidade_comentario_curtidas
  for insert
  with check (auth.uid() is not null and usuario_id::text = auth.uid()::text);

create policy "comunidade_comentario_curtidas_delete_proprio"
  on public.comunidade_comentario_curtidas
  for delete
  using (auth.uid() is not null and usuario_id::text = auth.uid()::text);

-- comunidade_enquete_votos

drop policy if exists "comunidade_enquete_votos_select_publico" on public.comunidade_enquete_votos;
drop policy if exists "comunidade_enquete_votos_insert_proprio" on public.comunidade_enquete_votos;
drop policy if exists "comunidade_enquete_votos_delete_proprio_ou_admin" on public.comunidade_enquete_votos;

create policy "comunidade_enquete_votos_select_publico"
  on public.comunidade_enquete_votos
  for select
  using (true);

create policy "comunidade_enquete_votos_insert_proprio"
  on public.comunidade_enquete_votos
  for insert
  with check (auth.uid() is not null and user_id::text = auth.uid()::text);

create policy "comunidade_enquete_votos_delete_proprio_ou_admin"
  on public.comunidade_enquete_votos
  for delete
  using (
    public.usuario_e_admin()
    or (auth.uid() is not null and user_id::text = auth.uid()::text)
  );


-- comunidade_salvos / comunidade_post_salvos / comunidade_comentarios_salvos

-- As três tabelas existem por compatibilidade com versões diferentes da tela
-- Comunidade/Admin. Select público permite contagem; insert/delete continuam próprios.
drop policy if exists "comunidade_salvos_select_publico" on public.comunidade_salvos;
drop policy if exists "comunidade_salvos_insert_proprio" on public.comunidade_salvos;
drop policy if exists "comunidade_salvos_delete_proprio" on public.comunidade_salvos;

create policy "comunidade_salvos_select_publico"
  on public.comunidade_salvos
  for select
  using (true);

create policy "comunidade_salvos_insert_proprio"
  on public.comunidade_salvos
  for insert
  with check (auth.uid() is not null and user_id::text = auth.uid()::text);

create policy "comunidade_salvos_delete_proprio"
  on public.comunidade_salvos
  for delete
  using (auth.uid() is not null and user_id::text = auth.uid()::text);

drop policy if exists "comunidade_post_salvos_select_publico" on public.comunidade_post_salvos;
drop policy if exists "comunidade_post_salvos_insert_proprio" on public.comunidade_post_salvos;
drop policy if exists "comunidade_post_salvos_delete_proprio" on public.comunidade_post_salvos;

create policy "comunidade_post_salvos_select_publico"
  on public.comunidade_post_salvos
  for select
  using (true);

create policy "comunidade_post_salvos_insert_proprio"
  on public.comunidade_post_salvos
  for insert
  with check (auth.uid() is not null and user_id::text = auth.uid()::text);

create policy "comunidade_post_salvos_delete_proprio"
  on public.comunidade_post_salvos
  for delete
  using (auth.uid() is not null and user_id::text = auth.uid()::text);

drop policy if exists "comunidade_comentarios_salvos_select_publico" on public.comunidade_comentarios_salvos;
drop policy if exists "comunidade_comentarios_salvos_insert_proprio" on public.comunidade_comentarios_salvos;
drop policy if exists "comunidade_comentarios_salvos_delete_proprio" on public.comunidade_comentarios_salvos;

create policy "comunidade_comentarios_salvos_select_publico"
  on public.comunidade_comentarios_salvos
  for select
  using (true);

create policy "comunidade_comentarios_salvos_insert_proprio"
  on public.comunidade_comentarios_salvos
  for insert
  with check (auth.uid() is not null and usuario_id::text = auth.uid()::text);

create policy "comunidade_comentarios_salvos_delete_proprio"
  on public.comunidade_comentarios_salvos
  for delete
  using (auth.uid() is not null and usuario_id::text = auth.uid()::text);

-- comunidade_denuncias

drop policy if exists "comunidade_denuncias_select_proprias_ou_admin" on public.comunidade_denuncias;
drop policy if exists "comunidade_denuncias_select_admin" on public.comunidade_denuncias;
drop policy if exists "comunidade_denuncias_insert_propria" on public.comunidade_denuncias;
drop policy if exists "comunidade_denuncias_update_admin" on public.comunidade_denuncias;
drop policy if exists "comunidade_denuncias_delete_admin" on public.comunidade_denuncias;

create policy "comunidade_denuncias_select_admin"
  on public.comunidade_denuncias
  for select
  using (
    auth.uid() is not null
    and public.usuario_e_admin()
  );

create policy "comunidade_denuncias_insert_propria"
  on public.comunidade_denuncias
  for insert
  with check (auth.uid() is not null and denunciante_id::text = auth.uid()::text);

create policy "comunidade_denuncias_update_admin"
  on public.comunidade_denuncias
  for update
  using (public.usuario_e_admin())
  with check (public.usuario_e_admin());

create policy "comunidade_denuncias_delete_admin"
  on public.comunidade_denuncias
  for delete
  using (public.usuario_e_admin());

-- top5_curtidas

drop policy if exists "top5_curtidas_select_publico" on public.top5_curtidas;
drop policy if exists "top5_curtidas_insert_proprio" on public.top5_curtidas;
drop policy if exists "top5_curtidas_delete_proprio" on public.top5_curtidas;

create policy "top5_curtidas_select_publico"
  on public.top5_curtidas
  for select
  using (true);

create policy "top5_curtidas_insert_proprio"
  on public.top5_curtidas
  for insert
  with check (
    auth.uid() is not null
    and usuario_id::text = auth.uid()::text
    and perfil_user_id::text <> auth.uid()::text
  );

create policy "top5_curtidas_delete_proprio"
  on public.top5_curtidas
  for delete
  using (auth.uid() is not null and usuario_id::text = auth.uid()::text);

-- denuncias_perfis

drop policy if exists "denuncias_perfis_select_proprias_ou_admin" on public.denuncias_perfis;
drop policy if exists "denuncias_perfis_select_admin" on public.denuncias_perfis;
drop policy if exists "denuncias_perfis_insert_propria" on public.denuncias_perfis;
drop policy if exists "denuncias_perfis_update_admin" on public.denuncias_perfis;
drop policy if exists "denuncias_perfis_delete_admin" on public.denuncias_perfis;

create policy "denuncias_perfis_select_admin"
  on public.denuncias_perfis
  for select
  using (
    auth.uid() is not null
    and public.usuario_e_admin()
  );

create policy "denuncias_perfis_insert_propria"
  on public.denuncias_perfis
  for insert
  with check (
    auth.uid() is not null
    and denunciante_id::text = auth.uid()::text
    and denunciante_id::text <> denunciado_id::text
  );

create policy "denuncias_perfis_update_admin"
  on public.denuncias_perfis
  for update
  using (public.usuario_e_admin())
  with check (public.usuario_e_admin());

create policy "denuncias_perfis_delete_admin"
  on public.denuncias_perfis
  for delete
  using (public.usuario_e_admin());

-- ============================================================
-- LIMPEZA DE POLICIES ANTIGAS DESTAS TABELAS
-- ============================================================

create temp table historietas_rls_keep_comunidade (
  tabela text not null,
  policy_name text not null
) on commit drop;

insert into historietas_rls_keep_comunidade (tabela, policy_name)
values
  ('comunidade_posts', 'comunidade_posts_select_publico'),
  ('comunidade_posts', 'comunidade_posts_insert_proprio'),
  ('comunidade_posts', 'comunidade_posts_update_proprio'),
  ('comunidade_posts', 'comunidade_posts_update_admin'),
  ('comunidade_posts', 'comunidade_posts_delete_proprio_ou_admin'),
  ('comunidade_comentarios', 'comunidade_comentarios_select_publico'),
  ('comunidade_comentarios', 'comunidade_comentarios_insert_proprio'),
  ('comunidade_comentarios', 'comunidade_comentarios_update_proprio_ou_admin'),
  ('comunidade_comentarios', 'comunidade_comentarios_delete_proprio_ou_admin'),
  ('comunidade_curtidas', 'comunidade_curtidas_select_publico'),
  ('comunidade_curtidas', 'comunidade_curtidas_insert_proprio'),
  ('comunidade_curtidas', 'comunidade_curtidas_delete_proprio'),
  ('comunidade_comentario_curtidas', 'comunidade_comentario_curtidas_select_publico'),
  ('comunidade_comentario_curtidas', 'comunidade_comentario_curtidas_insert_proprio'),
  ('comunidade_comentario_curtidas', 'comunidade_comentario_curtidas_delete_proprio'),
  ('comunidade_enquete_votos', 'comunidade_enquete_votos_select_publico'),
  ('comunidade_enquete_votos', 'comunidade_enquete_votos_insert_proprio'),
  ('comunidade_enquete_votos', 'comunidade_enquete_votos_delete_proprio_ou_admin'),
  ('comunidade_salvos', 'comunidade_salvos_select_publico'),
  ('comunidade_salvos', 'comunidade_salvos_insert_proprio'),
  ('comunidade_salvos', 'comunidade_salvos_delete_proprio'),
  ('comunidade_post_salvos', 'comunidade_post_salvos_select_publico'),
  ('comunidade_post_salvos', 'comunidade_post_salvos_insert_proprio'),
  ('comunidade_post_salvos', 'comunidade_post_salvos_delete_proprio'),
  ('comunidade_comentarios_salvos', 'comunidade_comentarios_salvos_select_publico'),
  ('comunidade_comentarios_salvos', 'comunidade_comentarios_salvos_insert_proprio'),
  ('comunidade_comentarios_salvos', 'comunidade_comentarios_salvos_delete_proprio'),
  ('comunidade_denuncias', 'comunidade_denuncias_select_admin'),
  ('comunidade_denuncias', 'comunidade_denuncias_insert_propria'),
  ('comunidade_denuncias', 'comunidade_denuncias_update_admin'),
  ('comunidade_denuncias', 'comunidade_denuncias_delete_admin'),
  ('top5_curtidas', 'top5_curtidas_select_publico'),
  ('top5_curtidas', 'top5_curtidas_insert_proprio'),
  ('top5_curtidas', 'top5_curtidas_delete_proprio'),
  ('denuncias_perfis', 'denuncias_perfis_select_admin'),
  ('denuncias_perfis', 'denuncias_perfis_insert_propria'),
  ('denuncias_perfis', 'denuncias_perfis_update_admin'),
  ('denuncias_perfis', 'denuncias_perfis_delete_admin');

do $$
declare
  policy_record record;
begin
  for policy_record in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        select distinct tabela
        from historietas_rls_keep_comunidade
      )
  loop
    if not exists (
      select 1
      from historietas_rls_keep_comunidade k
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

-- ============================================================
-- GRANTS
-- ============================================================

grant usage on schema public to anon, authenticated;

grant select on public.comunidade_posts to anon, authenticated;
grant select on public.comunidade_comentarios to anon, authenticated;
grant select on public.comunidade_curtidas to anon, authenticated;
grant select on public.comunidade_comentario_curtidas to anon, authenticated;
grant select on public.comunidade_enquete_votos to anon, authenticated;
grant select on public.comunidade_salvos to anon, authenticated;
grant select on public.comunidade_post_salvos to anon, authenticated;
grant select on public.comunidade_comentarios_salvos to anon, authenticated;
grant select on public.top5_curtidas to anon, authenticated;

grant insert, update, delete on public.comunidade_posts to authenticated;
grant insert, update, delete on public.comunidade_comentarios to authenticated;
grant insert, delete on public.comunidade_curtidas to authenticated;
grant insert, delete on public.comunidade_comentario_curtidas to authenticated;
grant insert, delete on public.comunidade_enquete_votos to authenticated;
grant insert, delete on public.comunidade_salvos to authenticated;
grant insert, delete on public.comunidade_post_salvos to authenticated;
grant insert, delete on public.comunidade_comentarios_salvos to authenticated;
grant insert, delete on public.top5_curtidas to authenticated;

grant select, insert, update, delete on public.comunidade_denuncias to authenticated;
grant select, insert, update, delete on public.denuncias_perfis to authenticated;

commit;