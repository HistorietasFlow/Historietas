-- Otimiza as policies RLS sem alterar o conjunto de linhas autorizado.
-- Tambem adiciona os indices que cobrem FKs e remove somente indices
-- estruturalmente identicos, preservando sempre um equivalente valido.

begin;

set local lock_timeout = '5s';
set local statement_timeout = '120s';
set local search_path = pg_catalog, public;

create temporary table pg_temp.rls_initplan_expected (
  table_name name not null,
  policy_name name not null,
  primary key (table_name, policy_name)
) on commit drop;

insert into pg_temp.rls_initplan_expected (table_name, policy_name)
values
  ('autor_avaliacoes', 'autor_avaliacoes_delete_proprio'),
  ('autor_avaliacoes', 'autor_avaliacoes_insert_proprio'),
  ('autor_avaliacoes', 'autor_avaliacoes_update_proprio'),
  ('capitulos', 'capitulos_delete_autor_obra'),
  ('capitulos', 'capitulos_insert_autor_obra'),
  ('capitulos', 'capitulos_select_publicados_ou_autor_obra'),
  ('capitulos', 'capitulos_update_autor_obra'),
  ('comentarios_capitulos', 'comentarios_capitulos_delete_proprio_ou_admin'),
  ('comentarios_obras', 'comentarios_obras_delete_proprio_ou_admin'),
  ('comentarios_obras_curtidas', 'comentarios_obras_curtidas_delete_proprio'),
  ('comunidade_comentario_curtidas', 'comunidade_comentario_curtidas_delete_proprio'),
  ('comunidade_comentario_curtidas', 'comunidade_comentario_curtidas_insert_proprio_post_visivel'),
  ('comunidade_comentarios', 'comunidade_comentarios_delete_proprio_ou_admin'),
  ('comunidade_comentarios', 'comunidade_comentarios_insert_proprio_sem_bloqueio'),
  ('comunidade_comentarios', 'comunidade_comentarios_update_proprio_post_visivel'),
  ('comunidade_comentarios_salvos', 'comunidade_comentarios_salvos_delete_proprio'),
  ('comunidade_comentarios_salvos', 'comunidade_comentarios_salvos_insert_proprio_visivel'),
  ('comunidade_comentarios_salvos', 'comunidade_comentarios_salvos_select_proprio_visivel'),
  ('comunidade_curtidas', 'comunidade_curtidas_delete_proprio'),
  ('comunidade_curtidas', 'comunidade_curtidas_insert_proprio_post_visivel'),
  ('comunidade_denuncias', 'comunidade_denuncias_select_admin'),
  ('comunidade_enquete_votos', 'comunidade_enquete_votos_delete_proprio'),
  ('comunidade_enquete_votos', 'comunidade_enquete_votos_insert_proprio_post_visivel'),
  ('comunidade_enquete_votos', 'comunidade_enquete_votos_update_proprio_post_visivel'),
  ('comunidade_post_salvos', 'comunidade_post_salvos_delete_proprio'),
  ('comunidade_post_salvos', 'comunidade_post_salvos_insert_proprio_post_visivel'),
  ('comunidade_post_salvos', 'comunidade_post_salvos_select_proprio'),
  ('comunidade_posts', 'comunidade_posts_delete_proprio_ou_admin'),
  ('comunidade_posts', 'comunidade_posts_insert_autenticado'),
  ('comunidade_posts', 'comunidade_posts_insert_proprio_visibilidade'),
  ('comunidade_posts', 'comunidade_posts_update_proprio_ou_admin_visibilidade'),
  ('comunidade_posts', 'usuarios podem criar publicacoes'),
  ('comunidade_salvos', 'comunidade_salvos_delete_proprio'),
  ('comunidade_salvos', 'comunidade_salvos_insert_proprio_post_visivel'),
  ('comunidade_salvos', 'comunidade_salvos_select_proprio'),
  ('concluidas', 'concluidas_delete_proprio'),
  ('concluidas', 'concluidas_insert_proprio'),
  ('denuncias_perfis', 'denuncias_perfis_select_admin'),
  ('diario_anotacao_comentarios', 'diario_anotacao_comentarios_delete_proprio'),
  ('diario_anotacao_comentarios', 'diario_anotacao_comentarios_insert_proprio'),
  ('diario_anotacao_comentarios', 'diario_anotacao_comentarios_select_visiveis'),
  ('diario_anotacao_comentarios', 'diario_anotacao_comentarios_update_proprio'),
  ('diario_anotacao_curtidas', 'diario_anotacao_curtidas_delete_proprio'),
  ('diario_anotacao_curtidas', 'diario_anotacao_curtidas_insert_proprio'),
  ('diario_anotacoes', 'diario_anotacoes_delete_proprio'),
  ('diario_anotacoes', 'diario_anotacoes_insert_proprio'),
  ('diario_anotacoes', 'diario_anotacoes_update_proprio'),
  ('diario_atividades', 'diario_atividades_delete_proprio'),
  ('diario_atividades', 'diario_atividades_insert_proprio'),
  ('diario_atividades', 'diario_atividades_select_visiveis'),
  ('diario_atividades', 'diario_atividades_update_proprio'),
  ('diario_avaliacoes', 'diario_avaliacoes_select_participantes'),
  ('diario_comentario_curtidas', 'diario_comentario_curtidas_delete_proprio'),
  ('diario_comentario_curtidas', 'diario_comentario_curtidas_insert_proprio'),
  ('diario_comentario_curtidas', 'diario_comentario_curtidas_select_visiveis'),
  ('diario_configuracoes', 'diario_configuracoes_delete_proprio'),
  ('diario_configuracoes', 'diario_configuracoes_insert_proprio'),
  ('diario_configuracoes', 'diario_configuracoes_select_proprio'),
  ('diario_configuracoes', 'diario_configuracoes_update_proprio'),
  ('favoritos', 'favoritos_delete_proprio'),
  ('favoritos', 'favoritos_insert_proprio'),
  ('notificacoes', 'notificacoes_delete_proprio'),
  ('notificacoes', 'notificacoes_select_proprio'),
  ('notificacoes', 'notificacoes_update_proprio'),
  ('obra_avaliacoes', 'obra_avaliacoes_delete_proprio'),
  ('obra_avaliacoes', 'obra_avaliacoes_insert_proprio'),
  ('obra_avaliacoes', 'obra_avaliacoes_update_proprio'),
  ('obras', 'obras_delete_proprias'),
  ('obras', 'obras_insert_proprias'),
  ('obras', 'obras_select_publicadas_ou_proprias'),
  ('obras', 'obras_update_proprias'),
  ('preferencias_privacidade', 'preferencias_privacidade_delete_proprio'),
  ('preferencias_privacidade', 'preferencias_privacidade_insert_proprio'),
  ('preferencias_privacidade', 'preferencias_privacidade_select_proprio'),
  ('preferencias_privacidade', 'preferencias_privacidade_update_proprio'),
  ('problemas_tecnicos', 'problemas_tecnicos_select_proprio_ou_admin'),
  ('profiles', 'profiles_delete_proprio'),
  ('profiles', 'profiles_insert_proprio'),
  ('profiles', 'profiles_update_proprio'),
  ('progresso_leitura', 'progresso_leitura_delete_proprio'),
  ('progresso_leitura', 'progresso_leitura_insert_proprio'),
  ('progresso_leitura', 'progresso_leitura_select_proprio'),
  ('progresso_leitura', 'progresso_leitura_update_proprio'),
  ('salvos_capitulos', 'salvos_capitulos_delete_proprio'),
  ('salvos_capitulos', 'salvos_capitulos_insert_proprio'),
  ('seguindo_autores', 'seguindo_autores_delete_proprio'),
  ('seguindo_autores', 'seguindo_autores_insert_proprio'),
  ('seguindo_autores', 'seguindo_autores_select_proprio'),
  ('seguindo_autores', 'seguindo_autores_update_proprio'),
  ('seguindo_obras', 'seguindo_obras_delete_proprio'),
  ('seguindo_obras', 'seguindo_obras_insert_proprio'),
  ('seguindo_usuarios', 'seguindo_usuarios_delete_proprio'),
  ('seguindo_usuarios', 'seguindo_usuarios_insert_proprio'),
  ('solicitacoes_seguidores', 'solicitacoes_seguidores_delete_participantes'),
  ('solicitacoes_seguidores', 'solicitacoes_seguidores_insert_propria'),
  ('solicitacoes_seguidores', 'solicitacoes_seguidores_select_participantes'),
  ('top5_curtidas', 'top5_curtidas_delete_proprio'),
  ('top5_curtidas', 'top5_curtidas_insert_proprio'),
  ('usuarios_bloqueados', 'usuarios_bloqueados_select_proprios');

create temporary table pg_temp.rls_policy_before
on commit drop
as
select
  policy.schemaname,
  policy.tablename,
  policy.policyname,
  policy.permissive,
  policy.roles,
  policy.cmd,
  policy.qual,
  policy.with_check
from pg_catalog.pg_policies policy
join pg_temp.rls_initplan_expected expected
  on expected.table_name = policy.tablename
 and expected.policy_name = policy.policyname
where policy.schemaname = 'public';

do $migration$
declare
  reviewed record;
  alter_sql text;
begin
  if (select count(*) from pg_temp.rls_initplan_expected) <> 99
     or (select count(*) from pg_temp.rls_policy_before) <> 99 then
    raise exception
      'Precondicao falhou: o inventario RLS deve conter exatamente 99 policies.';
  end if;

  if exists (
    select 1
    from pg_temp.rls_policy_before policy
    where position(
      'auth.uid()' in coalesce(policy.qual, '') || coalesce(policy.with_check, '')
    ) = 0
       or position(
         '( SELECT auth.uid()' in
         coalesce(policy.qual, '') || coalesce(policy.with_check, '')
       ) > 0
  ) then
    raise exception
      'Precondicao falhou: uma policy inventariada ja divergiu do formato esperado.';
  end if;

  if exists (
    select 1
    from pg_catalog.pg_policies policy
    where policy.schemaname = 'public'
      and position(
        'auth.uid()' in coalesce(policy.qual, '') || coalesce(policy.with_check, '')
      ) > 0
      and position(
        '( SELECT auth.uid()' in
        coalesce(policy.qual, '') || coalesce(policy.with_check, '')
      ) = 0
      and not exists (
        select 1
        from pg_temp.rls_initplan_expected expected
        where expected.table_name = policy.tablename
          and expected.policy_name = policy.policyname
      )
  ) then
    raise exception
      'Precondicao falhou: existe policy RLS nao inventariada com auth.uid() por linha.';
  end if;

  for reviewed in
    select *
    from pg_temp.rls_policy_before
    order by tablename, policyname
  loop
    alter_sql := pg_catalog.format(
      'alter policy %I on public.%I',
      reviewed.policyname,
      reviewed.tablename
    );

    if reviewed.qual is not null then
      alter_sql := alter_sql || pg_catalog.format(
        ' using (%s)',
        pg_catalog.replace(
          reviewed.qual,
          'auth.uid()',
          '(select auth.uid())'
        )
      );
    end if;

    if reviewed.with_check is not null then
      alter_sql := alter_sql || pg_catalog.format(
        ' with check (%s)',
        pg_catalog.replace(
          reviewed.with_check,
          'auth.uid()',
          '(select auth.uid())'
        )
      );
    end if;

    execute alter_sql;
  end loop;

  if exists (
    select 1
    from pg_temp.rls_policy_before before_policy
    join pg_catalog.pg_policies after_policy
      on after_policy.schemaname = before_policy.schemaname
     and after_policy.tablename = before_policy.tablename
     and after_policy.policyname = before_policy.policyname
    where after_policy.permissive is distinct from before_policy.permissive
       or after_policy.roles is distinct from before_policy.roles
       or after_policy.cmd is distinct from before_policy.cmd
       or pg_catalog.regexp_replace(
            coalesce(after_policy.qual, ''),
            '\(\s*SELECT\s+auth\.uid\(\)(\s+AS\s+[[:alpha:]_][[:alnum:]_]*)?\s*\)',
            'auth.uid()',
            'gi'
          ) is distinct from coalesce(before_policy.qual, '')
       or pg_catalog.regexp_replace(
            coalesce(after_policy.with_check, ''),
            '\(\s*SELECT\s+auth\.uid\(\)(\s+AS\s+[[:alpha:]_][[:alnum:]_]*)?\s*\)',
            'auth.uid()',
            'gi'
          ) is distinct from coalesce(before_policy.with_check, '')
  ) then
    raise exception
      'A otimizacao de initplan alterou a semantica ou os papeis de uma policy.';
  end if;
end;
$migration$;

create temporary table pg_temp.select_policy_merges (
  table_name name primary key,
  visible_policy name not null,
  admin_policy name not null
) on commit drop;

insert into pg_temp.select_policy_merges (
  table_name,
  visible_policy,
  admin_policy
)
values
  (
    'comentarios_capitulos',
    'comentarios_capitulos_select_capitulo_visivel',
    'comentarios_capitulos_select_admin_moderacao'
  ),
  (
    'diario_anotacao_comentarios',
    'diario_anotacao_comentarios_select_visiveis',
    'diario_comentarios_select_admin_moderacao'
  ),
  (
    'diario_anotacoes',
    'diario_anotacoes_select_visiveis',
    'diario_anotacoes_select_admin_moderacao'
  );

create temporary table pg_temp.delete_policy_merges (
  table_name name primary key,
  owner_policy name not null,
  admin_policy name not null
) on commit drop;

insert into pg_temp.delete_policy_merges (
  table_name,
  owner_policy,
  admin_policy
)
values
  (
    'diario_anotacao_comentarios',
    'diario_anotacao_comentarios_delete_proprio',
    'diario_comentarios_delete_admin_moderacao'
  ),
  (
    'diario_anotacoes',
    'diario_anotacoes_delete_proprio',
    'diario_anotacoes_delete_admin_moderacao'
  );

do $migration$
declare
  merge_row record;
  visible_qual text;
  admin_qual text;
  owner_qual text;
  visible_roles name[];
  admin_roles name[];
  owner_roles name[];
begin
  for merge_row in
    select * from pg_temp.select_policy_merges order by table_name
  loop
    select policy.qual, policy.roles
    into visible_qual, visible_roles
    from pg_catalog.pg_policies policy
    where policy.schemaname = 'public'
      and policy.tablename = merge_row.table_name
      and policy.policyname = merge_row.visible_policy
      and policy.cmd = 'SELECT';

    select policy.qual, policy.roles
    into admin_qual, admin_roles
    from pg_catalog.pg_policies policy
    where policy.schemaname = 'public'
      and policy.tablename = merge_row.table_name
      and policy.policyname = merge_row.admin_policy
      and policy.cmd = 'SELECT';

    if visible_qual is null
       or admin_qual is null
       or cardinality(visible_roles) <> 2
       or not (
         visible_roles @> array['anon', 'authenticated']::name[]
       )
       or admin_roles <> array['authenticated']::name[] then
      raise exception
        'Precondicao falhou ao consolidar SELECT RLS de public.%.',
        merge_row.table_name;
    end if;

    execute pg_catalog.format(
      'alter policy %I on public.%I to authenticated using ((%s) or (%s))',
      merge_row.admin_policy,
      merge_row.table_name,
      visible_qual,
      admin_qual
    );

    execute pg_catalog.format(
      'alter policy %I on public.%I to anon',
      merge_row.visible_policy,
      merge_row.table_name
    );
  end loop;

  for merge_row in
    select * from pg_temp.delete_policy_merges order by table_name
  loop
    select policy.qual, policy.roles
    into owner_qual, owner_roles
    from pg_catalog.pg_policies policy
    where policy.schemaname = 'public'
      and policy.tablename = merge_row.table_name
      and policy.policyname = merge_row.owner_policy
      and policy.cmd = 'DELETE';

    select policy.qual, policy.roles
    into admin_qual, admin_roles
    from pg_catalog.pg_policies policy
    where policy.schemaname = 'public'
      and policy.tablename = merge_row.table_name
      and policy.policyname = merge_row.admin_policy
      and policy.cmd = 'DELETE';

    if owner_qual is null
       or admin_qual is null
       or owner_roles <> array['authenticated']::name[]
       or admin_roles <> array['authenticated']::name[] then
      raise exception
        'Precondicao falhou ao consolidar DELETE RLS de public.%.',
        merge_row.table_name;
    end if;

    execute pg_catalog.format(
      'alter policy %I on public.%I using ((%s) or (%s))',
      merge_row.owner_policy,
      merge_row.table_name,
      owner_qual,
      admin_qual
    );

    execute pg_catalog.format(
      'drop policy %I on public.%I',
      merge_row.admin_policy,
      merge_row.table_name
    );
  end loop;

  if not exists (
    select 1
    from pg_catalog.pg_attribute attribute
    where attribute.attrelid = 'public.comunidade_posts'::regclass
      and attribute.attname = 'visibilidade'
      and attribute.attnotnull
      and not attribute.attisdropped
  ) or not exists (
    select 1
    from pg_catalog.pg_constraint constraint_row
    where constraint_row.conrelid = 'public.comunidade_posts'::regclass
      and constraint_row.conname = 'comunidade_posts_visibilidade_check'
      and constraint_row.contype = 'c'
      and constraint_row.convalidated
      and pg_catalog.pg_get_expr(
        constraint_row.conbin,
        constraint_row.conrelid
      ) = '(visibilidade = ANY (ARRAY[''publico''::text, ''seguidores''::text, ''seguindo''::text, ''somente_eu''::text]))'
  ) then
    raise exception
      'Precondicao falhou: visibilidade de comunidade_posts nao esta protegida pelo schema.';
  end if;

  if not exists (
    select 1
    from pg_catalog.pg_policies policy
    where policy.schemaname = 'public'
      and policy.tablename = 'comunidade_posts'
      and policy.policyname = 'comunidade_posts_insert_proprio_visibilidade'
      and policy.cmd = 'INSERT'
      and policy.roles = array['authenticated']::name[]
      and policy.with_check is not null
      and position('visibilidade = ANY' in policy.with_check) > 0
  ) then
    raise exception
      'Precondicao falhou: policy estrita de INSERT da comunidade ausente.';
  end if;

  drop policy comunidade_posts_insert_autenticado
    on public.comunidade_posts;
  drop policy "usuarios podem criar publicacoes"
    on public.comunidade_posts;
end;
$migration$;

create temporary table pg_temp.duplicate_indexes_to_drop (
  index_name name primary key
) on commit drop;

insert into pg_temp.duplicate_indexes_to_drop (index_name)
values
  ('comentarios_capitulos_curtidas_comentario_usuario_uidx'),
  ('comunidade_comentario_curtidas_comentario_usuario_uidx'),
  ('comunidade_comentario_curtidas_unica_idx'),
  ('comunidade_comentarios_salvos_unico_idx'),
  ('comunidade_curtidas_post_usuario_uidx'),
  ('comunidade_curtidas_unica_idx'),
  ('comunidade_enquete_votos_post_usuario_uidx'),
  ('comunidade_enquete_votos_unico_idx'),
  ('comunidade_post_salvos_unico_idx'),
  ('comunidade_salvos_unico_idx'),
  ('concluidas_user_id_obra_id_unique'),
  ('denuncias_perfis_denunciado_idx'),
  ('denuncias_perfis_denunciante_idx'),
  ('diario_anotacoes_usuario_obra_tipo_unico'),
  ('diario_atividades_user_idx'),
  ('diario_atividades_usuario_data_idx'),
  ('diario_atividades_visibilidade_idx'),
  ('favoritos_user_id_obra_id_unique'),
  ('obra_avaliacoes_obra_user_unique'),
  ('obra_curtidas_user_id_obra_id_unique'),
  ('seguindo_obras_user_idx'),
  ('seguindo_usuarios_seguidor_seguido_uidx'),
  ('top5_curtidas_unica_idx');

create temporary table pg_temp.duplicate_index_snapshot
on commit drop
as
select
  expected.index_name,
  index_relation.oid as index_oid,
  index_row.indrelid as table_oid,
  index_relation.relam,
  index_row.indnkeyatts,
  index_row.indnatts,
  index_row.indisunique,
  index_row.indisexclusion,
  index_row.indnullsnotdistinct,
  index_row.indkey::text as indkey,
  index_row.indcollation::text as indcollation,
  index_row.indclass::text as indclass,
  index_row.indoption::text as indoption,
  pg_catalog.pg_get_expr(index_row.indexprs, index_row.indrelid) as expressions,
  pg_catalog.pg_get_expr(index_row.indpred, index_row.indrelid) as predicate
from pg_temp.duplicate_indexes_to_drop expected
join pg_catalog.pg_class index_relation
  on index_relation.relname = expected.index_name
join pg_catalog.pg_namespace namespace_row
  on namespace_row.oid = index_relation.relnamespace
 and namespace_row.nspname = 'public'
join pg_catalog.pg_index index_row
  on index_row.indexrelid = index_relation.oid;

do $migration$
declare
  duplicate_index record;
begin
  if (select count(*) from pg_temp.duplicate_indexes_to_drop) <> 23
     or (select count(*) from pg_temp.duplicate_index_snapshot) <> 23 then
    raise exception
      'Precondicao falhou: o inventario deve conter 23 indices duplicados.';
  end if;

  if exists (
    select 1
    from pg_temp.duplicate_index_snapshot snapshot
    join pg_catalog.pg_constraint constraint_row
      on constraint_row.conindid = snapshot.index_oid
  ) then
    raise exception
      'Precondicao falhou: o inventario tentou remover indice de constraint.';
  end if;

  if exists (
    select 1
    from pg_temp.duplicate_index_snapshot snapshot
    where not exists (
      select 1
      from pg_catalog.pg_index kept_index
      join pg_catalog.pg_class kept_relation
        on kept_relation.oid = kept_index.indexrelid
      where kept_index.indrelid = snapshot.table_oid
        and kept_index.indexrelid <> snapshot.index_oid
        and kept_index.indisvalid
        and kept_index.indisready
        and kept_relation.relam = snapshot.relam
        and kept_index.indnkeyatts = snapshot.indnkeyatts
        and kept_index.indnatts = snapshot.indnatts
        and kept_index.indisunique = snapshot.indisunique
        and kept_index.indisexclusion = snapshot.indisexclusion
        and kept_index.indnullsnotdistinct = snapshot.indnullsnotdistinct
        and kept_index.indkey::text = snapshot.indkey
        and kept_index.indcollation::text = snapshot.indcollation
        and kept_index.indclass::text = snapshot.indclass
        and kept_index.indoption::text = snapshot.indoption
        and pg_catalog.pg_get_expr(
          kept_index.indexprs,
          kept_index.indrelid
        ) is not distinct from snapshot.expressions
        and pg_catalog.pg_get_expr(
          kept_index.indpred,
          kept_index.indrelid
        ) is not distinct from snapshot.predicate
        and not exists (
          select 1
          from pg_temp.duplicate_indexes_to_drop other_drop
          where other_drop.index_name = kept_relation.relname
        )
    )
  ) then
    raise exception
      'Precondicao falhou: um indice inventariado nao possui equivalente preservado.';
  end if;

  for duplicate_index in
    select index_name
    from pg_temp.duplicate_indexes_to_drop
    order by index_name
  loop
    execute pg_catalog.format(
      'drop index public.%I',
      duplicate_index.index_name
    );
  end loop;
end;
$migration$;

create temporary table pg_temp.fk_indexes_expected (
  constraint_name name primary key,
  table_name name not null,
  column_name name not null,
  index_name name not null unique
) on commit drop;

insert into pg_temp.fk_indexes_expected (
  constraint_name,
  table_name,
  column_name,
  index_name
)
values
  (
    'comentarios_capitulos_user_id_fkey',
    'comentarios_capitulos',
    'user_id',
    'comentarios_capitulos_user_id_idx'
  ),
  (
    'comunidade_comentarios_salvos_usuario_id_fkey',
    'comunidade_comentarios_salvos',
    'usuario_id',
    'comunidade_comentarios_salvos_usuario_id_idx'
  ),
  (
    'comunidade_curtidas_usuario_id_fkey',
    'comunidade_curtidas',
    'usuario_id',
    'comunidade_curtidas_usuario_id_idx'
  ),
  (
    'comunidade_denuncias_analisado_por_fkey',
    'comunidade_denuncias',
    'analisado_por',
    'comunidade_denuncias_analisado_por_idx'
  ),
  (
    'comunidade_post_salvos_usuario_id_fkey',
    'comunidade_post_salvos',
    'usuario_id',
    'comunidade_post_salvos_usuario_id_idx'
  ),
  (
    'comunidade_posts_fixado_por_fkey',
    'comunidade_posts',
    'fixado_por',
    'comunidade_posts_fixado_por_idx'
  ),
  (
    'comunidade_salvos_usuario_id_fkey',
    'comunidade_salvos',
    'usuario_id',
    'comunidade_salvos_usuario_id_idx'
  ),
  (
    'notificacoes_autor_id_fkey',
    'notificacoes',
    'autor_id',
    'notificacoes_autor_id_idx'
  ),
  (
    'problemas_tecnicos_analisado_por_fkey',
    'problemas_tecnicos',
    'analisado_por',
    'problemas_tecnicos_analisado_por_idx'
  ),
  (
    'progresso_leitura_capitulo_id_fkey',
    'progresso_leitura',
    'capitulo_id',
    'progresso_leitura_capitulo_id_idx'
  ),
  (
    'progresso_leitura_obra_id_fkey',
    'progresso_leitura',
    'obra_id',
    'progresso_leitura_obra_id_idx'
  ),
  (
    'top5_curtidas_usuario_id_fkey',
    'top5_curtidas',
    'usuario_id',
    'top5_curtidas_usuario_id_idx'
  );

do $migration$
begin
  if (select count(*) from pg_temp.fk_indexes_expected) <> 12
     or exists (
       select 1
       from pg_temp.fk_indexes_expected expected
       where pg_catalog.to_regclass(
         pg_catalog.format('public.%I', expected.index_name)
       ) is not null
     )
     or exists (
       select 1
       from pg_temp.fk_indexes_expected expected
       where not exists (
         select 1
         from pg_catalog.pg_constraint constraint_row
         join pg_catalog.pg_class table_row
           on table_row.oid = constraint_row.conrelid
         join pg_catalog.pg_namespace namespace_row
           on namespace_row.oid = table_row.relnamespace
         join pg_catalog.pg_attribute attribute
           on attribute.attrelid = table_row.oid
          and attribute.attname = expected.column_name
          and not attribute.attisdropped
         where namespace_row.nspname = 'public'
           and table_row.relname = expected.table_name
           and constraint_row.conname = expected.constraint_name
           and constraint_row.contype = 'f'
           and constraint_row.conkey = array[attribute.attnum]::smallint[]
       )
     ) then
    raise exception
      'Precondicao falhou: inventario de FKs ou nomes de indices divergiu.';
  end if;
end;
$migration$;

create index comentarios_capitulos_user_id_idx
  on public.comentarios_capitulos (user_id);
create index comunidade_comentarios_salvos_usuario_id_idx
  on public.comunidade_comentarios_salvos (usuario_id);
create index comunidade_curtidas_usuario_id_idx
  on public.comunidade_curtidas (usuario_id);
create index comunidade_denuncias_analisado_por_idx
  on public.comunidade_denuncias (analisado_por);
create index comunidade_post_salvos_usuario_id_idx
  on public.comunidade_post_salvos (usuario_id);
create index comunidade_posts_fixado_por_idx
  on public.comunidade_posts (fixado_por);
create index comunidade_salvos_usuario_id_idx
  on public.comunidade_salvos (usuario_id);
create index notificacoes_autor_id_idx
  on public.notificacoes (autor_id);
create index problemas_tecnicos_analisado_por_idx
  on public.problemas_tecnicos (analisado_por);
create index progresso_leitura_capitulo_id_idx
  on public.progresso_leitura (capitulo_id);
create index progresso_leitura_obra_id_idx
  on public.progresso_leitura (obra_id);
create index top5_curtidas_usuario_id_idx
  on public.top5_curtidas (usuario_id);

do $migration$
declare
  merge_row record;
begin
  if exists (
    select 1
    from pg_temp.duplicate_indexes_to_drop expected
    where pg_catalog.to_regclass(
      pg_catalog.format('public.%I', expected.index_name)
    ) is not null
  ) then
    raise exception 'Um indice duplicado inventariado permaneceu ativo.';
  end if;

  if exists (
    select 1
    from pg_temp.duplicate_index_snapshot snapshot
    where not exists (
      select 1
      from pg_catalog.pg_index kept_index
      join pg_catalog.pg_class kept_relation
        on kept_relation.oid = kept_index.indexrelid
      where kept_index.indrelid = snapshot.table_oid
        and kept_index.indisvalid
        and kept_index.indisready
        and kept_relation.relam = snapshot.relam
        and kept_index.indnkeyatts = snapshot.indnkeyatts
        and kept_index.indnatts = snapshot.indnatts
        and kept_index.indisunique = snapshot.indisunique
        and kept_index.indisexclusion = snapshot.indisexclusion
        and kept_index.indnullsnotdistinct = snapshot.indnullsnotdistinct
        and kept_index.indkey::text = snapshot.indkey
        and kept_index.indcollation::text = snapshot.indcollation
        and kept_index.indclass::text = snapshot.indclass
        and kept_index.indoption::text = snapshot.indoption
        and pg_catalog.pg_get_expr(
          kept_index.indexprs,
          kept_index.indrelid
        ) is not distinct from snapshot.expressions
        and pg_catalog.pg_get_expr(
          kept_index.indpred,
          kept_index.indrelid
        ) is not distinct from snapshot.predicate
    )
  ) then
    raise exception 'Um indice equivalente deixou de existir.';
  end if;

  if exists (
    select 1
    from pg_temp.fk_indexes_expected expected
    where not exists (
      select 1
      from pg_catalog.pg_constraint constraint_row
      join pg_catalog.pg_class table_row
        on table_row.oid = constraint_row.conrelid
      join pg_catalog.pg_namespace namespace_row
        on namespace_row.oid = table_row.relnamespace
      join pg_catalog.pg_attribute attribute
        on attribute.attrelid = table_row.oid
       and attribute.attname = expected.column_name
       and not attribute.attisdropped
      join pg_catalog.pg_index index_row
        on index_row.indrelid = table_row.oid
       and index_row.indisvalid
       and index_row.indisready
       and index_row.indexprs is null
       and index_row.indpred is null
       and index_row.indnkeyatts >= 1
       and index_row.indkey[0] = attribute.attnum
      join pg_catalog.pg_class index_relation
        on index_relation.oid = index_row.indexrelid
       and index_relation.relname = expected.index_name
      where namespace_row.nspname = 'public'
        and table_row.relname = expected.table_name
        and constraint_row.conname = expected.constraint_name
        and constraint_row.contype = 'f'
    )
  ) then
    raise exception 'Uma FK permaneceu sem o indice de apoio esperado.';
  end if;

  for merge_row in
    select * from pg_temp.select_policy_merges order by table_name
  loop
    if not exists (
      select 1
      from pg_catalog.pg_policies policy
      where policy.schemaname = 'public'
        and policy.tablename = merge_row.table_name
        and policy.policyname = merge_row.visible_policy
        and policy.cmd = 'SELECT'
        and policy.roles = array['anon']::name[]
    ) or not exists (
      select 1
      from pg_catalog.pg_policies policy
      where policy.schemaname = 'public'
        and policy.tablename = merge_row.table_name
        and policy.policyname = merge_row.admin_policy
        and policy.cmd = 'SELECT'
        and policy.roles = array['authenticated']::name[]
        and position(' OR ' in policy.qual) > 0
    ) then
      raise exception
        'Consolidacao de SELECT RLS falhou para public.%.',
        merge_row.table_name;
    end if;
  end loop;

  for merge_row in
    select * from pg_temp.delete_policy_merges order by table_name
  loop
    if exists (
      select 1
      from pg_catalog.pg_policies policy
      where policy.schemaname = 'public'
        and policy.tablename = merge_row.table_name
        and policy.policyname = merge_row.admin_policy
    ) or not exists (
      select 1
      from pg_catalog.pg_policies policy
      where policy.schemaname = 'public'
        and policy.tablename = merge_row.table_name
        and policy.policyname = merge_row.owner_policy
        and policy.cmd = 'DELETE'
        and policy.roles = array['authenticated']::name[]
        and position(' OR ' in policy.qual) > 0
    ) then
      raise exception
        'Consolidacao de DELETE RLS falhou para public.%.',
        merge_row.table_name;
    end if;
  end loop;

  if exists (
    select 1
    from pg_catalog.pg_policies policy
    where policy.schemaname = 'public'
      and policy.tablename = 'comunidade_posts'
      and policy.policyname in (
        'comunidade_posts_insert_autenticado',
        'usuarios podem criar publicacoes'
      )
  ) or not exists (
    select 1
    from pg_catalog.pg_policies policy
    where policy.schemaname = 'public'
      and policy.tablename = 'comunidade_posts'
      and policy.policyname = 'comunidade_posts_insert_proprio_visibilidade'
      and policy.cmd = 'INSERT'
      and policy.roles = array['authenticated']::name[]
  ) then
    raise exception 'Consolidacao de INSERT RLS da comunidade falhou.';
  end if;
end;
$migration$;

commit;
