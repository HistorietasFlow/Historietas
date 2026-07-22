-- 20260722000100_visualizacoes_capitulos.sql
-- Separa visualizações da obra das leituras de cada capítulo.

begin;

create extension if not exists pgcrypto;

alter table if exists public.capitulos
  add column if not exists visualizacoes integer default 0;

update public.capitulos
set visualizacoes = 0
where visualizacoes is null;

alter table if exists public.capitulos
  alter column visualizacoes set default 0;

alter table if exists public.capitulos
  alter column visualizacoes set not null;

create index if not exists capitulos_visualizacoes_idx
  on public.capitulos (visualizacoes desc);

-- Registra no máximo uma visualização por visitante, capítulo e dia.
create table if not exists public.capitulo_visualizacoes_unicas (
  capitulo_id uuid not null references public.capitulos(id) on delete cascade,
  chave_visitante text not null,
  dia date not null default current_date,
  criada_em timestamptz not null default now(),
  primary key (capitulo_id, chave_visitante, dia)
);

create index if not exists capitulo_visualizacoes_unicas_dia_idx
  on public.capitulo_visualizacoes_unicas (dia desc);

alter table public.capitulo_visualizacoes_unicas enable row level security;

-- A tabela é interna. Somente o RPC SECURITY DEFINER grava nela.
revoke all on table public.capitulo_visualizacoes_unicas
  from public, anon, authenticated;

drop function if exists public.incrementar_visualizacao_capitulo(uuid);

create or replace function public.incrementar_visualizacao_capitulo(
  capitulo_id_param uuid
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total_visualizacoes integer := 0;
  v_linhas_inseridas integer := 0;
  v_usuario_id uuid := auth.uid();
  v_cabecalhos jsonb := '{}'::jsonb;
  v_ip_visitante text := null;
  v_user_agent text := null;
  v_chave_visitante text := null;
begin
  if capitulo_id_param is null then
    return 0;
  end if;

  select coalesce(c.visualizacoes, 0)
  into v_total_visualizacoes
  from public.capitulos as c
  inner join public.obras as o on o.id = c.obra_id
  where c.id = capitulo_id_param
    and coalesce(c.publicado, false) = true
    and coalesce(o.publicado, false) = true
  limit 1;

  if not found then
    return 0;
  end if;

  if v_usuario_id is not null then
    v_chave_visitante := 'usuario:' || v_usuario_id::text;
  else
    begin
      v_cabecalhos := coalesce(
        nullif(current_setting('request.headers', true), '')::jsonb,
        '{}'::jsonb
      );
    exception
      when others then
        v_cabecalhos := '{}'::jsonb;
    end;

    v_ip_visitante := nullif(
      trim(
        coalesce(
          v_cabecalhos ->> 'cf-connecting-ip',
          split_part(
            coalesce(v_cabecalhos ->> 'x-forwarded-for', ''),
            ',',
            1
          ),
          v_cabecalhos ->> 'x-real-ip',
          ''
        )
      ),
      ''
    );

    v_user_agent := nullif(
      trim(coalesce(v_cabecalhos ->> 'user-agent', '')),
      ''
    );

    if v_ip_visitante is null then
      return v_total_visualizacoes;
    end if;

    v_chave_visitante :=
      'anon:' ||
      encode(
        digest(
          v_ip_visitante || '|' || coalesce(v_user_agent, ''),
          'sha256'
        ),
        'hex'
      );
  end if;

  insert into public.capitulo_visualizacoes_unicas (
    capitulo_id,
    chave_visitante,
    dia
  )
  values (
    capitulo_id_param,
    v_chave_visitante,
    current_date
  )
  on conflict (capitulo_id, chave_visitante, dia) do nothing;

  get diagnostics v_linhas_inseridas = row_count;

  if v_linhas_inseridas = 0 then
    return v_total_visualizacoes;
  end if;

  update public.capitulos as c
  set visualizacoes = coalesce(c.visualizacoes, 0) + 1
  where c.id = capitulo_id_param
    and coalesce(c.publicado, false) = true
  returning coalesce(c.visualizacoes, 0)
  into v_total_visualizacoes;

  return coalesce(v_total_visualizacoes, 0);
end;
$$;

revoke all on function public.incrementar_visualizacao_capitulo(uuid)
  from public;

revoke all on function public.incrementar_visualizacao_capitulo(uuid)
  from anon;

revoke all on function public.incrementar_visualizacao_capitulo(uuid)
  from authenticated;

grant execute on function public.incrementar_visualizacao_capitulo(uuid)
  to anon, authenticated;

commit;