-- Somente contrato SQL. Nao cria bucket, upload, entrega ou retirada publica.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '30s';
set local search_path = '';
lock table public.obras in share row exclusive mode;

-- Sem FK/cascata e sem backfill: conservar geracoes/recibos apos exclusao.
-- Obras anteriores sao inicializadas sob o lock da obra, com origem incerta.
create table historietas_privado.obra_capas_estado (
  obra_id uuid primary key,
  autor_id uuid not null,
  geracao uuid not null default gen_random_uuid(),
  versao bigint not null default 1 check (versao > 0),
  excluida boolean not null default false,
  publica_ou_incerta boolean not null,
  gerenciada boolean not null default false,
  capa_privada_id uuid
);
create table historietas_privado.obra_capas_referencias (
  id uuid primary key,
  obra_id uuid not null,
  geracao uuid not null,
  autor_id uuid not null,
  bucket text not null check (bucket = 'capas-obras-privadas'),
  caminho text not null unique,
  criada_em timestamptz not null default now(),
  check (caminho ~ ('^' || autor_id::text || '/' || geracao::text || '/' || id::text || '\.(jpg|png|webp)$'))
);
-- Registro interno de referencias, NAO atestado de bytes. Nenhum produtor ou
-- grant de registro nesta fase; futuras fases precisam validar Storage/quotas.
create table historietas_privado.obra_capas_operacoes (
  id uuid primary key,
  autor_id uuid not null,
  sessao_id uuid not null,
  obra_id uuid not null,
  geracao uuid not null,
  versao_esperada bigint not null check (versao_esperada > 0),
  parametros jsonb not null,
  transacao xid8 not null,
  recibo jsonb,
  criada_em timestamptz not null default now()
);
-- O trigger nao varre o historico de recibos a cada escrita legada.
create index obra_capas_operacoes_obra on historietas_privado.obra_capas_operacoes(obra_id,geracao,versao_esperada,transacao)
  where recibo is null;
alter table historietas_privado.obra_capas_estado enable row level security;
alter table historietas_privado.obra_capas_referencias enable row level security;
alter table historietas_privado.obra_capas_operacoes enable row level security;
revoke all on table historietas_privado.obra_capas_estado,
  historietas_privado.obra_capas_referencias, historietas_privado.obra_capas_operacoes
  from public, anon, authenticated, service_role;

create function historietas_privado.proteger_registro_capa()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  -- Somente conclusao do recibo na mesma transacao pode alterar uma operacao.
  if tg_table_name = 'obra_capas_operacoes' and tg_op = 'UPDATE' then
    if old.recibo is null and new.recibo is not null
      and old.transacao = pg_catalog.pg_current_xact_id()
      and (to_jsonb(new) - 'recibo') = (to_jsonb(old) - 'recibo') then
      return new;
    end if;
  end if;
  raise exception 'REGISTRO_CAPA_IMUTAVEL' using errcode = '55000';
end;
$$;
alter function historietas_privado.proteger_registro_capa() owner to postgres;
revoke all on function historietas_privado.proteger_registro_capa() from public,anon,authenticated,service_role;
create trigger capa_referencia_imutavel before update or delete on historietas_privado.obra_capas_referencias
for each row execute function historietas_privado.proteger_registro_capa();
create trigger capa_operacao_imutavel before update or delete on historietas_privado.obra_capas_operacoes
for each row execute function historietas_privado.proteger_registro_capa();

create function historietas_privado.rastrear_contrato_capa()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v historietas_privado.obra_capas_estado;
  op historietas_privado.obra_capas_operacoes;
  mudou boolean;
begin
  if tg_op = 'TRUNCATE' then
    update historietas_privado.obra_capas_estado set excluida=true,versao=versao+1 where not excluida;
    return null;
  end if;
  if tg_op = 'INSERT' then
    if new.classificacao_indicativa = '18+' and (btrim(new.capa_url) <> '' or exists (
      select 1 from historietas_privado.obra_capas_estado where obra_id=new.id and publica_ou_incerta
    )) then
      raise exception 'TRANSICAO_18_CAPA_BLOQUEADA' using errcode = '23514';
    end if;
    insert into historietas_privado.obra_capas_estado(obra_id,autor_id,publica_ou_incerta)
      values(new.id,new.user_id,btrim(new.capa_url)<>'')
      on conflict (obra_id) do update set autor_id=new.user_id,geracao=gen_random_uuid(),
        versao=obra_capas_estado.versao+1,excluida=false,gerenciada=false,capa_privada_id=null,
        publica_ou_incerta=obra_capas_estado.publica_ou_incerta or btrim(new.capa_url)<>''
      where obra_capas_estado.excluida;
    if not found then raise exception 'IDENTIDADE_CAPA_INDISPONIVEL' using errcode='55000'; end if;
    return null;
  end if;
  -- UPDATE/DELETE ja detem lock da obra. Nenhum trigger inverte estado -> obra.
  insert into historietas_privado.obra_capas_estado(obra_id,autor_id,publica_ou_incerta)
    values(old.id,old.user_id,true) on conflict (obra_id) do nothing;
  select * into strict v from historietas_privado.obra_capas_estado where obra_id=old.id for update;
  if v.excluida or v.autor_id<>old.user_id then
    raise exception 'IDENTIDADE_CAPA_INDISPONIVEL' using errcode='55000';
  end if;
  if tg_op = 'DELETE' then
    update historietas_privado.obra_capas_estado set excluida=true,versao=versao+1 where obra_id=old.id;
    return null;
  end if;
  if new.id <> old.id or new.user_id <> old.user_id then
    -- Os grants existentes continuam impedindo clientes de trocar identidade.
    -- Manutencao administrativa invalida a geracao, nao a identidade do asset.
    if row(new.capa_url,new.capa_nome,new.classificacao_indicativa,new.avisos_conteudo)
      is distinct from row(old.capa_url,old.capa_nome,old.classificacao_indicativa,old.avisos_conteudo) then
      raise exception 'IDENTIDADE_CAPA_DIVERGENTE' using errcode='23514';
    end if;
    if new.id = old.id then
      update historietas_privado.obra_capas_estado set autor_id=new.user_id,
        geracao=gen_random_uuid(),versao=versao+1,capa_privada_id=null,publica_ou_incerta=true
        where obra_id=old.id;
    else
      update historietas_privado.obra_capas_estado set excluida=true,versao=versao+1 where obra_id=old.id;
      insert into historietas_privado.obra_capas_estado(obra_id,autor_id,publica_ou_incerta)
        values(new.id,new.user_id,true)
        on conflict(obra_id) do update set autor_id=new.user_id,geracao=gen_random_uuid(),
          versao=obra_capas_estado.versao+1,excluida=false,gerenciada=false,capa_privada_id=null,publica_ou_incerta=true
        where obra_capas_estado.excluida;
      if not found then raise exception 'IDENTIDADE_CAPA_INDISPONIVEL' using errcode='55000'; end if;
    end if;
    return null;
  end if;
  mudou := row(new.capa_url,new.capa_nome,new.classificacao_indicativa,new.avisos_conteudo)
    is distinct from row(old.capa_url,old.capa_nome,old.classificacao_indicativa,old.avisos_conteudo);
  select * into op from historietas_privado.obra_capas_operacoes
    where obra_id=old.id and geracao=v.geracao and versao_esperada=v.versao
      and transacao=pg_catalog.pg_current_xact_id() and recibo is null;
  if v.gerenciada and mudou and op.id is null then
    raise exception 'CAPA_EXIGE_OPERACAO_VERSIONADA' using errcode='42501';
  end if;
  if op.id is not null and (
    new.classificacao_indicativa is distinct from op.parametros->>'classificacao'
    or to_jsonb(new.avisos_conteudo) is distinct from op.parametros->'avisos'
    or new.capa_url is distinct from old.capa_url or new.capa_nome is distinct from old.capa_nome
  ) then raise exception 'OPERACAO_CAPA_DIVERGENTE' using errcode='55000'; end if;
  -- Ausencia de URL nao prova retirada. A marca nunca e limpa por um cliente.
  if new.classificacao_indicativa='18+' and (
    (old.classificacao_indicativa<>'18+' and (v.publica_ou_incerta or v.gerenciada or btrim(new.capa_url)<>''))
    or (new.capa_url is distinct from old.capa_url and btrim(new.capa_url) <> '')
  ) then raise exception 'TRANSICAO_18_CAPA_BLOQUEADA' using errcode='23514'; end if;
  if mudou or op.id is not null then
    update historietas_privado.obra_capas_estado set versao=versao+1,
      publica_ou_incerta=publica_ou_incerta or btrim(new.capa_url)<>'' where obra_id=old.id;
  end if;
  return null;
end;
$$;
alter function historietas_privado.rastrear_contrato_capa() owner to postgres;
revoke all on function historietas_privado.rastrear_contrato_capa() from public,anon,authenticated,service_role;
create trigger obras_contrato_capa after insert or delete on public.obras
for each row execute function historietas_privado.rastrear_contrato_capa();
create trigger obras_contrato_capa_update after update of id,user_id,capa_url,capa_nome,classificacao_indicativa,avisos_conteudo on public.obras
for each row execute function historietas_privado.rastrear_contrato_capa();
create trigger obras_contrato_capa_truncate after truncate on public.obras
for each statement execute function historietas_privado.rastrear_contrato_capa();

create function historietas_privado.operar_contrato_capa(
  p_acao text, p_operacao_id uuid, p_obra_id uuid, p_geracao uuid,
  p_versao bigint, p_capa_privada_id uuid, p_classificacao text, p_avisos text[]
) returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare
  uid uuid := (select auth.uid());
  sid text := (select auth.jwt()->>'session_id');
  obra public.obras;
  estado historietas_privado.obra_capas_estado;
  op historietas_privado.obra_capas_operacoes;
  params jsonb;
  resultado jsonb;
begin
  if uid is null or sid is null or sid !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
    or p_acao is null or p_acao not in ('consultar','aplicar','recibo') then
    raise exception 'SESSAO_CAPA_INDISPONIVEL' using errcode='42501';
  end if;
  -- Locks contra exclusao da conta e revogacao da sessao durante o commit.
  -- Ordem: usuario -> sessao -> perfil -> UUID operacao -> obra -> estado.
  perform 1 from auth.users where id=uid for share;
  if not found then raise exception 'SESSAO_CAPA_INDISPONIVEL' using errcode='42501'; end if;
  perform 1 from auth.sessions where id=sid::uuid and user_id=uid
    and (not_after is null or not_after>clock_timestamp()) for share;
  if not found then raise exception 'SESSAO_CAPA_INDISPONIVEL' using errcode='42501'; end if;
  if exists(select 1 from public.operacoes_exclusao_conta where subject_user_id=uid) then
    raise exception 'CONTA_CAPA_INDISPONIVEL' using errcode='42501';
  end if;
  if p_acao='aplicar' then
    perform 1 from public.profiles where user_id=uid for share;
    if public.usuario_aceitou_termos_publicacao(uid) is not true then
      raise exception 'ACEITE_TERMOS_PUBLICACAO_OBRIGATORIO' using errcode='42501';
    end if;
  end if;
  if p_acao in ('aplicar','recibo') then
    if p_operacao_id is null then raise exception 'OPERACAO_CAPA_INVALIDA' using errcode='22023'; end if;
    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('capa:operacao:'||p_operacao_id::text,0));
    perform 1 from auth.sessions where id=sid::uuid and user_id=uid
      and (not_after is null or not_after>clock_timestamp());
    if not found then raise exception 'SESSAO_CAPA_INDISPONIVEL' using errcode='42501'; end if;
    select * into op from historietas_privado.obra_capas_operacoes where id=p_operacao_id;
    if op.id is not null and (op.autor_id<>uid or op.sessao_id<>sid::uuid) then
      raise exception 'OPERACAO_CAPA_INDISPONIVEL' using errcode='42501';
    end if;
    if p_acao='recibo' then
      -- Evidencia causal daquela operacao, nao permissao atual nem estado atual.
      -- Ausencia nao encerra uma requisicao SQL que ainda possa chegar depois.
      return case when op.id is null then jsonb_build_object('estado','ausente','terminal',false) else op.recibo end;
    end if;
    if p_obra_id is null or p_geracao is null or p_versao is null or p_versao<1
      or p_classificacao is null or p_classificacao not in ('Livre','10+','12+','14+','16+','18+')
      or p_avisos is null then raise exception 'PARAMETROS_CAPA_INVALIDOS' using errcode='22023'; end if;
    params:=jsonb_build_object('capaPrivadaId',p_capa_privada_id,'classificacao',p_classificacao,'avisos',p_avisos);
    if op.id is not null then
      if op.obra_id<>p_obra_id or op.geracao<>p_geracao or op.versao_esperada<>p_versao
        or op.parametros<>params or op.recibo is null then
        raise exception 'OPERACAO_CAPA_DIVERGENTE' using errcode='PT409';
      end if;
      return op.recibo;
    end if;
  end if;
  -- Definer exige propriedade real, nunca usa auth.uid() NULL como bypass.
  select * into obra from public.obras where id=p_obra_id and user_id=uid for update;
  if not found then raise exception 'OBRA_CAPA_INDISPONIVEL' using errcode='42501'; end if;
  insert into historietas_privado.obra_capas_estado(obra_id,autor_id,publica_ou_incerta)
    values(obra.id,obra.user_id,true) on conflict(obra_id) do nothing;
  select * into strict estado from historietas_privado.obra_capas_estado where obra_id=obra.id for update;
  if estado.excluida or estado.autor_id<>uid then
    raise exception 'OBRA_CAPA_INDISPONIVEL' using errcode='42501';
  end if;
  perform 1 from auth.sessions where id=sid::uuid and user_id=uid
    and (not_after is null or not_after>clock_timestamp());
  if not found then raise exception 'SESSAO_CAPA_INDISPONIVEL' using errcode='42501'; end if;
  if p_acao='consultar' then
    return jsonb_build_object('obraId',obra.id,'geracao',estado.geracao,'versao',estado.versao::text,
      'capaPrivadaId',estado.capa_privada_id,'classificacao',obra.classificacao_indicativa,
      'avisos',obra.avisos_conteudo,'publicaOuIncerta',estado.publica_ou_incerta,'gerenciada',estado.gerenciada);
  end if;
  if estado.geracao<>p_geracao or estado.versao<>p_versao then
    raise exception 'VERSAO_CAPA_DESATUALIZADA' using errcode='PT409';
  end if;
  -- Nenhuma operacao deste contrato libera a transicao 18+ nesta fase.
  if p_classificacao='18+' and obra.classificacao_indicativa<>'18+' then
    raise exception 'TRANSICAO_18_CAPA_BLOQUEADA' using errcode='23514';
  end if;
  if p_capa_privada_id is not null then
    if estado.publica_ou_incerta or btrim(obra.capa_url)<>'' then
      raise exception 'CAPA_PUBLICA_OU_INCERTA' using errcode='55000';
    end if;
    perform 1 from historietas_privado.obra_capas_referencias where id=p_capa_privada_id
      and obra_id=obra.id and geracao=estado.geracao and autor_id=uid;
    if not found then raise exception 'REFERENCIA_CAPA_INDISPONIVEL' using errcode='42501'; end if;
  end if;
  insert into historietas_privado.obra_capas_operacoes
    (id,autor_id,sessao_id,obra_id,geracao,versao_esperada,parametros,transacao)
    values(p_operacao_id,uid,sid::uuid,obra.id,estado.geracao,estado.versao,params,pg_catalog.pg_current_xact_id());
  update public.obras set classificacao_indicativa=p_classificacao,avisos_conteudo=p_avisos
    where id=obra.id and user_id=uid;
  if not found then raise exception 'GRAVACAO_CAPA_NAO_CONFIRMADA' using errcode='55000'; end if;
  -- Se apenas o vinculo privado mudou, o trigger publico nao ve diferenca em
  -- obras. Invalidar sua revisao logica na mesma transacao, sem ACK/flush/IO.
  if estado.capa_privada_id is distinct from p_capa_privada_id
    and obra.classificacao_indicativa=p_classificacao and obra.avisos_conteudo=p_avisos then
    update historietas_privado.obra_projecao_revisoes set revisao=revisao+1 where obra_id=obra.id and not excluida;
    if not found then raise exception 'REVISAO_CAPA_INDISPONIVEL' using errcode='55000'; end if;
  end if;
  update historietas_privado.obra_capas_estado set capa_privada_id=p_capa_privada_id,
    gerenciada=gerenciada or p_capa_privada_id is not null where obra_id=obra.id
    returning * into estado;
  resultado:=jsonb_build_object('estado','confirmada','operacaoId',p_operacao_id,'obraId',obra.id,
    'geracao',estado.geracao,'versaoAnterior',p_versao::text,'versao',estado.versao::text,
    'capaPrivadaId',estado.capa_privada_id,'classificacao',p_classificacao,'avisos',p_avisos);
  -- Triggers/revisao publica tambem podem ter aguardado locks depois do UPDATE.
  perform 1 from auth.sessions where id=sid::uuid and user_id=uid
    and (not_after is null or not_after>clock_timestamp());
  if not found then raise exception 'SESSAO_CAPA_INDISPONIVEL' using errcode='42501'; end if;
  update historietas_privado.obra_capas_operacoes set recibo=resultado where id=p_operacao_id;
  return resultado;
end;
$$;
alter function historietas_privado.operar_contrato_capa(text,uuid,uuid,uuid,bigint,uuid,text,text[]) owner to postgres;
revoke all on function historietas_privado.operar_contrato_capa(text,uuid,uuid,uuid,bigint,uuid,text,text[])
  from public,anon,authenticated,service_role;
grant execute on function historietas_privado.operar_contrato_capa(text,uuid,uuid,uuid,bigint,uuid,text,text[]) to authenticated;

create function public.consultar_contrato_capa(p_obra_id uuid)
returns jsonb language sql volatile security invoker set search_path = '' as $$
  select historietas_privado.operar_contrato_capa('consultar',null,p_obra_id,null,null,null,null,null);
$$;
create function public.aplicar_operacao_capa(p_operacao_id uuid,p_obra_id uuid,p_geracao uuid,p_versao bigint,
  p_capa_privada_id uuid,p_classificacao text,p_avisos text[])
returns jsonb language sql volatile security invoker set search_path = '' as $$
  select historietas_privado.operar_contrato_capa('aplicar',p_operacao_id,p_obra_id,p_geracao,p_versao,p_capa_privada_id,p_classificacao,p_avisos);
$$;
create function public.consultar_operacao_capa(p_operacao_id uuid)
returns jsonb language sql volatile security invoker set search_path = '' as $$
  select historietas_privado.operar_contrato_capa('recibo',p_operacao_id,null,null,null,null,null,null);
$$;
alter function public.consultar_contrato_capa(uuid) owner to postgres;
alter function public.aplicar_operacao_capa(uuid,uuid,uuid,bigint,uuid,text,text[]) owner to postgres;
alter function public.consultar_operacao_capa(uuid) owner to postgres;
revoke all on function public.consultar_contrato_capa(uuid),
  public.aplicar_operacao_capa(uuid,uuid,uuid,bigint,uuid,text,text[]),public.consultar_operacao_capa(uuid)
  from public,anon,authenticated,service_role;
grant execute on function public.consultar_contrato_capa(uuid),
  public.aplicar_operacao_capa(uuid,uuid,uuid,bigint,uuid,text,text[]),public.consultar_operacao_capa(uuid) to authenticated;
comment on table historietas_privado.obra_capas_referencias is
  'Contrato interno imutavel SEM produtor/Storage nesta fase. Registro nao comprova bytes, quotas, privacidade fisica ou autorizacao de entrega.';
comment on table historietas_privado.obra_capas_operacoes is
  'Recibos causais sem cascatas. Nao apagar, reutilizar UUID ou confundir evidencia passada com autorizacao atual. Retencao depende de protocolo futuro.';
notify pgrst, 'reload schema';
commit;
