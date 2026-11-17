-- SOMENTE runner QA: Supabase local descartavel, sem migration persistente.
-- Usuario 101 = autor; 102..106 = avaliadores sinteticos.
begin;

insert into auth.users (id)
select ('f8200000-0000-4000-8000-' || lpad(i::text,12,'0'))::uuid
from generate_series(101,106) i;

insert into public.profiles(id,user_id,nome,tipo)
select ('f8200000-0000-4000-8000-' || lpad(i::text,12,'0'))::uuid,
       ('f8200000-0000-4000-8000-' || lpad(i::text,12,'0'))::uuid,
       'QA Etapa3 ' || i,
       case when i=101 then 'autor' else 'leitor' end
from generate_series(101,106) i;

insert into public.preferencias_privacidade(
  user_id,visibilidade_biblioteca,mostrar_avaliacoes,perfil_privado
)
select ('f8200000-0000-4000-8000-' || lpad(i::text,12,'0'))::uuid,
       'publico',true,false
from generate_series(102,106) i;

insert into public.obras(
  id,user_id,titulo,autor,genero,formato,classificacao_indicativa,
  avisos_conteudo,publicado,arquivo_url,slug
)
select ('f8200000-0000-4000-8000-' || lpad(i::text,12,'0'))::uuid,
       'f8200000-0000-4000-8000-000000000101'::uuid,
       'QA Ranking Geral obra ' || lpad(i::text,2,'0'),
       'QA Autor', 'Fantasia', 'HQ',
       case when i=40 then '18+' else 'Livre' end,
       case when i=40 then array['violencia_intensa']::text[] else array[]::text[] end,
       i <> 41,
       case when i=42 then '' else 'https://example.invalid/qa-publico.txt' end,
       'qa-rank-etapa3-' || i
from (
  select i from generate_series(1,25) i
  union all
  select i from generate_series(40,43) i
) obras(i);

insert into public.obra_avaliacoes(obra_id,user_id,nota,visibilidade)
select ('f8200000-0000-4000-8000-' || lpad(i::text,12,'0'))::uuid,
       'f8200000-0000-4000-8000-000000000102'::uuid,
       case when i <= 2 then 5::numeric else 4.5::numeric end,
       case when i % 2 = 0 then 'parcial' else 'publico' end
from generate_series(1,25) i;

insert into public.obra_avaliacoes(obra_id,user_id,nota,visibilidade)
select ('f8200000-0000-4000-8000-' || lpad(i::text,12,'0'))::uuid,
       ('f8200000-0000-4000-8000-' || lpad(v::text,12,'0'))::uuid,
       5,'publico'
from generate_series(1,2) i
cross join generate_series(103,106) v;

insert into public.obra_avaliacoes(obra_id,user_id,nota,visibilidade)
select ('f8200000-0000-4000-8000-' || lpad(i::text,12,'0'))::uuid,
       'f8200000-0000-4000-8000-000000000102'::uuid, 5,
       case when i=43 then 'privado' else 'publico' end
from generate_series(40,43) i;

commit;

-- Exatamente 25 obras sinteticas com avaliacoes publicas elegiveis.
