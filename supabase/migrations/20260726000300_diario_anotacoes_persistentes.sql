-- Garante que as anotações do Diário sejam realmente salvas e possam ser
-- carregadas novamente pelo próprio usuário.
create extension if not exists pgcrypto;

create table if not exists public.diario_anotacoes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  obra_id uuid not null references public.obras(id) on delete cascade,
  tipo text not null,
  texto text not null,
  visibilidade text not null default 'privado',
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

-- Compatibilidade caso a tabela já exista, mas esteja incompleta.
alter table public.diario_anotacoes
  add column if not exists id uuid default gen_random_uuid(),
  add column if not exists user_id uuid,
  add column if not exists obra_id uuid,
  add column if not exists tipo text,
  add column if not exists texto text,
  add column if not exists visibilidade text default 'privado',
  add column if not exists criado_em timestamptz default now(),
  add column if not exists atualizado_em timestamptz default now();

update public.diario_anotacoes
set visibilidade = 'privado'
where visibilidade is null
   or visibilidade not in ('privado', 'publico', 'parcial');

update public.diario_anotacoes
set criado_em = coalesce(criado_em, now()),
    atualizado_em = coalesce(atualizado_em, criado_em, now());

-- Mantém apenas a versão mais recente de cada anotação antes de criar
-- a restrição usada pelo upsert do site.
with repetidas as (
  select
    id,
    row_number() over (
      partition by user_id, obra_id, tipo
      order by coalesce(atualizado_em, criado_em) desc nulls last, id desc
    ) as ordem
  from public.diario_anotacoes
  where user_id is not null
    and obra_id is not null
    and tipo is not null
)
delete from public.diario_anotacoes anotacao
using repetidas
where anotacao.id = repetidas.id
  and repetidas.ordem > 1;

create unique index if not exists diario_anotacoes_usuario_obra_tipo_unico
  on public.diario_anotacoes (user_id, obra_id, tipo);

alter table public.diario_anotacoes enable row level security;

drop policy if exists "diario_anotacoes_ler" on public.diario_anotacoes;
drop policy if exists "diario_anotacoes_inserir" on public.diario_anotacoes;
drop policy if exists "diario_anotacoes_atualizar" on public.diario_anotacoes;
drop policy if exists "diario_anotacoes_remover" on public.diario_anotacoes;

-- O próprio usuário sempre consegue reler suas anotações.
-- Anotações públicas/parciais também podem aparecer para visitantes.
create policy "diario_anotacoes_ler"
on public.diario_anotacoes
for select
to authenticated, anon
using (
  auth.uid() = user_id
  or visibilidade in ('publico', 'parcial')
);

create policy "diario_anotacoes_inserir"
on public.diario_anotacoes
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "diario_anotacoes_atualizar"
on public.diario_anotacoes
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "diario_anotacoes_remover"
on public.diario_anotacoes
for delete
to authenticated
using (auth.uid() = user_id);

grant select on public.diario_anotacoes to anon;
grant select, insert, update, delete on public.diario_anotacoes to authenticated;