-- 6D13: adaptador autenticado estreito; nao ativa nenhum controle.
begin;
set local lock_timeout='5s';
set local statement_timeout='30s';

create function historietas_privado.operar_cache_capitulos(p_id uuid,p_acao text)
returns jsonb language plpgsql volatile security definer set search_path='' as $$
declare
  g historietas_privado.capitulo_cache_operacoes_controle;
  u uuid := auth.uid(); s uuid; existente boolean; r jsonb;
begin
  -- Somente claims autenticadas pelo PostgREST; IDs nao sao argumentos da API.
  if coalesce(auth.jwt()->>'role','')<>'authenticated' or u is null then
    raise exception 'Sessao administrativa obrigatoria.' using errcode='42501'; end if;
  begin s:=(auth.jwt()->>'session_id')::uuid;
  exception when invalid_text_representation then
    raise exception 'Sessao invalida.' using errcode='42501'; end;
  if s is null then raise exception 'Sessao ausente.' using errcode='42501'; end if;
  if p_acao is null or p_acao not in ('preparar','executar','reconciliar') then
    raise exception 'Acao invalida.' using errcode='22023'; end if;
  -- Mesma ordem da 6D12. Nenhum IO Next/HTTP atravessa esta transacao.
  select * into strict g from historietas_privado.capitulo_cache_operacoes_controle where singleton for update;
  perform historietas_privado.validar_admin_operacao_cache(u,s);
  if not g.habilitado and not g.iniciado and g.pendente is null then
    if p_acao='preparar' then return jsonb_build_object('estado','legado'); end if;
    return jsonb_build_object('estado','protocolo_desativado');
  end if;
  if p_id is null then return jsonb_build_object('estado','identificador_obrigatorio'); end if;
  if exists(select 1 from historietas_privado.capitulo_cache_operacoes where id=p_id
    and row(usuario_id,sessao_id,limite) is distinct from row(u,s,5)) then
    raise exception 'Operacao indisponivel nesta sessao.' using errcode='42501'; end if;
  -- Constraints INVOKER da 6D12 exigem autoridade do adaptador, nao do papel
  -- PostgREST no COMMIT. Conferir depois de TODOS os vinculos, sem novos grants.
  set constraints historietas_privado.capitulo_cache_intencao_recibo,
    historietas_privado.capitulo_cache_recibo_vinculos deferred;
  if p_acao='preparar' then
    existente:=exists(select 1 from historietas_privado.capitulo_cache_operacoes where id=p_id);
    r:=historietas_privado.admitir_operacao_cache(p_id,u,s,5);
    r:=r || jsonb_build_object('nova',not existente and r->>'estado'='admitida');
  elsif p_acao='executar' then
    r:=historietas_privado.executar_operacao_cache(p_id,u,s,5);
  else
    -- Nao executa uma intencao admitida. Sela inclusive UUID ausente, sob lock.
    r:=historietas_privado.reconciliar_operacao_cache(p_id,u,s,5);
    if r->>'estado'='confirmada' then
      r:=historietas_privado.executar_operacao_cache(p_id,u,s,5);
    end if;
  end if;
  set constraints historietas_privado.capitulo_cache_intencao_recibo,
    historietas_privado.capitulo_cache_recibo_vinculos immediate;
  return r;
end;
$$;
alter function historietas_privado.operar_cache_capitulos(uuid,text) owner to postgres;
revoke all on function historietas_privado.operar_cache_capitulos(uuid,text) from public,anon,authenticated,service_role;
grant execute on function historietas_privado.operar_cache_capitulos(uuid,text) to authenticated;
create function public.operar_cache_capitulos(p_id uuid,p_acao text)
returns jsonb language sql volatile security invoker set search_path='' as $$
  select historietas_privado.operar_cache_capitulos(p_id,p_acao);
$$;
revoke all on function public.operar_cache_capitulos(uuid,text) from public,anon,authenticated,service_role;
grant execute on function public.operar_cache_capitulos(uuid,text) to authenticated;
notify pgrst,'reload schema';
commit;
