-- Exclusão de conta
-- 1. Garante que registros diretamente ligados a auth.users sejam removidos
--    quando o usuário for apagado. Campos de auditoria administrativa ficam nulos.
-- 2. Cria a fila privada de solicitações feitas pela página pública.

begin;

do $$
declare
  fk record;
  acao_desejada text;
  codigo_acao "char";
  colunas_origem text;
  colunas_destino text;
  clausula_diferimento text;
begin
  for fk in
    select
      c.oid,
      c.conname,
      n.nspname as schema_name,
      t.relname as table_name,
      c.confdeltype,
      c.condeferrable,
      c.condeferred,
      array_agg(a.attname order by origem.ord) as source_columns,
      array_agg(af.attname order by origem.ord) as target_columns
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    join lateral unnest(c.conkey) with ordinality origem(attnum, ord) on true
    join pg_attribute a
      on a.attrelid = c.conrelid
     and a.attnum = origem.attnum
    join lateral unnest(c.confkey) with ordinality destino(attnum, ord)
      on destino.ord = origem.ord
    join pg_attribute af
      on af.attrelid = c.confrelid
     and af.attnum = destino.attnum
    where c.contype = 'f'
      and c.confrelid = 'auth.users'::regclass
      and n.nspname = 'public'
    group by
      c.oid,
      c.conname,
      n.nspname,
      t.relname,
      c.confdeltype,
      c.condeferrable,
      c.condeferred
  loop
    if cardinality(fk.source_columns) <> 1 then
      raise notice 'Constraint % ignorada: chave composta.', fk.conname;
      continue;
    end if;

    acao_desejada := case
      when fk.source_columns[1] in (
        'analisado_por',
        'fixado_por',
        'moderado_por',
        'revisado_por',
        'processado_por'
      ) then 'SET NULL'
      else 'CASCADE'
    end;

    codigo_acao := case acao_desejada
      when 'CASCADE' then 'c'::"char"
      else 'n'::"char"
    end;

    if fk.confdeltype = codigo_acao then
      continue;
    end if;

    colunas_origem := format('%I', fk.source_columns[1]);
    colunas_destino := format('%I', fk.target_columns[1]);
    clausula_diferimento := case
      when fk.condeferrable and fk.condeferred then
        ' DEFERRABLE INITIALLY DEFERRED'
      when fk.condeferrable then
        ' DEFERRABLE INITIALLY IMMEDIATE'
      else
        ''
    end;

    execute format(
      'alter table %I.%I drop constraint %I',
      fk.schema_name,
      fk.table_name,
      fk.conname
    );

    execute format(
      'alter table %I.%I add constraint %I foreign key (%s) references auth.users (%s) on delete %s%s',
      fk.schema_name,
      fk.table_name,
      fk.conname,
      colunas_origem,
      colunas_destino,
      acao_desejada,
      clausula_diferimento
    );
  end loop;
end
$$;

-- Cascatas entre conteúdos que podem bloquear a remoção do usuário.
-- Os nomes das constraints podem variar entre ambientes, por isso a busca é
-- feita pela tabela e coluna de origem.
do $$
declare
  fk record;
  colunas_origem text;
  colunas_destino text;
  clausula_diferimento text;
begin
  for fk in
    select
      c.conname,
      n.nspname as source_schema,
      origem_tabela.relname as source_table,
      destino_schema.nspname as target_schema,
      destino_tabela.relname as target_table,
      c.confdeltype,
      c.condeferrable,
      c.condeferred,
      array_agg(origem_coluna.attname order by origem.ord) as source_columns,
      array_agg(destino_coluna.attname order by origem.ord) as target_columns
    from pg_constraint c
    join pg_class origem_tabela on origem_tabela.oid = c.conrelid
    join pg_namespace n on n.oid = origem_tabela.relnamespace
    join pg_class destino_tabela on destino_tabela.oid = c.confrelid
    join pg_namespace destino_schema on destino_schema.oid = destino_tabela.relnamespace
    join lateral unnest(c.conkey) with ordinality origem(attnum, ord) on true
    join pg_attribute origem_coluna
      on origem_coluna.attrelid = c.conrelid
     and origem_coluna.attnum = origem.attnum
    join lateral unnest(c.confkey) with ordinality destino(attnum, ord)
      on destino.ord = origem.ord
    join pg_attribute destino_coluna
      on destino_coluna.attrelid = c.confrelid
     and destino_coluna.attnum = destino.attnum
    where c.contype = 'f'
      and n.nspname = 'public'
      and (
        (origem_tabela.relname = 'comentarios_capitulos_curtidas' and origem_coluna.attname = 'comentario_id')
        or (origem_tabela.relname = 'comentarios_obras' and origem_coluna.attname = 'obra_id')
        or (origem_tabela.relname = 'comentarios_obras_curtidas' and origem_coluna.attname = 'comentario_id')
        or (origem_tabela.relname = 'diario_comentario_curtidas' and origem_coluna.attname = 'comentario_id')
      )
    group by
      c.conname,
      n.nspname,
      origem_tabela.relname,
      destino_schema.nspname,
      destino_tabela.relname,
      c.confdeltype,
      c.condeferrable,
      c.condeferred
  loop
    if fk.confdeltype = 'c'::"char" or cardinality(fk.source_columns) <> 1 then
      continue;
    end if;

    colunas_origem := format('%I', fk.source_columns[1]);
    colunas_destino := format('%I', fk.target_columns[1]);
    clausula_diferimento := case
      when fk.condeferrable and fk.condeferred then
        ' DEFERRABLE INITIALLY DEFERRED'
      when fk.condeferrable then
        ' DEFERRABLE INITIALLY IMMEDIATE'
      else
        ''
    end;

    execute format(
      'alter table %I.%I drop constraint %I',
      fk.source_schema,
      fk.source_table,
      fk.conname
    );

    execute format(
      'alter table %I.%I add constraint %I foreign key (%s) references %I.%I (%s) on delete cascade%s',
      fk.source_schema,
      fk.source_table,
      fk.conname,
      colunas_origem,
      fk.target_schema,
      fk.target_table,
      colunas_destino,
      clausula_diferimento
    );
  end loop;
end
$$;

create table if not exists public.solicitacoes_exclusao_conta (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  motivo text,
  origem text not null default 'pagina_publica',
  status text not null default 'pendente',
  user_agent text,
  criada_em timestamptz not null default now(),
  atualizada_em timestamptz not null default now(),
  processada_em timestamptz,
  observacao_interna text,
  constraint solicitacoes_exclusao_conta_email_check
    check (char_length(email) between 3 and 254),
  constraint solicitacoes_exclusao_conta_motivo_check
    check (motivo is null or char_length(motivo) <= 1000),
  constraint solicitacoes_exclusao_conta_origem_check
    check (origem in ('pagina_publica', 'suporte', 'administracao')),
  constraint solicitacoes_exclusao_conta_status_check
    check (status in ('pendente', 'verificando', 'concluida', 'recusada', 'cancelada'))
);

create unique index if not exists solicitacoes_exclusao_conta_email_ativa_uidx
  on public.solicitacoes_exclusao_conta (lower(email))
  where status in ('pendente', 'verificando');

create index if not exists solicitacoes_exclusao_conta_status_criada_idx
  on public.solicitacoes_exclusao_conta (status, criada_em desc);

alter table public.solicitacoes_exclusao_conta enable row level security;

revoke all on table public.solicitacoes_exclusao_conta
  from public, anon, authenticated;

grant all on table public.solicitacoes_exclusao_conta to service_role;

comment on table public.solicitacoes_exclusao_conta is
  'Fila privada para solicitações de exclusão recebidas fora da conta autenticada. A identidade deve ser verificada antes do processamento manual.';

commit;
