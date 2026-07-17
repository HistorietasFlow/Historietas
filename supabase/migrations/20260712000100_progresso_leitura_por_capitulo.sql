-- 20260712000100_progresso_leitura_por_capitulo.sql
-- Permite registrar o progresso separadamente para cada capítulo lido.
-- A identidade do registro passa a ser:
--   user_id + obra_id + capitulo_id
--
-- Registros legados sem capitulo_id são preservados, mas novos registros
-- precisam informar o capítulo.

begin;

-- Falha de forma clara quando a estrutura necessária ainda não existe.
do $$
declare
  v_coluna_necessaria text;
begin
  if to_regclass('public.progresso_leitura') is null then
    raise exception 'A tabela public.progresso_leitura não existe.';
  end if;

  foreach v_coluna_necessaria in array array[
    'user_id',
    'obra_id',
    'capitulo_id',
    'lido',
    'progresso',
    'criado_em',
    'atualizado_em'
  ]
  loop
    if not exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'progresso_leitura'
        and column_name = v_coluna_necessaria
    ) then
      raise exception
        'A coluna public.progresso_leitura.% não existe.',
        v_coluna_necessaria;
    end if;
  end loop;
end
$$;

-- Impede gravações concorrentes entre a limpeza das duplicidades e a criação
-- da nova unicidade.
lock table public.progresso_leitura
  in share row exclusive mode;

-- Remove duplicidades para o mesmo usuário, obra e capítulo.
-- Mantém o registro atualizado mais recentemente.
with registros_ordenados as (
  select
    ctid,
    row_number() over (
      partition by user_id, obra_id, capitulo_id
      order by
        atualizado_em desc nulls last,
        criado_em desc nulls last,
        ctid desc
    ) as posicao
  from public.progresso_leitura
  where capitulo_id is not null
)
delete from public.progresso_leitura as progresso
using registros_ordenados as registro
where progresso.ctid = registro.ctid
  and registro.posicao > 1;

-- Uma chave primária antiga composta somente por user_id + obra_id também
-- impediria vários capítulos. Não é seguro removê-la automaticamente porque
-- outras tabelas podem depender dela.
do $$
begin
  if exists (
    select 1
    from pg_constraint as restricao
    where restricao.conrelid = 'public.progresso_leitura'::regclass
      and restricao.contype = 'p'
      and (
        select array_agg(
          atributo.attname::text
          order by atributo.attname::text
        )
        from unnest(restricao.conkey) as chave(attnum)
        join pg_attribute as atributo
          on atributo.attrelid = restricao.conrelid
         and atributo.attnum = chave.attnum
      ) = array['obra_id', 'user_id']::text[]
  ) then
    raise exception
      'A chave primária de public.progresso_leitura ainda usa somente user_id e obra_id.';
  end if;
end
$$;

-- Remove constraints UNIQUE antigas compostas somente por user_id + obra_id,
-- independentemente do nome usado no banco.
do $$
declare
  v_restricao record;
begin
  for v_restricao in
    select restricao.conname
    from pg_constraint as restricao
    where restricao.conrelid = 'public.progresso_leitura'::regclass
      and restricao.contype = 'u'
      and (
        select array_agg(
          atributo.attname::text
          order by atributo.attname::text
        )
        from unnest(restricao.conkey) as chave(attnum)
        join pg_attribute as atributo
          on atributo.attrelid = restricao.conrelid
         and atributo.attnum = chave.attnum
      ) = array['obra_id', 'user_id']::text[]
  loop
    execute format(
      'alter table public.progresso_leitura drop constraint %I',
      v_restricao.conname
    );
  end loop;
end
$$;

-- Remove índices UNIQUE antigos criados diretamente somente para
-- user_id + obra_id.
do $$
declare
  v_indice record;
begin
  for v_indice in
    select indice.relname
    from pg_index as definicao
    join pg_class as indice
      on indice.oid = definicao.indexrelid
    where definicao.indrelid = 'public.progresso_leitura'::regclass
      and definicao.indisunique
      and not definicao.indisprimary
      and definicao.indpred is null
      and definicao.indexprs is null
      and not exists (
        select 1
        from pg_constraint as restricao
        where restricao.conindid = definicao.indexrelid
      )
      and (
        select array_agg(
          atributo.attname::text
          order by atributo.attname::text
        )
        from generate_series(
          0,
          definicao.indnkeyatts - 1
        ) as posicao(indice_chave)
        join pg_attribute as atributo
          on atributo.attrelid = definicao.indrelid
         and atributo.attnum =
           definicao.indkey[posicao.indice_chave]
      ) = array['obra_id', 'user_id']::text[]
  loop
    execute format(
      'drop index if exists public.%I',
      v_indice.relname
    );
  end loop;
end
$$;

-- Preserva registros antigos sem capítulo, mas bloqueia novas gravações
-- incompletas. Constraints NOT VALID já são aplicadas a INSERTs e UPDATEs
-- novos, sem exigir a limpeza imediata do histórico legado.
alter table public.progresso_leitura
  drop constraint if exists progresso_leitura_capitulo_id_obrigatorio;

alter table public.progresso_leitura
  add constraint progresso_leitura_capitulo_id_obrigatorio
  check (capitulo_id is not null)
  not valid;

-- Cria a nova unicidade somente quando não existe constraint ou índice
-- equivalente, mesmo que ele tenha outro nome.
do $$
declare
  v_unicidade_existe boolean;
begin
  select exists (
    select 1
    from pg_index as definicao
    where definicao.indrelid = 'public.progresso_leitura'::regclass
      and definicao.indisunique
      and definicao.indisvalid
      and definicao.indpred is null
      and definicao.indexprs is null
      and (
        select array_agg(
          atributo.attname::text
          order by atributo.attname::text
        )
        from generate_series(
          0,
          definicao.indnkeyatts - 1
        ) as posicao(indice_chave)
        join pg_attribute as atributo
          on atributo.attrelid = definicao.indrelid
         and atributo.attnum =
           definicao.indkey[posicao.indice_chave]
      ) = array[
        'capitulo_id',
        'obra_id',
        'user_id'
      ]::text[]
  )
  into v_unicidade_existe;

  if not v_unicidade_existe then
    alter table public.progresso_leitura
      drop constraint if exists
        progresso_leitura_user_obra_capitulo_key;

    drop index if exists
      public.progresso_leitura_user_obra_capitulo_uidx;

    create unique index
      progresso_leitura_user_obra_capitulo_uidx
      on public.progresso_leitura (
        user_id,
        obra_id,
        capitulo_id
      );

    alter table public.progresso_leitura
      add constraint progresso_leitura_user_obra_capitulo_key
      unique using index
        progresso_leitura_user_obra_capitulo_uidx;
  end if;
end
$$;

commit;