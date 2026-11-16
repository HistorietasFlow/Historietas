begin;

select plan(8);

select is(
  (
    select roles
    from pg_policies
    where schemaname = 'public'
      and tablename = 'comunidade_comentarios'
      and policyname = 'comunidade_comentarios_select_visivel_sem_bloqueio'
  ),
  array['authenticated'::name],
  'authenticated conserva a policy completa de comentario e bloqueio'
);

select is(
  (
    select roles
    from pg_policies
    where schemaname = 'public'
      and tablename = 'comunidade_comentarios'
      and policyname = 'comunidade_comentarios_select_post_visivel_anon'
  ),
  array['anon'::name],
  'anon possui policy separada de visibilidade do post'
);

set local session_replication_role = replica;

insert into auth.users (id)
values
  ('e1100000-0000-4000-8000-000000000001'),
  ('e1100000-0000-4000-8000-000000000002'),
  ('e1100000-0000-4000-8000-000000000003');

insert into public.comunidade_posts (
  id,
  autor_id,
  autor_nome,
  texto,
  visibilidade
)
values
  (
    'e1200000-0000-4000-8000-000000000001',
    'e1100000-0000-4000-8000-000000000002',
    'Fixture RLS',
    'Post publico de teste',
    'publico'
  ),
  (
    'e1200000-0000-4000-8000-000000000002',
    'e1100000-0000-4000-8000-000000000002',
    'Fixture RLS',
    'Post privado de teste',
    'somente_eu'
  );

insert into public.comunidade_comentarios (
  id,
  post_id,
  autor_id,
  autor_nome,
  texto
)
values
  (
    'e1300000-0000-4000-8000-000000000001',
    'e1200000-0000-4000-8000-000000000001',
    'e1100000-0000-4000-8000-000000000002',
    'Fixture RLS',
    'Comentario publico permitido'
  ),
  (
    'e1300000-0000-4000-8000-000000000002',
    'e1200000-0000-4000-8000-000000000001',
    'e1100000-0000-4000-8000-000000000003',
    'Fixture RLS',
    'Comentario publico bloqueado'
  ),
  (
    'e1300000-0000-4000-8000-000000000003',
    'e1200000-0000-4000-8000-000000000002',
    'e1100000-0000-4000-8000-000000000002',
    'Fixture RLS',
    'Comentario privado'
  );

insert into public.usuarios_bloqueados (
  id,
  bloqueador_id,
  bloqueado_id
)
values (
  'e1400000-0000-4000-8000-000000000001',
  'e1100000-0000-4000-8000-000000000001',
  'e1100000-0000-4000-8000-000000000003'
);

set local session_replication_role = origin;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
set local role anon;

select results_eq(
  $$
    select id
    from public.comunidade_comentarios
    where id in (
      'e1300000-0000-4000-8000-000000000001',
      'e1300000-0000-4000-8000-000000000002',
      'e1300000-0000-4000-8000-000000000003'
    )
    order by id
  $$,
  $$
    values
      ('e1300000-0000-4000-8000-000000000001'::uuid),
      ('e1300000-0000-4000-8000-000000000002'::uuid)
  $$,
  'anon le todos os comentarios de post publico'
);

select is(
  (
    select count(*)
    from public.comunidade_comentarios
    where id = 'e1300000-0000-4000-8000-000000000003'
  ),
  0::bigint,
  'anon nao le comentario de post privado'
);

reset role;
select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","sub":"e1100000-0000-4000-8000-000000000001"}',
  true
);
set local role authenticated;

select is(
  (
    select count(*)
    from public.comunidade_comentarios
    where id = 'e1300000-0000-4000-8000-000000000001'
  ),
  1::bigint,
  'authenticated le comentario publico sem bloqueio'
);

select is(
  (
    select count(*)
    from public.comunidade_comentarios
    where id = 'e1300000-0000-4000-8000-000000000002'
  ),
  0::bigint,
  'authenticated nao le comentario de usuario bloqueado'
);

select is(
  (
    select count(*)
    from public.comunidade_comentarios
    where id = 'e1300000-0000-4000-8000-000000000003'
  ),
  0::bigint,
  'authenticated nao le comentario de post privado alheio'
);

reset role;
select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","sub":"e1100000-0000-4000-8000-000000000002"}',
  true
);
set local role authenticated;

select is(
  (
    select count(*)
    from public.comunidade_comentarios
    where id = 'e1300000-0000-4000-8000-000000000003'
  ),
  1::bigint,
  'autor autenticado conserva acesso ao comentario do proprio post privado'
);

reset role;

select * from finish();

rollback;
