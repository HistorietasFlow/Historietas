-- Fase 1: contratos privados. SEM executor, Cron ou publicacao automatica.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '30s';

create table historietas_privado.capitulo_agendamentos (
  capitulo_id uuid primary key references public.capitulos(id) on delete cascade,
  autor_id uuid not null references auth.users(id) on delete cascade,
  publicar_em timestamptz not null check (isfinite(publicar_em)),
  fuso_horario text not null check (char_length(fuso_horario) between 1 and 100),
  revisao bigint not null check (revisao > 0),
  estado text not null check (estado in
    ('agendado','cancelado','invalidado','publicado','bloqueado','erro')),
  resultado text check (resultado in
    ('cancelado_pelo_autor','conteudo_alterado','vinculo_alterado',
     'publicado','autorizacao_indisponivel','falha_transitoria')),
  executado_em timestamptz check (isfinite(executado_em)),
  criado_em timestamptz not null default clock_timestamp(),
  atualizado_em timestamptz not null default clock_timestamp(),
  check (((estado = 'agendado' and resultado is null and executado_em is null)
    or (estado = 'cancelado' and resultado = 'cancelado_pelo_autor' and executado_em is null)
    or (estado = 'invalidado' and resultado in ('conteudo_alterado','vinculo_alterado') and executado_em is null)
    or (estado = 'publicado' and resultado = 'publicado' and executado_em is not null)
    or (estado = 'bloqueado' and resultado = 'autorizacao_indisponivel' and executado_em is not null)
    or (estado = 'erro' and resultado = 'falha_transitoria' and executado_em is not null)) is true)
);
create index capitulo_agendamentos_pendentes_idx
  on historietas_privado.capitulo_agendamentos (publicar_em, capitulo_id)
  where estado = 'agendado';
alter table historietas_privado.capitulo_agendamentos enable row level security;
revoke all on table historietas_privado.capitulo_agendamentos
  from public, anon, authenticated, service_role;
-- Sem policy permissiva: somente o nucleo privado com autorizacao explicita.

create function historietas_privado.operar_agendamento_capitulo(
  p_operacao text, p_capitulo_id uuid, p_revisao_esperada bigint,
  p_publicar_em timestamptz, p_fuso_horario text
) returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare
  v_uid uuid := (select auth.uid());
  v_sessao text := (select auth.jwt()->>'session_id');
  v_obra_id uuid;
  v_obra public.obras;
  v_cap public.capitulos;
  v_ag historietas_privado.capitulo_agendamentos;
  v_revisao bigint;
begin
  if v_uid is null or v_sessao is null
    or v_sessao !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' then
    raise exception 'Sessao autenticada necessaria.' using errcode = '42501';
  end if;
  perform 1 from auth.sessions where id = v_sessao::uuid and user_id = v_uid
    and (not_after is null or not_after > clock_timestamp()) for share;
  if not found then raise exception 'Sessao indisponivel.' using errcode = '42501'; end if;
  if p_operacao is null or p_operacao not in ('agendar','cancelar','consultar') then
    raise exception 'Operacao invalida.' using errcode = '22023';
  end if;
  -- Ordem pai/filho/registro tambem usada por cascatas. Edicao direta ja tem
  -- lock no capitulo; seu trigger so acessa o registro, nunca bloqueia o pai.
  select obra_id into v_obra_id from public.capitulos where id = p_capitulo_id and user_id = v_uid;
  select * into v_obra from public.obras where id = v_obra_id and user_id = v_uid for share;
  if not found then raise exception 'Capitulo indisponivel.' using errcode = '42501'; end if;
  select * into v_cap from public.capitulos
    where id = p_capitulo_id and obra_id = v_obra_id and user_id = v_uid for update;
  if not found then raise exception 'Capitulo indisponivel.' using errcode = '42501'; end if;
  select * into v_ag from historietas_privado.capitulo_agendamentos where capitulo_id = p_capitulo_id for update;
  v_revisao := coalesce(v_ag.revisao, 0);

  if p_operacao <> 'consultar' then
    if p_revisao_esperada is null or p_revisao_esperada < 0 then
      raise exception 'Revisao invalida.' using errcode = '22023';
    end if;
    -- Retry de resposta perdida somente da transicao imediatamente anterior,
    -- com mesmo estado/parametros. Nao ressuscita cancelamento ou invalidacao.
    if v_revisao <> p_revisao_esperada and not coalesce((
      v_revisao - 1 = p_revisao_esperada and (
        (p_operacao = 'agendar' and v_ag.estado = 'agendado'
          and v_ag.publicar_em = p_publicar_em and v_ag.fuso_horario = p_fuso_horario)
        or (p_operacao = 'cancelar' and v_ag.estado = 'cancelado')
      )
    ), false) then
      raise exception 'Revisao do agendamento desatualizada.' using errcode = 'PT409';
    end if;
  end if;

  if p_operacao = 'agendar' then
    if v_obra.publicado is not true or v_cap.publicado is not false or v_cap.tipo_conteudo <> 'texto' then
      raise exception 'Agendamento exige draft de texto em obra publicada.' using errcode = 'PT409';
    end if;
    if public.usuario_aceitou_termos_publicacao(v_uid) is not true then
      raise exception 'ACEITE_TERMOS_PUBLICACAO_OBRIGATORIO' using errcode = '42501';
    end if;
    if exists (select 1 from public.operacoes_exclusao_conta where subject_user_id = v_uid) then
      raise exception 'Conta indisponivel.' using errcode = '42501';
    end if;
    if p_publicar_em is null or not isfinite(p_publicar_em) then
      raise exception 'Instante de publicacao invalido.' using errcode = '22023';
    end if;
    if p_fuso_horario is null or char_length(p_fuso_horario) > 100
      or not exists (select 1 from pg_catalog.pg_timezone_names where name = p_fuso_horario
        and (name = 'UTC' or position('/' in name) > 0)
        and name not like 'posix/%' and name not like 'right/%') then
      raise exception 'Fuso horario invalido.' using errcode = '22023';
    end if;
    -- Retry nao altera o prazo/revisao, mesmo se o horario ja passou. Sem worker
    -- nesta fase, um registro vencido permanece privado e pendente.
    if v_revisao = p_revisao_esperada then
      if p_publicar_em <= clock_timestamp() then
        raise exception 'Publicacao deve estar no futuro.' using errcode = '22023';
      end if;
      insert into historietas_privado.capitulo_agendamentos
        (capitulo_id, autor_id, publicar_em, fuso_horario, revisao, estado)
      values (p_capitulo_id, v_uid, p_publicar_em, p_fuso_horario, v_revisao + 1, 'agendado')
      on conflict (capitulo_id) do update set
        autor_id = excluded.autor_id, publicar_em = excluded.publicar_em,
        fuso_horario = excluded.fuso_horario, revisao = excluded.revisao,
        estado = 'agendado', resultado = null, executado_em = null, atualizado_em = clock_timestamp()
      returning * into v_ag;
    end if;
  elsif p_operacao = 'cancelar' then
    if v_ag.estado = 'agendado' then
      update historietas_privado.capitulo_agendamentos set
        estado = 'cancelado', resultado = 'cancelado_pelo_autor',
        revisao = revisao + 1, atualizado_em = clock_timestamp()
      where capitulo_id = p_capitulo_id returning * into v_ag;
    elsif v_ag.estado is distinct from 'cancelado' then
      raise exception 'Agendamento nao esta pendente.' using errcode = 'PT409';
    end if;
  end if;
  return jsonb_build_object('capituloId', p_capitulo_id, 'revisao', coalesce(v_ag.revisao, 0),
    'estado', coalesce(v_ag.estado, 'nao_agendado'), 'publicarEm', v_ag.publicar_em,
    'fusoHorario', v_ag.fuso_horario, 'resultado', v_ag.resultado, 'executadoEm', v_ag.executado_em,
    'publicacaoAutomaticaHabilitada', false);
end;
$$;

create function public.agendar_capitulo(
  p_capitulo_id uuid, p_revisao_esperada bigint, p_publicar_em timestamptz, p_fuso_horario text
) returns jsonb language sql volatile security invoker set search_path = '' as $$
  select historietas_privado.operar_agendamento_capitulo('agendar',p_capitulo_id,p_revisao_esperada,p_publicar_em,p_fuso_horario);
$$;
create function public.cancelar_agendamento_capitulo(p_capitulo_id uuid, p_revisao_esperada bigint)
returns jsonb language sql volatile security invoker set search_path = '' as $$
  select historietas_privado.operar_agendamento_capitulo('cancelar',p_capitulo_id,p_revisao_esperada,null,null);
$$;
create function public.consultar_agendamento_capitulo(p_capitulo_id uuid)
returns jsonb language sql volatile security invoker set search_path = '' as $$
  select historietas_privado.operar_agendamento_capitulo('consultar',p_capitulo_id,null,null,null);
$$;

alter function historietas_privado.operar_agendamento_capitulo(text,uuid,bigint,timestamptz,text) owner to postgres;
revoke all on function historietas_privado.operar_agendamento_capitulo(text,uuid,bigint,timestamptz,text)
  from public, anon, authenticated, service_role;
grant execute on function historietas_privado.operar_agendamento_capitulo(text,uuid,bigint,timestamptz,text) to authenticated;
revoke all on function public.agendar_capitulo(uuid,bigint,timestamptz,text) from public,anon,authenticated,service_role;
revoke all on function public.cancelar_agendamento_capitulo(uuid,bigint) from public,anon,authenticated,service_role;
revoke all on function public.consultar_agendamento_capitulo(uuid) from public,anon,authenticated,service_role;
grant execute on function public.agendar_capitulo(uuid,bigint,timestamptz,text) to authenticated;
grant execute on function public.cancelar_agendamento_capitulo(uuid,bigint) to authenticated;
grant execute on function public.consultar_agendamento_capitulo(uuid) to authenticated;

create function historietas_privado.invalidar_agendamento_capitulo()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  -- Nenhum cliente, inclusive service_role, publica um agendamento pendente.
  -- O executor futuro precisara de transicao atomica e autorizacao propria;
  -- nao adicionar bypass via GUC, JWT editavel ou parametro do navegador.
  if exists (select 1 from historietas_privado.capitulo_agendamentos
    where capitulo_id = old.id and estado = 'agendado') then
    if new.publicado then
      raise exception 'Cancele o agendamento antes de publicar manualmente.' using errcode = 'PT409';
    end if;
    if (new.titulo,new.texto) is distinct from (old.titulo,old.texto)
      or (new.obra_id,new.user_id,new.tipo_conteudo) is distinct from (old.obra_id,old.user_id,old.tipo_conteudo) then
      update historietas_privado.capitulo_agendamentos set
        estado = 'invalidado', revisao = revisao + 1, atualizado_em = clock_timestamp(),
        resultado = case when (new.titulo,new.texto) is distinct from (old.titulo,old.texto)
          then 'conteudo_alterado' else 'vinculo_alterado' end
      where capitulo_id = old.id and estado = 'agendado';
    end if;
  end if;
  return new;
end;
$$;
alter function historietas_privado.invalidar_agendamento_capitulo() owner to postgres;
revoke all on function historietas_privado.invalidar_agendamento_capitulo() from public,anon,authenticated,service_role;
create trigger capitulos_invalidar_agendamento
before update on public.capitulos
for each row execute function historietas_privado.invalidar_agendamento_capitulo();

comment on table historietas_privado.capitulo_agendamentos is
  'Contrato privado com revisao por capitulo. Estados de execucao reservados; nao existe executor, notificacao ou Cron nesta fase.';
comment on function public.agendar_capitulo(uuid,bigint,timestamptz,text) is
  'Agenda/reagenda draft proprio de texto; revisao inicial zero. Nao publica nem instala executor. UTC + nome IANA explicitos.';
-- Futuro executor: mesma ordem de locks, revisao esperada, autoria/termos atuais,
-- obra publicada e tipo texto revalidados na MESMA transacao de publicacao e
-- resultado/notificacoes idempotentes. Nunca reaproveitar auth.uid() nulo como
-- autorizacao; estado agendado, por si so, nao autoriza executar.
commit;
