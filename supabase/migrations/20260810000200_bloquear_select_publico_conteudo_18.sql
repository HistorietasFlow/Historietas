begin;

-- Historietas
-- Enquanto o acesso global a conteudo 18+ estiver temporariamente bloqueado,
-- obras e capitulos 18+ nao devem ser retornados em consultas publicas.
-- O proprio autor continua podendo acessar seus registros, pois outras areas
-- autenticadas do site dependem disso para edicao e administracao.
--
-- Quando o acesso 18+ for reativado no futuro, estas policies devem ser
-- revisadas por uma nova migration.

drop policy if exists "obras_select_publicadas_ou_proprias"
on public.obras;

create policy "obras_select_publicadas_ou_proprias"
on public.obras
for select
to anon, authenticated
using (
  (
    auth.uid() is not null
    and user_id = auth.uid()
  )
  or
  (
    coalesce(publicado, false) = true
    and classificacao_indicativa in (
      'Livre',
      '10+',
      '12+',
      '14+',
      '16+'
    )
  )
);

drop policy if exists "capitulos_select_publicados_ou_proprios"
on public.capitulos;

create policy "capitulos_select_publicados_ou_proprios"
on public.capitulos
for select
to anon, authenticated
using (
  (
    auth.uid() is not null
    and (
      user_id = auth.uid()
      or exists (
        select 1
        from public.obras as obra_propria
        where obra_propria.id = capitulos.obra_id
          and obra_propria.user_id = auth.uid()
      )
    )
  )
  or
  (
    coalesce(publicado, false) = true
    and exists (
      select 1
      from public.obras as obra_publica
      where obra_publica.id = capitulos.obra_id
        and coalesce(obra_publica.publicado, false) = true
        and obra_publica.classificacao_indicativa in (
          'Livre',
          '10+',
          '12+',
          '14+',
          '16+'
        )
    )
  )
);

comment on policy "obras_select_publicadas_ou_proprias"
on public.obras is
'Bloqueia SELECT publico de obras 18+ enquanto o acesso adulto global estiver desativado; o autor continua podendo acessar as proprias obras.';

comment on policy "capitulos_select_publicados_ou_proprios"
on public.capitulos is
'Bloqueia SELECT publico de capitulos pertencentes a obras 18+ enquanto o acesso adulto global estiver desativado; o autor continua podendo acessar os proprios capitulos.';

commit;
