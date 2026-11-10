-- 6D12: contratos SQL privados, sem caller/API ou ativacao.
begin;
set local lock_timeout='5s';
set local statement_timeout='30s';

create table historietas_privado.capitulo_cache_operacoes_controle (
  singleton boolean primary key default true check(singleton),
  habilitado boolean not null default false,
  iniciado boolean not null default false,
  pausado boolean not null default true,
  revisao bigint not null default 1 check(revisao>0),
  pendente uuid
);
insert into historietas_privado.capitulo_cache_operacoes_controle(singleton) values(true);
create table historietas_privado.capitulo_cache_operacoes (
  id uuid primary key,
  usuario_id uuid not null,
  sessao_id uuid not null,
  limite integer not null check(limite between 1 and 5),
  criada_em timestamptz not null default clock_timestamp(),
  admissao_xid xid8 not null default pg_current_xact_id(),
  estado text not null check(estado in ('admitida','confirmada','encerrada_sem_claim')),
  encerrada_em timestamptz,
  check((estado='admitida')=(encerrada_em is null))
);
-- Uma operacao ambigua fecha a admissao, nao e um timeout/lease de takeover.
create unique index capitulo_cache_uma_operacao_aberta on historietas_privado.capitulo_cache_operacoes ((true)) where estado='admitida';
alter table historietas_privado.capitulo_cache_operacoes_controle add foreign key(pendente)
  references historietas_privado.capitulo_cache_operacoes(id) on delete restrict;
create table historietas_privado.capitulo_cache_operacoes_recibos (
  operacao_id uuid primary key references historietas_privado.capitulo_cache_operacoes(id) on delete restrict,
  resultado jsonb not null check(jsonb_typeof(resultado)='array' and jsonb_array_length(resultado)<=5),
  debito integer not null check(debito between 0 and 5),
  revisao_orcamento bigint not null check(revisao_orcamento>0),
  registrada_em timestamptz not null default clock_timestamp(),
  check(debito=jsonb_array_length(resultado))
);
create table historietas_privado.capitulo_cache_operacoes_eventos (
  operacao_id uuid not null references historietas_privado.capitulo_cache_operacoes_recibos(operacao_id) on delete restrict,
  -- Snapshot duravel sem cascata; existencia/lease conferidos no commit do claim.
  evento_id uuid not null,
  lease_id uuid not null,
  lease_ate timestamptz not null,
  primary key(operacao_id,evento_id)
);
create table historietas_privado.capitulo_cache_operacoes_retomadas (
  revisao_esperada bigint primary key check(revisao_esperada>0),
  justificativa text not null check(justificativa in ('configuracao_validada','causa_corrigida')),
  registrada_em timestamptz not null default clock_timestamp()
);

create function historietas_privado.proteger_registro_operacao_cache()
returns trigger language plpgsql security invoker set search_path='' as $$
begin
  if tg_table_name='capitulo_cache_operacoes' and tg_op='UPDATE' then
    if old.estado='admitida' and new.estado in ('confirmada','encerrada_sem_claim')
      and new.encerrada_em is not null
      and (to_jsonb(new)-array['estado','encerrada_em'])=(to_jsonb(old)-array['estado','encerrada_em']) then return new; end if;
  end if;
  raise exception 'Registro de operacao imutavel.' using errcode='55000';
end;
$$;
create trigger capitulo_cache_intencao_imutavel before update or delete on historietas_privado.capitulo_cache_operacoes
  for each row execute function historietas_privado.proteger_registro_operacao_cache();
create trigger capitulo_cache_recibo_imutavel before update or delete on historietas_privado.capitulo_cache_operacoes_recibos
  for each row execute function historietas_privado.proteger_registro_operacao_cache();
create trigger capitulo_cache_vinculo_imutavel before update or delete on historietas_privado.capitulo_cache_operacoes_eventos
  for each row execute function historietas_privado.proteger_registro_operacao_cache();
create trigger capitulo_cache_retomada_imutavel before update or delete on historietas_privado.capitulo_cache_operacoes_retomadas
  for each row execute function historietas_privado.proteger_registro_operacao_cache();

create function historietas_privado.conferir_recibo_operacao_cache()
returns trigger language plpgsql security invoker set search_path='' as $$
declare v_id uuid; o historietas_privado.capitulo_cache_operacoes; r historietas_privado.capitulo_cache_operacoes_recibos;
begin
  v_id:=coalesce(to_jsonb(new)->>'operacao_id',to_jsonb(new)->>'id')::uuid;
  select * into strict o from historietas_privado.capitulo_cache_operacoes where id=v_id;
  select * into r from historietas_privado.capitulo_cache_operacoes_recibos where operacao_id=v_id;
  if (o.estado='confirmada') is distinct from found then
    raise exception 'Estado e recibo inconsistentes.' using errcode='23514'; end if;
  if o.estado='confirmada' and (r.debito>o.limite or r.debito<>(
    select count(*) from historietas_privado.capitulo_cache_operacoes_eventos where operacao_id=v_id)) then
    raise exception 'Recibo e vinculos inconsistentes.' using errcode='23514'; end if;
  return null;
end;
$$;
create constraint trigger capitulo_cache_intencao_recibo after insert or update on historietas_privado.capitulo_cache_operacoes
  deferrable initially deferred for each row execute function historietas_privado.conferir_recibo_operacao_cache();
create constraint trigger capitulo_cache_recibo_vinculos after insert on historietas_privado.capitulo_cache_operacoes_recibos
  deferrable initially deferred for each row execute function historietas_privado.conferir_recibo_operacao_cache();

-- Nucleo 6D10 movido literalmente. So o owner SQL pode chama-lo diretamente.
-- O wrapper antigo conserva identidade/ACL; nao existe bypass por GUC/JWT.
do $$declare d text; begin
  d:=pg_get_functiondef('historietas_privado.reivindicar_cache_capitulos(integer)'::regprocedure);
  if position('capitulo_cache_orcamento' in d)=0 or position('skip locked' in lower(d))=0 then
    raise exception 'Nucleo 6D10 inesperado.'; end if;
  d:=replace(d,'FUNCTION historietas_privado.reivindicar_cache_capitulos(',
    'FUNCTION historietas_privado.reivindicar_cache_capitulos_nucleo(');
  d:=replace(d,'SECURITY DEFINER','SECURITY INVOKER');
  execute d;
end $$;
create or replace function historietas_privado.reivindicar_cache_capitulos(p_limite integer)
returns jsonb language plpgsql volatile security definer set search_path='' as $$
declare g historietas_privado.capitulo_cache_operacoes_controle;
begin
  select * into strict g from historietas_privado.capitulo_cache_operacoes_controle where singleton for update;
  if g.habilitado or g.iniciado or g.pendente is not null then
    raise exception 'Reivindicacao exige protocolo privado de operacoes.' using errcode='55000'; end if;
  return historietas_privado.reivindicar_cache_capitulos_nucleo(p_limite);
end;
$$;

create function historietas_privado.validar_admin_operacao_cache(p_usuario uuid,p_sessao uuid)
returns void language plpgsql volatile security invoker set search_path='' as $$
declare m jsonb;
begin
  -- Locks duram somente a transacao SQL. Logout/revogacao serializam aqui;
  -- nenhum IO externo e executado segurando estes locks.
  select raw_app_meta_data into m from auth.users where id=p_usuario and deleted_at is null
    and (banned_until is null or banned_until<=clock_timestamp()) for share;
  if not found then raise exception 'Administrador indisponivel.' using errcode='42501'; end if;
  perform 1 from auth.sessions where id=p_sessao and user_id=p_usuario
    and (not_after is null or not_after>clock_timestamp()) for share;
  if not found or exists(select 1 from auth.sessions where id=p_sessao and not_after<=clock_timestamp()) or not (
    lower(btrim(coalesce(m->>'role','')))='admin'
    or lower(btrim(coalesce(m->>'admin',''))) in ('true','1','yes','sim')
    or lower(btrim(coalesce(m->>'is_admin',''))) in ('true','1','yes','sim')
    or lower(btrim(coalesce(m->>'cargo','')))='admin'
    or lower(btrim(coalesce(m->>'tipo_usuario','')))='admin'
    or exists(select 1 from jsonb_array_elements_text(case when jsonb_typeof(m->'roles')='array' then m->'roles' else '[]'::jsonb end) r(role)
      where lower(btrim(r.role))='admin')) then
    raise exception 'Sessao administrativa indisponivel.' using errcode='42501'; end if;
end;
$$;

create function historietas_privado.conferir_parametros_operacao_cache(p_id uuid,p_usuario uuid,p_sessao uuid,p_limite integer)
returns void language plpgsql immutable security invoker set search_path='' as $$
begin
  if p_id is null or p_usuario is null or p_sessao is null or p_limite is null or p_limite not between 1 and 5 then
    raise exception 'Parametros de operacao invalidos.' using errcode='22023'; end if;
end;
$$;

create function historietas_privado.admitir_operacao_cache(p_id uuid,p_usuario uuid,p_sessao uuid,p_limite integer)
returns jsonb language plpgsql volatile security invoker set search_path='' as $$
declare g historietas_privado.capitulo_cache_operacoes_controle; o historietas_privado.capitulo_cache_operacoes;
begin
  perform historietas_privado.conferir_parametros_operacao_cache(p_id,p_usuario,p_sessao,p_limite);
  select * into strict g from historietas_privado.capitulo_cache_operacoes_controle where singleton for update;
  perform historietas_privado.validar_admin_operacao_cache(p_usuario,p_sessao);
  select * into o from historietas_privado.capitulo_cache_operacoes where id=p_id for update;
  if found then
    if row(o.usuario_id,o.sessao_id,o.limite) is distinct from row(p_usuario,p_sessao,p_limite) then
      raise exception 'Operacao anterior divergente.' using errcode='55000'; end if;
    return jsonb_build_object('estado',o.estado,'operacaoId',o.id);
  end if;
  if not g.habilitado or g.pausado or g.pendente is not null then
    return jsonb_build_object('estado','admissao_bloqueada'); end if;
  insert into historietas_privado.capitulo_cache_operacoes(id,usuario_id,sessao_id,limite,estado)
    values(p_id,p_usuario,p_sessao,p_limite,'admitida');
  -- Fail-closed ANTES da execucao: commit separado obrigatorio, protegido abaixo.
  update historietas_privado.capitulo_cache_operacoes_controle
    set iniciado=true,pausado=true,pendente=p_id,revisao=revisao+1 where singleton;
  return jsonb_build_object('estado','admitida','operacaoId',p_id);
end;
$$;

create function historietas_privado.executar_operacao_cache(p_id uuid,p_usuario uuid,p_sessao uuid,p_limite integer)
returns jsonb language plpgsql volatile security invoker set search_path='' as $$
declare g historietas_privado.capitulo_cache_operacoes_controle; o historietas_privado.capitulo_cache_operacoes;
  b historietas_privado.capitulo_cache_orcamento; r historietas_privado.capitulo_cache_operacoes_recibos;
  resultado jsonb; total integer; consumo_anterior bigint;
begin
  perform historietas_privado.conferir_parametros_operacao_cache(p_id,p_usuario,p_sessao,p_limite);
  select * into strict g from historietas_privado.capitulo_cache_operacoes_controle where singleton for update;
  select * into o from historietas_privado.capitulo_cache_operacoes where id=p_id for update;
  if not found then raise exception 'Intencao previa ausente.' using errcode='55000'; end if;
  if row(o.usuario_id,o.sessao_id,o.limite) is distinct from row(p_usuario,p_sessao,p_limite) then
    raise exception 'Operacao anterior divergente.' using errcode='55000'; end if;
  perform historietas_privado.validar_admin_operacao_cache(p_usuario,p_sessao);
  if o.estado='encerrada_sem_claim' then return jsonb_build_object('estado',o.estado,'operacaoId',p_id); end if;
  if o.estado='confirmada' then
    select * into strict r from historietas_privado.capitulo_cache_operacoes_recibos where operacao_id=p_id;
  else
    -- XID8 do topo tambem cobre SAVEPOINTs. xmin de uma subtransacao NAO e
    -- suficiente. Nao depender de timestamp, sleep, lease ou request HTTP.
    if o.admissao_xid=pg_current_xact_id() then
      raise exception 'Intencao precisa de commit previo.' using errcode='55000'; end if;
    if not g.habilitado or g.pendente is distinct from p_id then
      raise exception 'Operacao nao admitida.' using errcode='55000'; end if;
    select * into strict b from historietas_privado.capitulo_cache_orcamento where singleton for update;
    if not b.habilitado or b.pausado or b.limite is null or b.consumidas>=b.limite then
      return jsonb_build_object('estado','orcamento_bloqueado','operacaoId',p_id); end if;
    consumo_anterior:=b.consumidas;
    resultado:=historietas_privado.reivindicar_cache_capitulos_nucleo(p_limite);
    total:=jsonb_array_length(resultado);
    select * into strict b from historietas_privado.capitulo_cache_orcamento where singleton;
    if b.consumidas-consumo_anterior<>total then
      raise exception 'Debito de recibo inconsistente.' using errcode='55000'; end if;
    perform historietas_privado.validar_admin_operacao_cache(p_usuario,p_sessao);
    insert into historietas_privado.capitulo_cache_operacoes_recibos(operacao_id,resultado,debito,revisao_orcamento)
      values(p_id,resultado,total,b.revisao) returning * into r;
    insert into historietas_privado.capitulo_cache_operacoes_eventos(operacao_id,evento_id,lease_id,lease_ate)
      select p_id,e.id,e.lease_id,e.lease_ate from jsonb_array_elements(resultado) j
      join historietas_privado.capitulo_cache_outbox e on e.id=(j->>'id')::uuid and e.lease_id=(j->>'leaseId')::uuid;
    if (select count(*) from historietas_privado.capitulo_cache_operacoes_eventos where operacao_id=p_id)<>total then
      raise exception 'Vinculo de recibo incompleto.' using errcode='55000'; end if;
    update historietas_privado.capitulo_cache_operacoes set estado='confirmada',encerrada_em=clock_timestamp() where id=p_id;
    -- Pausa persiste mesmo no sucesso. Esta fase exige retomada SQL/CAS entre
    -- operacoes, nao oferece fluxo automatico nem confirma recebimento HTTP.
    update historietas_privado.capitulo_cache_operacoes_controle set pendente=null,revisao=revisao+1 where singleton;
  end if;
  return jsonb_build_object('estado','confirmada','operacaoId',p_id,'recibo',to_jsonb(r),
    'leasesValidos',not exists(select 1 from historietas_privado.capitulo_cache_operacoes_eventos e
      left join historietas_privado.capitulo_cache_outbox a on a.id=e.evento_id
      where e.operacao_id=p_id and (a.lease_id is distinct from e.lease_id or a.lease_ate<=clock_timestamp())));
end;
$$;

create function historietas_privado.reconciliar_operacao_cache(p_id uuid,p_usuario uuid,p_sessao uuid,p_limite integer)
returns jsonb language plpgsql volatile security invoker set search_path='' as $$
declare g historietas_privado.capitulo_cache_operacoes_controle; o historietas_privado.capitulo_cache_operacoes;
begin
  perform historietas_privado.conferir_parametros_operacao_cache(p_id,p_usuario,p_sessao,p_limite);
  select * into strict g from historietas_privado.capitulo_cache_operacoes_controle where singleton for update;
  select * into o from historietas_privado.capitulo_cache_operacoes where id=p_id for update;
  -- SQL administrativo restrito permite encerrar apos logout/exclusao. Nao
  -- concede direitos ao usuario armazenado nem depende de auth.uid() nulo.
  if found then
    if row(o.usuario_id,o.sessao_id,o.limite) is distinct from row(p_usuario,p_sessao,p_limite) then
      raise exception 'Operacao anterior divergente.' using errcode='55000'; end if;
    if o.estado<>'admitida' then return jsonb_build_object('estado',o.estado,'operacaoId',p_id); end if;
    update historietas_privado.capitulo_cache_operacoes set estado='encerrada_sem_claim',encerrada_em=clock_timestamp() where id=p_id;
  else
    -- Ausencia simples NAO e prova. Tombstone impede tambem admissao atrasada.
    insert into historietas_privado.capitulo_cache_operacoes(id,usuario_id,sessao_id,limite,estado,encerrada_em)
      values(p_id,p_usuario,p_sessao,p_limite,'encerrada_sem_claim',clock_timestamp());
  end if;
  update historietas_privado.capitulo_cache_operacoes_controle set iniciado=true,pausado=true,
    pendente=case when pendente=p_id then null else pendente end,revisao=revisao+1 where singleton;
  return jsonb_build_object('estado','encerrada_sem_claim','operacaoId',p_id);
end;
$$;

create function historietas_privado.retomar_operacoes_cache(p_revisao bigint,p_justificativa text)
returns jsonb language plpgsql volatile security invoker set search_path='' as $$
declare g historietas_privado.capitulo_cache_operacoes_controle; motivo text;
begin
  if p_revisao is null or p_revisao<=0 or p_justificativa is null or p_justificativa not in ('configuracao_validada','causa_corrigida') then
    raise exception 'Retomada invalida.' using errcode='22023'; end if;
  select * into strict g from historietas_privado.capitulo_cache_operacoes_controle where singleton for update;
  select justificativa into motivo from historietas_privado.capitulo_cache_operacoes_retomadas where revisao_esperada=p_revisao;
  if found then
    if motivo<>p_justificativa then raise exception 'Retomada divergente.' using errcode='55000'; end if;
    return jsonb_build_object('estado','ja_registrado','revisao',g.revisao,'pausado',g.pausado);
  end if;
  if g.revisao<>p_revisao or not g.pausado or g.pendente is not null then
    raise exception 'Revisao ou operacao pendente impedem retomada.' using errcode='55000'; end if;
  insert into historietas_privado.capitulo_cache_operacoes_retomadas(revisao_esperada,justificativa) values(p_revisao,p_justificativa);
  update historietas_privado.capitulo_cache_operacoes_controle set pausado=false,revisao=revisao+1 where singleton;
  return jsonb_build_object('estado','retomada_registrada','revisao',g.revisao+1,'habilitado',g.habilitado);
end;
$$;

do $$declare n text; begin
  foreach n in array array['capitulo_cache_operacoes_controle','capitulo_cache_operacoes','capitulo_cache_operacoes_recibos',
    'capitulo_cache_operacoes_eventos','capitulo_cache_operacoes_retomadas'] loop
    execute format('alter table historietas_privado.%I enable row level security',n);
    execute format('revoke all on table historietas_privado.%I from public,anon,authenticated,service_role,historietas_capitulo_runner,historietas_agendamento_monitor',n);
  end loop;
end $$;
revoke all on function historietas_privado.reivindicar_cache_capitulos_nucleo(integer),
  historietas_privado.proteger_registro_operacao_cache(),
  historietas_privado.conferir_recibo_operacao_cache(),
  historietas_privado.validar_admin_operacao_cache(uuid,uuid),
  historietas_privado.conferir_parametros_operacao_cache(uuid,uuid,uuid,integer),
  historietas_privado.admitir_operacao_cache(uuid,uuid,uuid,integer),
  historietas_privado.executar_operacao_cache(uuid,uuid,uuid,integer),
  historietas_privado.reconciliar_operacao_cache(uuid,uuid,uuid,integer),
  historietas_privado.retomar_operacoes_cache(bigint,text)
  from public,anon,authenticated,service_role,historietas_capitulo_runner,historietas_agendamento_monitor;
comment on table historietas_privado.capitulo_cache_operacoes is
  'Intencao privada sem cascatas; recibo de claim nao e ACK. Admissao requer commit separado. Sem TTL, purga, endpoint ou ativacao. Uma ambiguidade bloqueia novas admissoes ate reconciliacao e retomada administrativa CAS.';
comment on table historietas_privado.capitulo_cache_operacoes_controle is
  'Desativado. Cada admissao fecha o gate ate retomada administrativa explicita, inclusive apos sucesso. Iniciado impede voltar ao caminho legado apenas desabilitando o controle. Nao e limite fisico de WAL/abortos.';
do $$begin
  if exists(select 1 from historietas_privado.capitulo_runner_controle where habilitado)
    or exists(select 1 from historietas_privado.capitulo_cache_orcamento where habilitado) then
    raise exception 'Instalacao exige controles desativados.'; end if;
end $$;
commit;
