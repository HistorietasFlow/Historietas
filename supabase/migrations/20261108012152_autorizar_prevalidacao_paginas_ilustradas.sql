-- Fase 2C1: somente autorizacao de pre-validacao, SEM escrita no Storage.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '30s';

create function historietas_privado.conferir_reserva_pagina_capitulo(
  p_reserva_id uuid, p_capitulo_id uuid, p_versao_esperada bigint
)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare
  v_uid uuid := (select auth.uid());
  v_sessao text := (select auth.jwt()->>'session_id');
  v_obra_id uuid;
  v_cap public.capitulos;
  v_res historietas_privado.capitulo_uploads_pendentes;
  v_mime text;
begin
  if v_uid is null or v_sessao is null
    or v_sessao !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' then
    raise exception 'Sessao autenticada necessaria.' using errcode = '42501';
  end if;
  -- JWT ainda assinado nao comprova sessao ativa depois de logout.
  perform 1 from auth.sessions where id = v_sessao::uuid and user_id = v_uid
    and (not_after is null or not_after > clock_timestamp()) for share;
  if not found then raise exception 'Sessao indisponivel.' using errcode = '42501'; end if;
  if p_versao_esperada is null or p_versao_esperada < 0 then
    raise exception 'Versao invalida.' using errcode = '22023';
  end if;
  -- Mesma ordem pai/filho das cascatas; nenhum lock atravessa o processamento HTTP.
  select obra_id into v_obra_id from public.capitulos where id = p_capitulo_id and user_id = v_uid;
  perform 1 from public.obras where id = v_obra_id and user_id = v_uid for share;
  if not found then raise exception 'Reserva indisponivel.' using errcode = '42501'; end if;
  select * into v_cap from public.capitulos
    where id = p_capitulo_id and obra_id = v_obra_id and user_id = v_uid for share;
  if not found then raise exception 'Reserva indisponivel.' using errcode = '42501'; end if;
  select * into v_res from historietas_privado.capitulo_uploads_pendentes
    where id = p_reserva_id and capitulo_id = p_capitulo_id and user_id = v_uid for share;
  if not found then raise exception 'Reserva indisponivel.' using errcode = '42501'; end if;
  if v_cap.versao_paginas <> p_versao_esperada or v_res.versao_esperada <> p_versao_esperada then
    raise exception 'Versao do manifesto desatualizada.' using errcode = 'PT409';
  end if;
  if v_res.liberado_em is not null or v_res.expira_em <= clock_timestamp() then
    raise exception 'Reserva encerrada.' using errcode = 'PT410';
  end if;
  if v_res.estado <> 'reservado' or (v_cap.tipo_conteudo = 'texto' and v_cap.publicado) then
    raise exception 'Reserva indisponivel para pre-validacao.' using errcode = 'PT409';
  end if;
  v_mime := case right(v_res.storage_path, 4) when '.jpg' then 'image/jpeg'
    when '.png' then 'image/png' else case right(v_res.storage_path, 5) when '.webp' then 'image/webp' end end;
  if v_mime is null then raise exception 'Formato da reserva invalido.' using errcode = '22023'; end if;
  -- Nao expor caminho, sessao, capacidade de upload ou dados de outras contas.
  return jsonb_build_object('usuarioId', v_uid, 'mimeType', v_mime,
    'expiraEm', v_res.expira_em, 'versaoEsperada', v_res.versao_esperada);
end;
$$;
create function public.conferir_reserva_pagina_capitulo(
  p_reserva_id uuid, p_capitulo_id uuid, p_versao_esperada bigint
)
returns jsonb language sql volatile security invoker set search_path = '' as $$
  select historietas_privado.conferir_reserva_pagina_capitulo(p_reserva_id, p_capitulo_id, p_versao_esperada);
$$;
alter function historietas_privado.conferir_reserva_pagina_capitulo(uuid,uuid,bigint) owner to postgres;
revoke all on function historietas_privado.conferir_reserva_pagina_capitulo(uuid,uuid,bigint)
  from public, anon, authenticated, service_role;
revoke all on function public.conferir_reserva_pagina_capitulo(uuid,uuid,bigint)
  from public, anon, authenticated, service_role;
grant execute on function historietas_privado.conferir_reserva_pagina_capitulo(uuid,uuid,bigint) to authenticated;
grant execute on function public.conferir_reserva_pagina_capitulo(uuid,uuid,bigint) to authenticated;
comment on function public.conferir_reserva_pagina_capitulo(uuid,uuid,bigint) is
  'Pre-validacao autenticada e somente leitura; nao bloqueia quota durante IO, nao autoriza Storage nem finaliza paginas.';

-- Reutiliza o nucleo do limitador existente sem expor parametros nem alterar
-- os grants da RPC generica. Nenhum service role no endpoint.
create function historietas_privado.limitar_prevalidacao_pagina_capitulo()
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare
  v_uid uuid := (select auth.uid());
  v_sessao text := (select auth.jwt()->>'session_id');
  v_limite record;
begin
  if v_uid is null or v_sessao is null
    or v_sessao !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' then
    raise exception 'Sessao autenticada necessaria.' using errcode = '42501';
  end if;
  perform 1 from auth.sessions where id = v_sessao::uuid and user_id = v_uid
    and (not_after is null or not_after > clock_timestamp()) for share;
  if not found then raise exception 'Sessao indisponivel.' using errcode = '42501'; end if;
  select * into v_limite from historietas_privado.consumir_limite_requisicao(
    'prevalidar-pagina-capitulo',
    encode(sha256(convert_to('prevalidar-pagina-capitulo:' || v_uid::text, 'UTF8')), 'hex'),
    30, 60, 60);
  return jsonb_build_object('permitido', v_limite.permitido,
    'tentarNovamenteSegundos', v_limite.tentar_novamente_segundos);
end;
$$;
create function public.limitar_prevalidacao_pagina_capitulo()
returns jsonb language sql volatile security invoker set search_path = '' as $$
  select historietas_privado.limitar_prevalidacao_pagina_capitulo();
$$;
alter function historietas_privado.limitar_prevalidacao_pagina_capitulo() owner to postgres;
revoke all on function historietas_privado.limitar_prevalidacao_pagina_capitulo() from public, anon, authenticated, service_role;
revoke all on function public.limitar_prevalidacao_pagina_capitulo() from public, anon, authenticated, service_role;
grant execute on function historietas_privado.limitar_prevalidacao_pagina_capitulo() to authenticated;
grant execute on function public.limitar_prevalidacao_pagina_capitulo() to authenticated;
notify pgrst, 'reload schema';
commit;
