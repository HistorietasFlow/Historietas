-- 2C2c: observacao duravel e gate FECHADO. Sem escritor ou publicacao.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '30s';

-- Sem FK: recibos sobrevivem a exclusoes de conta, obra, capitulo e reserva.
-- sha256 e metadados sao a observacao de um futuro verificador INTERNO,
-- nunca prova de terminalidade nem atestado recebido do navegador.
create table historietas_privado.capitulo_upload_recibos (
  id uuid primary key default gen_random_uuid(),
  tentativa_id uuid not null unique,
  reserva_id uuid not null,
  user_id uuid not null,
  sessao_id uuid not null,
  capitulo_id uuid not null,
  versao_esperada bigint not null check (versao_esperada >= 0),
  storage_path text not null unique,
  objeto_id uuid not null,
  objeto_versao text not null check (char_length(objeto_versao) between 1 and 128),
  sha256 text not null check (sha256 ~ '^[0-9a-f]{64}$'),
  tamanho_bytes bigint not null check (tamanho_bytes between 1 and 2097152),
  largura integer not null check (largura between 1 and 2048),
  altura integer not null check (altura between 1 and 4096),
  mime_type text not null check (mime_type in ('image/jpeg','image/png','image/webp')),
  evidencia text not null default 'observacao_sem_terminalidade'
    check (evidencia = 'observacao_sem_terminalidade'),
  criado_em timestamptz not null default clock_timestamp(),
  check (largura::bigint * altura <= 8000000),
  check (storage_path = user_id::text || '/capitulos/' || capitulo_id::text || '/' || reserva_id::text ||
    case mime_type when 'image/jpeg' then '.jpg' when 'image/png' then '.png' else '.webp' end)
);
alter table historietas_privado.capitulo_upload_recibos enable row level security;
revoke all on table historietas_privado.capitulo_upload_recibos from public,anon,authenticated,service_role;

create function historietas_privado.registrar_observacao_upload_pagina(
  p_tentativa_id uuid, p_lease_token uuid, p_objeto_id uuid, p_objeto_versao text, p_sha256 text
) returns jsonb language plpgsql volatile security invoker set search_path = '' as $$
declare
  v_t historietas_privado.capitulo_upload_tentativas;
  v_r historietas_privado.capitulo_upload_recibos;
begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('historietas:storage:cota:v1',0));
  select * into v_t from historietas_privado.capitulo_upload_tentativas where id=p_tentativa_id for update;
  if not found or v_t.lease_token is distinct from p_lease_token
    or v_t.estado not in ('transferindo','incerta') then
    raise exception 'Tentativa indisponivel.' using errcode='PT409';
  end if;
  -- Pode observar depois de logout/cascata: nao revalida nem concede direitos.
  if p_sha256 is null or p_sha256 is distinct from v_t.sha256 then
    raise exception 'Bytes divergentes.' using errcode='22023';
  end if;
  select * into v_r from historietas_privado.capitulo_upload_recibos where tentativa_id=v_t.id;
  if found then
    if (v_r.objeto_id,v_r.objeto_versao,v_r.sha256) is distinct from (p_objeto_id,p_objeto_versao,p_sha256) then
      raise exception 'Recibo divergente.' using errcode='PT409';
    end if;
  else
    -- Metadata do Storage so identifica a observacao; nao prova hash/ausencia
    -- de outros escritores. Nao ha escrita ou DELETE em storage.objects.
    if not exists (select 1 from storage.objects where id=p_objeto_id
      and bucket_id='arquivos-obras' and name=v_t.storage_path and version=p_objeto_versao
      and metadata->>'size'=v_t.tamanho_bytes::text and metadata->>'mimetype'=v_t.mime_type) then
      raise exception 'Objeto observado indisponivel.' using errcode='PT409';
    end if;
    insert into historietas_privado.capitulo_upload_recibos
      (tentativa_id,reserva_id,user_id,sessao_id,capitulo_id,versao_esperada,storage_path,
       objeto_id,objeto_versao,sha256,tamanho_bytes,largura,altura,mime_type)
    values (v_t.id,v_t.reserva_id,v_t.user_id,v_t.sessao_id,v_t.capitulo_id,v_t.versao_esperada,v_t.storage_path,
      p_objeto_id,p_objeto_versao,p_sha256,v_t.tamanho_bytes,v_t.largura,v_t.altura,v_t.mime_type)
    returning * into v_r;
  end if;
  return jsonb_build_object('reciboId',v_r.id,'publicacaoHabilitada',false,'evidencia',v_r.evidencia);
end;
$$;

-- Controle transacional preparatorio, SEM DML no manifesto. O resultado nao e
-- uma capacidade reutilizavel: uma futura finalizacao tera de repetir tudo na
-- MESMA transacao que publica e comprovar terminalidade ainda inexistente.
create function historietas_privado.conferir_finalizacao_pagina(
  p_tentativa_id uuid, p_lease_token uuid, p_recibo_id uuid
) returns jsonb language plpgsql volatile security invoker set search_path = '' as $$
declare v_t historietas_privado.capitulo_upload_tentativas;
begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('historietas:storage:cota:v1',0));
  select * into v_t from historietas_privado.capitulo_upload_tentativas where id=p_tentativa_id;
  if not found or v_t.user_id is distinct from (select auth.uid())
    or v_t.sessao_id::text is distinct from (auth.jwt()->>'session_id') then
    raise exception 'Tentativa indisponivel.' using errcode='42501';
  end if;
  -- Sessao real FOR SHARE, depois obra/capitulo/reserva na ordem existente.
  perform historietas_privado.conferir_reserva_pagina_capitulo(v_t.reserva_id,v_t.capitulo_id,v_t.versao_esperada);
  select * into strict v_t from historietas_privado.capitulo_upload_tentativas where id=p_tentativa_id for update;
  if v_t.estado <> 'transferindo' or v_t.lease_token is distinct from p_lease_token
    or v_t.lease_ate <= clock_timestamp() then
    raise exception 'Tentativa encerrada.' using errcode='PT409';
  end if;
  if exists (select 1 from public.operacoes_exclusao_conta where subject_user_id=v_t.user_id)
    or exists (select 1 from historietas_privado.capitulo_arquivos_limpeza where storage_path=v_t.storage_path) then
    raise exception 'Finalizacao cancelada ou em limpeza.' using errcode='PT409';
  end if;
  perform 1 from historietas_privado.capitulo_upload_recibos
    where id=p_recibo_id and tentativa_id=v_t.id and reserva_id=v_t.reserva_id
      and user_id=v_t.user_id and sessao_id=v_t.sessao_id and capitulo_id=v_t.capitulo_id
      and versao_esperada=v_t.versao_esperada and storage_path=v_t.storage_path
      and sha256=v_t.sha256 and tamanho_bytes=v_t.tamanho_bytes
      and largura=v_t.largura and altura=v_t.altura and mime_type=v_t.mime_type for share;
  if not found then raise exception 'Recibo indisponivel.' using errcode='PT409'; end if;
  return jsonb_build_object('publicacaoHabilitada',false,'motivo','terminalidade_nao_comprovada');
end;
$$;

-- Uma exclusao ja registrada impede novas tentativas/inicios. A operacao de
-- exclusao existe antes da RPC de conferência; o lock compartilhado serializa
-- com preparacao/inicio, e o ledger retido bloqueia a limpeza em caso de corrida.
create function historietas_privado.bloquear_tentativa_durante_exclusao()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if tg_op='INSERT' or (old.estado='preparada' and new.estado='transferindo') then
    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('historietas:storage:cota:v1',0));
    if exists (select 1 from public.operacoes_exclusao_conta where subject_user_id=new.user_id) then
      raise exception 'Conta em exclusao.' using errcode='PT409';
    end if;
  end if;
  return new;
end;
$$;
create trigger capitulo_tentativas_bloquear_exclusao before insert or update on historietas_privado.capitulo_upload_tentativas
for each row execute function historietas_privado.bloquear_tentativa_durante_exclusao();

-- Unica projecao nova exposta: booleano para o executor administrativo existente.
-- Nao lista caminhos/usuarios, nao remove arquivos, nao libera capacidade.
create function historietas_privado.ha_uploads_ilustrados_pendentes_exclusao(p_user_id uuid)
returns boolean language plpgsql volatile security definer set search_path = '' as $$
begin
  if p_user_id is null then raise exception 'Identidade necessaria.' using errcode='22023'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('historietas:storage:cota:v1',0));
  return exists (select 1 from historietas_privado.capitulo_upload_tentativas
    where user_id=p_user_id and estado <> 'cancelada_sem_envio');
end;
$$;
create function public.ha_uploads_ilustrados_pendentes_exclusao(p_user_id uuid)
returns boolean language sql volatile security invoker set search_path = '' as $$
  select historietas_privado.ha_uploads_ilustrados_pendentes_exclusao(p_user_id);
$$;
alter function historietas_privado.ha_uploads_ilustrados_pendentes_exclusao(uuid) owner to postgres;
revoke all on function historietas_privado.registrar_observacao_upload_pagina(uuid,uuid,uuid,text,text) from public,anon,authenticated,service_role;
revoke all on function historietas_privado.conferir_finalizacao_pagina(uuid,uuid,uuid) from public,anon,authenticated,service_role;
revoke all on function historietas_privado.bloquear_tentativa_durante_exclusao() from public,anon,authenticated,service_role;
revoke all on function historietas_privado.ha_uploads_ilustrados_pendentes_exclusao(uuid) from public,anon,authenticated,service_role;
revoke all on function public.ha_uploads_ilustrados_pendentes_exclusao(uuid) from public,anon,authenticated,service_role;
grant execute on function historietas_privado.ha_uploads_ilustrados_pendentes_exclusao(uuid) to service_role;
grant execute on function public.ha_uploads_ilustrados_pendentes_exclusao(uuid) to service_role;
comment on table historietas_privado.capitulo_upload_recibos is
  '2C2c: observacao interna duravel, sem prova de terminalidade e sem autorizacao de publicacao. Sem escritor/consumidor. Quotas retidas; limpeza fisica e manifesto continuam bloqueados.';
notify pgrst, 'reload schema';
commit;
