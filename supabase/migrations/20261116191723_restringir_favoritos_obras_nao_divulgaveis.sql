begin;

-- A leitura pessoal inclui favoritos privados e obras que deixaram de ser publicas.
-- Para terceiros, a privacidade da Biblioteca nao basta para divulgar a obra.
-- Os filtros explicitos tambem valem quando o terceiro e o autor da obra.
alter policy favoritos_select_visiveis on public.favoritos
using (
  (select auth.uid()) = user_id
  or (
    historietas_privado.usuario_pode_ver_registro_biblioteca(user_id, visibilidade, 'favoritos')
    and exists (
      select 1 from public.obras obra
      where obra.id = favoritos.obra_id
        and obra.publicado = true
        and obra.classificacao_indicativa in ('Livre', '10+', '12+', '14+', '16+')
    )
  )
);

commit;
