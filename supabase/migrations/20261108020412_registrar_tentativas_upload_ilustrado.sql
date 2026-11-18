-- Fase 2C2a: ledger e protocolo PRIVADOS. Nenhum escritor Storage habilitado.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '30s';

-- Sem FKs deliberadamente: nem logout nem cascata podem apagar a evidencia
-- de uma escrita possivel. UUIDs sao referencias de auditoria, nao autorizacao.
create table historietas_privado.capitulo_upload_tentativas (
  id uuid primary key default gen_random_uuid(),
  reserva_id uuid not null unique,
  capitulo_id uuid not null,
  user_id uuid not null,
  sessao_id uuid not null,
  chave_requisicao uuid not null,
  versao_esperada bigint not null check (versao_esperada >= 0),
  storage_path text not null unique,
  mime_type text not null check (mime_type in ('image/jpeg','image/png','image/webp')),
  tamanho_reservado bigint not null default 2097152 check (tamanho_reservado = 2097152),
  estado text not null default 'preparada'
    check (estado in ('preparada','transferindo','incerta','cancelada_sem_envio')),
  lease_token uuid not null default gen_random_uuid(),
  criado_em timestamptz not null default clock_timestamp(),
  lease_ate timestamptz not null default (clock_timestamp() + interval '2 minutes'),
  iniciado_em timestamptz,
  atualizado_em timestamptz not null default clock_timestamp(),
  sha256 text check (sha256 ~ '^[0-9a-f]{64}$'),
  tamanho_bytes bigint check (tamanho_bytes between 1 and 2097152),
  largura integer check (largura between 1 and 2048),
  altura integer check (altura between 1 and 4096),
  ultimo_erro_codigo text check (ultimo_erro_codigo in ('timeout','storage','cancelamento','resposta_ambigua')),
  unique(user_id, chave_requisicao),
  check (lease_ate > criado_em and lease_ate <= criado_em + interval '3 minutes'),
  check (largura::bigint * altura <= 8000000),
  check (storage_path = user_id::text || '/capitulos/' || capitulo_id::text || '/' || reserva_id::text ||
    case mime_type when 'image/jpeg' then '.jpg' when 'image/png' then '.png' else '.webp' end),
  check ((estado in ('preparada','cancelada_sem_envio') and iniciado_em is null
      and sha256 is null and tamanho_bytes is null and largura is null and altura is null)
    or (estado in ('transferindo','incerta') and iniciado_em is not null
      and sha256 is not null and tamanho_bytes is not null and largura is not null and altura is not null))
);
create index capitulo_upload_tentativas_usuario_idx on historietas_privado.capitulo_upload_tentativas(user_id);
create index capitulo_upload_tentativas_recuperacao_idx on historietas_privado.capitulo_upload_tentativas(lease_ate)
  where estado <> 'cancelada_sem_envio';
alter table historietas_privado.capitulo_upload_tentativas enable row level security;
revoke all on table historietas_privado.capitulo_upload_tentativas from public, anon, authenticated, service_role;

-- Mesma projecao e mesmo advisory lock dos anexos, sem modificar suas policies.
-- MAX por caminho evita contar reserva + tentativa + objeto tres vezes.
-- Lease vencido NAO libera capacidade; ausencia de resposta nao prova ausencia.
create or replace function historietas_privado.objetos_storage_com_reservas()
returns table(id uuid, bucket_id text, name text, metadata jsonb)
language sql volatile security invoker set search_path = '' as $$
  with compromissos as (
    select storage_path, max(tamanho_reservado) tamanho_reservado from (
      select storage_path, tamanho_reservado from historietas_privado.capitulo_uploads_pendentes
      where liberado_em is null and expira_em > statement_timestamp()
      union all
      select storage_path, tamanho_reservado from historietas_privado.capitulo_upload_tentativas
      where estado <> 'cancelada_sem_envio'
    ) capacidade group by storage_path
  )
  select o.id, o.bucket_id, o.name, jsonb_build_object('size', greatest(
    case when pg_catalog.pg_input_is_valid(coalesce(o.metadata->>'size',''), 'pg_catalog.int8')
      and coalesce(o.metadata->>'size','') not like '-%' then (o.metadata->>'size')::bigint
      else case o.bucket_id when 'avatars' then 1048576 when 'capas-obras' then 2097152 else 5242880 end
    end, coalesce(c.tamanho_reservado,0)))
  from storage.objects o left join compromissos c on o.bucket_id='arquivos-obras' and c.storage_path=o.name
  where o.bucket_id in ('avatars','capas-obras','arquivos-obras')
  union all
  select null::uuid, 'arquivos-obras', c.storage_path, jsonb_build_object('size',c.tamanho_reservado)
  from compromissos c where not exists (select 1 from storage.objects o
    where o.bucket_id='arquivos-obras' and o.name=c.storage_path);
$$;

-- Chamavel apenas pelo owner do banco, ainda SEM wrapper publico ou grant a
-- service_role. Nao aceitar metadata do navegador como prova do decoder.
create function historietas_privado.preparar_tentativa_upload_pagina(
  p_reserva_id uuid, p_capitulo_id uuid, p_versao_esperada bigint, p_chave_requisicao uuid
) returns jsonb language plpgsql volatile security invoker set search_path = '' as $$
declare
  v_uid uuid := (select auth.uid());
  v_conferencia jsonb;
  v_r historietas_privado.capitulo_uploads_pendentes;
  v_t historietas_privado.capitulo_upload_tentativas;
begin
  if p_chave_requisicao is null then raise exception 'Chave necessaria.' using errcode='22023'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('historietas:storage:cota:v1',0));
  v_conferencia := historietas_privado.conferir_reserva_pagina_capitulo(p_reserva_id,p_capitulo_id,p_versao_esperada);
  select * into strict v_r from historietas_privado.capitulo_uploads_pendentes where id=p_reserva_id;
  select * into v_t from historietas_privado.capitulo_upload_tentativas where reserva_id=p_reserva_id for update;
  if found then
    if v_t.user_id <> v_uid or v_t.sessao_id <> (auth.jwt()->>'session_id')::uuid
      or v_t.chave_requisicao <> p_chave_requisicao or v_t.capitulo_id <> p_capitulo_id
      or v_t.versao_esperada <> p_versao_esperada then
      raise exception 'Tentativa ja vinculada.' using errcode='PT409';
    end if;
    if v_t.estado = 'cancelada_sem_envio' or v_t.lease_ate <= clock_timestamp() then
      raise exception 'Tentativa encerrada; reconciliacao necessaria.' using errcode='PT409';
    end if;
  else
    if exists (select 1 from historietas_privado.capitulo_upload_tentativas
      where user_id=v_uid and chave_requisicao=p_chave_requisicao) then
      raise exception 'Chave ja utilizada.' using errcode='PT409';
    end if;
    if exists (select 1 from storage.objects where bucket_id='arquivos-obras' and name=v_r.storage_path)
      or exists (select 1 from historietas_privado.capitulo_arquivos_limpeza where storage_path=v_r.storage_path)
      or exists (select 1 from public.capitulo_paginas where storage_path=v_r.storage_path) then
      raise exception 'Caminho indisponivel.' using errcode='PT409';
    end if;
    -- Verificacao do ledger compartilhado, inclusive reservas ja comprometidas.
    if not historietas_privado.upload_storage_dentro_cota('arquivos-obras',v_r.storage_path,'2097152',null) then
      raise exception 'Capacidade indisponivel.' using errcode='54000';
    end if;
    insert into historietas_privado.capitulo_upload_tentativas
      (reserva_id,capitulo_id,user_id,sessao_id,chave_requisicao,versao_esperada,storage_path,mime_type)
    values(p_reserva_id,p_capitulo_id,v_uid,(auth.jwt()->>'session_id')::uuid,p_chave_requisicao,
      p_versao_esperada,v_r.storage_path,v_conferencia->>'mimeType') returning * into v_t;
  end if;
  return jsonb_build_object('tentativaId',v_t.id,'leaseToken',v_t.lease_token,
    'leaseAte',v_t.lease_ate,'estado',v_t.estado,'escritaHabilitada',false);
end;
$$;

-- Fence de transicao, NAO autorizacao Storage. Repetir nao concede um segundo
-- envio: somente preparada pode transicionar, e o lease nunca e renovado.
create function historietas_privado.iniciar_transferencia_pagina(
  p_tentativa_id uuid, p_lease_token uuid, p_sha256 text, p_tamanho_bytes bigint,
  p_largura integer, p_altura integer, p_mime_type text
) returns void language plpgsql volatile security invoker set search_path = '' as $$
declare v_t historietas_privado.capitulo_upload_tentativas;
begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('historietas:storage:cota:v1',0));
  select * into v_t from historietas_privado.capitulo_upload_tentativas where id=p_tentativa_id;
  if not found or v_t.user_id is distinct from (select auth.uid())
    or v_t.sessao_id::text is distinct from (auth.jwt()->>'session_id') then
    raise exception 'Tentativa indisponivel.' using errcode='42501';
  end if;
  perform historietas_privado.conferir_reserva_pagina_capitulo(v_t.reserva_id,v_t.capitulo_id,v_t.versao_esperada);
  select * into strict v_t from historietas_privado.capitulo_upload_tentativas where id=p_tentativa_id for update;
  if v_t.estado <> 'preparada' or v_t.lease_token is distinct from p_lease_token or v_t.lease_ate <= clock_timestamp() then
    raise exception 'Lease indisponivel.' using errcode='PT409';
  end if;
  if p_mime_type is distinct from v_t.mime_type or p_sha256 is null or p_tamanho_bytes is null
    or p_largura is null or p_altura is null then
    raise exception 'Metadados canonicos invalidos.' using errcode='22023';
  end if;
  -- A tentativa ja e o registro duravel de recuperacao ANTES de qualquer IO.
  -- Nao enfileirar remocao na outbox antiga: ela ainda nao conhece esse lease.
  update historietas_privado.capitulo_upload_tentativas set estado='transferindo',
    iniciado_em=clock_timestamp(),atualizado_em=clock_timestamp(),sha256=p_sha256,
    tamanho_bytes=p_tamanho_bytes,largura=p_largura,altura=p_altura where id=p_tentativa_id;
end;
$$;

-- Pode registrar resultado ambiguo mesmo depois de logout/cascata: e uma
-- operacao interna que SO retira autorizacao, nunca libera quota nem envia IO.
create function historietas_privado.encerrar_tentativa_upload_pagina(
  p_tentativa_id uuid, p_lease_token uuid, p_erro_codigo text
) returns void language plpgsql volatile security invoker set search_path = '' as $$
declare v_t historietas_privado.capitulo_upload_tentativas;
begin
  if p_erro_codigo is null or p_erro_codigo not in ('timeout','storage','cancelamento','resposta_ambigua') then
    raise exception 'Codigo invalido.' using errcode='22023';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('historietas:storage:cota:v1',0));
  select * into v_t from historietas_privado.capitulo_upload_tentativas where id=p_tentativa_id for update;
  if not found or v_t.lease_token is distinct from p_lease_token then
    raise exception 'Tentativa indisponivel.' using errcode='PT409';
  end if;
  if v_t.estado in ('incerta','cancelada_sem_envio') then return; end if;
  update historietas_privado.capitulo_upload_tentativas set
    estado=case when v_t.estado='preparada' then 'cancelada_sem_envio' else 'incerta' end,
    ultimo_erro_codigo=p_erro_codigo,atualizado_em=clock_timestamp() where id=p_tentativa_id;
  -- Preparada nunca deu permissao de IO. Depois de iniciar, ate erro anterior
  -- ao envio deve ser tratado conservadoramente: nao ha prova duravel de ausencia.
end;
$$;

revoke all on function historietas_privado.preparar_tentativa_upload_pagina(uuid,uuid,bigint,uuid)
  from public,anon,authenticated,service_role;
revoke all on function historietas_privado.iniciar_transferencia_pagina(uuid,uuid,text,bigint,integer,integer,text)
  from public,anon,authenticated,service_role;
revoke all on function historietas_privado.encerrar_tentativa_upload_pagina(uuid,uuid,text)
  from public,anon,authenticated,service_role;
comment on table historietas_privado.capitulo_upload_tentativas is
  '2C2a: privado e inativo, sem escritor Storage. Leases vencidos/resultados ambiguos retêm 2 MiB/objeto ate futura reconciliacao comprovada. Sem FKs ou release pos-IO. Nao habilitar upload antes do fence Storage e recibo/limpeza via API.';
commit;
