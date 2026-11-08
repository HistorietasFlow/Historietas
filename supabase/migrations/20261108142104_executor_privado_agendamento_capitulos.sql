-- Fase 2: operacoes SQL administrativas, SEM Cron, endpoint ou consumidor.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '30s';

-- Recibo transacional dos efeitos. Nao contem texto, tokens ou caminhos Storage.
create table historietas_privado.capitulo_publicacao_eventos (
  capitulo_id uuid not null references public.capitulos(id) on delete cascade,
  revisao_agendada bigint not null check (revisao_agendada > 0),
  autor_id uuid not null references auth.users(id) on delete cascade,
  obra_id uuid not null references public.obras(id) on delete cascade,
  publicado_em timestamptz not null check (isfinite(publicado_em)),
  notificacoes_criadas integer not null check (notificacoes_criadas >= 0),
  primary key (capitulo_id, revisao_agendada)
);
alter table historietas_privado.capitulo_publicacao_eventos enable row level security;
revoke all on table historietas_privado.capitulo_publicacao_eventos from public,anon,authenticated,service_role;
create index capitulo_agendamentos_retry_idx
  on historietas_privado.capitulo_agendamentos (executado_em, capitulo_id) where estado = 'erro';

-- Reutiliza o corpo real da notificacao existente (destinatarios, chave, link e
-- advisory lock), sem mudar sua assinatura, ACL ou comportamento best-effort.
-- Variante INTERNA estrita: autor vem do banco, horario vem do commit logico,
-- erro nao vira zero. Nao impersona JWT nem confia em metadata de navegador.
do $migration$
declare
  v_body text;
  v_handler text;
begin
  select prosrc into strict v_body from pg_catalog.pg_proc
    where oid = 'historietas_privado.criar_notificacoes_capitulo(uuid,uuid,text,text,text,text,timestamptz)'::regprocedure;
  v_body := replace(v_body,E'\r\n',E'\n');
  v_handler := substring(v_body from position(E'\nexception\n' in v_body));
  if strpos(v_body, 'v_autor_id uuid := auth.uid();') = 0
    or strpos(v_body, 'perform p_titulo, p_mensagem, p_href, p_criado_em;') = 0
    or strpos(v_body, 'coalesce(v_capitulo.criado_em, now());') = 0
    or strpos(v_body, 'coalesce(p_tipo,') = 0
    or strpos(v_body, E'    500\n  );') = 0
    or v_handler is null or strpos(v_handler, 'when others then') = 0
    or strpos(v_body, 'novo-capitulo:') = 0 or strpos(v_body, 'on conflict do nothing') = 0 then
    raise exception 'Contrato legado de notificacoes divergiu; revisar antes de habilitar executor.';
  end if;
  v_body := replace(v_body, 'v_autor_id uuid := auth.uid();', 'v_autor_id uuid := p_autor_validado;');
  v_body := replace(v_body, 'perform p_titulo, p_mensagem, p_href, p_criado_em;', 'perform p_publicado_em;');
  v_body := replace(v_body, 'coalesce(p_tipo,', 'coalesce(''novo-capitulo'',');
  v_body := replace(v_body, 'coalesce(v_capitulo.criado_em, now());', 'p_publicado_em;');
  -- O schema real limita mensagem a 300; o legado usava 500 e silenciava erro.
  v_body := replace(v_body, E'    500\n  );', E'    300\n  );');
  v_body := replace(v_body, v_handler, E'\nend;\n');
  -- Zero destinatarios e legitimo (ROW_COUNT=0). Zero por contrato indisponivel
  -- nao e: esses returns sao guards de schema/identidade, nao a contagem final.
  v_body := replace(v_body, 'return 0;', 'raise exception ''Contrato de notificacoes indisponivel.'' using errcode = ''55000'';');
  execute 'create function historietas_privado.notificar_capitulo_agendado(
    p_obra_id uuid, p_capitulo_id uuid, p_autor_validado uuid, p_publicado_em timestamptz
  ) returns integer language plpgsql volatile security invoker set search_path = ''''
  as ' || quote_literal(v_body);
end;
$migration$;
revoke all on function historietas_privado.notificar_capitulo_agendado(uuid,uuid,uuid,timestamptz)
  from public,anon,authenticated,service_role;

-- Erro transitorio ainda e intencao ativa: editar/cancelar deve impedir retry.
-- Adapta apenas o ramo de cancelamento, preservando os guards/ACL da fase 1.
do $migration$
declare v_def text;
begin
  select pg_catalog.pg_get_functiondef('historietas_privado.operar_agendamento_capitulo(text,uuid,bigint,timestamptz,text)'::regprocedure) into v_def;
  if strpos(v_def, 'if v_ag.estado = ''agendado'' then') = 0
    or strpos(v_def, 'estado = ''cancelado'', resultado = ''cancelado_pelo_autor'',') = 0 then
    raise exception 'Contrato de cancelamento divergiu.';
  end if;
  v_def := replace(v_def, 'if v_ag.estado = ''agendado'' then', 'if v_ag.estado in (''agendado'',''erro'') then');
  v_def := replace(v_def, 'estado = ''cancelado'', resultado = ''cancelado_pelo_autor'',',
    'estado = ''cancelado'', resultado = ''cancelado_pelo_autor'', executado_em = null,');
  execute v_def;
end;
$migration$;
create or replace function historietas_privado.invalidar_agendamento_capitulo()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if exists (select 1 from historietas_privado.capitulo_agendamentos
    where capitulo_id=old.id and estado in ('agendado','erro')) then
    if new.publicado then
      raise exception 'Cancele o agendamento antes de publicar manualmente.' using errcode='PT409';
    end if;
    if (new.titulo,new.texto) is distinct from (old.titulo,old.texto)
      or (new.obra_id,new.user_id,new.tipo_conteudo) is distinct from (old.obra_id,old.user_id,old.tipo_conteudo) then
      update historietas_privado.capitulo_agendamentos set
        estado='invalidado',revisao=revisao+1,atualizado_em=clock_timestamp(),executado_em=null,
        resultado=case when (new.titulo,new.texto) is distinct from (old.titulo,old.texto)
          then 'conteudo_alterado' else 'vinculo_alterado' end
      where capitulo_id=old.id and estado in ('agendado','erro');
    end if;
  end if;
  return new;
end;
$$;
revoke all on function historietas_privado.invalidar_agendamento_capitulo() from public,anon,authenticated,service_role;

create function historietas_privado.executar_agendamento_capitulo(p_capitulo_id uuid, p_revisao_esperada bigint)
returns jsonb language plpgsql volatile security invoker set search_path = '' as $$
declare
  v_antes historietas_privado.capitulo_agendamentos;
  v_ag historietas_privado.capitulo_agendamentos;
  v_cap public.capitulos;
  v_obra public.obras;
  v_evento historietas_privado.capitulo_publicacao_eventos;
  v_perfil_existe boolean;
  v_autor_autorizado boolean;
  v_agora timestamptz;
  v_total integer;
begin
  if p_capitulo_id is null or p_revisao_esperada is null or p_revisao_esperada < 1 then
    raise exception 'Identificador/revisao invalidos.' using errcode = '22023';
  end if;
  -- So executores usam este try-lock. Nao muda a ordem pai/filho das operacoes
  -- autenticadas: cancelamento/edicao/reagendamento serializam no capitulo.
  if not pg_catalog.pg_try_advisory_xact_lock(pg_catalog.hashtextextended('historietas:agendamento:' || p_capitulo_id::text,0)) then
    return jsonb_build_object('estado','ocupado');
  end if;
  -- Mesmo lock da RPC legada ANTES de bloquear o capitulo: evita inverter
  -- lock de notificacao/FK quando os dois caminhos se encontram.
  if not pg_catalog.pg_try_advisory_xact_lock(pg_catalog.hashtextextended('novo-capitulo:' || p_capitulo_id::text,0)) then
    return jsonb_build_object('estado','ocupado');
  end if;
  select * into v_antes from historietas_privado.capitulo_agendamentos where capitulo_id = p_capitulo_id;
  if not found then return jsonb_build_object('estado','ausente'); end if;
  -- Autor real e aceites nao podem desaparecer/mudar entre validacao e commit.
  select deleted_at is null and (banned_until is null or banned_until <= clock_timestamp())
    into v_autor_autorizado from auth.users where id = v_antes.autor_id for share;
  if not found then return jsonb_build_object('estado','ausente'); end if;
  perform 1 from public.profiles where user_id = v_antes.autor_id or id = v_antes.autor_id for share;
  v_perfil_existe := found;
  select o.* into v_obra from public.obras o join public.capitulos c on c.obra_id = o.id
    where c.id = p_capitulo_id for share of o;
  if not found then return jsonb_build_object('estado','ausente'); end if;
  select * into v_cap from public.capitulos where id = p_capitulo_id for update;
  if not found then return jsonb_build_object('estado','ausente'); end if;
  select * into v_ag from historietas_privado.capitulo_agendamentos where capitulo_id = p_capitulo_id for update;
  if not found then return jsonb_build_object('estado','ausente'); end if;
  -- A identidade lida antes dos locks nao e autorizacao reutilizavel.
  if v_ag.autor_id <> v_antes.autor_id or v_cap.obra_id <> v_obra.id then
    return jsonb_build_object('estado','desatualizado');
  end if;
  select * into v_evento from historietas_privado.capitulo_publicacao_eventos
    where capitulo_id = p_capitulo_id and revisao_agendada = p_revisao_esperada;
  if found then
    return jsonb_build_object('estado','publicado','publicadoEm',v_evento.publicado_em,
      'notificacoes',v_evento.notificacoes_criadas,'repetido',true);
  end if;
  if v_ag.revisao <> p_revisao_esperada or v_ag.estado not in ('agendado','erro') then
    return jsonb_build_object('estado','desatualizado');
  end if;
  v_agora := clock_timestamp();
  if v_ag.publicar_em > v_agora then return jsonb_build_object('estado','futuro'); end if;
  if v_ag.estado = 'erro' and v_ag.executado_em > v_agora - interval '1 minute' then
    return jsonb_build_object('estado','aguardando_retry');
  end if;
  if v_autor_autorizado is not true or not v_perfil_existe or public.usuario_aceitou_termos_publicacao(v_ag.autor_id) is not true
    or v_obra.user_id is distinct from v_ag.autor_id or v_cap.user_id is distinct from v_ag.autor_id
    or v_obra.publicado is not true or v_cap.publicado is not false or v_cap.tipo_conteudo is distinct from 'texto'
    or exists (select 1 from public.operacoes_exclusao_conta where subject_user_id = v_ag.autor_id) then
    update historietas_privado.capitulo_agendamentos set estado='bloqueado',resultado='autorizacao_indisponivel',
      executado_em=v_agora,atualizado_em=v_agora,revisao=revisao+1 where capitulo_id=p_capitulo_id;
    return jsonb_build_object('estado','bloqueado');
  end if;
  begin
    -- Retira pendente ANTES do UPDATE de capitulo, sob os mesmos locks e na
    -- MESMA subtransacao. Sem GUC/bypass no trigger da fase 1 e sem novo grant.
    update historietas_privado.capitulo_agendamentos set estado='publicado',resultado='publicado',
      executado_em=v_agora,atualizado_em=v_agora,revisao=revisao+1 where capitulo_id=p_capitulo_id;
    update public.capitulos set publicado=true,atualizado_em=v_agora where id=p_capitulo_id;
    v_total := historietas_privado.notificar_capitulo_agendado(v_obra.id,p_capitulo_id,v_ag.autor_id,v_agora);
    insert into historietas_privado.capitulo_publicacao_eventos
      (capitulo_id,revisao_agendada,autor_id,obra_id,publicado_em,notificacoes_criadas)
      values (p_capitulo_id,p_revisao_esperada,v_ag.autor_id,v_obra.id,v_agora,v_total);
    return jsonb_build_object('estado','publicado','publicadoEm',v_agora,'notificacoes',v_total,'repetido',false);
  exception when others then
    -- Publicacao, notificacoes parciais e evento sao TODOS revertidos. Nao
    -- guardar sqlerrm ou dados sensiveis. A mesma intencao pode ser repetida,
    -- apos cooldown; erro nao avanca revisao nem resgata intencao invalidada.
    update historietas_privado.capitulo_agendamentos set estado='erro',resultado='falha_transitoria',
      executado_em=clock_timestamp(),atualizado_em=clock_timestamp() where capitulo_id=p_capitulo_id;
    return jsonb_build_object('estado','erro');
  end;
end;
$$;
revoke all on function historietas_privado.executar_agendamento_capitulo(uuid,bigint)
  from public,anon,authenticated,service_role;

create function historietas_privado.executar_lote_agendamentos_capitulos(p_limite integer default 5)
returns jsonb language plpgsql volatile security invoker set search_path = '' as $$
declare v_item record; v_resultado jsonb; v_itens jsonb := '[]'::jsonb; v_limiar timestamptz := clock_timestamp();
begin
  if p_limite is null or p_limite not between 1 and 10 then
    raise exception 'Lote deve conter de 1 a 10 capitulos.' using errcode = '22023';
  end if;
  -- Sem lock antecipado no registro filho. O nucleo usa try-lock por capitulo
  -- e relê revisao/identidade apos bloquear os pais; dois lotes nao duplicam IO.
  for v_item in select capitulo_id,revisao from historietas_privado.capitulo_agendamentos
    where publicar_em <= v_limiar and (estado='agendado'
      or (estado='erro' and executado_em <= v_limiar-interval '1 minute'))
    order by publicar_em,capitulo_id limit p_limite
  loop
    v_resultado := historietas_privado.executar_agendamento_capitulo(v_item.capitulo_id,v_item.revisao);
    v_itens := v_itens || jsonb_build_array(v_resultado || jsonb_build_object('capituloId',v_item.capitulo_id));
  end loop;
  return v_itens;
end;
$$;
revoke all on function historietas_privado.executar_lote_agendamentos_capitulos(integer)
  from public,anon,authenticated,service_role;
comment on function historietas_privado.executar_lote_agendamentos_capitulos(integer) is
  'Somente SQL administrativo confiavel. Sem wrapper, grant de API, consumidor ou Cron. Publicacao/notificacoes atomicas; retries manuais limitados por lote e cooldown.';
comment on table historietas_privado.capitulo_publicacao_eventos is
  'Recibo privado por intencao publicada, atomico com capitulo/notificacoes. Cascatas preservam exclusao de conta. Nao e executor de Diario/cache.';
comment on table historietas_privado.capitulo_agendamentos is
  'Intencao privada com revisao. Executor SQL administrativo revalida autorizacao e prazo; nao existe Cron, endpoint ou consumidor automatico.';
commit;
