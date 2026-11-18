-- 6D4: orcamento LOGICO finito. Sem ativacao, ACK, purga ou reserva fisica.
begin;
set local lock_timeout='5s';
set local statement_timeout='30s';

create table historietas_privado.capitulo_notificacao_orcamento (
  singleton boolean primary key default true check(singleton),
  limite_destinatarios integer not null default 100 check(limite_destinatarios between 1 and 100),
  limite_por_capitulo integer not null default 100 check(limite_por_capitulo between 1 and 100),
  limite_linha_bytes integer not null default 8192 check(limite_linha_bytes between 1 and 8192),
  limite_capitulo_bytes bigint not null default 262144 check(limite_capitulo_bytes between 1 and 262144),
  limite_total integer not null default 1000 check(limite_total between 1 and 1000),
  limite_total_bytes bigint not null default 2097152 check(limite_total_bytes between 1 and 2097152),
  notificacoes_admitidas bigint not null default 0 check(notificacoes_admitidas>=0),
  payload_admitido_bytes bigint not null default 0 check(payload_admitido_bytes>=0)
);
insert into historietas_privado.capitulo_notificacao_orcamento(singleton) values(true);
alter table historietas_privado.capitulo_notificacao_orcamento enable row level security;
revoke all on table historietas_privado.capitulo_notificacao_orcamento
  from public,anon,authenticated,service_role,historietas_capitulo_runner;

-- Reutiliza os campos, chave, links e uniao de audiencias do notificador real.
-- O plano e exclusivamente privado, calculado do banco e usado na mesma chamada.
-- N+1 detecta excesso; nunca publica/notifica um prefixo de uma audiencia maior.
do $migration$
declare b text; inicio integer;
begin
  select replace(prosrc,E'\r\n',E'\n') into strict b from pg_proc
    where oid='historietas_privado.notificar_capitulo_agendado(uuid,uuid,uuid,timestamptz)'::regprocedure;
  inicio:=strpos(b,'  v_sql := format(');
  if inicio=0 or strpos(b,'or coalesce(v_capitulo.publicado, false) = false')=0
    or strpos(b,'array_to_string(v_receptores_partes, '' union '')')=0
    or strpos(b,'v_where_duplicada')=0 or strpos(b,'    300'||chr(10)||'  );')=0 then
    raise exception 'Contrato do notificador divergiu; revisar plano antes da instalacao.';
  end if;
  b:=left(b,inicio-1);
  b:=replace(b,'  v_total integer := 0;',
    '  v_destinatarios uuid[]; v_linhas jsonb; v_objeto text;');
  b:=replace(b,'or coalesce(v_capitulo.publicado, false) = false','or v_capitulo.publicado is null');
  b:=b || $body$
  -- Cada fonte e limitada antes da uniao: no maximo 303 candidatos. Se uma
  -- fonte tiver mais de 100, seus 101 distintos ja comprovam excesso. Se todas
  -- couberem, a uniao ainda contem TODOS os elegiveis, sem prefixo silencioso.
  select string_agg('(select distinct receptor_id from (' || parte || ') fonte
    where receptor_id is not null and receptor_id<>$1 limit 101)',' union all ')
    into v_receptores_sql from unnest(v_receptores_partes) parte;
  execute format(
    'select coalesce(array_agg(receptor_id),''{}''::uuid[]) from (
       select distinct origem.receptor_id from (%s) origem
       where origem.receptor_id is not null and origem.receptor_id<>$1
       limit 101
     ) audiencia',v_receptores_sql)
  into v_destinatarios using v_autor_id,v_tipo,v_titulo,v_mensagem,p_obra_id,
    p_capitulo_id,v_href,v_metadata,v_criado_em,v_notificacao_base;
  -- Valores/nomes sao aqueles calculados pelo contrato legado, nao do navegador.
  select string_agg(format('%L, %s',coluna,valor),', ' order by ordem)
    into v_objeto from unnest(v_colunas,v_valores) with ordinality x(coluna,valor,ordem);
  v_sql:=format(
    'with preparados as (
       select receptor_id,$10 || '':'' || receptor_id::text as notificacao_chave
       from unnest($11::uuid[]) receptor_id
     ) select coalesce(jsonb_agg(jsonb_build_object(%s)),''[]''::jsonb)
       from preparados where not exists(select 1 from public.notificacoes n where %s)',
    v_objeto,v_where_duplicada);
  execute v_sql into v_linhas using v_autor_id,v_tipo,v_titulo,v_mensagem,p_obra_id,
    p_capitulo_id,v_href,v_metadata,v_criado_em,v_notificacao_base,v_destinatarios;
  return jsonb_build_object('destinatarios',cardinality(v_destinatarios),
    'linhas',v_linhas,'colunas',to_jsonb(v_colunas));
end;
$body$;
  execute 'create or replace function historietas_privado.planejar_notificacoes_capitulo_agendado(
    p_obra_id uuid,p_capitulo_id uuid,p_autor_validado uuid,p_publicado_em timestamptz
  ) returns jsonb language plpgsql volatile security invoker set search_path='''' as ' || quote_literal(b);
end;
$migration$;

create function historietas_privado.admitir_notificacoes_capitulo(p_plano jsonb)
returns boolean language plpgsql volatile security invoker set search_path='' as $$
declare c historietas_privado.capitulo_notificacao_orcamento;
  n integer; d integer; b bigint; maior bigint;
begin
  -- Mesmo lock global do runner; try-lock evita inversao com executor manual.
  if not pg_try_advisory_xact_lock(hashtextextended('historietas:runner:capitulos:v1',0)) then
    raise exception 'Orcamento ocupado; repetir transacao.' using errcode='55P03';
  end if;
  select * into strict c from historietas_privado.capitulo_notificacao_orcamento where singleton for update;
  if jsonb_typeof(p_plano->'linhas') is distinct from 'array' then
    raise exception 'Plano privado invalido.' using errcode='55000';
  end if;
  n:=jsonb_array_length(p_plano->'linhas'); d:=(p_plano->>'destinatarios')::integer;
  -- Estimativa definida: JSON UTF-8 canonico + 512 bytes por linha. NAO tamanho
  -- fisico, indice, WAL, TOAST ou garantia de disco. Inclui escaping/multibyte.
  select coalesce(sum(octet_length(value::text)+512),0),coalesce(max(octet_length(value::text)+512),0)
    into b,maior from jsonb_array_elements(p_plano->'linhas');
  if d is null or d<0 or n>d then raise exception 'Plano privado invalido.' using errcode='55000'; end if;
  if d>c.limite_destinatarios or n>c.limite_por_capitulo or maior>c.limite_linha_bytes
    or b>c.limite_capitulo_bytes or c.notificacoes_admitidas+n>c.limite_total
    or c.payload_admitido_bytes+b>c.limite_total_bytes then return false; end if;
  -- Escrita da mesma linha impede que snapshot RR antigo admita saldo obsoleto.
  -- Debito e efeitos revertem juntos; sem renovacao por horario/lease/logout.
  update historietas_privado.capitulo_notificacao_orcamento set
    notificacoes_admitidas=notificacoes_admitidas+n,payload_admitido_bytes=payload_admitido_bytes+b where singleton;
  return true;
end;
$$;

create function historietas_privado.aplicar_notificacoes_capitulo(p_plano jsonb)
returns integer language plpgsql volatile security invoker set search_path='' as $$
declare colunas text; n integer;
begin
  -- Somente o executor confiavel recebe este plano, sem RPC/grant a clientes.
  select string_agg(format('%I',value),',') into colunas
    from jsonb_array_elements_text(p_plano->'colunas');
  execute format('insert into public.notificacoes (%s) select %s
    from jsonb_populate_recordset(null::public.notificacoes,$1) on conflict do nothing',colunas,colunas)
    using p_plano->'linhas';
  get diagnostics n=row_count;
  return n;
end;
$$;

-- Mantem todos os guards/locks/recibos do executor. A audiencia e congelada
-- ANTES de publicar; nao se conta um conjunto para inserir outro depois.
do $migration$
declare d text;
begin
  d:=replace(pg_get_functiondef('historietas_privado.executar_agendamento_capitulo(uuid,bigint)'::regprocedure),E'\r\n',E'\n');
  if strpos(d,'  v_total integer;')=0 or strpos(d,'    -- Retira pendente ANTES')=0
    or strpos(d,'v_total := historietas_privado.notificar_capitulo_agendado(v_obra.id,p_capitulo_id,v_ag.autor_id,v_agora);')=0 then
    raise exception 'Contrato do executor divergiu; revisar admissao.';
  end if;
  d:=replace(d,'  v_total integer;','  v_total integer; v_plano jsonb;');
  d:=replace(d,'    -- Retira pendente ANTES',
    '    v_plano := historietas_privado.planejar_notificacoes_capitulo_agendado(v_obra.id,p_capitulo_id,v_ag.autor_id,v_agora);'||chr(10)||
    '    if not historietas_privado.admitir_notificacoes_capitulo(v_plano) then'||chr(10)||
    '      return jsonb_build_object(''estado'',''capacidade_notificacoes'');'||chr(10)||
    '    end if;'||chr(10)||'    -- Retira pendente ANTES');
  d:=replace(d,'v_total := historietas_privado.notificar_capitulo_agendado(v_obra.id,p_capitulo_id,v_ag.autor_id,v_agora);',
    'v_total := historietas_privado.aplicar_notificacoes_capitulo(v_plano);');
  execute d;
  d:=replace(pg_get_functiondef('historietas_privado.executar_runner_capitulos(integer,integer)'::regprocedure),E'\r\n',E'\n');
  if strpos(d,'      v_estado := v_resposta->>''estado'';')=0 then raise exception 'Contrato do runner divergiu.'; end if;
  d:=replace(d,'      v_estado := v_resposta->>''estado'';',
    '      v_estado := v_resposta->>''estado'';'||chr(10)||
    '      if v_estado=''capacidade_notificacoes'' then'||chr(10)||
    '        update historietas_privado.capitulo_runner_controle set habilitado=false where singleton;'||chr(10)||
    '        v_capacidade := jsonb_build_object(''estado'',''capacidade_notificacoes'');'||chr(10)||
    '        exit; -- Sem consumir tentativa tecnica ou apagar a intencao.'||chr(10)||
    '      end if;');
  execute d;
end;
$migration$;

create function historietas_privado.proteger_orcamento_notificacoes()
returns trigger language plpgsql security invoker set search_path='' as $$
begin
  if not pg_try_advisory_xact_lock(hashtextextended('historietas:runner:capitulos:v1',0)) then
    raise exception 'Orcamento ocupado.' using errcode='55P03';
  end if;
  if exists(select 1 from historietas_privado.capitulo_runner_controle where habilitado) then
    raise exception 'Revisao do orcamento exige runner desativado.' using errcode='55000';
  end if;
  return new;
end;
$$;
create trigger capitulo_notificacao_orcamento_config before update of limite_destinatarios,
  limite_por_capitulo,limite_linha_bytes,limite_capitulo_bytes,limite_total,limite_total_bytes
  on historietas_privado.capitulo_notificacao_orcamento for each row
  execute function historietas_privado.proteger_orcamento_notificacoes();

revoke all on function historietas_privado.planejar_notificacoes_capitulo_agendado(uuid,uuid,uuid,timestamptz),
  historietas_privado.admitir_notificacoes_capitulo(jsonb),historietas_privado.aplicar_notificacoes_capitulo(jsonb),
  historietas_privado.proteger_orcamento_notificacoes()
  from public,anon,authenticated,service_role,historietas_capitulo_runner;
do $$ begin
  if not exists(select 1 from historietas_privado.capitulo_runner_controle where singleton and not habilitado) then
    raise exception 'Instalacao exige runner desativado.' using errcode='55000';
  end if;
end $$;
comment on table historietas_privado.capitulo_notificacao_orcamento is
  'Saldo logico acumulado somente do executor agendado. Sem reset automatico/API. Estimativa JSON+512 por linha NAO reserva disco/WAL; outros produtores intactos. Limites iniciais para revisao, nao autorizacao de ativacao.';
commit;
