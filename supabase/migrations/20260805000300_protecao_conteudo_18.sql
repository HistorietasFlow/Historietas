-- Proteção e avisos para obras classificadas como 18+.
-- Mantém obras antigas compatíveis e exige ao menos um aviso em novas gravações.

begin;

alter table public.obras
  add column if not exists avisos_conteudo text[];

alter table public.obras
  alter column avisos_conteudo set default '{}'::text[];

update public.obras
set avisos_conteudo = '{}'::text[]
where avisos_conteudo is null;

alter table public.obras
  alter column avisos_conteudo set not null;

update public.obras
set avisos_conteudo = array['outro_tema_adulto']::text[]
where classificacao_indicativa = '18+'
  and cardinality(avisos_conteudo) = 0;

update public.obras
set avisos_conteudo = '{}'::text[]
where coalesce(classificacao_indicativa, '') <> '18+'
  and cardinality(avisos_conteudo) > 0;

alter table public.obras
  drop constraint if exists obras_avisos_conteudo_check;

alter table public.obras
  add constraint obras_avisos_conteudo_check
  check (
    avisos_conteudo <@ array[
      'violencia_intensa',
      'drogas',
      'linguagem_forte',
      'terror',
      'tema_sexual_nao_explicito',
      'outro_tema_adulto'
    ]::text[]
    and (
      (
        classificacao_indicativa = '18+'
        and cardinality(avisos_conteudo) > 0
      )
      or (
        coalesce(classificacao_indicativa, '') <> '18+'
        and cardinality(avisos_conteudo) = 0
      )
    )
  );

comment on column public.obras.avisos_conteudo is
  'Avisos obrigatórios para obras 18+: violência intensa, drogas, linguagem forte, terror, tema sexual não explícito ou outro tema adulto.';

notify pgrst, 'reload schema';

commit;
