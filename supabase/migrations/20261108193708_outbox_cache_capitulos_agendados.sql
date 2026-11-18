-- Fase 4 parcial: outbox pos-commit e solicitacao de invalidacao; SEM ack final.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '30s';
set local search_path = '';

-- Referencia LOGICA ao PK do recibo. Sem FK/cascata: exclusoes nao podem apagar
-- uma invalidacao pendente. Nenhum texto, preferencia, JWT ou URL privada.
create table historietas_privado.capitulo_cache_outbox (
  id uuid primary key default gen_random_uuid(),
  capitulo_id uuid not null,
  revisao_agendada bigint not null check (revisao_agendada > 0),
  obra_id uuid not null,
  slug_publicacao text,
  numero_capitulo integer,
  publicado_em timestamptz not null check (isfinite(publicado_em)),
  criado_em timestamptz not null default clock_timestamp(),
  lease_id uuid,
  lease_ate timestamptz,
  tentativas bigint not null default 0 check (tentativas >= 0),
  solicitada_em timestamptz,
  unique (capitulo_id,revisao_agendada),
  check ((lease_id is null) = (lease_ate is null))
);
alter table historietas_privado.capitulo_cache_outbox enable row level security;
revoke all on table historietas_privado.capitulo_cache_outbox from public,anon,authenticated,service_role;
create index capitulo_cache_outbox_lease_idx on historietas_privado.capitulo_cache_outbox(tentativas,criado_em,id);

create function historietas_privado.proteger_snapshot_cache_capitulo()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if (new.id,new.capitulo_id,new.revisao_agendada,new.obra_id,new.slug_publicacao,
      new.numero_capitulo,new.publicado_em,new.criado_em) is distinct from
     (old.id,old.capitulo_id,old.revisao_agendada,old.obra_id,old.slug_publicacao,
      old.numero_capitulo,old.publicado_em,old.criado_em) then
    raise exception 'Snapshot de publicacao imutavel.' using errcode='55000';
  end if;
  return new;
end;
$$;
revoke all on function historietas_privado.proteger_snapshot_cache_capitulo() from public,anon,authenticated,service_role;
create trigger capitulo_cache_snapshot_imutavel before update on historietas_privado.capitulo_cache_outbox
for each row execute function historietas_privado.proteger_snapshot_cache_capitulo();

create function historietas_privado.enfileirar_cache_capitulo_agendado()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  insert into historietas_privado.capitulo_cache_outbox
    (capitulo_id,revisao_agendada,obra_id,slug_publicacao,numero_capitulo,publicado_em)
    select new.capitulo_id,new.revisao_agendada,new.obra_id,o.slug,c.ordem,new.publicado_em
    from public.capitulos c join public.obras o on o.id=c.obra_id
    where c.id=new.capitulo_id and o.id=new.obra_id
    on conflict (capitulo_id,revisao_agendada) do nothing;
  if not found then
    raise exception 'Snapshot de publicacao indisponivel.' using errcode='55000';
  end if;
  return new;
end;
$$;
revoke all on function historietas_privado.enfileirar_cache_capitulo_agendado() from public,anon,authenticated,service_role;
-- AFTER INSERT nao roda no conflito ignorado; falha desfaz a publicacao inteira.
create trigger capitulo_publicacao_enfileirar_cache after insert on historietas_privado.capitulo_publicacao_eventos
for each row execute function historietas_privado.enfileirar_cache_capitulo_agendado();

-- Gate de acionamento manual: sessao atual e papel admin REAL do Auth, nunca
-- user_metadata ou apenas uma claim antiga de um usuario removido/rebaixado.
create function historietas_privado.autorizar_consumidor_cache_capitulos()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from auth.users u join auth.sessions s on s.user_id=u.id
    where u.id=(select auth.uid()) and s.id::text=(select auth.jwt()->>'session_id')
      and (s.not_after is null or s.not_after > now())
      and u.deleted_at is null and (u.banned_until is null or u.banned_until <= now())
      and (
        lower(btrim(coalesce(u.raw_app_meta_data->>'role','')))='admin'
        or lower(btrim(coalesce(u.raw_app_meta_data->>'admin',''))) in ('true','1','yes','sim')
        or lower(btrim(coalesce(u.raw_app_meta_data->>'is_admin',''))) in ('true','1','yes','sim')
        or lower(btrim(coalesce(u.raw_app_meta_data->>'cargo','')))='admin'
        or lower(btrim(coalesce(u.raw_app_meta_data->>'tipo_usuario','')))='admin'
        or exists (select 1 from jsonb_array_elements_text(case
          when jsonb_typeof(u.raw_app_meta_data->'roles')='array' then u.raw_app_meta_data->'roles'
          else '[]'::jsonb end) r(role) where lower(btrim(r.role))='admin')
      )
  );
$$;
alter function historietas_privado.autorizar_consumidor_cache_capitulos() owner to postgres;
revoke all on function historietas_privado.autorizar_consumidor_cache_capitulos() from public,anon,authenticated,service_role;
grant execute on function historietas_privado.autorizar_consumidor_cache_capitulos() to authenticated;
create function public.autorizar_consumidor_cache_capitulos()
returns boolean language sql stable security invoker set search_path = '' as $$
  select historietas_privado.autorizar_consumidor_cache_capitulos();
$$;
revoke all on function public.autorizar_consumidor_cache_capitulos() from public,anon,authenticated,service_role;
grant execute on function public.autorizar_consumidor_cache_capitulos() to authenticated;

-- Somente o servidor pode reivindicar/registrar SOLICITACAO, nunca confirmar
-- invalidacao final. O Next enfileira revalidateTag/Path e nao retorna Promise.
create function historietas_privado.reivindicar_cache_capitulos(p_limite integer)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare v_resultado jsonb;
begin
  if p_limite is null or p_limite not between 1 and 5 then
    raise exception 'Lote invalido.' using errcode='22023';
  end if;
  with candidatos as (
    select id from historietas_privado.capitulo_cache_outbox
    where lease_ate is null or lease_ate <= clock_timestamp()
    order by tentativas,criado_em,id limit p_limite for update skip locked
  ), reivindicados as (
    update historietas_privado.capitulo_cache_outbox b
    set lease_id=gen_random_uuid(),lease_ate=clock_timestamp()+interval '2 minutes',tentativas=tentativas+1
    from candidatos c where b.id=c.id returning b.*
  ) select coalesce(jsonb_agg(jsonb_build_object('id',b.id,'leaseId',b.lease_id,
    'obraId',b.obra_id,'capituloId',b.capitulo_id,'revisao',b.revisao_agendada,
    'slug',b.slug_publicacao,'slugAtual',o.slug,'numero',b.numero_capitulo)), '[]'::jsonb)
    into v_resultado from reivindicados b left join public.obras o on o.id=b.obra_id;
  return v_resultado;
end;
$$;
alter function historietas_privado.reivindicar_cache_capitulos(integer) owner to postgres;
revoke all on function historietas_privado.reivindicar_cache_capitulos(integer) from public,anon,authenticated,service_role;
grant execute on function historietas_privado.reivindicar_cache_capitulos(integer) to service_role;
create function public.reivindicar_cache_capitulos(p_limite integer)
returns jsonb language sql volatile security invoker set search_path = '' as $$
  select historietas_privado.reivindicar_cache_capitulos(p_limite);
$$;
revoke all on function public.reivindicar_cache_capitulos(integer) from public,anon,authenticated,service_role;
grant execute on function public.reivindicar_cache_capitulos(integer) to service_role;

create function historietas_privado.registrar_solicitacao_cache_capitulo(p_id uuid,p_lease_id uuid)
returns boolean language plpgsql volatile security definer set search_path = '' as $$
begin
  update historietas_privado.capitulo_cache_outbox set solicitada_em=coalesce(solicitada_em,clock_timestamp())
    where id=p_id and lease_id=p_lease_id and lease_ate > clock_timestamp();
  if not found then raise exception 'Lease indisponivel.' using errcode='55000'; end if;
  return true;
end;
$$;
alter function historietas_privado.registrar_solicitacao_cache_capitulo(uuid,uuid) owner to postgres;
revoke all on function historietas_privado.registrar_solicitacao_cache_capitulo(uuid,uuid) from public,anon,authenticated,service_role;
grant execute on function historietas_privado.registrar_solicitacao_cache_capitulo(uuid,uuid) to service_role;
create function public.registrar_solicitacao_cache_capitulo(p_id uuid,p_lease_id uuid)
returns boolean language sql volatile security invoker set search_path = '' as $$
  select historietas_privado.registrar_solicitacao_cache_capitulo(p_id,p_lease_id);
$$;
revoke all on function public.registrar_solicitacao_cache_capitulo(uuid,uuid) from public,anon,authenticated,service_role;
grant execute on function public.registrar_solicitacao_cache_capitulo(uuid,uuid) to service_role;
comment on table historietas_privado.capitulo_cache_outbox is
  'Snapshot privado duravel do recibo; solicitada_em NAO e ack. Sem confirmacao final, job ou exclusao automatica. Ativacao suspensa.';
commit;
