-- 20260712000100_progresso_leitura_por_capitulo.sql
-- Permite registrar o progresso separadamente para cada capítulo lido.
-- A nova identidade do registro passa a ser:
--   user_id + obra_id + capitulo_id

begin;

-- Falha de forma clara se a tabela ou alguma coluna necessária não existir.
do $$
declare
  coluna_necessaria text;
begin
  if to_regclass('public.progresso_leitura') is null then
    raise exception 'A tabela public.progresso_leitura não existe.';
  end if;

  foreach coluna_necessaria in array array[
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
        and column_name = coluna_necessaria
    ) then
      raise exception
        'A coluna public.progresso_leitura.% não existe.',
        coluna_necessaria;
    end if;
  end loop;
end
$$;

-- Remove duplicidades já existentes para o mesmo usuário, obra e capítulo.
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

-- Remove qualquer restrição UNIQUE antiga composta somente por
-- user_id + obra_id, independentemente do nome usado no banco.
do $$
declare
  restricao record;
begin
  for restricao in
    select constraint_info.conname
    from pg_constraint as constraint_info
    where constraint_info.conrelid = 'public.progresso_leitura'::regclass
      and constraint_info.contype = 'u'
      and (
        select array_agg(attribute_info.attname::text order by attribute_info.attname::text)
        from unnest(constraint_info.conkey) as chave(attnum)
        join pg_attribute as attribute_info
          on attribute_info.attrelid = constraint_info.conrelid
         and attribute_info.attnum = chave.attnum
      ) = array['obra_id', 'user_id']::text[]
  loop
    execute format(
      'alter table public.progresso_leitura drop constraint %I',
      restricao.conname
    );
  end loop;
end
$$;

-- Remove também índices UNIQUE antigos que tenham sido criados diretamente,
-- sem uma constraint associada, somente para user_id + obra_id.
do $$
declare
  indice record;
begin
  for indice in
    select index_relation.relname
    from pg_index as index_info
    join pg_class as index_relation
      on index_relation.oid = index_info.indexrelid
    where index_info.indrelid = 'public.progresso_leitura'::regclass
      and index_info.indisunique
      and not index_info.indisprimary
      and not exists (
        select 1
        from pg_constraint as constraint_info
        where constraint_info.conindid = index_info.indexrelid
      )
      and (
        select array_agg(attribute_info.attname::text order by attribute_info.attname::text)
        from generate_series(0, index_info.indnkeyatts - 1) as posicao(indice_chave)
        join pg_attribute as attribute_info
          on attribute_info.attrelid = index_info.indrelid
         and attribute_info.attnum = index_info.indkey[posicao.indice_chave]
      ) = array['obra_id', 'user_id']::text[]
  loop
    execute format(
      'drop index if exists public.%I',
      indice.relname
    );
  end loop;
end
$$;

-- Registros antigos sem capitulo_id não são apagados, porque podem representar
-- histórico legado. A constraint NOT VALID impede novos registros sem capítulo,
-- sem bloquear a migration por causa dos dados antigos.
alter table public.progresso_leitura
  drop constraint if exists progresso_leitura_capitulo_id_obrigatorio;

alter table public.progresso_leitura
  add constraint progresso_leitura_capitulo_id_obrigatorio
  check (capitulo_id is not null)
  not valid;

-- Cria a nova unicidade por usuário, obra e capítulo.
-- Se a mesma regra já existir com outro nome, não cria uma segunda constraint.
do $$
begin
  if not exists (
    select 1
    from pg_constraint as constraint_info
    where constraint_info.conrelid = 'public.progresso_leitura'::regclass
      and constraint_info.contype = 'u'
      and (
        select array_agg(attribute_info.attname::text order by attribute_info.attname::text)
        from unnest(constraint_info.conkey) as chave(attnum)
        join pg_attribute as attribute_info
          on attribute_info.attrelid = constraint_info.conrelid
         and attribute_info.attnum = chave.attnum
      ) = array['capitulo_id', 'obra_id', 'user_id']::text[]
  ) then
    alter table public.progresso_leitura
      add constraint progresso_leitura_user_obra_capitulo_key
      unique (user_id, obra_id, capitulo_id);
  end if;
end
$$;

commit;