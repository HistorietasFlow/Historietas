-- Bloqueia notificacoes relacionadas a obras 18+ enquanto o acesso adulto
-- estiver temporariamente desativado no Historietas.
--
-- Objetivos:
-- 1. Recuperar obra_id em notificacoes antigas quando possivel.
-- 2. Impedir novas notificacoes 18+ de serem persistidas.
-- 3. Falhar fechado para notificacoes de obra/capitulo sem obra identificavel.
-- 4. Reforcar a RLS para que conteudo 18+ nao seja retornado ao navegador.
--
-- Quando o acesso 18+ for reativado no produto, esta regra devera ser
-- revisada por uma migration posterior.

begin;

-- ============================================================
-- 1. BACKFILL: CAPITULO -> OBRA
-- ============================================================

update public.notificacoes notificacao
set obra_id = capitulo.obra_id
from public.capitulos capitulo
where notificacao.obra_id is null
  and notificacao.capitulo_id is not null
  and capitulo.id = notificacao.capitulo_id
  and capitulo.obra_id is not null;

-- ============================================================
-- 2. BACKFILL: LINK /obra/<slug-ou-id> -> OBRA
-- ============================================================

with referencias as (
  select
    notificacao.id,
    substring(
      notificacao.link
      from '^/obra/([^/?#]+)'
    ) as referencia
  from public.notificacoes notificacao
  where notificacao.obra_id is null
    and coalesce(notificacao.link, '') ~ '^/obra/[^/?#]+'
),
resolvidas as (
  select
    referencia_notificacao.id,
    (
      select obra.id
      from public.obras obra
      where obra.id::text = referencia_notificacao.referencia
         or obra.slug = referencia_notificacao.referencia
      order by
        case
          when obra.id::text = referencia_notificacao.referencia then 0
          else 1
        end,
        obra.id
      limit 1
    ) as obra_id
  from referencias referencia_notificacao
)
update public.notificacoes notificacao
set obra_id = resolvida.obra_id
from resolvidas resolvida
where notificacao.id = resolvida.id
  and notificacao.obra_id is null
  and resolvida.obra_id is not null;

-- ============================================================
-- 3. BACKFILL: notificacao_id de comentario em obra -> OBRA
-- ============================================================

with referencias as (
  select
    notificacao.id,
    substring(
      notificacao.notificacao_id
      from '^(?:resposta-)?comentario-obra:([0-9a-fA-F-]{36})$'
    )::uuid as comentario_id
  from public.notificacoes notificacao
  where notificacao.obra_id is null
    and coalesce(notificacao.notificacao_id, '') ~
      '^(?:resposta-)?comentario-obra:[0-9a-fA-F-]{36}$'
)
update public.notificacoes notificacao
set obra_id = comentario.obra_id
from referencias referencia_notificacao
join public.comentarios_obras comentario
  on comentario.id = referencia_notificacao.comentario_id
where notificacao.id = referencia_notificacao.id
  and notificacao.obra_id is null
  and comentario.obra_id is not null;

-- ============================================================
-- 4. BACKFILL: notificacao_id de curtida em obra -> OBRA
-- ============================================================

with referencias as (
  select
    notificacao.id,
    substring(
      notificacao.notificacao_id
      from '^curtida-obra:([0-9a-fA-F-]{36}):[0-9a-fA-F-]{36}$'
    )::uuid as obra_id
  from public.notificacoes notificacao
  where notificacao.obra_id is null
    and coalesce(notificacao.notificacao_id, '') ~
      '^curtida-obra:[0-9a-fA-F-]{36}:[0-9a-fA-F-]{36}$'
)
update public.notificacoes notificacao
set obra_id = referencia_notificacao.obra_id
from referencias referencia_notificacao
where notificacao.id = referencia_notificacao.id
  and notificacao.obra_id is null
  and exists (
    select 1
    from public.obras obra
    where obra.id = referencia_notificacao.obra_id
  );

-- ============================================================
-- 5. FUNCAO CENTRAL DE RESOLUCAO / PERMISSAO
-- ============================================================

create or replace function public.notificacao_conteudo_18_liberado(
  p_obra_id uuid,
  p_capitulo_id uuid,
  p_link text,
  p_tipo text
)
returns boolean
language plpgsql
stable
security definer
set search_path to 'pg_catalog', 'public', 'pg_temp'
as $$
declare
  v_obra_id uuid := p_obra_id;
  v_referencia text;
  v_tipo text := lower(btrim(coalesce(p_tipo, '')));
  v_relacionada_a_obra boolean := false;
begin
  if v_obra_id is null and p_capitulo_id is not null then
    select capitulo.obra_id
    into v_obra_id
    from public.capitulos capitulo
    where capitulo.id = p_capitulo_id
    limit 1;
  end if;

  if v_obra_id is null
    and coalesce(p_link, '') ~ '^/obra/[^/?#]+'
  then
    v_referencia :=
      substring(p_link from '^/obra/([^/?#]+)');

    select obra.id
    into v_obra_id
    from public.obras obra
    where obra.id::text = v_referencia
       or obra.slug = v_referencia
    order by
      case
        when obra.id::text = v_referencia then 0
        else 1
      end,
      obra.id
    limit 1;
  end if;

  v_relacionada_a_obra :=
    v_obra_id is not null
    or p_capitulo_id is not null
    or coalesce(p_link, '') ~ '^/obra/[^/?#]+'
    or v_tipo in (
      'novo-capitulo',
      'comentario-obra',
      'curtida-obra',
      'curtida-capitulo',
      'comentario-capitulo',
      'curtida-comentario-capitulo'
    );

  if not v_relacionada_a_obra then
    return true;
  end if;

  -- Falha fechada: notificacao relacionada a obra sem obra resolvida.
  if v_obra_id is null then
    return false;
  end if;

  return exists (
    select 1
    from public.obras obra
    where obra.id = v_obra_id
      and obra.classificacao_indicativa in (
        'Livre',
        '10+',
        '12+',
        '14+',
        '16+'
      )
  );
end;
$$;

alter function public.notificacao_conteudo_18_liberado(
  uuid,
  uuid,
  text,
  text
) owner to postgres;

revoke all on function public.notificacao_conteudo_18_liberado(
  uuid,
  uuid,
  text,
  text
) from public;

grant execute on function public.notificacao_conteudo_18_liberado(
  uuid,
  uuid,
  text,
  text
) to authenticated;

-- ============================================================
-- 6. TRIGGER: BLOQUEIA NOVAS NOTIFICACOES 18+
-- ============================================================

create or replace function public.proteger_notificacao_conteudo_18()
returns trigger
language plpgsql
security definer
set search_path to 'pg_catalog', 'public', 'pg_temp'
as $$
declare
  v_obra_id uuid := new.obra_id;
  v_referencia text;
  v_tipo text := lower(btrim(coalesce(new.tipo, '')));
  v_relacionada_a_obra boolean := false;
begin
  if v_obra_id is null and new.capitulo_id is not null then
    select capitulo.obra_id
    into v_obra_id
    from public.capitulos capitulo
    where capitulo.id = new.capitulo_id
    limit 1;
  end if;

  if v_obra_id is null
    and coalesce(new.link, '') ~ '^/obra/[^/?#]+'
  then
    v_referencia :=
      substring(new.link from '^/obra/([^/?#]+)');

    select obra.id
    into v_obra_id
    from public.obras obra
    where obra.id::text = v_referencia
       or obra.slug = v_referencia
    order by
      case
        when obra.id::text = v_referencia then 0
        else 1
      end,
      obra.id
    limit 1;
  end if;

  v_relacionada_a_obra :=
    v_obra_id is not null
    or new.capitulo_id is not null
    or coalesce(new.link, '') ~ '^/obra/[^/?#]+'
    or v_tipo in (
      'novo-capitulo',
      'comentario-obra',
      'curtida-obra',
      'curtida-capitulo',
      'comentario-capitulo',
      'curtida-comentario-capitulo'
    );

  if not v_relacionada_a_obra then
    return new;
  end if;

  -- Falha fechada se uma notificacao relacionada a obra nao puder
  -- ser associada com seguranca a uma obra real.
  if v_obra_id is null then
    return null;
  end if;

  if not exists (
    select 1
    from public.obras obra
    where obra.id = v_obra_id
      and obra.classificacao_indicativa in (
        'Livre',
        '10+',
        '12+',
        '14+',
        '16+'
      )
  ) then
    return null;
  end if;

  new.obra_id := v_obra_id;

  return new;
end;
$$;

alter function public.proteger_notificacao_conteudo_18()
owner to postgres;

revoke all on function public.proteger_notificacao_conteudo_18()
from public;

drop trigger if exists proteger_notificacao_conteudo_18
on public.notificacoes;

create trigger proteger_notificacao_conteudo_18
before insert on public.notificacoes
for each row
execute function public.proteger_notificacao_conteudo_18();

-- ============================================================
-- 7. RLS: NUNCA RETORNA NOTIFICACAO 18+ AO CLIENTE
-- ============================================================

drop policy if exists notificacoes_select_proprio
on public.notificacoes;

create policy notificacoes_select_proprio
on public.notificacoes
for select
to authenticated
using (
  auth.uid() is not null
  and user_id::text = auth.uid()::text
  and public.notificacao_conteudo_18_liberado(
    obra_id,
    capitulo_id,
    link,
    tipo
  )
);

commit;
