begin;

-- Falhar em caso de drift de propriedades, sem ampliar ACL nem trocar owner/OID.
do $migration$
declare
  v_antes jsonb;
  v_depois jsonb;
begin
  select to_jsonb(p) - 'prosrc' into strict v_antes
  from pg_catalog.pg_proc p
  where p.oid = 'historietas_privado.usuario_pode_ver_registro_biblioteca(uuid,text,text)'::regprocedure;

  execute $definition$
    create or replace function historietas_privado.usuario_pode_ver_registro_biblioteca(
      p_user_id uuid,
      p_visibilidade text,
      p_categoria text
    )
    returns boolean
    language sql
    stable
    security definer
    set search_path = ''
    as $function$
      select
        p_user_id is not null
        and (
          auth.uid() = p_user_id
          or (
            coalesce(p_visibilidade, 'privado') in ('publico', 'parcial')
            and public.usuario_pode_ver_aba_perfil(
              p_user_id,
              coalesce(preferencias.visibilidade_biblioteca, 'somente_eu')
            )
            and coalesce(
              case p_categoria
                when 'favoritos' then preferencias.mostrar_favoritos
                when 'concluidas' then preferencias.mostrar_concluidas
                when 'obra_avaliacoes' then preferencias.mostrar_avaliacoes
                when 'seguindo_obras' then preferencias.mostrar_quero_ler
                when 'salvos_capitulos' then preferencias.mostrar_historico_leitura
                else false
              end,
              false
            )
          )
        )
      -- Uma linha mesmo sem preferencias: preserva proprietario e NULL booleano.
      -- A PK de preferencias_privacidade(user_id) garante no maximo uma linha.
      from (select 1) as ancora
      left join public.preferencias_privacidade as preferencias
        on preferencias.user_id = p_user_id;
    $function$;
  $definition$;

  select to_jsonb(p) - 'prosrc' into strict v_depois
  from pg_catalog.pg_proc p
  where p.oid = 'historietas_privado.usuario_pode_ver_registro_biblioteca(uuid,text,text)'::regprocedure;
  if v_depois is distinct from v_antes then
    raise exception 'Propriedades da helper da Biblioteca divergiram; otimizacao cancelada';
  end if;
end;
$migration$;

commit;
