-- Fase 3: Diario transacional. SEM consumidor de cache, Cron ou ativacao.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '30s';
-- pg_get_expr deve produzir referencias qualificadas para os helpers vazios.
set local search_path = '';

-- Estende o CHECK real, sem retirar tipos anteriores ou adicionar publicou_obra.
do $migration$
declare v_check text;
begin
  select pg_get_expr(conbin,conrelid) into strict v_check from pg_constraint
    where conrelid='public.diario_atividades'::regclass and conname='diario_atividades_tipo_check';
  alter table public.diario_atividades drop constraint diario_atividades_tipo_check;
  execute 'alter table public.diario_atividades add constraint diario_atividades_tipo_check
    check ((' || v_check || ') or tipo = ''publicou_capitulo'')';
end;
$migration$;

-- O SELECT legado consulta preferencias sem grant para anon. Somente o novo
-- tipo usa um predicado booleano privado; nao conceder leitura da tabela.
create function historietas_privado.publicacao_capitulo_diario_visivel(p_user_id uuid, p_visibilidade text)
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce(p_user_id = (select auth.uid()),false) or (
    p_visibilidade in ('publico','parcial')
    and historietas_privado.usuario_pode_ver_perfil(p_user_id)
    and coalesce((select mostrar_diario_perfil from public.preferencias_privacidade where user_id=p_user_id),true)
    and coalesce((select mostrar_atividades_leitura from public.preferencias_privacidade where user_id=p_user_id),true)
  );
$$;
alter function historietas_privado.publicacao_capitulo_diario_visivel(uuid,text) owner to postgres;
revoke all on function historietas_privado.publicacao_capitulo_diario_visivel(uuid,text)
  from public,anon,authenticated,service_role;
grant execute on function historietas_privado.publicacao_capitulo_diario_visivel(uuid,text) to anon,authenticated;
do $migration$
declare v_legado text;
begin
  select pg_get_expr(polqual,polrelid) into strict v_legado from pg_policy
    where polrelid='public.diario_atividades'::regclass and polname='diario_atividades_select_visiveis';
  -- PL/pgSQL invoker nao e inline: os subplans legados (e suas permissoes/RLS)
  -- sao avaliados SOMENTE quando o tipo antigo for consultado. CASE com a
  -- expressao direta ainda exige permissao de tabela ao preparar o SELECT.
  execute 'create function historietas_privado.diario_atividade_legada_visivel(
    p_user_id uuid,p_tipo text,p_visibilidade text) returns boolean
    language plpgsql stable security invoker set search_path = '''' as ' || quote_literal(
    'begin return (select (' || v_legado || ') from (select p_user_id as user_id,
      p_tipo as tipo,p_visibilidade as visibilidade) diario_atividades); end;');
  execute 'alter policy diario_atividades_select_visiveis on public.diario_atividades using
    (case when tipo = ''publicou_capitulo'' then
      historietas_privado.publicacao_capitulo_diario_visivel(user_id,visibilidade)
    else historietas_privado.diario_atividade_legada_visivel(user_id,tipo,visibilidade) end)';
end;
$migration$;
revoke all on function historietas_privado.diario_atividade_legada_visivel(uuid,text,text)
  from public,anon,authenticated,service_role;
grant execute on function historietas_privado.diario_atividade_legada_visivel(uuid,text,text) to anon,authenticated;

-- Policies RESTRITIVAS: nunca ampliam a permissao/privacidade existente.
-- Metadata historica nao pode expor um capitulo retirado de circulacao ou 18+.
create policy diario_publicacao_capitulo_visivel on public.diario_atividades
as restrictive for select to anon, authenticated using (
  tipo <> 'publicou_capitulo' or user_id = (select auth.uid()) or exists (
    select 1 from public.capitulos c join public.obras o on o.id = c.obra_id
    where c.id = diario_atividades.capitulo_id and o.id = diario_atividades.obra_id
      and c.user_id = diario_atividades.user_id and o.user_id = diario_atividades.user_id
      and c.publicado is true and o.publicado is true
      and o.classificacao_indicativa in ('Livre','10+','12+','14+','16+')
  )
);
create policy diario_publicacao_capitulo_autoria_insert on public.diario_atividades
as restrictive for insert to authenticated with check (
  tipo <> 'publicou_capitulo' or exists (
    select 1 from public.capitulos c join public.obras o on o.id = c.obra_id
    where c.id = diario_atividades.capitulo_id and o.id = diario_atividades.obra_id
      and c.user_id = (select auth.uid()) and o.user_id = (select auth.uid())
      and c.publicado is true and o.publicado is true
  )
);
create policy diario_publicacao_capitulo_autoria_update on public.diario_atividades
as restrictive for update to authenticated using (true) with check (
  tipo <> 'publicou_capitulo' or exists (
    select 1 from public.capitulos c join public.obras o on o.id = c.obra_id
    where c.id = diario_atividades.capitulo_id and o.id = diario_atividades.obra_id
      and c.user_id = (select auth.uid()) and o.user_id = (select auth.uid())
  )
);

-- Nullable para recibos anteriores e para exclusao voluntaria da atividade.
-- Retry de recibo existente nunca recria uma atividade apagada pelo autor.
alter table historietas_privado.capitulo_publicacao_eventos
  add column diario_atividade_id uuid unique references public.diario_atividades(id) on delete set null;

create function historietas_privado.registrar_diario_capitulo_agendado()
returns trigger language plpgsql security invoker set search_path = '' as $$
declare
  v_cap public.capitulos;
  v_obra public.obras;
  v_diario uuid;
  v_href text;
begin
  select * into strict v_cap from public.capitulos where id = new.capitulo_id;
  select * into strict v_obra from public.obras where id = new.obra_id;
  if v_cap.obra_id is distinct from new.obra_id or v_cap.user_id is distinct from new.autor_id
    or v_obra.user_id is distinct from new.autor_id or v_cap.publicado is not true
    or v_obra.publicado is not true or v_cap.tipo_conteudo is distinct from 'texto'
    or not exists (select 1 from historietas_privado.capitulo_agendamentos a
      where a.capitulo_id = new.capitulo_id and a.autor_id = new.autor_id
        and a.estado = 'publicado' and a.revisao = new.revisao_agendada + 1
        and a.executado_em = new.publicado_em and a.publicar_em <= new.publicado_em) then
    raise exception 'Evento de publicacao indisponivel.' using errcode = '55000';
  end if;
  v_href := case when btrim(coalesce(v_obra.slug,'')) ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
    then '/obra/' || btrim(v_obra.slug) || '/capitulo/' || v_cap.ordem::text
    else '/ler-capitulo?obraId=' || v_obra.id::text || '&capituloId=' || v_cap.id::text end;
  insert into public.diario_atividades
    (user_id,tipo,obra_id,capitulo_id,texto,visibilidade,metadata,criado_em,atualizado_em)
    values (new.autor_id,'publicou_capitulo',new.obra_id,new.capitulo_id,'','publico',
      jsonb_build_object('obra_titulo',v_obra.titulo,'titulo_obra',v_obra.titulo,
        'capitulo_titulo',v_cap.titulo,'numero_capitulo',v_cap.ordem,'href',v_href),
      new.publicado_em,new.publicado_em) returning id into v_diario;
  update historietas_privado.capitulo_publicacao_eventos set diario_atividade_id = v_diario
    where capitulo_id = new.capitulo_id and revisao_agendada = new.revisao_agendada;
  return new;
end;
$$;
revoke all on function historietas_privado.registrar_diario_capitulo_agendado()
  from public,anon,authenticated,service_role;
-- AFTER INSERT nao executa em ON CONFLICT DO NOTHING. Falhas propagam para a
-- subtransacao do executor, revertendo capitulo/notificacoes/recibo/Diario.
create trigger capitulo_publicacao_registrar_diario after insert
on historietas_privado.capitulo_publicacao_eventos for each row
execute function historietas_privado.registrar_diario_capitulo_agendado();
comment on column historietas_privado.capitulo_publicacao_eventos.diario_atividade_id is
  'Atividade atomica da intencao; sem backfill. NULL apos remocao voluntaria nao autoriza recriar no retry. Nao e confirmacao de invalidacao de cache Next.js.';
commit;
