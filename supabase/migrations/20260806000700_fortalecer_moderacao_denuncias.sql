-- HISTORIETAS — fortalecimento de denúncias e moderação
-- Adiciona autoria persistente do alvo, histórico de auditoria,
-- notificações de mudança de status e contagem de reincidências.

begin;

-- A interface e as RPCs já aceitam até 1200 caracteres. A constraint legada
-- de 400 caracteres tornava o limite real menor que o informado ao usuário.
alter table public.comunidade_denuncias
  drop constraint if exists comunidade_denuncias_detalhe_check;

alter table public.comunidade_denuncias
  add column if not exists alvo_autor_id uuid;

create index if not exists comunidade_denuncias_alvo_autor_id_idx
  on public.comunidade_denuncias (alvo_autor_id);

-- O backfill precisa ignorar temporariamente o trigger de moderação, porque
-- uma migration não possui auth.uid() de moderador.
alter table public.comunidade_denuncias
  disable trigger comunidade_denuncias_validar_integridade;

update public.comunidade_denuncias denuncia
set alvo_autor_id = case denuncia.alvo_tipo
  when 'post' then (
    select post.autor_id
    from public.comunidade_posts post
    where post.id = denuncia.alvo_id
    limit 1
  )
  when 'comentario' then (
    select comentario.autor_id
    from public.comunidade_comentarios comentario
    where comentario.id = denuncia.alvo_id
    limit 1
  )
  when 'comentario_capitulo' then (
    select comentario.user_id
    from public.comentarios_capitulos comentario
    where comentario.id = denuncia.alvo_id
    limit 1
  )
  when 'obra' then (
    select obra.user_id
    from public.obras obra
    where obra.id = denuncia.alvo_id
    limit 1
  )
  when 'capitulo' then (
    select coalesce(capitulo.user_id, obra.user_id)
    from public.capitulos capitulo
    left join public.obras obra on obra.id = capitulo.obra_id
    where capitulo.id = denuncia.alvo_id
    limit 1
  )
  when 'comentario_obra' then (
    select comentario.user_id
    from public.comentarios_obras comentario
    where comentario.id = denuncia.alvo_id
    limit 1
  )
  when 'diario_anotacao' then (
    select anotacao.user_id
    from public.diario_anotacoes anotacao
    where anotacao.id = denuncia.alvo_id
    limit 1
  )
  when 'comentario_diario' then (
    select comentario.user_id
    from public.diario_anotacao_comentarios comentario
    where comentario.id = denuncia.alvo_id
    limit 1
  )
  else null
end
where denuncia.alvo_autor_id is null;

alter table public.comunidade_denuncias
  enable trigger comunidade_denuncias_validar_integridade;

create or replace function public.definir_autor_denuncia_conteudo()
returns trigger
language plpgsql
security definer
set search_path to 'pg_catalog', 'public', 'auth', 'pg_temp'
as $$
begin
  if tg_op = 'UPDATE' then
    new.alvo_autor_id := old.alvo_autor_id;
    return new;
  end if;

  new.alvo_autor_id := case lower(btrim(coalesce(new.alvo_tipo, '')))
    when 'post' then (
      select post.autor_id
      from public.comunidade_posts post
      where post.id = new.alvo_id
      limit 1
    )
    when 'comentario' then (
      select comentario.autor_id
      from public.comunidade_comentarios comentario
      where comentario.id = new.alvo_id
      limit 1
    )
    when 'comentario_capitulo' then (
      select comentario.user_id
      from public.comentarios_capitulos comentario
      where comentario.id = new.alvo_id
      limit 1
    )
    when 'obra' then (
      select obra.user_id
      from public.obras obra
      where obra.id = new.alvo_id
      limit 1
    )
    when 'capitulo' then (
      select coalesce(capitulo.user_id, obra.user_id)
      from public.capitulos capitulo
      left join public.obras obra on obra.id = capitulo.obra_id
      where capitulo.id = new.alvo_id
      limit 1
    )
    when 'comentario_obra' then (
      select comentario.user_id
      from public.comentarios_obras comentario
      where comentario.id = new.alvo_id
      limit 1
    )
    when 'diario_anotacao' then (
      select anotacao.user_id
      from public.diario_anotacoes anotacao
      where anotacao.id = new.alvo_id
      limit 1
    )
    when 'comentario_diario' then (
      select comentario.user_id
      from public.diario_anotacao_comentarios comentario
      where comentario.id = new.alvo_id
      limit 1
    )
    else null
  end;

  return new;
end;
$$;

revoke all on function public.definir_autor_denuncia_conteudo() from public;

-- O prefixo "a_" garante que este trigger execute antes do trigger de
-- validação já existente na mesma fase BEFORE.
drop trigger if exists a_comunidade_denuncias_definir_autor
  on public.comunidade_denuncias;

create trigger a_comunidade_denuncias_definir_autor
before insert or update on public.comunidade_denuncias
for each row execute function public.definir_autor_denuncia_conteudo();

create table if not exists public.moderacao_historico (
  id uuid primary key default gen_random_uuid(),
  origem text not null
    check (origem in ('conteudo', 'perfil')),
  denuncia_id uuid not null,
  acao text not null
    check (acao in (
      'criada',
      'migrada',
      'status_alterado',
      'arquivada',
      'restaurada',
      'atualizada',
      'excluida'
    )),
  alvo_tipo text,
  alvo_id uuid,
  alvo_autor_id uuid,
  denunciante_id uuid,
  denunciado_id uuid,
  status_anterior text,
  status_novo text,
  observacao_admin text not null default '',
  moderador_id uuid,
  denuncia_criada_em timestamptz,
  snapshot jsonb not null default '{}'::jsonb,
  criado_em timestamptz not null default now()
);

create index if not exists moderacao_historico_denuncia_idx
  on public.moderacao_historico (origem, denuncia_id, criado_em desc);

create index if not exists moderacao_historico_usuario_idx
  on public.moderacao_historico (
    coalesce(alvo_autor_id, denunciado_id),
    criado_em desc
  );

create index if not exists moderacao_historico_moderador_idx
  on public.moderacao_historico (moderador_id, criado_em desc);

alter table public.moderacao_historico enable row level security;

revoke all on table public.moderacao_historico from public, anon, authenticated;
grant select on table public.moderacao_historico to authenticated;
grant all on table public.moderacao_historico to service_role;

drop policy if exists moderacao_historico_select_admin
  on public.moderacao_historico;

create policy moderacao_historico_select_admin
on public.moderacao_historico
for select
to authenticated
using (public.usuario_e_admin());

-- Registra o estado já existente antes da instalação dos triggers.
insert into public.moderacao_historico (
  origem,
  denuncia_id,
  acao,
  alvo_tipo,
  alvo_id,
  alvo_autor_id,
  denunciante_id,
  status_novo,
  observacao_admin,
  moderador_id,
  denuncia_criada_em,
  snapshot,
  criado_em
)
select
  'conteudo',
  denuncia.id,
  'migrada',
  denuncia.alvo_tipo,
  denuncia.alvo_id,
  denuncia.alvo_autor_id,
  denuncia.denunciante_id,
  denuncia.status,
  denuncia.observacao_admin,
  denuncia.analisado_por,
  denuncia.criado_em,
  to_jsonb(denuncia),
  coalesce(denuncia.atualizado_em, denuncia.criado_em)
from public.comunidade_denuncias denuncia
where not exists (
  select 1
  from public.moderacao_historico historico
  where historico.origem = 'conteudo'
    and historico.denuncia_id = denuncia.id
);

insert into public.moderacao_historico (
  origem,
  denuncia_id,
  acao,
  denunciante_id,
  denunciado_id,
  status_novo,
  denuncia_criada_em,
  snapshot,
  criado_em
)
select
  'perfil',
  denuncia.id,
  'migrada',
  denuncia.denunciante_id,
  denuncia.denunciado_id,
  denuncia.status,
  denuncia.criado_em,
  to_jsonb(denuncia),
  coalesce(denuncia.atualizado_em, denuncia.criado_em)
from public.denuncias_perfis denuncia
where not exists (
  select 1
  from public.moderacao_historico historico
  where historico.origem = 'perfil'
    and historico.denuncia_id = denuncia.id
);

create or replace function public.registrar_historico_moderacao()
returns trigger
language plpgsql
security definer
set search_path to 'pg_catalog', 'public', 'auth', 'pg_temp'
as $$
declare
  v_registro jsonb;
  v_anterior jsonb := '{}'::jsonb;
  v_origem text;
  v_acao text;
  v_moderador_id uuid := auth.uid();
  v_status_anterior text;
  v_status_novo text;
  v_denunciante_id uuid;
  v_denuncia_id uuid;
  v_mensagem text;
begin
  if tg_op = 'DELETE' then
    v_registro := to_jsonb(old);
    v_anterior := to_jsonb(old);
  elsif tg_op = 'UPDATE' then
    v_registro := to_jsonb(new);
    v_anterior := to_jsonb(old);
  else
    v_registro := to_jsonb(new);
  end if;

  v_origem := case tg_table_name
    when 'comunidade_denuncias' then 'conteudo'
    when 'denuncias_perfis' then 'perfil'
    else null
  end;

  if v_origem is null then
    raise exception 'Tabela de denúncia não suportada pelo histórico: %.', tg_table_name;
  end if;

  v_denuncia_id := nullif(v_registro ->> 'id', '')::uuid;
  v_denunciante_id := nullif(v_registro ->> 'denunciante_id', '')::uuid;
  v_status_anterior := nullif(v_anterior ->> 'status', '');
  v_status_novo := nullif(v_registro ->> 'status', '');

  if tg_op = 'INSERT' then
    v_acao := 'criada';
  elsif tg_op = 'DELETE' then
    v_acao := 'excluida';
    v_status_novo := v_status_anterior;
  elsif v_status_novo is distinct from v_status_anterior then
    v_acao := 'status_alterado';
  elsif coalesce(v_registro ->> 'arquivada', 'false')
        is distinct from coalesce(v_anterior ->> 'arquivada', 'false') then
    v_acao := case
      when coalesce((v_registro ->> 'arquivada')::boolean, false)
        then 'arquivada'
      else 'restaurada'
    end;
  else
    v_acao := 'atualizada';
  end if;

  if not coalesce(public.usuario_e_admin(), false) then
    v_moderador_id := null;
  end if;

  insert into public.moderacao_historico (
    origem,
    denuncia_id,
    acao,
    alvo_tipo,
    alvo_id,
    alvo_autor_id,
    denunciante_id,
    denunciado_id,
    status_anterior,
    status_novo,
    observacao_admin,
    moderador_id,
    denuncia_criada_em,
    snapshot
  ) values (
    v_origem,
    v_denuncia_id,
    v_acao,
    nullif(v_registro ->> 'alvo_tipo', ''),
    nullif(v_registro ->> 'alvo_id', '')::uuid,
    nullif(v_registro ->> 'alvo_autor_id', '')::uuid,
    v_denunciante_id,
    nullif(v_registro ->> 'denunciado_id', '')::uuid,
    v_status_anterior,
    v_status_novo,
    left(coalesce(v_registro ->> 'observacao_admin', ''), 1200),
    v_moderador_id,
    nullif(v_registro ->> 'criado_em', '')::timestamptz,
    v_registro
  );

  -- Informa o denunciante sem expor a observação interna do moderador.
  if tg_op = 'UPDATE'
    and v_status_novo is distinct from v_status_anterior
    and v_moderador_id is not null
    and v_denunciante_id is not null
    and to_regprocedure(
      'public.criar_notificacao_comunidade_interna(uuid,uuid,text,text,text,text,text)'
    ) is not null
  then
    v_mensagem := case
      when v_status_novo in ('em_analise', 'analisada')
        then 'Sua denúncia está sendo analisada pela moderação.'
      when v_status_novo = 'resolvida'
        then 'A moderação concluiu a análise da sua denúncia.'
      when v_status_novo in ('rejeitada', 'ignorada')
        then 'A moderação concluiu a análise e não aplicou uma ação ao conteúdo ou perfil denunciado.'
      else 'O status da sua denúncia foi atualizado pela moderação.'
    end;

    perform public.criar_notificacao_comunidade_interna(
      v_denunciante_id,
      v_moderador_id,
      'moderacao-denuncia',
      'Atualização da sua denúncia',
      v_mensagem,
      '/notificacoes',
      'moderacao:' || v_origem || ':' || v_denuncia_id::text || ':' || v_status_novo
    );
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

revoke all on function public.registrar_historico_moderacao() from public;

drop trigger if exists comunidade_denuncias_historico
  on public.comunidade_denuncias;
create trigger comunidade_denuncias_historico
after insert or update or delete on public.comunidade_denuncias
for each row execute function public.registrar_historico_moderacao();

drop trigger if exists denuncias_perfis_historico
  on public.denuncias_perfis;
create trigger denuncias_perfis_historico
after insert or update or delete on public.denuncias_perfis
for each row execute function public.registrar_historico_moderacao();

create or replace function public.listar_reincidencias_moderacao()
returns table (
  user_id uuid,
  total_denuncias bigint,
  pendentes bigint,
  em_analise bigint,
  resolvidas bigint,
  rejeitadas bigint,
  ultima_denuncia timestamptz
)
language plpgsql
stable
security definer
set search_path to 'pg_catalog', 'public', 'auth', 'pg_temp'
as $$
begin
  if auth.uid() is null
    or not coalesce(public.usuario_e_admin(), false)
  then
    raise exception 'Somente administradores e moderadores podem consultar reincidências.'
      using errcode = '42501';
  end if;

  return query
  with denuncias_unicas as (
    select distinct on (historico.origem, historico.denuncia_id)
      historico.origem,
      historico.denuncia_id,
      coalesce(historico.alvo_autor_id, historico.denunciado_id) as usuario_id,
      historico.denuncia_criada_em
    from public.moderacao_historico historico
    where historico.acao in ('criada', 'migrada')
      and coalesce(historico.alvo_autor_id, historico.denunciado_id) is not null
    order by
      historico.origem,
      historico.denuncia_id,
      historico.criado_em asc
  ),
  ultimo_estado as (
    select distinct on (historico.origem, historico.denuncia_id)
      historico.origem,
      historico.denuncia_id,
      historico.status_novo as status_atual
    from public.moderacao_historico historico
    order by
      historico.origem,
      historico.denuncia_id,
      historico.criado_em desc
  )
  select
    denuncia.usuario_id,
    count(*)::bigint as total_denuncias,
    count(*) filter (
      where estado.status_atual = 'pendente'
    )::bigint as pendentes,
    count(*) filter (
      where estado.status_atual in ('em_analise', 'analisada')
    )::bigint as em_analise,
    count(*) filter (
      where estado.status_atual = 'resolvida'
    )::bigint as resolvidas,
    count(*) filter (
      where estado.status_atual in ('rejeitada', 'ignorada')
    )::bigint as rejeitadas,
    max(denuncia.denuncia_criada_em) as ultima_denuncia
  from denuncias_unicas denuncia
  join ultimo_estado estado
    on estado.origem = denuncia.origem
   and estado.denuncia_id = denuncia.denuncia_id
  group by denuncia.usuario_id
  order by count(*) desc, max(denuncia.denuncia_criada_em) desc;
end;
$$;

revoke all on function public.listar_reincidencias_moderacao() from public;
grant execute on function public.listar_reincidencias_moderacao() to authenticated;

comment on table public.moderacao_historico is
  'Histórico imutável de criação, atualização, arquivamento e exclusão de denúncias.';

comment on function public.listar_reincidencias_moderacao() is
  'Retorna contagens de denúncias por usuário denunciado para o painel de moderação.';

commit;
