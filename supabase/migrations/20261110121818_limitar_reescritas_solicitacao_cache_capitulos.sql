-- 6D8 parcial: no maximo uma alteracao CONFIRMADA de solicitada_em por evento.
-- Locks ainda podem gerar WAL; isto NAO e um orcamento fisico ou ACK.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '30s';

create or replace function historietas_privado.registrar_solicitacao_cache_capitulo(p_id uuid,p_lease_id uuid)
returns boolean language plpgsql volatile security definer set search_path = '' as $$
declare v_solicitada_em timestamptz; v_lease_ate timestamptz;
begin
  -- Mesmo lock exclusivo do UPDATE anterior. Uma reivindicacao concorrente ou
  -- um snapshot obsoleto nao pode validar um lease que ja foi substituido.
  select solicitada_em,lease_ate into v_solicitada_em,v_lease_ate
    from historietas_privado.capitulo_cache_outbox
    where id=p_id and lease_id=p_lease_id and lease_ate > clock_timestamp()
    for update;
  if not found or v_lease_ate <= clock_timestamp() then
    raise exception 'Lease indisponivel.' using errcode='55000';
  end if;
  if v_solicitada_em is null then
    update historietas_privado.capitulo_cache_outbox set solicitada_em=clock_timestamp()
      where id=p_id;
  end if;
  return true;
end;
$$;
-- CREATE OR REPLACE conserva owner/ACL/assinatura. Wrapper e grants intactos.
comment on function historietas_privado.registrar_solicitacao_cache_capitulo(uuid,uuid) is
  'Solicitacao nao e ACK. Lease atual obrigatorio inclusive no retry. No maximo uma escrita confirmada de solicitada_em por evento; repeticoes preservam timestamp/tupla. Locks, reivindicacoes e abortos ainda geram WAL. Sem ativacao ou descarte.';
commit;
