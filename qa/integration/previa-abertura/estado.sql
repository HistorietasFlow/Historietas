-- Apenas resumos das tabelas da aplicação e das permissões de Auth.
-- As consultas geradas são executadas na mesma transação de leitura.
begin isolation level repeatable read read only;
select format(
  'select %L, count(*), md5(coalesce(string_agg(md5(to_jsonb(t)::text), '''' order by md5(to_jsonb(t)::text)), '''')) from %I.%I t',
  schemaname || '.' || tablename, schemaname, tablename)
from pg_tables where schemaname in ('public','historietas_privado') order by schemaname,tablename
\gexec
select relowner,relacl,relrowsecurity,relforcerowsecurity
from pg_class where oid='auth.sessions'::regclass;
select attnum,attacl from pg_attribute where attrelid='auth.sessions'::regclass and attnum>0 order by attnum;
select to_jsonb(p) from pg_policies p where schemaname='auth' and tablename='sessions' order by policyname;
rollback;
