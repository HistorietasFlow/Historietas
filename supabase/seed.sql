-- Fixtures exclusivas do Supabase local para os testes de paginação.
-- Este arquivo não faz parte de `supabase db push`; o CLI o executa somente
-- após recriar o banco local com `supabase start`/`supabase db reset`.

begin;

-- A carga em massa de Auth/Comunidade abaixo dispensa os triggers de negócio
-- fora do escopo deste teste de leitura. Obras/capítulos voltam ao modo normal
-- mais abaixo para preservar os contratos de integridade e revisão pública.
-- Os usuários referenciados também são criados no ambiente descartável.
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

insert into public.profiles (
  id,
  user_id,
  nome,
  avatar_url,
  bio,
  tipo,
  criado_em,
  atualizado_em,
  sobre_bio,
  username
)
values
  (
    'a0000000-0000-0000-0000-000000000001'::uuid,
    'a0000000-0000-0000-0000-000000000001'::uuid,
    'QA Paginação',
    '',
    '',
    'autor',
    timestamptz '2026-01-01 00:00:00+00',
    timestamptz '2026-01-01 00:00:00+00',
    '',
    'qa-paginacao'
  ),
  (
    'a0000000-0000-0000-0000-000000000002'::uuid,
    'a0000000-0000-0000-0000-000000000002'::uuid,
    'Autora Renomeada Fora da Página',
    '',
    '',
    'autor',
    timestamptz '2026-01-01 00:00:00+00',
    timestamptz '2026-01-01 00:00:00+00',
    '',
    'autora-renomeada-fora-pagina'
  );

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

-- Obras/capítulos precisam dos triggers normais, inclusive do ledger de revisão
-- pública. A seed roda após as migrations: o backfill não cobre estas inserções.
-- Sem JWT, os gates existentes permitem esta fixture administrativa local;
-- autoria, integridade e revisão continuam sendo verificadas pelos triggers.
set local session_replication_role = origin;

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
  visualizacoes,
  criada_em,
  atualizado_em
)
select
  format(
    '40000000-0000-0000-0000-%s',
    lpad(indice::text, 12, '0')
  )::uuid,
  case
    when indice = 1177
      then 'a0000000-0000-0000-0000-000000000002'::uuid
    else 'a0000000-0000-0000-0000-000000000001'::uuid
  end,
  format('QA Paginação Obra %s', lpad(indice::text, 6, '0')),
  case
    when indice = 1177 then 'Nome Antigo da Autora'
    else 'QA Paginação'
  end,
  'Teste',
  'Texto',
  'Livre',
  'Fixture local para validar paginação real pela Data API.',
  true,
  format('qa-paginacao-obra-%s', lpad(indice::text, 6, '0')),
  1202 - indice,
  timestamptz '2026-04-01 00:00:00+00' + indice * interval '1 second',
  timestamptz '2026-04-01 00:00:00+00' + indice * interval '1 second'
from generate_series(1, 1201) as indice;

insert into public.capitulos (
  id,
  obra_id,
  user_id,
  titulo,
  texto,
  ordem,
  publicado,
  criado_em,
  atualizado_em
)
select
  format(
    '50000000-0000-0000-0000-%s',
    lpad(indice::text, 12, '0')
  )::uuid,
  format(
    '40000000-0000-0000-0000-%s',
    lpad(indice::text, 12, '0')
  )::uuid,
  case
    when indice = 1177
      then 'a0000000-0000-0000-0000-000000000002'::uuid
    else 'a0000000-0000-0000-0000-000000000001'::uuid
  end,
  format('Capítulo QA %s', lpad(indice::text, 6, '0')),
  'Fixture local para validar o catálogo paginado.',
  1,
  true,
  timestamptz '2026-04-01 00:00:00+00' + indice * interval '1 second',
  timestamptz '2026-04-01 00:00:00+00' + indice * interval '1 second'
from generate_series(1, 1201) as indice;

analyze public.comunidade_posts;
analyze public.comunidade_comentarios;
analyze public.comunidade_curtidas;
analyze public.obras;
analyze public.capitulos;

commit;
