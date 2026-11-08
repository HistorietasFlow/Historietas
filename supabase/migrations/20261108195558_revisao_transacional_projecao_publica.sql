-- Fase 5A: contrato de leitura; NAO altera caches nem ativa publicacao.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '30s';
set local search_path = '';
-- Backfill e instalacao dos triggers sem janela de escrita nao rastreada.
lock table public.obras, public.capitulos in share row exclusive mode;

-- Sem FK/cascata: o tombstone impede reutilizar revisoes apos excluir/recriar.
create table historietas_privado.obra_projecao_revisoes (
  obra_id uuid primary key,
  geracao uuid not null default gen_random_uuid(),
  revisao bigint not null default 1 check (revisao > 0),
  excluida boolean not null default false
);
alter table historietas_privado.obra_projecao_revisoes enable row level security;
revoke all on table historietas_privado.obra_projecao_revisoes from public, anon, authenticated, service_role;
insert into historietas_privado.obra_projecao_revisoes(obra_id) select id from public.obras;

-- Escrita exclusivamente por triggers internos. Nao altera obras/capitulos,
-- nao depende de JWT e nao muda a ordem de locks dos executores existentes.
create function historietas_privado.revisar_projecao_obra()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'UPDATE' then
    -- Contadores/colunas derivadas nao invalidam conteudo; timestamps sozinhos
    -- tambem nao. As demais colunas (inclusive futuras) sao conservadoras.
    if (to_jsonb(new) - array['visualizacoes','atualizado_em','busca_documento'])
      is not distinct from (to_jsonb(old) - array['visualizacoes','atualizado_em','busca_documento']) then
      return null;
    end if;
  end if;
  if tg_op = 'DELETE' or (tg_op = 'UPDATE' and old.id <> new.id) then
    update historietas_privado.obra_projecao_revisoes set revisao = revisao + 1, excluida = true
      where obra_id = old.id and not excluida;
    if not found then raise exception 'Revisao publica indisponivel.' using errcode = '55000'; end if;
  end if;
  if tg_op = 'INSERT' or (tg_op = 'UPDATE' and old.id <> new.id) then
    insert into historietas_privado.obra_projecao_revisoes(obra_id) values(new.id)
      on conflict (obra_id) do update set geracao = gen_random_uuid(),
        revisao = obra_projecao_revisoes.revisao + 1, excluida = false
      where obra_projecao_revisoes.excluida;
    if not found then raise exception 'Identidade publica ja existente.' using errcode = '55000'; end if;
  elsif tg_op = 'UPDATE' then
    update historietas_privado.obra_projecao_revisoes set revisao = revisao + 1
      where obra_id = new.id and not excluida;
    if not found then raise exception 'Revisao publica indisponivel.' using errcode = '55000'; end if;
  end if;
  return null;
end;
$$;
alter function historietas_privado.revisar_projecao_obra() owner to postgres;
revoke all on function historietas_privado.revisar_projecao_obra() from public, anon, authenticated, service_role;
create trigger obras_revisar_projecao after insert or update or delete on public.obras
  for each row execute function historietas_privado.revisar_projecao_obra();

create function historietas_privado.revisar_projecao_capitulo()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_obras uuid[]; v_id uuid;
begin
  if tg_op = 'UPDATE' and
    (to_jsonb(new) - array['visualizacoes','atualizado_em','busca_documento'])
    is not distinct from (to_jsonb(old) - array['visualizacoes','atualizado_em','busca_documento']) then
    return null;
  end if;
  -- Drafts nao integram a projecao publica, nem revelam atividade pelo contador.
  if tg_op <> 'INSERT' and old.publicado then v_obras := array[old.obra_id]; end if;
  if tg_op <> 'DELETE' and new.publicado then v_obras := array_append(v_obras,new.obra_id); end if;
  for v_id in select distinct id from unnest(v_obras) id order by id loop
    -- Serializacao somente no ledger; nao faz chapter -> obra FOR UPDATE.
    update historietas_privado.obra_projecao_revisoes set revisao = revisao + 1
      where obra_id = v_id and not excluida;
    if not found and exists(select 1 from public.obras where id = v_id) then
      raise exception 'Revisao publica indisponivel.' using errcode = '55000';
    end if;
  end loop;
  return null;
end;
$$;
alter function historietas_privado.revisar_projecao_capitulo() owner to postgres;
revoke all on function historietas_privado.revisar_projecao_capitulo() from public, anon, authenticated, service_role;
create trigger capitulos_revisar_projecao after insert or update or delete on public.capitulos
  for each row execute function historietas_privado.revisar_projecao_capitulo();

-- TRUNCATE administrativo tambem nao pode apagar a historia. Nenhum novo grant.
create function historietas_privado.revisar_projecao_truncate()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  update historietas_privado.obra_projecao_revisoes
    set revisao = revisao + 1, excluida = (tg_table_name = 'obras')
    where not excluida;
  return null;
end;
$$;
alter function historietas_privado.revisar_projecao_truncate() owner to postgres;
revoke all on function historietas_privado.revisar_projecao_truncate() from public, anon, authenticated, service_role;
create trigger obras_revisar_truncate after truncate on public.obras
  for each statement execute function historietas_privado.revisar_projecao_truncate();
create trigger capitulos_revisar_truncate after truncate on public.capitulos
  for each statement execute function historietas_privado.revisar_projecao_truncate();

-- So identificadores de obras PUBLICAS permitidas ficam legiveis. A policy
-- consulta obras como invoker, preservando tambem suas policies atuais/futuras.
-- Tombstones, drafts e revisoes de 18+ nao sao publicados nem para o autor.
create policy obra_projecao_revisoes_select_publicas
on historietas_privado.obra_projecao_revisoes for select to anon, authenticated
using (not excluida and exists (
  select 1 from public.obras o where o.id = obra_id and o.publicado
    and o.classificacao_indicativa in ('Livre','10+','12+','14+','16+')
));
grant select(obra_id,geracao,revisao) on historietas_privado.obra_projecao_revisoes to anon, authenticated;

-- Uma unica instrucao/snapshot MVCC: dados e revisao nunca sao buscados em
-- requests diferentes. Ausencia publica nao distingue privado, removido ou 18+.
-- Projecao pequena: obra + capitulo solicitado, NAO todo o texto do catalogo.
create function public.obter_projecao_publica_obra(p_slug text, p_numero integer default null)
returns jsonb language sql stable security invoker set search_path = '' as $$
  with obra as materialized (
    select o.*, r.geracao, r.revisao from public.obras o
    join historietas_privado.obra_projecao_revisoes r on r.obra_id = o.id
    where o.slug = p_slug and o.publicado
      and o.classificacao_indicativa in ('Livre','10+','12+','14+','16+')
  ), capitulo as materialized (
    select c.* from public.capitulos c join obra o on o.id = c.obra_id
    where p_numero > 0 and c.ordem = p_numero and c.publicado and c.user_id = o.user_id
    order by c.id limit 1
  )
  select coalesce((select jsonb_build_object(
    'estado', case when p_numero is null then 'obra_publica'
      when exists(select 1 from capitulo) then 'capitulo_publico' else 'capitulo_indisponivel' end,
    'obraId',o.id,'geracao',o.geracao,'revisao',o.revisao::text,'slug',o.slug,
    'obra',jsonb_build_object('titulo',o.titulo,'autor',o.autor,'autorId',o.user_id,
      'genero',o.genero,'formato',o.formato,'classificacaoIndicativa',o.classificacao_indicativa,
      'avisosConteudo',o.avisos_conteudo,'sinopse',o.sinopse,'tags',o.tags,
      'capa',o.capa_url,'capaNome',o.capa_nome,'criadaEm',o.criada_em),
    'capitulo',(select jsonb_build_object('id',c.id,'ordem',c.ordem,'titulo',c.titulo,
      'texto',c.texto,'tipoConteudo',c.tipo_conteudo,'criadoEm',c.criado_em) from capitulo c)
  ) from obra o), jsonb_build_object('estado','obra_indisponivel'));
$$;
revoke all on function public.obter_projecao_publica_obra(text,integer) from public, anon, authenticated, service_role;
grant execute on function public.obter_projecao_publica_obra(text,integer) to anon, authenticated;
comment on function public.obter_projecao_publica_obra(text,integer) is
  'Snapshot publico invoker: revisao decimal em string, obra/capitulo no mesmo snapshot. Sem drafts, arquivos privados, cache ou ack de invalidacao.';
comment on table historietas_privado.obra_projecao_revisoes is
  'Historico conservador por UUID, sem cascatas; nao apagar tombstones nem reutilizar revisoes. Escrita somente por triggers. Nao ativa agendamento/cache/ilustrados.';
notify pgrst, 'reload schema';
commit;
