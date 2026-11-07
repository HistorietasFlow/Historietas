begin;

select plan(9);

select has_table(
  'public',
  'moderacao_historico',
  'historico de moderacao existe no schema publico'
);

select ok(
  (
    select relrowsecurity
    from pg_class
    where oid = 'public.moderacao_historico'::regclass
  ),
  'historico de moderacao permanece protegido por RLS'
);

select ok(
  has_table_privilege('authenticated', 'public.moderacao_historico', 'SELECT'),
  'authenticated possui apenas a capacidade necessaria de consulta'
);

select ok(
  not has_table_privilege('anon', 'public.moderacao_historico', 'SELECT'),
  'anon nao possui grant de consulta ao historico'
);

select ok(
  not has_table_privilege('authenticated', 'public.moderacao_historico', 'INSERT')
  and not has_table_privilege('authenticated', 'public.moderacao_historico', 'UPDATE')
  and not has_table_privilege('authenticated', 'public.moderacao_historico', 'DELETE')
  and not has_table_privilege('authenticated', 'public.moderacao_historico', 'TRUNCATE'),
  'authenticated nao pode inserir, alterar ou apagar eventos de auditoria'
);

select is(
  (
    select count(*)::integer
    from pg_policies
    where schemaname = 'public'
      and tablename = 'moderacao_historico'
      and cmd = 'SELECT'
      and roles = array['authenticated'::name]
      and qual like '%usuario_e_admin%'
  ),
  1,
  'somente a policy administrativa pode revelar o historico'
);

select ok(
  exists (
    select 1
    from pg_trigger
    where tgrelid = 'public.comunidade_denuncias'::regclass
      and tgname = 'comunidade_denuncias_historico'
      and not tgisinternal
  ),
  'denuncias de conteudo registram eventos automaticamente'
);

select ok(
  exists (
    select 1
    from pg_trigger
    where tgrelid = 'public.denuncias_perfis'::regclass
      and tgname = 'denuncias_perfis_historico'
      and not tgisinternal
  ),
  'denuncias de perfil registram eventos automaticamente'
);

select ok(
  exists (
    select 1
    from pg_constraint
    where conrelid = 'public.moderacao_historico'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) like '%status_alterado%'
      and pg_get_constraintdef(oid) like '%excluida%'
  ),
  'acoes auditadas incluem decisoes e exclusoes do painel'
);

select * from finish();

rollback;
