begin;

select plan(2);

select ok(
  not exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind = 'r'
      and not c.relrowsecurity
  ),
  'todas as tabelas public possuem RLS habilitado'
);

select ok(
  not exists (
    select 1
    from information_schema.role_table_grants
    where table_schema = 'public'
      and table_name in (
        'capitulo_visualizacoes_unicas',
        'obra_comentario_curtidas',
        'obra_comentarios',
        'obra_visualizacoes_unicas',
        'operacoes_exclusao_conta',
        'solicitacoes_exclusao_conta'
      )
      and grantee in ('anon', 'authenticated')
  ),
  'tabelas internas sem policies nao sao expostas a anon/authenticated'
);

select * from finish();

rollback;
