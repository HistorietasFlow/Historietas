-- Fixtures exclusivas do Supabase local para os testes de paginação.
-- Este arquivo não faz parte de `supabase db push`; o CLI o executa somente
-- após recriar o banco local com `supabase start`/`supabase db reset`.

begin;

-- As migrations de produção possuem triggers de negócio (termos, notificações
-- e sincronizações) que não fazem parte do escopo deste teste de leitura. Os
-- registros continuam respeitando constraints e chaves únicas; os usuários
-- referenciados também são criados no ambiente descartável.
set local session_replication_role = replica;

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
select
  '00000000-0000-0000-0000-000000000000'::uuid,
  format(
    'a0000000-0000-0000-0000-%s',
    lpad(indice::text, 12, '0')
  )::uuid,
  'authenticated',
  'authenticated',
  format('qa-paginacao-%s@example.invalid', indice),
  timestamptz '2026-01-01 00:00:00+00',
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{}'::jsonb,
  timestamptz '2026-01-01 00:00:00+00',
  timestamptz '2026-01-01 00:00:00+00'
from generate_series(1, 101) as indice;

insert into public.comunidade_posts (
  id,
  autor_id,
  autor_nome,
  texto,
  obra_relacionada,
  criado_em,
  visibilidade
)
select
  format(
    '10000000-0000-0000-0000-%s',
    lpad(indice::text, 12, '0')
  )::uuid,
  'a0000000-0000-0000-0000-000000000001'::uuid,
  'QA Paginação',
  format('QA PAGINACAO POST %s', lpad(indice::text, 6, '0')),
  'qa-paginacao',
  timestamptz '2026-01-01 00:00:00+00' + indice * interval '1 second',
  'publico'
from generate_series(1, 137) as indice;

insert into public.comunidade_comentarios (
  id,
  post_id,
  autor_id,
  autor_nome,
  texto,
  criado_em
)
select
  format(
    '20000000-0000-0000-0000-%s',
    lpad(indice::text, 12, '0')
  )::uuid,
  format(
    '10000000-0000-0000-0000-%s',
    lpad((((indice - 1) % 50) + 88)::text, 12, '0')
  )::uuid,
  'a0000000-0000-0000-0000-000000000001'::uuid,
  'QA Paginação',
  format('Comentário QA %s', lpad(indice::text, 6, '0')),
  timestamptz '2026-02-01 00:00:00+00' + indice * interval '1 second'
from generate_series(1, 2501) as indice;

insert into public.comunidade_curtidas (
  id,
  post_id,
  usuario_id,
  criado_em
)
select
  format(
    '30000000-0000-0000-0000-%s',
    lpad(indice::text, 12, '0')
  )::uuid,
  format(
    '10000000-0000-0000-0000-%s',
    lpad((((indice - 1) % 50) + 88)::text, 12, '0')
  )::uuid,
  format(
    'a0000000-0000-0000-0000-%s',
    lpad((((indice - 1) / 50) + 1)::text, 12, '0')
  )::uuid,
  timestamptz '2026-03-01 00:00:00+00' + indice * interval '1 second'
from generate_series(1, 5001) as indice;

insert into public.obras (
  id,
  user_id,
  titulo,
  autor,
  genero,
  formato,
  classificacao_indicativa,
  sinopse,
  publicado,
  slug,
  criada_em,
  atualizado_em
)
select
  format(
    '40000000-0000-0000-0000-%s',
    lpad(indice::text, 12, '0')
  )::uuid,
  'a0000000-0000-0000-0000-000000000001'::uuid,
  format('QA Paginação Obra %s', lpad(indice::text, 6, '0')),
  'QA Paginação',
  'Teste',
  'Texto',
  'Livre',
  'Fixture local para validar paginação real pela Data API.',
  true,
  format('qa-paginacao-obra-%s', lpad(indice::text, 6, '0')),
  timestamptz '2026-04-01 00:00:00+00' + indice * interval '1 second',
  timestamptz '2026-04-01 00:00:00+00' + indice * interval '1 second'
from generate_series(1, 1201) as indice;

analyze public.comunidade_posts;
analyze public.comunidade_comentarios;
analyze public.comunidade_curtidas;
analyze public.obras;

commit;
