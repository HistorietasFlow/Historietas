-- HISTORIETAS — BASELINE CANDIDATA DO SCHEMA PUBLIC
-- Gerada a partir do dump real do Supabase em 2026-08-06.
-- NÃO EXECUTAR NO PROJETO REMOTO ATUAL.
-- Use somente em um Supabase local descartável até a validação completa.
-- Esta baseline substitui o histórico legado apenas após aprovação explícita.




SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';


-- Preserva os privilégios específicos registrados no dump.
-- Recomendação do Supabase para restauração de schema em projeto novo.
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public"
  REVOKE ALL ON TABLES FROM "anon", "authenticated";



CREATE OR REPLACE FUNCTION "public"."aceitar_termos_publicacao"("p_termos_versao" "text", "p_diretrizes_versao" "text", "p_politica_versao" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
    AS $$
declare
  v_user_id uuid := auth.uid();
  v_agora timestamptz := now();
begin
  if v_user_id is null then
    raise exception 'É necessário estar autenticado para aceitar os termos.'
      using errcode = '42501';
  end if;

  if p_termos_versao is distinct from '2026-08-05'
     or p_diretrizes_versao is distinct from '2026-08-05'
     or p_politica_versao is distinct from '2026-08-05' then
    raise exception 'A versão dos documentos não é a versão atual.'
      using errcode = '22023';
  end if;

  update public.profiles
  set
    termos_uso_versao = p_termos_versao,
    termos_uso_aceitos_em = v_agora,
    diretrizes_comunidade_versao = p_diretrizes_versao,
    diretrizes_comunidade_aceitas_em = v_agora,
    politica_privacidade_versao = p_politica_versao,
    politica_privacidade_ciente_em = v_agora
  where user_id = v_user_id or id = v_user_id;

  if not found then
    raise exception 'Perfil não encontrado. Saia da conta, entre novamente e tente outra vez.'
      using errcode = 'P0002';
  end if;

  return true;
end;
$$;


ALTER FUNCTION "public"."aceitar_termos_publicacao"("p_termos_versao" "text", "p_diretrizes_versao" "text", "p_politica_versao" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."atualizar_atualizado_em"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."atualizar_atualizado_em"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."atualizar_diario_anotacoes_atualizado_em"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."atualizar_diario_anotacoes_atualizado_em"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."atualizar_diario_atualizado_em"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."atualizar_diario_atualizado_em"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."atualizar_diario_comentario_atualizado_em"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."atualizar_diario_comentario_atualizado_em"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."atualizar_fixado_comunidade"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if new.fixado = true and old.fixado = false then
    new.fixado_em = now();
    new.fixado_por = auth.uid();
  end if;

  if new.fixado = false then
    new.fixado_em = null;
    new.fixado_por = null;
  end if;

  return new;
end;
$$;


ALTER FUNCTION "public"."atualizar_fixado_comunidade"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."atualizar_notificacoes_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."atualizar_notificacoes_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."bloquear_autoavaliacao_obra"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public', 'auth', 'pg_temp'
    AS $$
declare
  v_autor_id uuid;
begin
  select obra.user_id
  into v_autor_id
  from public.obras obra
  where obra.id = new.obra_id
  limit 1;

  if v_autor_id is null then
    raise exception 'A obra informada não existe.'
      using errcode = '23503';
  end if;

  if new.user_id = v_autor_id then
    raise exception 'O autor não pode avaliar a própria obra.'
      using errcode = '42501';
  end if;

  return new;
end;
$$;


ALTER FUNCTION "public"."bloquear_autoavaliacao_obra"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."bloquear_usuario"("p_bloqueado_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public', 'auth', 'pg_temp'
    AS $$
declare
  v_bloqueador_id uuid := auth.uid();
begin
  if v_bloqueador_id is null then
    raise exception 'Entre na sua conta para bloquear este usuário.'
      using errcode = '42501';
  end if;

  if p_bloqueado_id is null then
    raise exception 'Usuário inválido.'
      using errcode = '22023';
  end if;

  if v_bloqueador_id = p_bloqueado_id then
    raise exception 'Você não pode bloquear o próprio perfil.'
      using errcode = '22023';
  end if;

  if not exists (
    select 1
    from auth.users usuario
    where usuario.id = p_bloqueado_id
  ) then
    raise exception 'Usuário não encontrado.'
      using errcode = 'P0002';
  end if;

  insert into public.usuarios_bloqueados (
    bloqueador_id,
    bloqueado_id
  )
  values (
    v_bloqueador_id,
    p_bloqueado_id
  )
  on conflict (bloqueador_id, bloqueado_id)
  do nothing;

  -- O bloqueio encerra relações e solicitações nas duas direções.
  delete from public.seguindo_usuarios relacao
  where (
    relacao.seguidor_id = v_bloqueador_id
    and relacao.seguido_id = p_bloqueado_id
  )
  or (
    relacao.seguidor_id = p_bloqueado_id
    and relacao.seguido_id = v_bloqueador_id
  );

  delete from public.solicitacoes_seguidores solicitacao
  where (
    solicitacao.solicitante_id = v_bloqueador_id
    and solicitacao.destinatario_id = p_bloqueado_id
  )
  or (
    solicitacao.solicitante_id = p_bloqueado_id
    and solicitacao.destinatario_id = v_bloqueador_id
  );

  return true;
end;
$$;


ALTER FUNCTION "public"."bloquear_usuario"("p_bloqueado_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cancelar_solicitacao_seguidor"("p_seguido_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
declare
  v_seguidor_id uuid := auth.uid();
begin
  if v_seguidor_id is null or p_seguido_id is null then
    return false;
  end if;

  delete from public.solicitacoes_seguidores solicitacao
  where solicitacao.solicitante_id = v_seguidor_id
    and solicitacao.destinatario_id = p_seguido_id;

  perform public.remover_notificacoes_seguimento(
    v_seguidor_id,
    p_seguido_id,
    false
  );

  -- Cancelar é idempotente: se já não existe solicitação, o estado desejado
  -- também foi alcançado.
  return true;
end;
$$;


ALTER FUNCTION "public"."cancelar_solicitacao_seguidor"("p_seguido_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."carregar_avaliacao_diario"("p_diario_user_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public', 'auth', 'pg_temp'
    AS $$
declare
  v_usuario_atual uuid := auth.uid();
  v_mostrar boolean := true;
  v_permitir boolean := true;
  v_quem text := 'todos';
  v_pode_ver boolean := false;
  v_pode_avaliar boolean := false;
  v_media numeric(3,1) := 0;
  v_total integer := 0;
  v_minha_nota numeric(2,1) := 0;
begin
  if p_diario_user_id is null then
    raise exception 'O perfil do Diário não foi informado.'
      using errcode = '22023';
  end if;

  if not exists (
    select 1
    from auth.users usuario
    where usuario.id = p_diario_user_id
  ) then
    raise exception 'O perfil do Diário não existe mais.'
      using errcode = 'P0002';
  end if;

  select
    coalesce(preferencias.mostrar_avaliacao_diario, true),
    coalesce(preferencias.permitir_avaliacao_diario, true),
    coalesce(preferencias.quem_pode_avaliar_diario, 'todos')
  into v_mostrar, v_permitir, v_quem
  from public.preferencias_privacidade preferencias
  where preferencias.user_id = p_diario_user_id;

  if not found then
    v_mostrar := true;
    v_permitir := true;
    v_quem := 'todos';
  end if;

  v_pode_ver :=
    (
      v_usuario_atual = p_diario_user_id
      or coalesce(public.usuario_e_admin(), false)
      or (
        v_mostrar
        and public.diario_usuarios_sem_bloqueio(
          v_usuario_atual,
          p_diario_user_id
        )
        and public.usuario_pode_ver_aba_perfil(
          p_diario_user_id,
          coalesce(
            (
              select preferencias.visibilidade_diario
              from public.preferencias_privacidade preferencias
              where preferencias.user_id = p_diario_user_id
            ),
            'publico'
          )
        )
      )
    );

  if v_pode_ver then
    select
      coalesce(round(avg(avaliacao.nota)::numeric, 1), 0),
      count(*)::integer
    into v_media, v_total
    from public.diario_avaliacoes avaliacao
    where avaliacao.diario_user_id = p_diario_user_id;
  end if;

  if v_usuario_atual is not null then
    select coalesce(avaliacao.nota, 0)
    into v_minha_nota
    from public.diario_avaliacoes avaliacao
    where avaliacao.diario_user_id = p_diario_user_id
      and avaliacao.avaliador_id = v_usuario_atual
    limit 1;

    if not found then
      v_minha_nota := 0;
    end if;
  end if;

  v_pode_avaliar := public.diario_pode_avaliar(
    p_diario_user_id,
    v_usuario_atual
  );

  return jsonb_build_object(
    'visivel', v_pode_ver,
    'mostrar', v_mostrar,
    'permitir', v_permitir,
    'quem_pode_avaliar', v_quem,
    'pode_avaliar', v_pode_avaliar,
    'media', v_media,
    'total', v_total,
    'minha_nota', v_minha_nota
  );
end;
$$;


ALTER FUNCTION "public"."carregar_avaliacao_diario"("p_diario_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."carregar_estado_bloqueio_usuario"("p_outro_user_id" "uuid") RETURNS "jsonb"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public', 'auth', 'pg_temp'
    AS $$
  select jsonb_build_object(
    'bloqueadoPorMim',
      auth.uid() is not null
      and p_outro_user_id is not null
      and exists (
        select 1
        from public.usuarios_bloqueados bloqueio
        where bloqueio.bloqueador_id = auth.uid()
          and bloqueio.bloqueado_id = p_outro_user_id
      ),
    'bloqueadoPeloPerfil',
      auth.uid() is not null
      and p_outro_user_id is not null
      and exists (
        select 1
        from public.usuarios_bloqueados bloqueio
        where bloqueio.bloqueador_id = p_outro_user_id
          and bloqueio.bloqueado_id = auth.uid()
      ),
    'existeBloqueio',
      auth.uid() is not null
      and p_outro_user_id is not null
      and public.usuarios_possuem_bloqueio(
        auth.uid(),
        p_outro_user_id
      )
  );
$$;


ALTER FUNCTION "public"."carregar_estado_bloqueio_usuario"("p_outro_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."carregar_permissoes_abas_perfil"("p_user_id" "uuid") RETURNS "jsonb"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
  select jsonb_build_object(
    'obras', public.usuario_pode_ver_aba_perfil(
      p_user_id,
      coalesce(
        (
          select preferencias.visibilidade_obras
          from public.preferencias_privacidade preferencias
          where preferencias.user_id = p_user_id
        ),
        'publico'
      )
    ),
    'sobre', public.usuario_pode_ver_aba_perfil(
      p_user_id,
      coalesce(
        (
          select preferencias.visibilidade_sobre
          from public.preferencias_privacidade preferencias
          where preferencias.user_id = p_user_id
        ),
        'publico'
      )
    ),
    'diario', public.usuario_pode_ver_aba_perfil(
      p_user_id,
      coalesce(
        (
          select preferencias.visibilidade_diario
          from public.preferencias_privacidade preferencias
          where preferencias.user_id = p_user_id
        ),
        'publico'
      )
    ),
    'comunidade', public.usuario_pode_ver_aba_perfil(
      p_user_id,
      coalesce(
        (
          select preferencias.visibilidade_comunidade
          from public.preferencias_privacidade preferencias
          where preferencias.user_id = p_user_id
        ),
        'publico'
      )
    ),
    'biblioteca', public.usuario_pode_ver_aba_perfil(
      p_user_id,
      coalesce(
        (
          select preferencias.visibilidade_biblioteca
          from public.preferencias_privacidade preferencias
          where preferencias.user_id = p_user_id
        ),
        'somente_eu'
      )
    ),
    'atividades', public.usuario_pode_ver_aba_perfil(
      p_user_id,
      coalesce(
        (
          select preferencias.visibilidade_atividades
          from public.preferencias_privacidade preferencias
          where preferencias.user_id = p_user_id
        ),
        'seguidores'
      )
    )
  );
$$;


ALTER FUNCTION "public"."carregar_permissoes_abas_perfil"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."comunidade_enquete_resultados"("p_post_ids" "uuid"[]) RETURNS TABLE("post_id" "uuid", "opcao" "text", "total" bigint, "meu_voto" boolean)
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select
    v.post_id,
    v.opcao,
    count(*)::bigint as total,
    bool_or(v.user_id = auth.uid()) as meu_voto
  from public.comunidade_enquete_votos v
  where v.post_id = any(p_post_ids)
  group by v.post_id, v.opcao
  order by v.post_id, v.opcao;
$$;


ALTER FUNCTION "public"."comunidade_enquete_resultados"("p_post_ids" "uuid"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."comunidade_motivo_denuncia_valido"("p_motivo" "text") RETURNS boolean
    LANGUAGE "sql" IMMUTABLE
    SET "search_path" TO 'pg_catalog'
    AS $$
  select btrim(coalesce(p_motivo, '')) in (
    -- Valores legados já usados pela interface atual.
    'Conteúdo inadequado',
    'Conteúdo impróprio',
    'Conteúdo ofensivo',
    'Spam',
    'Assédio',
    'Ódio ou discriminação',
    'Ameaça ou violência',
    'Conteúdo sexual impróprio',
    'Risco envolvendo menor',
    'Plágio ou direitos autorais',
    'Exposição de informações pessoais',
    'Fraude ou golpe',
    'Perfil falso',
    'Outro',

    -- Códigos estáveis preparados para o modal compartilhado futuro.
    'conteudo_inadequado',
    'spam',
    'assedio',
    'odio_discriminacao',
    'ameaca_violencia',
    'conteudo_sexual',
    'risco_menor',
    'plagio_direitos_autorais',
    'informacoes_pessoais',
    'fraude',
    'perfil_falso',
    'outro'
  );
$$;


ALTER FUNCTION "public"."comunidade_motivo_denuncia_valido"("p_motivo" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."comunidade_motivo_denuncia_valido"("p_motivo" "text") IS 'Valida motivos aceitos para novas denúncias da Comunidade.';



CREATE OR REPLACE FUNCTION "public"."comunidade_pode_ver_comentario"("p_comentario_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public', 'auth', 'pg_temp'
    AS $$
  select exists (
    select 1
    from public.comunidade_comentarios comentario
    where comentario.id = p_comentario_id
      and public.comunidade_pode_ver_post(comentario.post_id)
  );
$$;


ALTER FUNCTION "public"."comunidade_pode_ver_comentario"("p_comentario_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."comunidade_pode_ver_comentario"("p_comentario_id" "uuid") IS 'Verifica se a sessão atual pode visualizar o post que contém o comentário.';



CREATE OR REPLACE FUNCTION "public"."comunidade_pode_ver_post"("p_post_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public', 'auth', 'pg_temp'
    AS $$
  select exists (
    select 1
    from public.comunidade_posts post
    where post.id = p_post_id
      and (
        post.autor_id = auth.uid()
        or (
          auth.uid() is not null
          and public.comunidade_usuario_e_admin()
        )
        or post.visibilidade = 'publico'
        or (
          post.visibilidade = 'seguidores'
          and auth.uid() is not null
          and exists (
            select 1
            from public.seguindo_usuarios relacao
            where relacao.seguidor_id = auth.uid()
              and relacao.seguido_id = post.autor_id
          )
        )
        or (
          post.visibilidade = 'seguindo'
          and auth.uid() is not null
          and exists (
            select 1
            from public.seguindo_usuarios relacao
            where relacao.seguidor_id = post.autor_id
              and relacao.seguido_id = auth.uid()
          )
        )
      )
  );
$$;


ALTER FUNCTION "public"."comunidade_pode_ver_post"("p_post_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."comunidade_pode_ver_post"("p_post_id" "uuid") IS 'Verifica no servidor se a sessão atual pode visualizar uma publicação da Comunidade.';



CREATE OR REPLACE FUNCTION "public"."comunidade_usuario_e_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
  with contexto as (
    select
      auth.uid() as usuario_id,
      coalesce(
        auth.jwt() -> 'app_metadata',
        '{}'::jsonb
      ) as app_metadata
  )
  select
    usuario_id is not null
    and (
      lower(btrim(coalesce(app_metadata ->> 'role', '')))
        in ('admin', 'moderador', 'moderator')
      or lower(btrim(coalesce(app_metadata ->> 'cargo', '')))
        in ('admin', 'moderador', 'moderator')
      or lower(btrim(coalesce(app_metadata ->> 'tipo_usuario', '')))
        in ('admin', 'moderador', 'moderator')
      or lower(btrim(coalesce(app_metadata ->> 'admin', '')))
        in ('true', '1', 'sim', 'yes')
      or lower(btrim(coalesce(app_metadata ->> 'is_admin', '')))
        in ('true', '1', 'sim', 'yes')
      or lower(btrim(coalesce(app_metadata ->> 'moderator', '')))
        in ('true', '1', 'sim', 'yes')
      or exists (
        select 1
        from jsonb_array_elements_text(
          case
            when jsonb_typeof(app_metadata -> 'roles') = 'array'
              then app_metadata -> 'roles'
            else '[]'::jsonb
          end
        ) as papel(valor)
        where lower(btrim(papel.valor))
          in ('admin', 'moderador', 'moderator')
      )
    )
  from contexto;
$$;


ALTER FUNCTION "public"."comunidade_usuario_e_admin"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."comunidade_usuario_e_admin"() IS 'Retorna true somente para usuários autenticados com privilégio administrativo em app_metadata.';



CREATE OR REPLACE FUNCTION "public"."criar_denuncia"("p_alvo_tipo" "text", "p_alvo_id" "uuid", "p_motivo" "text" DEFAULT 'Conteúdo inadequado'::"text", "p_detalhe" "text" DEFAULT ''::"text") RETURNS TABLE("denuncia_id" "uuid", "denuncia_status" "text", "denuncia_criado_em" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public', 'auth', 'pg_temp'
    AS $$
declare
  v_usuario_id uuid := auth.uid();
  v_alvo_tipo text :=
    lower(btrim(coalesce(p_alvo_tipo, '')));
  v_motivo text :=
    btrim(coalesce(p_motivo, ''));
  v_detalhe text :=
    btrim(coalesce(p_detalhe, ''));
  v_denuncia_id uuid;
  v_denuncia_status text;
  v_denuncia_criado_em timestamptz;
begin
  if v_usuario_id is null then
    raise exception
      'Entre na sua conta para enviar uma denúncia.'
      using errcode = '42501';
  end if;

  if v_alvo_tipo not in (
    'post',
    'comentario',
    'comentario_capitulo',
    'obra',
    'capitulo',
    'comentario_obra',
    'diario_anotacao',
    'comentario_diario'
  ) then
    raise exception
      'Tipo de conteúdo denunciado inválido.'
      using errcode = '22023';
  end if;

  if p_alvo_id is null then
    raise exception
      'A denúncia precisa informar o conteúdo denunciado.'
      using errcode = '23502';
  end if;

  if not public.comunidade_motivo_denuncia_valido(
    v_motivo
  ) then
    raise exception
      'Motivo da denúncia inválido.'
      using errcode = '22023';
  end if;

  if char_length(v_detalhe) > 1200 then
    raise exception
      'A explicação da denúncia pode ter no máximo 1200 caracteres.'
      using errcode = '22001';
  end if;

  if exists (
    select 1
    from public.comunidade_denuncias denuncia
    where denuncia.alvo_tipo = v_alvo_tipo
      and denuncia.alvo_id = p_alvo_id
      and denuncia.denunciante_id = v_usuario_id
      and denuncia.status in (
        'pendente',
        'em_analise'
      )
  ) then
    raise exception
      'Você já possui uma denúncia ativa para este conteúdo.'
      using
        errcode = '23505',
        constraint =
          'comunidade_denuncias_ativa_uidx';
  end if;

  insert into public.comunidade_denuncias (
    alvo_tipo,
    alvo_id,
    denunciante_id,
    motivo,
    detalhe
  )
  values (
    v_alvo_tipo,
    p_alvo_id,
    v_usuario_id,
    v_motivo,
    v_detalhe
  )
  returning
    id,
    status,
    criado_em
  into
    v_denuncia_id,
    v_denuncia_status,
    v_denuncia_criado_em;

  return query
  select
    v_denuncia_id,
    v_denuncia_status,
    v_denuncia_criado_em;

exception
  when unique_violation then
    raise exception
      'Você já possui uma denúncia ativa para este conteúdo.'
      using
        errcode = '23505',
        constraint =
          'comunidade_denuncias_ativa_uidx';
end;
$$;


ALTER FUNCTION "public"."criar_denuncia"("p_alvo_tipo" "text", "p_alvo_id" "uuid", "p_motivo" "text", "p_detalhe" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."criar_denuncia"("p_alvo_tipo" "text", "p_alvo_id" "uuid", "p_motivo" "text", "p_detalhe" "text") IS 'Cria denúncias seguras para Comunidade, obras, capítulos, Diário e comentários.';



CREATE OR REPLACE FUNCTION "public"."criar_denuncia_perfil"("p_denunciado_id" "uuid", "p_perfil_nome" "text" DEFAULT ''::"text", "p_perfil_url" "text" DEFAULT ''::"text", "p_motivo" "text" DEFAULT 'outro'::"text", "p_descricao" "text" DEFAULT ''::"text") RETURNS TABLE("denuncia_id" "uuid", "denuncia_status" "text", "denuncia_criado_em" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public', 'auth', 'pg_temp'
    AS $$
declare
  v_usuario_id uuid := auth.uid();
  v_motivo text := lower(btrim(coalesce(p_motivo, 'outro')));
  v_denuncia_id uuid;
  v_denuncia_status text;
  v_denuncia_criado_em timestamptz;
begin
  if v_usuario_id is null then
    raise exception 'Entre na sua conta para enviar uma denúncia.'
      using errcode = '42501';
  end if;

  if p_denunciado_id is null then
    raise exception 'A denúncia precisa informar o perfil denunciado.'
      using errcode = '23502';
  end if;

  if v_usuario_id = p_denunciado_id then
    raise exception 'Você não pode denunciar o próprio perfil.'
      using errcode = '22023';
  end if;

  if not public.perfil_motivo_denuncia_valido(v_motivo) then
    raise exception 'Motivo da denúncia inválido.'
      using errcode = '22023';
  end if;

  if char_length(btrim(coalesce(p_descricao, ''))) > 1200 then
    raise exception
      'A explicação da denúncia pode ter no máximo 1200 caracteres.'
      using errcode = '22001';
  end if;

  if exists (
    select 1
    from public.denuncias_perfis denuncia
    where denuncia.denunciante_id = v_usuario_id
      and denuncia.denunciado_id = p_denunciado_id
      and denuncia.status in ('pendente', 'analisada')
  ) then
    raise exception 'Você já possui uma denúncia ativa para este perfil.'
      using
        errcode = '23505',
        constraint = 'denuncias_perfis_ativa_uidx';
  end if;

  insert into public.denuncias_perfis (
    denunciante_id,
    denunciado_id,
    perfil_nome,
    perfil_url,
    motivo,
    descricao,
    status
  )
  values (
    v_usuario_id,
    p_denunciado_id,
    left(btrim(coalesce(p_perfil_nome, '')), 120),
    left(btrim(coalesce(p_perfil_url, '')), 1000),
    v_motivo,
    btrim(coalesce(p_descricao, '')),
    'pendente'
  )
  returning
    id,
    status,
    criado_em
  into
    v_denuncia_id,
    v_denuncia_status,
    v_denuncia_criado_em;

  return query
  select
    v_denuncia_id,
    v_denuncia_status,
    v_denuncia_criado_em;

exception
  when unique_violation then
    raise exception 'Você já possui uma denúncia ativa para este perfil.'
      using
        errcode = '23505',
        constraint = 'denuncias_perfis_ativa_uidx';
end;
$$;


ALTER FUNCTION "public"."criar_denuncia_perfil"("p_denunciado_id" "uuid", "p_perfil_nome" "text", "p_perfil_url" "text", "p_motivo" "text", "p_descricao" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."criar_denuncia_perfil"("p_denunciado_id" "uuid", "p_perfil_nome" "text", "p_perfil_url" "text", "p_motivo" "text", "p_descricao" "text") IS 'Cria uma denúncia de perfil usando auth.uid(), sem aceitar o denunciante informado pelo cliente.';



CREATE OR REPLACE FUNCTION "public"."criar_notificacao_comunidade_interna"("p_user_id" "uuid", "p_ator_id" "uuid", "p_tipo" "text", "p_titulo" "text", "p_mensagem" "text", "p_link" "text", "p_notificacao_id" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public', 'pg_temp'
    AS $_$
declare
  v_user_id uuid := p_user_id;
  v_ator_id uuid := p_ator_id;
  v_tipo text :=
    left(
      lower(nullif(btrim(coalesce(p_tipo, '')), '')),
      80
    );
  v_titulo text :=
    left(
      regexp_replace(
        coalesce(
          nullif(btrim(p_titulo), ''),
          'Nova interação na Comunidade'
        ),
        E'[\n\r\t]+',
        ' ',
        'g'
      ),
      160
    );
  v_mensagem text :=
    left(
      regexp_replace(
        coalesce(
          nullif(btrim(p_mensagem), ''),
          'Você recebeu uma nova interação na Comunidade.'
        ),
        E'[\n\r\t]+',
        ' ',
        'g'
      ),
      600
    );
  v_link text :=
    nullif(btrim(coalesce(p_link, '')), '');
  v_notificacao_chave text :=
    left(
      nullif(btrim(coalesce(p_notificacao_id, '')), ''),
      300
    );
  v_notificacao_valor text;
  v_agora timestamptz := now();
  v_metadata jsonb;

  v_tem_user_id boolean := false;
  v_tem_titulo boolean := false;
  v_tem_mensagem boolean := false;
  v_tem_tipo boolean := false;
  v_tem_obra_id boolean := false;
  v_tem_capitulo_id boolean := false;
  v_tem_link boolean := false;
  v_tem_href boolean := false;
  v_tem_lida boolean := false;
  v_tem_notificacao_id boolean := false;
  v_tem_autor_id boolean := false;
  v_tem_metadata boolean := false;
  v_tem_criada_em boolean := false;
  v_tem_criado_em boolean := false;
  v_tem_created_at boolean := false;
  v_tem_atualizado_em boolean := false;
  v_tem_updated_at boolean := false;

  v_tipo_notificacao_id text := '';
  v_tipo_metadata text := '';

  v_colunas text[] := array[]::text[];
  v_valores text[] := array[]::text[];
  v_sql text;
  v_sql_existe text;
  v_ja_existe boolean := false;
begin
  if v_user_id is null
    or v_ator_id is null
    or v_user_id = v_ator_id
    or v_tipo is null
    or v_notificacao_chave is null
    or to_regclass('public.notificacoes') is null
  then
    return;
  end if;

  -- Links de notificação devem permanecer internos ao site.
  if v_link is null
    or left(v_link, 1) <> '/'
    or left(v_link, 2) = '//'
    or v_link like E'%\\%'
    or v_link ~ E'[\n\r\t]'
  then
    v_link := '/comunidade';
  end if;

  select
    exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'notificacoes'
        and column_name = 'user_id'
    ),
    exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'notificacoes'
        and column_name = 'titulo'
    ),
    exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'notificacoes'
        and column_name = 'mensagem'
    ),
    exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'notificacoes'
        and column_name = 'tipo'
    ),
    exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'notificacoes'
        and column_name = 'obra_id'
    ),
    exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'notificacoes'
        and column_name = 'capitulo_id'
    ),
    exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'notificacoes'
        and column_name = 'link'
    ),
    exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'notificacoes'
        and column_name = 'href'
    ),
    exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'notificacoes'
        and column_name = 'lida'
    ),
    exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'notificacoes'
        and column_name = 'notificacao_id'
    ),
    coalesce((
      select coluna.udt_name
      from information_schema.columns coluna
      where coluna.table_schema = 'public'
        and coluna.table_name = 'notificacoes'
        and coluna.column_name = 'notificacao_id'
      limit 1
    ), ''),
    exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'notificacoes'
        and column_name = 'autor_id'
    ),
    exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'notificacoes'
        and column_name = 'metadata'
    ),
    coalesce((
      select coluna.udt_name
      from information_schema.columns coluna
      where coluna.table_schema = 'public'
        and coluna.table_name = 'notificacoes'
        and coluna.column_name = 'metadata'
      limit 1
    ), ''),
    exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'notificacoes'
        and column_name = 'criada_em'
    ),
    exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'notificacoes'
        and column_name = 'criado_em'
    ),
    exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'notificacoes'
        and column_name = 'created_at'
    ),
    exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'notificacoes'
        and column_name = 'atualizado_em'
    ),
    exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'notificacoes'
        and column_name = 'updated_at'
    )
  into
    v_tem_user_id,
    v_tem_titulo,
    v_tem_mensagem,
    v_tem_tipo,
    v_tem_obra_id,
    v_tem_capitulo_id,
    v_tem_link,
    v_tem_href,
    v_tem_lida,
    v_tem_notificacao_id,
    v_tipo_notificacao_id,
    v_tem_autor_id,
    v_tem_metadata,
    v_tipo_metadata,
    v_tem_criada_em,
    v_tem_criado_em,
    v_tem_created_at,
    v_tem_atualizado_em,
    v_tem_updated_at;

  if not (
    v_tem_user_id
    and v_tem_titulo
    and v_tem_mensagem
    and v_tem_tipo
  ) then
    return;
  end if;

  if v_tem_notificacao_id
    and v_tipo_notificacao_id not in (
      'uuid',
      'text',
      'varchar',
      'bpchar'
    )
  then
    v_tem_notificacao_id := false;
  end if;

  if v_tem_metadata
    and v_tipo_metadata not in (
      'json',
      'jsonb',
      'text',
      'varchar',
      'bpchar'
    )
  then
    v_tem_metadata := false;
  end if;

  if v_tem_notificacao_id
    and v_tipo_notificacao_id = 'uuid'
  then
    v_notificacao_valor :=
      substr(md5(v_notificacao_chave), 1, 8) || '-' ||
      substr(md5(v_notificacao_chave), 9, 4) || '-' ||
      substr(md5(v_notificacao_chave), 13, 4) || '-' ||
      substr(md5(v_notificacao_chave), 17, 4) || '-' ||
      substr(md5(v_notificacao_chave), 21, 12);
  else
    v_notificacao_valor := v_notificacao_chave;
  end if;

  v_metadata := jsonb_build_object(
    'origem', 'notificacoes_comunidade_triggers',
    'ator_id', v_ator_id,
    'notificacao_id', v_notificacao_chave,
    'tipo', v_tipo
  );

  -- Serializa chamadas do mesmo evento e destinatário.
  perform pg_advisory_xact_lock(
    hashtextextended(
      v_user_id::text || ':' || v_notificacao_chave,
      0
    )
  );

  if v_tem_notificacao_id then
    execute
      'select exists (
         select 1
         from public.notificacoes
         where user_id::text = $1::text
           and notificacao_id::text = $2
         limit 1
       )'
    into v_ja_existe
    using v_user_id, v_notificacao_valor;
  elsif v_tem_metadata
    and v_tipo_metadata in ('json', 'jsonb')
  then
    execute
      'select exists (
         select 1
         from public.notificacoes
         where user_id::text = $1::text
           and metadata::jsonb ->> ''notificacao_id'' = $2
         limit 1
       )'
    into v_ja_existe
    using v_user_id, v_notificacao_chave;
  else
    v_sql_existe :=
      'select exists (' ||
      'select 1 from public.notificacoes ' ||
      'where user_id::text = $1::text ' ||
      'and tipo::text = $2';

    if v_tem_autor_id then
      v_sql_existe :=
        v_sql_existe ||
        ' and autor_id::text = $3::text';
    end if;

    if v_tem_link then
      v_sql_existe :=
        v_sql_existe ||
        ' and link::text = $4';
    elsif v_tem_href then
      v_sql_existe :=
        v_sql_existe ||
        ' and href::text = $4';
    end if;

    v_sql_existe := v_sql_existe || ' limit 1)';

    execute v_sql_existe
    into v_ja_existe
    using v_user_id, v_tipo, v_ator_id, v_link;
  end if;

  if v_ja_existe then
    return;
  end if;

  v_colunas := array[
    'user_id',
    'titulo',
    'mensagem',
    'tipo'
  ];

  v_valores := array[
    '$1',
    '$2',
    '$3',
    '$4'
  ];

  if v_tem_obra_id then
    v_colunas := array_append(v_colunas, 'obra_id');
    v_valores := array_append(v_valores, 'null');
  end if;

  if v_tem_capitulo_id then
    v_colunas := array_append(v_colunas, 'capitulo_id');
    v_valores := array_append(v_valores, 'null');
  end if;

  if v_tem_link then
    v_colunas := array_append(v_colunas, 'link');
    v_valores := array_append(v_valores, '$5');
  end if;

  if v_tem_href then
    v_colunas := array_append(v_colunas, 'href');
    v_valores := array_append(v_valores, '$5');
  end if;

  if v_tem_lida then
    v_colunas := array_append(v_colunas, 'lida');
    v_valores := array_append(v_valores, 'false');
  end if;

  if v_tem_notificacao_id then
    v_colunas := array_append(v_colunas, 'notificacao_id');

    if v_tipo_notificacao_id = 'uuid' then
      v_valores := array_append(v_valores, '$6::uuid');
    else
      v_valores := array_append(v_valores, '$6');
    end if;
  end if;

  if v_tem_autor_id then
    v_colunas := array_append(v_colunas, 'autor_id');
    v_valores := array_append(v_valores, '$7');
  end if;

  if v_tem_metadata then
    v_colunas := array_append(v_colunas, 'metadata');

    if v_tipo_metadata = 'json' then
      v_valores := array_append(
        v_valores,
        '$9::jsonb::json'
      );
    elsif v_tipo_metadata = 'jsonb' then
      v_valores := array_append(
        v_valores,
        '$9::jsonb'
      );
    else
      v_valores := array_append(
        v_valores,
        '$9::text'
      );
    end if;
  end if;

  if v_tem_criada_em then
    v_colunas := array_append(v_colunas, 'criada_em');
    v_valores := array_append(v_valores, '$8::timestamptz');
  end if;

  if v_tem_criado_em then
    v_colunas := array_append(v_colunas, 'criado_em');
    v_valores := array_append(v_valores, '$8::timestamptz');
  end if;

  if v_tem_created_at then
    v_colunas := array_append(v_colunas, 'created_at');
    v_valores := array_append(v_valores, '$8::timestamptz');
  end if;

  if v_tem_atualizado_em then
    v_colunas := array_append(v_colunas, 'atualizado_em');
    v_valores := array_append(v_valores, '$8::timestamptz');
  end if;

  if v_tem_updated_at then
    v_colunas := array_append(v_colunas, 'updated_at');
    v_valores := array_append(v_valores, '$8::timestamptz');
  end if;

  v_sql := format(
    'insert into public.notificacoes (%s) values (%s)',
    array_to_string(
      array(
        select format('%I', coluna)
        from unnest(v_colunas) as coluna
      ),
      ', '
    ),
    array_to_string(v_valores, ', ')
  );

  execute v_sql
  using
    v_user_id,
    v_titulo,
    v_mensagem,
    v_tipo,
    v_link,
    v_notificacao_valor,
    v_ator_id,
    v_agora,
    v_metadata;
exception
  when unique_violation then
    return;
  when others then
    raise warning
      'Falha ao criar notificação da Comunidade: %',
      sqlerrm;

    return;
end;
$_$;


ALTER FUNCTION "public"."criar_notificacao_comunidade_interna"("p_user_id" "uuid", "p_ator_id" "uuid", "p_tipo" "text", "p_titulo" "text", "p_mensagem" "text", "p_link" "text", "p_notificacao_id" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."criar_notificacao_interacao_capitulo"("p_capitulo_id" "uuid", "p_comentario_id" "uuid", "p_tipo" "text", "p_titulo" "text", "p_mensagem" "text", "p_link" "text") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public', 'pg_temp'
    AS $_$
declare
  v_ator_id uuid := auth.uid();
  v_receptor_id uuid;
  v_obra_id uuid;
  v_obra_slug text := '';
  v_capitulo_titulo text := '';
  v_capitulo_ordem integer;
  v_comentario_pai_id uuid;
  v_eh_resposta boolean := false;

  v_tipo text := nullif(btrim(coalesce(p_tipo, '')), '');
  v_titulo text;
  v_mensagem text;
  v_link text;
  v_nome_ator text := 'Usuário';

  v_notificacao_chave text;
  v_notificacao_valor text;
  v_notificacao_id_tipo text := '';
  v_metadata_tipo text := '';

  v_tem_user_id boolean := false;
  v_tem_titulo boolean := false;
  v_tem_mensagem boolean := false;
  v_tem_tipo boolean := false;
  v_tem_obra_id boolean := false;
  v_tem_capitulo_id boolean := false;
  v_tem_lida boolean := false;
  v_tem_notificacao_id boolean := false;
  v_tem_autor_id boolean := false;
  v_tem_link boolean := false;
  v_tem_href boolean := false;
  v_tem_metadata boolean := false;
  v_tem_criada_em boolean := false;
  v_tem_criado_em boolean := false;
  v_tem_created_at boolean := false;
  v_tem_atualizado_em boolean := false;
  v_tem_updated_at boolean := false;

  v_colunas text[] := array[]::text[];
  v_valores text[] := array[]::text[];
  v_sql text;
  v_ja_existe boolean := false;
begin
  -- Mantém a assinatura usada pelo frontend, mas não confia no conteúdo
  -- enviado pelo cliente.
  perform p_titulo, p_mensagem, p_link;

  if v_ator_id is null
    or p_capitulo_id is null
    or v_tipo is null
    or to_regclass('public.capitulos') is null
    or to_regclass('public.obras') is null
    or to_regclass('public.notificacoes') is null
  then
    return 0;
  end if;

  if v_tipo not in (
    'curtida-capitulo',
    'comentario-capitulo',
    'curtida-comentario-capitulo'
  ) then
    return 0;
  end if;

  select
    capitulo.obra_id,
    coalesce(obra.user_id, capitulo.user_id),
    coalesce(obra.slug, ''),
    coalesce(capitulo.titulo, ''),
    capitulo.ordem
  into
    v_obra_id,
    v_receptor_id,
    v_obra_slug,
    v_capitulo_titulo,
    v_capitulo_ordem
  from public.capitulos capitulo
  join public.obras obra
    on obra.id = capitulo.obra_id
  where capitulo.id = p_capitulo_id
    and coalesce(capitulo.publicado, false) = true
    and coalesce(obra.publicado, false) = true
  limit 1;

  if v_obra_id is null or v_receptor_id is null then
    return 0;
  end if;

  if v_tipo = 'curtida-capitulo' then
    if to_regclass('public.curtidas_capitulos') is null then
      return 0;
    end if;

    if not exists (
      select 1
      from public.curtidas_capitulos curtida
      where curtida.capitulo_id = p_capitulo_id
        and curtida.user_id = v_ator_id
      limit 1
    ) then
      return 0;
    end if;
  elsif v_tipo = 'comentario-capitulo' then
    if p_comentario_id is null
      or to_regclass('public.comentarios_capitulos') is null
    then
      return 0;
    end if;

    select comentario.comentario_pai_id
    into v_comentario_pai_id
    from public.comentarios_capitulos comentario
    where comentario.id = p_comentario_id
      and comentario.capitulo_id = p_capitulo_id
      and comentario.user_id = v_ator_id
    limit 1;

    if not found then
      return 0;
    end if;

    if v_comentario_pai_id is not null then
      select comentario_pai.user_id
      into v_receptor_id
      from public.comentarios_capitulos comentario_pai
      where comentario_pai.id = v_comentario_pai_id
        and comentario_pai.capitulo_id = p_capitulo_id
      limit 1;

      if v_receptor_id is null then
        return 0;
      end if;

      v_eh_resposta := true;
    end if;
  else
    if p_comentario_id is null
      or to_regclass('public.comentarios_capitulos') is null
      or to_regclass('public.comentarios_capitulos_curtidas') is null
    then
      return 0;
    end if;

    select comentario.user_id
    into v_receptor_id
    from public.comentarios_capitulos comentario
    where comentario.id = p_comentario_id
      and comentario.capitulo_id = p_capitulo_id
    limit 1;

    if v_receptor_id is null then
      return 0;
    end if;

    if not exists (
      select 1
      from public.comentarios_capitulos_curtidas curtida
      where curtida.comentario_id = p_comentario_id
        and curtida.usuario_id = v_ator_id
      limit 1
    ) then
      return 0;
    end if;
  end if;

  if v_receptor_id = v_ator_id then
    return 0;
  end if;

  if to_regprocedure(
    'public.obter_nome_usuario_notificacao(uuid)'
  ) is not null then
    begin
      execute
        'select public.obter_nome_usuario_notificacao($1)'
      into v_nome_ator
      using v_ator_id;
    exception
      when others then
        v_nome_ator := 'Usuário';
    end;
  end if;

  v_nome_ator := left(
    regexp_replace(
      coalesce(nullif(btrim(v_nome_ator), ''), 'Usuário'),
      E'[\n\r\t]+',
      ' ',
      'g'
    ),
    80
  );

  v_link :=
    case
      when nullif(btrim(v_obra_slug), '') is not null
        and v_capitulo_ordem is not null
        and v_capitulo_ordem > 0
      then
        '/obra/' ||
        v_obra_slug ||
        '/capitulo/' ||
        v_capitulo_ordem::text
      when nullif(btrim(v_obra_slug), '') is not null
      then
        '/obra/' || v_obra_slug
      else
        '/notificacoes'
    end;

  if v_tipo = 'curtida-capitulo' then
    v_titulo := 'Curtiram seu capítulo';
    v_mensagem :=
      v_nome_ator ||
      ' curtiu' ||
      case
        when nullif(btrim(v_capitulo_titulo), '') is not null
        then
          ' "' ||
          left(btrim(v_capitulo_titulo), 120) ||
          '".'
        else
          ' um capítulo seu.'
      end;

    v_notificacao_chave :=
      'curtida-capitulo:' ||
      p_capitulo_id::text ||
      ':' ||
      v_ator_id::text;
  elsif v_tipo = 'comentario-capitulo' and v_eh_resposta then
    v_titulo := 'Nova resposta ao seu comentário';
    v_mensagem :=
      v_nome_ator ||
      ' respondeu ao seu comentário' ||
      case
        when nullif(btrim(v_capitulo_titulo), '') is not null
        then
          ' em "' ||
          left(btrim(v_capitulo_titulo), 120) ||
          '".'
        else
          ' em um capítulo.'
      end;

    v_notificacao_chave :=
      'resposta-comentario-capitulo:' ||
      p_comentario_id::text;
  elsif v_tipo = 'comentario-capitulo' then
    v_titulo := 'Novo comentário no capítulo';
    v_mensagem :=
      v_nome_ator ||
      ' comentou' ||
      case
        when nullif(btrim(v_capitulo_titulo), '') is not null
        then
          ' em "' ||
          left(btrim(v_capitulo_titulo), 120) ||
          '".'
        else
          ' em um capítulo seu.'
      end;

    v_notificacao_chave :=
      'comentario-capitulo:' ||
      p_comentario_id::text;
  else
    v_titulo := 'Curtiram seu comentário';
    v_mensagem :=
      v_nome_ator ||
      ' curtiu seu comentário em um capítulo.';

    v_notificacao_chave :=
      'curtida-comentario-capitulo:' ||
      p_comentario_id::text ||
      ':' ||
      v_ator_id::text;
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended(
      v_receptor_id::text || ':' || v_notificacao_chave,
      0
    )
  );

  select
    exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'notificacoes'
        and column_name = 'user_id'
    ),
    exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'notificacoes'
        and column_name = 'titulo'
    ),
    exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'notificacoes'
        and column_name = 'mensagem'
    ),
    exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'notificacoes'
        and column_name = 'tipo'
    ),
    exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'notificacoes'
        and column_name = 'obra_id'
    ),
    exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'notificacoes'
        and column_name = 'capitulo_id'
    ),
    exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'notificacoes'
        and column_name = 'lida'
    ),
    exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'notificacoes'
        and column_name = 'notificacao_id'
    ),
    coalesce((
      select coluna.udt_name
      from information_schema.columns coluna
      where coluna.table_schema = 'public'
        and coluna.table_name = 'notificacoes'
        and coluna.column_name = 'notificacao_id'
      limit 1
    ), ''),
    exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'notificacoes'
        and column_name = 'autor_id'
    ),
    exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'notificacoes'
        and column_name = 'link'
    ),
    exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'notificacoes'
        and column_name = 'href'
    ),
    exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'notificacoes'
        and column_name = 'metadata'
    ),
    coalesce((
      select coluna.udt_name
      from information_schema.columns coluna
      where coluna.table_schema = 'public'
        and coluna.table_name = 'notificacoes'
        and coluna.column_name = 'metadata'
      limit 1
    ), ''),
    exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'notificacoes'
        and column_name = 'criada_em'
    ),
    exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'notificacoes'
        and column_name = 'criado_em'
    ),
    exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'notificacoes'
        and column_name = 'created_at'
    ),
    exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'notificacoes'
        and column_name = 'atualizado_em'
    ),
    exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'notificacoes'
        and column_name = 'updated_at'
    )
  into
    v_tem_user_id,
    v_tem_titulo,
    v_tem_mensagem,
    v_tem_tipo,
    v_tem_obra_id,
    v_tem_capitulo_id,
    v_tem_lida,
    v_tem_notificacao_id,
    v_notificacao_id_tipo,
    v_tem_autor_id,
    v_tem_link,
    v_tem_href,
    v_tem_metadata,
    v_metadata_tipo,
    v_tem_criada_em,
    v_tem_criado_em,
    v_tem_created_at,
    v_tem_atualizado_em,
    v_tem_updated_at;

  if not (
    v_tem_user_id
    and v_tem_titulo
    and v_tem_mensagem
    and v_tem_tipo
  ) then
    return 0;
  end if;

  if v_tem_notificacao_id and v_notificacao_id_tipo = 'uuid' then
    v_notificacao_valor :=
      substr(md5(v_notificacao_chave), 1, 8) || '-' ||
      substr(md5(v_notificacao_chave), 9, 4) || '-' ||
      substr(md5(v_notificacao_chave), 13, 4) || '-' ||
      substr(md5(v_notificacao_chave), 17, 4) || '-' ||
      substr(md5(v_notificacao_chave), 21, 12);
  else
    v_notificacao_valor := v_notificacao_chave;
  end if;

  if v_tem_notificacao_id then
    execute
      'select exists (
         select 1
         from public.notificacoes
         where user_id::text = $1::text
           and notificacao_id::text = $2
       )'
    into v_ja_existe
    using v_receptor_id, v_notificacao_valor;
  elsif v_tem_metadata and v_metadata_tipo in ('json', 'jsonb') then
    execute
      'select exists (
         select 1
         from public.notificacoes
         where user_id::text = $1::text
           and metadata::jsonb ->> ''notificacao_id'' = $2
       )'
    into v_ja_existe
    using v_receptor_id, v_notificacao_chave;
  elsif v_tem_autor_id and v_tem_capitulo_id
    and v_tipo = 'curtida-capitulo'
  then
    execute
      'select exists (
         select 1
         from public.notificacoes
         where user_id::text = $1::text
           and tipo::text = $2
           and capitulo_id::text = $3::text
           and autor_id::text = $4::text
       )'
    into v_ja_existe
    using
      v_receptor_id,
      v_tipo,
      p_capitulo_id,
      v_ator_id;
  end if;

  if v_ja_existe then
    return 0;
  end if;

  v_colunas := array[
    'user_id',
    'titulo',
    'mensagem',
    'tipo'
  ];

  v_valores := array[
    '$1',
    '$4',
    '$5',
    '$6'
  ];

  if v_tem_obra_id then
    v_colunas := array_append(v_colunas, 'obra_id');
    v_valores := array_append(v_valores, '$2');
  end if;

  if v_tem_capitulo_id then
    v_colunas := array_append(v_colunas, 'capitulo_id');
    v_valores := array_append(v_valores, '$3');
  end if;

  if v_tem_lida then
    v_colunas := array_append(v_colunas, 'lida');
    v_valores := array_append(v_valores, 'false');
  end if;

  if v_tem_link then
    v_colunas := array_append(v_colunas, 'link');
    v_valores := array_append(v_valores, '$7');
  end if;

  if v_tem_href then
    v_colunas := array_append(v_colunas, 'href');
    v_valores := array_append(v_valores, '$7');
  end if;

  if v_tem_notificacao_id then
    v_colunas := array_append(v_colunas, 'notificacao_id');

    if v_notificacao_id_tipo = 'uuid' then
      v_valores := array_append(v_valores, '$8::uuid');
    else
      v_valores := array_append(v_valores, '$8');
    end if;
  end if;

  if v_tem_autor_id then
    v_colunas := array_append(v_colunas, 'autor_id');
    v_valores := array_append(v_valores, '$9');
  end if;

  if v_tem_metadata and v_metadata_tipo in ('json', 'jsonb') then
    v_colunas := array_append(v_colunas, 'metadata');

    if v_metadata_tipo = 'json' then
      v_valores := array_append(
        v_valores,
        'jsonb_build_object(
          ''origem'', ''criar_notificacao_interacao_capitulo'',
          ''ator_id'', $9::text,
          ''comentario_id'', $10::text,
          ''comentario_pai_id'', $11::text,
          ''resposta'', $12,
          ''notificacao_id'', $13
        )::json'
      );
    else
      v_valores := array_append(
        v_valores,
        'jsonb_build_object(
          ''origem'', ''criar_notificacao_interacao_capitulo'',
          ''ator_id'', $9::text,
          ''comentario_id'', $10::text,
          ''comentario_pai_id'', $11::text,
          ''resposta'', $12,
          ''notificacao_id'', $13
        )'
      );
    end if;
  end if;

  if v_tem_criada_em then
    v_colunas := array_append(v_colunas, 'criada_em');
    v_valores := array_append(v_valores, 'now()');
  end if;

  if v_tem_criado_em then
    v_colunas := array_append(v_colunas, 'criado_em');
    v_valores := array_append(v_valores, 'now()');
  end if;

  if v_tem_created_at then
    v_colunas := array_append(v_colunas, 'created_at');
    v_valores := array_append(v_valores, 'now()');
  end if;

  if v_tem_atualizado_em then
    v_colunas := array_append(v_colunas, 'atualizado_em');
    v_valores := array_append(v_valores, 'now()');
  end if;

  if v_tem_updated_at then
    v_colunas := array_append(v_colunas, 'updated_at');
    v_valores := array_append(v_valores, 'now()');
  end if;

  v_sql := format(
    'insert into public.notificacoes (%s) values (%s)',
    array_to_string(
      array(
        select format('%I', coluna)
        from unnest(v_colunas) as coluna
      ),
      ', '
    ),
    array_to_string(v_valores, ', ')
  );

  execute v_sql
  using
    v_receptor_id,
    v_obra_id,
    p_capitulo_id,
    v_titulo,
    v_mensagem,
    v_tipo,
    v_link,
    v_notificacao_valor,
    v_ator_id,
    p_comentario_id,
    v_comentario_pai_id,
    v_eh_resposta,
    v_notificacao_chave;

  return 1;
exception
  when unique_violation then
    return 0;
  when others then
    return 0;
end;
$_$;


ALTER FUNCTION "public"."criar_notificacao_interacao_capitulo"("p_capitulo_id" "uuid", "p_comentario_id" "uuid", "p_tipo" "text", "p_titulo" "text", "p_mensagem" "text", "p_link" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."criar_notificacao_social"("p_user_id" "uuid", "p_tipo" "text", "p_titulo" "text" DEFAULT NULL::"text", "p_mensagem" "text" DEFAULT NULL::"text", "p_link" "text" DEFAULT NULL::"text", "p_notificacao_id" "text" DEFAULT NULL::"text", "p_obra_id" "uuid" DEFAULT NULL::"uuid", "p_capitulo_id" "uuid" DEFAULT NULL::"uuid") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $_$
declare
  v_ator_id uuid := auth.uid();
  v_receptor_id uuid := p_user_id;
  v_tipo text := nullif(trim(coalesce(p_tipo, '')), '');

  -- Entrada usada apenas para identificar a interação real da Comunidade.
  -- Nunca é persistida como notificacao_id.
  v_notificacao_id_entrada text :=
    nullif(trim(coalesce(p_notificacao_id, '')), '');

  -- Conteúdo final sempre criado no servidor.
  v_titulo text := null;
  v_mensagem text := null;
  v_link text := null;
  v_notificacao_id text := null;
  v_nome_ator text := 'Usuário';

  v_post_id uuid := null;
  v_comentario_id uuid := null;
  v_partes text[];

  v_tem_obra_id boolean := false;
  v_tem_capitulo_id boolean := false;
  v_tem_link boolean := false;
  v_tem_href boolean := false;
  v_tem_lida boolean := false;
  v_tem_notificacao_id boolean := false;
  v_tem_autor_id boolean := false;
  v_tem_metadata boolean := false;
  v_tem_criada_em boolean := false;
  v_tem_criado_em boolean := false;
  v_tem_created_at boolean := false;
  v_tem_atualizado_em boolean := false;
  v_tem_updated_at boolean := false;

  v_tipo_notificacao_id text := null;
  v_tipo_metadata text := null;
  v_metadata jsonb;

  v_colunas text[] := array['user_id', 'titulo', 'mensagem', 'tipo'];
  v_valores text[] := array['$1', '$2', '$3', '$4'];
  v_sql text;
  v_sql_existe text;
  v_ja_existe boolean := false;
begin
  -- Mantém a assinatura antiga para não quebrar o frontend, mas estes
  -- parâmetros não são confiáveis e não participam do conteúdo salvo.
  perform p_titulo;
  perform p_mensagem;
  perform p_link;
  perform p_obra_id;
  perform p_capitulo_id;

  if v_ator_id is null
    or v_receptor_id is null
    or v_tipo is null
    or v_receptor_id = v_ator_id
    or to_regclass('public.notificacoes') is null
  then
    return 0;
  end if;

  if v_tipo not in (
    'seguir-usuario',
    'comunidade-curtida-post',
    'comunidade-comentario-post',
    'comunidade-curtida-comentario'
  ) then
    return 0;
  end if;

  -- Colunas obrigatórias da tabela notificacoes.
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'notificacoes'
      and column_name in ('user_id', 'titulo', 'mensagem', 'tipo')
    group by table_schema, table_name
    having count(*) = 4
  ) then
    return 0;
  end if;

  -- Nome público do ator. A função auxiliar é chamada dinamicamente para
  -- esta migration continuar segura mesmo em bancos antigos.
  if to_regprocedure(
    'public.obter_nome_usuario_notificacao(uuid)'
  ) is not null then
    begin
      execute
        'select public.obter_nome_usuario_notificacao($1)'
      into v_nome_ator
      using v_ator_id;
    exception
      when others then
        v_nome_ator := 'Usuário';
    end;
  end if;

  v_nome_ator := left(
    regexp_replace(
      coalesce(nullif(trim(v_nome_ator), ''), 'Usuário'),
      E'[\\n\\r\\t]+',
      ' ',
      'g'
    ),
    80
  );

  -- ==========================================================
  -- SEGUIR USUÁRIO
  -- ==========================================================
  if v_tipo = 'seguir-usuario' then
    if to_regclass('public.seguindo_usuarios') is null then
      return 0;
    end if;

    if not exists (
      select 1
      from public.seguindo_usuarios su
      where su.seguidor_id = v_ator_id
        and su.seguido_id = v_receptor_id
      limit 1
    ) then
      return 0;
    end if;

    v_notificacao_id :=
      'seguir-usuario:' ||
      v_ator_id::text ||
      ':' ||
      v_receptor_id::text;

    v_titulo := 'Novo seguidor';
    v_mensagem := v_nome_ator || ' começou a seguir você.';
    v_link :=
      '/perfil-autor?autorId=' ||
      v_ator_id::text ||
      '&userId=' ||
      v_ator_id::text;
  end if;

  -- ==========================================================
  -- CURTIDA EM POST DA COMUNIDADE
  -- Entrada antiga esperada:
  -- comunidade-curtida-post:{postId}:{atorId}
  -- ==========================================================
  if v_tipo = 'comunidade-curtida-post' then
    if to_regclass('public.comunidade_posts') is null
      or to_regclass('public.comunidade_curtidas') is null
      or v_notificacao_id_entrada is null
    then
      return 0;
    end if;

    v_partes := regexp_match(
      v_notificacao_id_entrada,
      '^comunidade-curtida-post:([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}):([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$'
    );

    if v_partes is null
      or array_length(v_partes, 1) <> 2
      or v_partes[2]::uuid <> v_ator_id
    then
      return 0;
    end if;

    v_post_id := v_partes[1]::uuid;

    select cp.autor_id
    into v_receptor_id
    from public.comunidade_posts cp
    where cp.id = v_post_id
    limit 1;

    if v_receptor_id is null
      or v_receptor_id <> p_user_id
      or v_receptor_id = v_ator_id
    then
      return 0;
    end if;

    if not exists (
      select 1
      from public.comunidade_curtidas cc
      where cc.post_id = v_post_id
        and cc.usuario_id = v_ator_id
      limit 1
    ) then
      return 0;
    end if;

    v_notificacao_id :=
      'comunidade-curtida-post:' ||
      v_post_id::text ||
      ':' ||
      v_ator_id::text;

    v_titulo := 'Nova curtida na Comunidade';
    v_mensagem := v_nome_ator || ' curtiu sua publicação.';
    v_link := '/comunidade?post=' || v_post_id::text;
  end if;

  -- ==========================================================
  -- COMENTÁRIO EM POST DA COMUNIDADE
  -- Entrada antiga esperada:
  -- comunidade-comentario-post:{postId}:{comentarioId}
  -- ==========================================================
  if v_tipo = 'comunidade-comentario-post' then
    if to_regclass('public.comunidade_posts') is null
      or to_regclass('public.comunidade_comentarios') is null
      or v_notificacao_id_entrada is null
    then
      return 0;
    end if;

    v_partes := regexp_match(
      v_notificacao_id_entrada,
      '^comunidade-comentario-post:([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}):([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$'
    );

    if v_partes is null or array_length(v_partes, 1) <> 2 then
      return 0;
    end if;

    v_post_id := v_partes[1]::uuid;
    v_comentario_id := v_partes[2]::uuid;

    select cp.autor_id
    into v_receptor_id
    from public.comunidade_posts cp
    join public.comunidade_comentarios comentario
      on comentario.post_id = cp.id
    where cp.id = v_post_id
      and comentario.id = v_comentario_id
      and comentario.autor_id = v_ator_id
    limit 1;

    if v_receptor_id is null
      or v_receptor_id <> p_user_id
      or v_receptor_id = v_ator_id
    then
      return 0;
    end if;

    v_notificacao_id :=
      'comunidade-comentario-post:' ||
      v_post_id::text ||
      ':' ||
      v_comentario_id::text;

    v_titulo := 'Novo comentário na Comunidade';
    v_mensagem := v_nome_ator || ' comentou na sua publicação.';
    v_link := '/comunidade?post=' || v_post_id::text;
  end if;

  -- ==========================================================
  -- CURTIDA EM COMENTÁRIO DA COMUNIDADE
  -- Entrada antiga esperada:
  -- comunidade-curtida-comentario:{comentarioId}:{atorId}
  -- ==========================================================
  if v_tipo = 'comunidade-curtida-comentario' then
    if to_regclass('public.comunidade_comentarios') is null
      or to_regclass('public.comunidade_comentario_curtidas') is null
      or v_notificacao_id_entrada is null
    then
      return 0;
    end if;

    v_partes := regexp_match(
      v_notificacao_id_entrada,
      '^comunidade-curtida-comentario:([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}):([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$'
    );

    if v_partes is null
      or array_length(v_partes, 1) <> 2
      or v_partes[2]::uuid <> v_ator_id
    then
      return 0;
    end if;

    v_comentario_id := v_partes[1]::uuid;

    select comentario.autor_id, comentario.post_id
    into v_receptor_id, v_post_id
    from public.comunidade_comentarios comentario
    where comentario.id = v_comentario_id
    limit 1;

    if v_receptor_id is null
      or v_receptor_id <> p_user_id
      or v_receptor_id = v_ator_id
      or v_post_id is null
    then
      return 0;
    end if;

    if not exists (
      select 1
      from public.comunidade_comentario_curtidas curtida
      where curtida.comentario_id = v_comentario_id
        and curtida.usuario_id = v_ator_id
      limit 1
    ) then
      return 0;
    end if;

    v_notificacao_id :=
      'comunidade-curtida-comentario:' ||
      v_comentario_id::text ||
      ':' ||
      v_ator_id::text;

    v_titulo := 'Nova curtida no seu comentário';
    v_mensagem :=
      v_nome_ator ||
      ' curtiu seu comentário na Comunidade.';
    v_link := '/comunidade?post=' || v_post_id::text;
  end if;

  if v_receptor_id is null
    or v_receptor_id = v_ator_id
    or v_notificacao_id is null
    or v_titulo is null
    or v_mensagem is null
    or v_link is null
  then
    return 0;
  end if;

  -- Detecta as colunas opcionais existentes.
  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'notificacoes'
      and column_name = 'obra_id'
  ) into v_tem_obra_id;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'notificacoes'
      and column_name = 'capitulo_id'
  ) into v_tem_capitulo_id;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'notificacoes'
      and column_name = 'link'
  ) into v_tem_link;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'notificacoes'
      and column_name = 'href'
  ) into v_tem_href;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'notificacoes'
      and column_name = 'lida'
  ) into v_tem_lida;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'notificacoes'
      and column_name = 'notificacao_id'
  ) into v_tem_notificacao_id;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'notificacoes'
      and column_name = 'autor_id'
  ) into v_tem_autor_id;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'notificacoes'
      and column_name = 'metadata'
  ) into v_tem_metadata;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'notificacoes'
      and column_name = 'criada_em'
  ) into v_tem_criada_em;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'notificacoes'
      and column_name = 'criado_em'
  ) into v_tem_criado_em;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'notificacoes'
      and column_name = 'created_at'
  ) into v_tem_created_at;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'notificacoes'
      and column_name = 'atualizado_em'
  ) into v_tem_atualizado_em;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'notificacoes'
      and column_name = 'updated_at'
  ) into v_tem_updated_at;

  if v_tem_notificacao_id then
    select udt_name
    into v_tipo_notificacao_id
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'notificacoes'
      and column_name = 'notificacao_id'
    limit 1;
  end if;

  if v_tem_metadata then
    select udt_name
    into v_tipo_metadata
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'notificacoes'
      and column_name = 'metadata'
    limit 1;
  end if;

  if v_tem_metadata
    and v_tipo_metadata not in ('json', 'jsonb', 'text', 'varchar', 'bpchar')
  then
    v_tem_metadata := false;
  end if;

  v_metadata := jsonb_build_object(
    'origem', 'criar_notificacao_social',
    'ator_id', v_ator_id,
    'notificacao_id', v_notificacao_id,
    'tipo', v_tipo
  );

  -- Serializa chamadas do mesmo evento para impedir duplicidade em corrida.
  perform pg_advisory_xact_lock(
    hashtextextended(
      v_receptor_id::text || ':' || v_notificacao_id,
      0
    )
  );

  if v_tem_notificacao_id then
    if v_tipo_notificacao_id = 'uuid' then
      execute '
        select exists (
          select 1
          from public.notificacoes
          where user_id::text = $1::text
            and notificacao_id = (
              substr(md5($2), 1, 8) || ''-'' ||
              substr(md5($2), 9, 4) || ''-'' ||
              substr(md5($2), 13, 4) || ''-'' ||
              substr(md5($2), 17, 4) || ''-'' ||
              substr(md5($2), 21, 12)
            )::uuid
          limit 1
        )
      '
      into v_ja_existe
      using v_receptor_id, v_notificacao_id;
    else
      execute '
        select exists (
          select 1
          from public.notificacoes
          where user_id::text = $1::text
            and notificacao_id::text = $2
          limit 1
        )
      '
      into v_ja_existe
      using v_receptor_id, v_notificacao_id;
    end if;
  elsif v_tem_metadata then
    if v_tipo_metadata in ('json', 'jsonb') then
      execute '
        select exists (
          select 1
          from public.notificacoes
          where user_id::text = $1::text
            and metadata::jsonb ->> ''notificacao_id'' = $2
          limit 1
        )
      '
      into v_ja_existe
      using v_receptor_id, v_notificacao_id;
    else
      execute '
        select exists (
          select 1
          from public.notificacoes
          where user_id::text = $1::text
            and metadata::text = $2
          limit 1
        )
      '
      into v_ja_existe
      using v_receptor_id, v_metadata::text;
    end if;
  else
    v_sql_existe :=
      'select exists (' ||
      'select 1 from public.notificacoes ' ||
      'where user_id::text = $1::text and tipo = $2';

    if v_tem_autor_id then
      v_sql_existe := v_sql_existe || ' and autor_id::text = $3::text';
    end if;

    if v_tem_link then
      v_sql_existe := v_sql_existe || ' and link::text = $4';
    elsif v_tem_href then
      v_sql_existe := v_sql_existe || ' and href::text = $4';
    end if;

    v_sql_existe := v_sql_existe || ' limit 1)';

    execute v_sql_existe
    into v_ja_existe
    using v_receptor_id, v_tipo, v_ator_id, v_link;
  end if;

  if v_ja_existe then
    return 0;
  end if;

  -- Notificações sociais nunca recebem obra_id/capitulo_id do cliente.
  if v_tem_obra_id then
    v_colunas := array_append(v_colunas, 'obra_id');
    v_valores := array_append(v_valores, 'null');
  end if;

  if v_tem_capitulo_id then
    v_colunas := array_append(v_colunas, 'capitulo_id');
    v_valores := array_append(v_valores, 'null');
  end if;

  if v_tem_link then
    v_colunas := array_append(v_colunas, 'link');
    v_valores := array_append(v_valores, '$5');
  end if;

  if v_tem_href then
    v_colunas := array_append(v_colunas, 'href');
    v_valores := array_append(v_valores, '$5');
  end if;

  if v_tem_lida then
    v_colunas := array_append(v_colunas, 'lida');
    v_valores := array_append(v_valores, 'false');
  end if;

  if v_tem_notificacao_id then
    v_colunas := array_append(v_colunas, 'notificacao_id');

    if v_tipo_notificacao_id = 'uuid' then
      v_valores := array_append(
        v_valores,
        '(substr(md5($6), 1, 8) || ''-'' || ' ||
        'substr(md5($6), 9, 4) || ''-'' || ' ||
        'substr(md5($6), 13, 4) || ''-'' || ' ||
        'substr(md5($6), 17, 4) || ''-'' || ' ||
        'substr(md5($6), 21, 12))::uuid'
      );
    else
      v_valores := array_append(v_valores, '$6');
    end if;
  end if;

  if v_tem_autor_id then
    v_colunas := array_append(v_colunas, 'autor_id');
    v_valores := array_append(v_valores, '$7');
  end if;

  if v_tem_metadata then
    v_colunas := array_append(v_colunas, 'metadata');

    if v_tipo_metadata = 'json' then
      v_valores := array_append(v_valores, '$8::jsonb::json');
    elsif v_tipo_metadata = 'jsonb' then
      v_valores := array_append(v_valores, '$8::jsonb');
    else
      v_valores := array_append(v_valores, '$8::text');
    end if;
  end if;

  if v_tem_criada_em then
    v_colunas := array_append(v_colunas, 'criada_em');
    v_valores := array_append(v_valores, 'now()');
  end if;

  if v_tem_criado_em then
    v_colunas := array_append(v_colunas, 'criado_em');
    v_valores := array_append(v_valores, 'now()');
  end if;

  if v_tem_created_at then
    v_colunas := array_append(v_colunas, 'created_at');
    v_valores := array_append(v_valores, 'now()');
  end if;

  if v_tem_atualizado_em then
    v_colunas := array_append(v_colunas, 'atualizado_em');
    v_valores := array_append(v_valores, 'now()');
  end if;

  if v_tem_updated_at then
    v_colunas := array_append(v_colunas, 'updated_at');
    v_valores := array_append(v_valores, 'now()');
  end if;

  v_sql := format(
    'insert into public.notificacoes (%s) values (%s)',
    array_to_string(
      array(
        select format('%I', coluna)
        from unnest(v_colunas) as coluna
      ),
      ', '
    ),
    array_to_string(v_valores, ', ')
  );

  execute v_sql
  using
    v_receptor_id,
    v_titulo,
    v_mensagem,
    v_tipo,
    v_link,
    v_notificacao_id,
    v_ator_id,
    v_metadata;

  return 1;
exception
  when others then
    return 0;
end;
$_$;


ALTER FUNCTION "public"."criar_notificacao_social"("p_user_id" "uuid", "p_tipo" "text", "p_titulo" "text", "p_mensagem" "text", "p_link" "text", "p_notificacao_id" "text", "p_obra_id" "uuid", "p_capitulo_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."criar_notificacoes_capitulo"("p_obra_id" "uuid", "p_capitulo_id" "uuid", "p_titulo" "text", "p_mensagem" "text", "p_href" "text", "p_tipo" "text" DEFAULT 'novo-capitulo'::"text", "p_criado_em" timestamp with time zone DEFAULT "now"()) RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public', 'pg_temp'
    AS $_$
declare
  v_autor_id uuid := auth.uid();
  v_obra record;
  v_capitulo record;
  v_total integer := 0;

  v_tipo_entrada text :=
    lower(nullif(btrim(coalesce(p_tipo, '')), ''));
  v_tipo text := 'novo-capitulo';
  v_titulo text := 'Novo capítulo publicado';
  v_mensagem text;
  v_href text;
  v_criado_em timestamptz;
  v_notificacao_base text;
  v_metadata jsonb;

  v_colunas text[] :=
    array['user_id', 'tipo', 'titulo', 'mensagem'];
  v_valores text[] :=
    array[
      'preparados.receptor_id',
      '$2',
      '$3',
      '$4'
    ];

  v_receptores_partes text[] := array[]::text[];
  v_receptores_sql text;
  v_where_duplicada text :=
    'n.user_id::text = preparados.receptor_id::text ' ||
    'and n.tipo::text = $2';
  v_notificacao_expressao text;
  v_sql text;

  v_tem_user_id boolean := false;
  v_tem_tipo boolean := false;
  v_tem_titulo boolean := false;
  v_tem_mensagem boolean := false;
  v_tem_obra_id boolean := false;
  v_tem_capitulo_id boolean := false;
  v_tem_href boolean := false;
  v_tem_link boolean := false;
  v_tem_lida boolean := false;
  v_tem_notificacao_id boolean := false;
  v_tem_autor_id boolean := false;
  v_tem_metadata boolean := false;
  v_tem_criada_em boolean := false;
  v_tem_criado_em boolean := false;
  v_tem_created_at boolean := false;
  v_tem_atualizado_em boolean := false;
  v_tem_updated_at boolean := false;

  v_tipo_notificacao_id text := '';
  v_tipo_metadata text := '';
begin
  -- Mantém a assinatura usada pelo frontend, mas não confia nestes valores.
  perform p_titulo, p_mensagem, p_href, p_criado_em;

  if v_autor_id is null
    or p_obra_id is null
    or p_capitulo_id is null
    or v_tipo_entrada is distinct from 'novo-capitulo'
    or to_regclass('public.obras') is null
    or to_regclass('public.capitulos') is null
    or to_regclass('public.notificacoes') is null
  then
    return 0;
  end if;

  select
    obra.id,
    obra.user_id,
    obra.titulo,
    obra.autor,
    obra.slug,
    obra.publicado
  into v_obra
  from public.obras obra
  where obra.id = p_obra_id
  limit 1;

  if v_obra.id is null
    or v_obra.user_id is distinct from v_autor_id
    or coalesce(v_obra.publicado, false) = false
  then
    return 0;
  end if;

  select
    capitulo.id,
    capitulo.obra_id,
    capitulo.user_id,
    capitulo.titulo,
    capitulo.ordem,
    capitulo.publicado,
    capitulo.criado_em,
    capitulo.atualizado_em
  into v_capitulo
  from public.capitulos capitulo
  where capitulo.id = p_capitulo_id
    and capitulo.obra_id = p_obra_id
  limit 1;

  if v_capitulo.id is null
    or coalesce(v_capitulo.publicado, false) = false
    or (
      v_capitulo.user_id is not null
      and v_capitulo.user_id is distinct from v_autor_id
    )
  then
    return 0;
  end if;

  v_mensagem := left(
    coalesce(
      nullif(
        regexp_replace(
          btrim(coalesce(v_capitulo.titulo, '')),
          E'[\n\r\t]+',
          ' ',
          'g'
        ),
        ''
      ),
      'Um novo capítulo'
    ) ||
    ' foi adicionado em "' ||
    left(
      coalesce(
        nullif(
          regexp_replace(
            btrim(coalesce(v_obra.titulo, '')),
            E'[\n\r\t]+',
            ' ',
            'g'
          ),
          ''
        ),
        'uma obra'
      ),
      120
    ) ||
    '".',
    500
  );

  v_href :=
    case
      when nullif(btrim(coalesce(v_obra.slug, '')), '') is not null
        and v_capitulo.ordem is not null
        and v_capitulo.ordem > 0
      then
        '/obra/' ||
        btrim(v_obra.slug) ||
        '/capitulo/' ||
        v_capitulo.ordem::text
      when nullif(btrim(coalesce(v_obra.slug, '')), '') is not null
      then
        '/obra/' || btrim(v_obra.slug)
      else
        '/notificacoes'
    end;

  v_criado_em :=
    coalesce(v_capitulo.criado_em, now());

  v_notificacao_base :=
    'novo-capitulo:' || p_capitulo_id::text;

  v_metadata := jsonb_build_object(
    'origem', 'criar_notificacoes_capitulo',
    'obra_id', p_obra_id,
    'obra_titulo', coalesce(v_obra.titulo, ''),
    'autor_id', v_autor_id,
    'autor', coalesce(v_obra.autor, ''),
    'capitulo_id', p_capitulo_id,
    'capitulo_titulo', coalesce(v_capitulo.titulo, ''),
    'numero_capitulo', v_capitulo.ordem,
    'notificacao_base', v_notificacao_base
  );

  -- Serializa chamadas do mesmo capítulo para evitar duplicidade concorrente.
  perform pg_advisory_xact_lock(
    hashtextextended(v_notificacao_base, 0)
  );

  select
    exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'notificacoes'
        and column_name = 'user_id'
    ),
    exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'notificacoes'
        and column_name = 'tipo'
    ),
    exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'notificacoes'
        and column_name = 'titulo'
    ),
    exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'notificacoes'
        and column_name = 'mensagem'
    ),
    exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'notificacoes'
        and column_name = 'obra_id'
    ),
    exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'notificacoes'
        and column_name = 'capitulo_id'
    ),
    exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'notificacoes'
        and column_name = 'href'
    ),
    exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'notificacoes'
        and column_name = 'link'
    ),
    exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'notificacoes'
        and column_name = 'lida'
    ),
    exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'notificacoes'
        and column_name = 'notificacao_id'
    ),
    coalesce((
      select coluna.udt_name
      from information_schema.columns coluna
      where coluna.table_schema = 'public'
        and coluna.table_name = 'notificacoes'
        and coluna.column_name = 'notificacao_id'
      limit 1
    ), ''),
    exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'notificacoes'
        and column_name = 'autor_id'
    ),
    exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'notificacoes'
        and column_name = 'metadata'
    ),
    coalesce((
      select coluna.udt_name
      from information_schema.columns coluna
      where coluna.table_schema = 'public'
        and coluna.table_name = 'notificacoes'
        and coluna.column_name = 'metadata'
      limit 1
    ), ''),
    exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'notificacoes'
        and column_name = 'criada_em'
    ),
    exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'notificacoes'
        and column_name = 'criado_em'
    ),
    exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'notificacoes'
        and column_name = 'created_at'
    ),
    exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'notificacoes'
        and column_name = 'atualizado_em'
    ),
    exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'notificacoes'
        and column_name = 'updated_at'
    )
  into
    v_tem_user_id,
    v_tem_tipo,
    v_tem_titulo,
    v_tem_mensagem,
    v_tem_obra_id,
    v_tem_capitulo_id,
    v_tem_href,
    v_tem_link,
    v_tem_lida,
    v_tem_notificacao_id,
    v_tipo_notificacao_id,
    v_tem_autor_id,
    v_tem_metadata,
    v_tipo_metadata,
    v_tem_criada_em,
    v_tem_criado_em,
    v_tem_created_at,
    v_tem_atualizado_em,
    v_tem_updated_at;

  if not (
    v_tem_user_id
    and v_tem_tipo
    and v_tem_titulo
    and v_tem_mensagem
  ) then
    return 0;
  end if;

  if v_tem_notificacao_id
    and v_tipo_notificacao_id not in (
      'uuid',
      'text',
      'varchar',
      'bpchar'
    )
  then
    v_tem_notificacao_id := false;
  end if;

  if v_tem_metadata
    and v_tipo_metadata not in (
      'json',
      'jsonb',
      'text',
      'varchar',
      'bpchar'
    )
  then
    v_tem_metadata := false;
  end if;

  if v_tem_obra_id then
    v_colunas := array_append(v_colunas, 'obra_id');
    v_valores := array_append(v_valores, '$5');
  end if;

  if v_tem_capitulo_id then
    v_colunas := array_append(v_colunas, 'capitulo_id');
    v_valores := array_append(v_valores, '$6');
  end if;

  if v_tem_href then
    v_colunas := array_append(v_colunas, 'href');
    v_valores := array_append(v_valores, '$7');
  end if;

  if v_tem_link then
    v_colunas := array_append(v_colunas, 'link');
    v_valores := array_append(v_valores, '$7');
  end if;

  if v_tem_lida then
    v_colunas := array_append(v_colunas, 'lida');
    v_valores := array_append(v_valores, 'false');
  end if;

  if v_tem_notificacao_id then
    v_notificacao_expressao :=
      case
        when v_tipo_notificacao_id = 'uuid'
        then
          '(' ||
          'substr(md5(preparados.notificacao_chave), 1, 8) || ''-'' || ' ||
          'substr(md5(preparados.notificacao_chave), 9, 4) || ''-'' || ' ||
          'substr(md5(preparados.notificacao_chave), 13, 4) || ''-'' || ' ||
          'substr(md5(preparados.notificacao_chave), 17, 4) || ''-'' || ' ||
          'substr(md5(preparados.notificacao_chave), 21, 12)' ||
          ')::uuid'
        else
          'preparados.notificacao_chave'
      end;

    v_colunas := array_append(v_colunas, 'notificacao_id');
    v_valores := array_append(
      v_valores,
      v_notificacao_expressao
    );

    v_where_duplicada :=
      v_where_duplicada ||
      ' and n.notificacao_id::text = (' ||
      v_notificacao_expressao ||
      ')::text';
  elsif v_tem_capitulo_id then
    v_where_duplicada :=
      v_where_duplicada ||
      ' and n.capitulo_id::text = $6::text';
  elsif v_tem_obra_id then
    v_where_duplicada :=
      v_where_duplicada ||
      ' and n.obra_id::text = $5::text';
  elsif v_tem_href then
    v_where_duplicada :=
      v_where_duplicada ||
      ' and n.href::text = $7';
  elsif v_tem_link then
    v_where_duplicada :=
      v_where_duplicada ||
      ' and n.link::text = $7';
  end if;

  if v_tem_autor_id then
    v_colunas := array_append(v_colunas, 'autor_id');
    v_valores := array_append(v_valores, '$1');
  end if;

  if v_tem_metadata then
    v_colunas := array_append(v_colunas, 'metadata');

    if v_tipo_metadata = 'json' then
      v_valores := array_append(
        v_valores,
        'jsonb_set(
          $8::jsonb,
          ''{notificacao_id}'',
          to_jsonb(preparados.notificacao_chave),
          true
        )::json'
      );
    elsif v_tipo_metadata = 'jsonb' then
      v_valores := array_append(
        v_valores,
        'jsonb_set(
          $8::jsonb,
          ''{notificacao_id}'',
          to_jsonb(preparados.notificacao_chave),
          true
        )'
      );
    else
      v_valores := array_append(
        v_valores,
        'jsonb_set(
          $8::jsonb,
          ''{notificacao_id}'',
          to_jsonb(preparados.notificacao_chave),
          true
        )::text'
      );
    end if;
  end if;

  if v_tem_criada_em then
    v_colunas := array_append(v_colunas, 'criada_em');
    v_valores := array_append(v_valores, '$9::timestamptz');
  end if;

  if v_tem_criado_em then
    v_colunas := array_append(v_colunas, 'criado_em');
    v_valores := array_append(v_valores, '$9::timestamptz');
  end if;

  if v_tem_created_at then
    v_colunas := array_append(v_colunas, 'created_at');
    v_valores := array_append(v_valores, '$9::timestamptz');
  end if;

  if v_tem_atualizado_em then
    v_colunas := array_append(v_colunas, 'atualizado_em');
    v_valores := array_append(v_valores, '$9::timestamptz');
  end if;

  if v_tem_updated_at then
    v_colunas := array_append(v_colunas, 'updated_at');
    v_valores := array_append(v_valores, '$9::timestamptz');
  end if;

  if to_regclass('public.seguindo_obras') is not null
    and exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'seguindo_obras'
        and column_name in ('obra_id', 'user_id')
      group by table_schema, table_name
      having count(*) = 2
    )
  then
    v_receptores_partes := array_append(
      v_receptores_partes,
      'select seguidor.user_id::uuid as receptor_id
       from public.seguindo_obras seguidor
       where seguidor.obra_id = $5'
    );
  end if;

  if to_regclass('public.favoritos') is not null
    and exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'favoritos'
        and column_name in ('obra_id', 'user_id')
      group by table_schema, table_name
      having count(*) = 2
    )
  then
    v_receptores_partes := array_append(
      v_receptores_partes,
      'select favorito.user_id::uuid as receptor_id
       from public.favoritos favorito
       where favorito.obra_id = $5'
    );
  end if;

  if to_regclass('public.seguindo_usuarios') is not null
    and exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'seguindo_usuarios'
        and column_name in ('seguidor_id', 'seguido_id')
      group by table_schema, table_name
      having count(*) = 2
    )
  then
    v_receptores_partes := array_append(
      v_receptores_partes,
      'select relacao.seguidor_id::uuid as receptor_id
       from public.seguindo_usuarios relacao
       where relacao.seguido_id = $1'
    );
  end if;

  if array_length(v_receptores_partes, 1) is null then
    return 0;
  end if;

  v_receptores_sql :=
    array_to_string(v_receptores_partes, ' union ');

  v_sql := format(
    'with receptores as (
       select distinct origem.receptor_id
       from (%s) origem
       where origem.receptor_id is not null
         and origem.receptor_id <> $1
     ),
     preparados as (
       select
         receptor_id,
         $10 || '':'' || receptor_id::text as notificacao_chave
       from receptores
     )
     insert into public.notificacoes (%s)
     select %s
     from preparados
     where not exists (
       select 1
       from public.notificacoes n
       where %s
     )
     on conflict do nothing',
    v_receptores_sql,
    array_to_string(
      array(
        select format('%I', coluna)
        from unnest(v_colunas) as coluna
      ),
      ', '
    ),
    array_to_string(v_valores, ', '),
    v_where_duplicada
  );

  execute v_sql
  using
    v_autor_id,
    v_tipo,
    v_titulo,
    v_mensagem,
    p_obra_id,
    p_capitulo_id,
    v_href,
    v_metadata,
    v_criado_em,
    v_notificacao_base;

  get diagnostics v_total = row_count;

  return v_total;
exception
  when others then
    raise warning
      'Não foi possível criar notificações do capítulo %: %',
      p_capitulo_id,
      sqlerrm;

    return 0;
end;
$_$;


ALTER FUNCTION "public"."criar_notificacoes_capitulo"("p_obra_id" "uuid", "p_capitulo_id" "uuid", "p_titulo" "text", "p_mensagem" "text", "p_href" "text", "p_tipo" "text", "p_criado_em" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."criar_problema_tecnico"("p_categoria" "text", "p_titulo" "text", "p_descricao" "text", "p_pagina_url" "text" DEFAULT ''::"text", "p_navegador" "text" DEFAULT ''::"text", "p_dispositivo" "text" DEFAULT ''::"text") RETURNS TABLE("problema_id" "uuid", "problema_status" "text", "problema_criado_em" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public', 'auth', 'pg_temp'
    AS $$
declare
  v_usuario_id uuid := auth.uid();
  v_email text := '';
  v_categoria text :=
    lower(btrim(coalesce(p_categoria, 'outro')));
  v_titulo text :=
    btrim(coalesce(p_titulo, ''));
  v_descricao text :=
    btrim(coalesce(p_descricao, ''));
  v_pagina_url text :=
    btrim(coalesce(p_pagina_url, ''));
  v_navegador text :=
    btrim(coalesce(p_navegador, ''));
  v_dispositivo text :=
    btrim(coalesce(p_dispositivo, ''));
  v_id uuid;
  v_status text;
  v_criado_em timestamptz;
begin
  if v_usuario_id is null then
    raise exception
      'Entre na sua conta para relatar um problema técnico.'
      using errcode = '42501';
  end if;

  select lower(btrim(coalesce(usuario.email, '')))
  into v_email
  from auth.users usuario
  where usuario.id = v_usuario_id;

  insert into public.problemas_tecnicos (
    user_id,
    email_contato,
    categoria,
    titulo,
    descricao,
    pagina_url,
    navegador,
    dispositivo
  )
  values (
    v_usuario_id,
    coalesce(v_email, ''),
    v_categoria,
    v_titulo,
    v_descricao,
    v_pagina_url,
    v_navegador,
    v_dispositivo
  )
  returning
    id,
    status,
    criado_em
  into
    v_id,
    v_status,
    v_criado_em;

  return query
  select
    v_id,
    v_status,
    v_criado_em;
end;
$$;


ALTER FUNCTION "public"."criar_problema_tecnico"("p_categoria" "text", "p_titulo" "text", "p_descricao" "text", "p_pagina_url" "text", "p_navegador" "text", "p_dispositivo" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."criar_problema_tecnico"("p_categoria" "text", "p_titulo" "text", "p_descricao" "text", "p_pagina_url" "text", "p_navegador" "text", "p_dispositivo" "text") IS 'Cria um chamado técnico autenticado, validado e limitado por frequência.';



CREATE OR REPLACE FUNCTION "public"."definir_fixacao_comunidade_post"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if tg_op = 'UPDATE' and new.fixado is distinct from old.fixado then
    if coalesce(new.fixado, false) = true then
      new.fixado_em := coalesce(new.fixado_em, now());
      new.fixado_por := coalesce(new.fixado_por, auth.uid());
    else
      new.fixado_em := null;
      new.fixado_por := null;
    end if;
  end if;

  return new;
end;
$$;


ALTER FUNCTION "public"."definir_fixacao_comunidade_post"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."deixar_de_seguir_usuario"("p_seguido_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
declare
  v_seguidor_id uuid := auth.uid();
begin
  if v_seguidor_id is null or p_seguido_id is null then
    return false;
  end if;

  delete from public.seguindo_usuarios relacao
  where relacao.seguidor_id = v_seguidor_id
    and relacao.seguido_id = p_seguido_id;

  delete from public.solicitacoes_seguidores solicitacao
  where solicitacao.solicitante_id = v_seguidor_id
    and solicitacao.destinatario_id = p_seguido_id;

  perform public.remover_notificacoes_seguimento(
    v_seguidor_id,
    p_seguido_id,
    true
  );

  return true;
end;
$$;


ALTER FUNCTION "public"."deixar_de_seguir_usuario"("p_seguido_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."desbloquear_usuario"("p_bloqueado_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public', 'auth', 'pg_temp'
    AS $$
declare
  v_bloqueador_id uuid := auth.uid();
begin
  if v_bloqueador_id is null then
    raise exception 'Entre na sua conta para desbloquear este usuário.'
      using errcode = '42501';
  end if;

  if p_bloqueado_id is null then
    raise exception 'Usuário inválido.'
      using errcode = '22023';
  end if;

  delete from public.usuarios_bloqueados bloqueio
  where bloqueio.bloqueador_id = v_bloqueador_id
    and bloqueio.bloqueado_id = p_bloqueado_id;

  return true;
end;
$$;


ALTER FUNCTION "public"."desbloquear_usuario"("p_bloqueado_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."diario_pode_avaliar"("p_diario_user_id" "uuid", "p_avaliador_id" "uuid" DEFAULT "auth"."uid"()) RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public', 'auth', 'pg_temp'
    AS $$
  select
    p_diario_user_id is not null
    and p_avaliador_id is not null
    and p_diario_user_id <> p_avaliador_id
    and p_avaliador_id = auth.uid()
    and exists (
      select 1
      from auth.users usuario
      where usuario.id = p_diario_user_id
    )
    and public.diario_usuarios_sem_bloqueio(
      p_avaliador_id,
      p_diario_user_id
    )
    and public.usuario_pode_ver_aba_perfil(
      p_diario_user_id,
      coalesce(
        (
          select preferencias.visibilidade_diario
          from public.preferencias_privacidade preferencias
          where preferencias.user_id = p_diario_user_id
        ),
        'publico'
      )
    )
    and coalesce(
      (
        select preferencias.permitir_avaliacao_diario
        from public.preferencias_privacidade preferencias
        where preferencias.user_id = p_diario_user_id
      ),
      true
    )
    and case coalesce(
      (
        select preferencias.quem_pode_avaliar_diario
        from public.preferencias_privacidade preferencias
        where preferencias.user_id = p_diario_user_id
      ),
      'todos'
    )
      when 'todos' then true
      when 'seguidores' then public.diario_usuario_e_seguidor(
        p_avaliador_id,
        p_diario_user_id
      )
      else false
    end
    and exists (
      select 1
      from public.diario_anotacoes anotacao
      where anotacao.user_id = p_diario_user_id
        and public.diario_pode_ver_anotacao(anotacao.id)
    );
$$;


ALTER FUNCTION "public"."diario_pode_avaliar"("p_diario_user_id" "uuid", "p_avaliador_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."diario_pode_comentar"("p_anotacao_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public', 'auth', 'pg_temp'
    AS $$
  select coalesce(
    (
      select
        auth.uid() is not null
        and public.diario_pode_ver_comentarios(anotacao.id)
        and public.diario_sem_bloqueio_com_usuario_atual(
          anotacao.user_id
        )
        and (
          anotacao.user_id = auth.uid()
          or case
            when coalesce(
              anotacao.quem_pode_comentar,
              'herdar'
            ) = 'herdar'
              then case coalesce(
                preferencias.quem_pode_comentar_diario,
                'todos'
              )
                when 'todos' then true
                when 'seguidores' then public.diario_usuario_e_seguidor(
                  auth.uid(),
                  anotacao.user_id
                )
                else false
              end
            when anotacao.quem_pode_comentar = 'todos' then true
            when anotacao.quem_pode_comentar = 'seguidores'
              then public.diario_usuario_e_seguidor(
                auth.uid(),
                anotacao.user_id
              )
            else false
          end
        )
      from public.diario_anotacoes anotacao
      left join public.preferencias_privacidade preferencias
        on preferencias.user_id = anotacao.user_id
      where anotacao.id = p_anotacao_id
      limit 1
    ),
    false
  );
$$;


ALTER FUNCTION "public"."diario_pode_comentar"("p_anotacao_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."diario_pode_ver_anotacao"("p_anotacao_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public', 'auth', 'pg_temp'
    AS $$
  select coalesce(
    (
      select
        anotacao.user_id = auth.uid()
        or coalesce(public.usuario_e_admin(), false)
        or (
          public.diario_usuarios_sem_bloqueio(
            auth.uid(),
            anotacao.user_id
          )
          and public.usuario_pode_ver_aba_perfil(
            anotacao.user_id,
            coalesce(
              preferencias.visibilidade_diario,
              'publico'
            )
          )
          and case coalesce(anotacao.visibilidade, 'privado')
            when 'publico' then true
            when 'parcial' then public.diario_usuario_e_seguidor(
              auth.uid(),
              anotacao.user_id
            )
            else false
          end
        )
      from public.diario_anotacoes anotacao
      left join public.preferencias_privacidade preferencias
        on preferencias.user_id = anotacao.user_id
      where anotacao.id = p_anotacao_id
      limit 1
    ),
    false
  );
$$;


ALTER FUNCTION "public"."diario_pode_ver_anotacao"("p_anotacao_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."diario_pode_ver_comentarios"("p_anotacao_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public', 'auth', 'pg_temp'
    AS $$
  select coalesce(
    (
      select
        public.diario_pode_ver_anotacao(anotacao.id)
        and (
          anotacao.user_id = auth.uid()
          or coalesce(public.usuario_e_admin(), false)
          or case coalesce(
            anotacao.visibilidade_comentarios,
            'herdar'
          )
            when 'somente_eu' then false
            when 'seguidores' then public.diario_usuario_e_seguidor(
              auth.uid(),
              anotacao.user_id
            )
            else true
          end
        )
      from public.diario_anotacoes anotacao
      where anotacao.id = p_anotacao_id
      limit 1
    ),
    false
  );
$$;


ALTER FUNCTION "public"."diario_pode_ver_comentarios"("p_anotacao_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."diario_sem_bloqueio_com_usuario_atual"("p_outro_user_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public', 'auth', 'pg_temp'
    AS $$
  select public.diario_usuarios_sem_bloqueio(
    auth.uid(),
    p_outro_user_id
  );
$$;


ALTER FUNCTION "public"."diario_sem_bloqueio_com_usuario_atual"("p_outro_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."diario_usuario_e_seguidor"("p_seguidor_id" "uuid", "p_seguido_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public', 'auth', 'pg_temp'
    AS $$
  select
    p_seguidor_id is not null
    and p_seguido_id is not null
    and exists (
      select 1
      from public.seguindo_usuarios relacao
      where relacao.seguidor_id = p_seguidor_id
        and relacao.seguido_id = p_seguido_id
    );
$$;


ALTER FUNCTION "public"."diario_usuario_e_seguidor"("p_seguidor_id" "uuid", "p_seguido_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."diario_usuarios_sem_bloqueio"("p_usuario_a" "uuid", "p_usuario_b" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public', 'auth', 'pg_temp'
    AS $$
  select
    p_usuario_a is null
    or p_usuario_b is null
    or p_usuario_a = p_usuario_b
    or not exists (
      select 1
      from public.usuarios_bloqueados bloqueio
      where (
        bloqueio.bloqueador_id = p_usuario_a
        and bloqueio.bloqueado_id = p_usuario_b
      )
      or (
        bloqueio.bloqueador_id = p_usuario_b
        and bloqueio.bloqueado_id = p_usuario_a
      )
    );
$$;


ALTER FUNCTION "public"."diario_usuarios_sem_bloqueio"("p_usuario_a" "uuid", "p_usuario_b" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."evitar_notificacao_duplicada"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $_$
declare
  v_user_id text;
  v_notificacao_id text;
begin
  v_user_id := coalesce(new.user_id::text, '');
  v_notificacao_id := btrim(coalesce(new.notificacao_id::text, ''));

  if v_user_id = '' or v_notificacao_id = '' then
    return new;
  end if;

  -- Serializa inserções simultâneas do mesmo evento.
  perform pg_advisory_xact_lock(
    hashtextextended(v_user_id || ':' || v_notificacao_id, 0)
  );

  if exists (
    select 1
    from public.notificacoes notificacao
    where notificacao.user_id::text = v_user_id
      and btrim(notificacao.notificacao_id::text) = v_notificacao_id
  ) then
    -- Uma repetição volta a aparecer como nova, sem criar outra linha.
    if exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'notificacoes'
        and column_name = 'lida'
    ) then
      execute
        'update public.notificacoes
            set lida = false
          where user_id::text = $1
            and btrim(notificacao_id::text) = $2'
      using v_user_id, v_notificacao_id;
    end if;

    if exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'notificacoes'
        and column_name = 'atualizado_em'
    ) then
      execute
        'update public.notificacoes
            set atualizado_em = now()
          where user_id::text = $1
            and btrim(notificacao_id::text) = $2'
      using v_user_id, v_notificacao_id;
    elsif exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'notificacoes'
        and column_name = 'updated_at'
    ) then
      execute
        'update public.notificacoes
            set updated_at = now()
          where user_id::text = $1
            and btrim(notificacao_id::text) = $2'
      using v_user_id, v_notificacao_id;
    elsif exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'notificacoes'
        and column_name = 'criado_em'
    ) then
      execute
        'update public.notificacoes
            set criado_em = now()
          where user_id::text = $1
            and btrim(notificacao_id::text) = $2'
      using v_user_id, v_notificacao_id;
    elsif exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'notificacoes'
        and column_name = 'created_at'
    ) then
      execute
        'update public.notificacoes
            set created_at = now()
          where user_id::text = $1
            and btrim(notificacao_id::text) = $2'
      using v_user_id, v_notificacao_id;
    end if;

    return null;
  end if;

  return new;
end;
$_$;


ALTER FUNCTION "public"."evitar_notificacao_duplicada"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."excluir_notificacoes_lidas"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  total_excluidas integer := 0;
begin
  if auth.uid() is null then
    raise exception 'Usuário não autenticado.';
  end if;

  delete from public.notificacoes
  where user_id = auth.uid()
    and lida = true;

  get diagnostics total_excluidas = row_count;

  return total_excluidas;
end;
$$;


ALTER FUNCTION "public"."excluir_notificacoes_lidas"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."exigir_aceite_termos_antes_de_publicar"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
    AS $$
begin
  -- Operações administrativas/servidor sem JWT não são bloqueadas por este gatilho.
  if auth.uid() is null then
    return new;
  end if;

  if not public.usuario_aceitou_termos_publicacao(auth.uid()) then
    raise exception 'ACEITE_TERMOS_PUBLICACAO_OBRIGATORIO'
      using
        errcode = 'P0001',
        hint = 'Aceite os Termos de Uso e as Diretrizes da Comunidade antes de publicar.';
  end if;

  return new;
end;
$$;


ALTER FUNCTION "public"."exigir_aceite_termos_antes_de_publicar"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."historietas_nome_publico_usuario"("p_user_id" "uuid") RETURNS "text"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public', 'pg_temp'
    AS $_$
declare
  v_nome text;
  v_colunas_nome text[];
  v_predicados_usuario text[];
  v_sql text;
begin
  if p_user_id is null
    or to_regclass('public.profiles') is null
  then
    return 'Usuário';
  end if;

  select array_agg(
    format(
      'nullif(btrim(%I::text), '''')',
      coluna.column_name
    )
    order by array_position(
      array[
        'nome',
        'nome_usuario',
        'username',
        'apelido',
        'display_name',
        'nome_exibicao'
      ]::text[],
      coluna.column_name
    )
  )
  into v_colunas_nome
  from information_schema.columns coluna
  where coluna.table_schema = 'public'
    and coluna.table_name = 'profiles'
    and coluna.column_name = any(
      array[
        'nome',
        'nome_usuario',
        'username',
        'apelido',
        'display_name',
        'nome_exibicao'
      ]::text[]
    );

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'id'
  ) then
    v_predicados_usuario := array_append(
      v_predicados_usuario,
      'id::text = $1::text'
    );
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'user_id'
  ) then
    v_predicados_usuario := array_append(
      v_predicados_usuario,
      'user_id::text = $1::text'
    );
  end if;

  if array_length(v_colunas_nome, 1) is null
    or array_length(v_predicados_usuario, 1) is null
  then
    return 'Usuário';
  end if;

  v_sql := format(
    'select coalesce(%s, ''Usuário'')
       from public.profiles
      where (%s)
      limit 1',
    array_to_string(v_colunas_nome, ', '),
    array_to_string(v_predicados_usuario, ' or ')
  );

  execute v_sql
  into v_nome
  using p_user_id;

  return left(
    regexp_replace(
      coalesce(nullif(btrim(v_nome), ''), 'Usuário'),
      E'[\n\r\t]+',
      ' ',
      'g'
    ),
    80
  );
exception
  when others then
    return 'Usuário';
end;
$_$;


ALTER FUNCTION "public"."historietas_nome_publico_usuario"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."incrementar_visualizacao_capitulo"("capitulo_id_param" "uuid") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public', 'extensions'
    AS $$
declare
  v_total_visualizacoes integer := 0;
  v_linhas_inseridas integer := 0;
  v_usuario_id uuid := auth.uid();
  v_cabecalhos jsonb := '{}'::jsonb;
  v_ip_visitante text := null;
  v_user_agent text := null;
  v_chave_visitante text := null;
begin
  if capitulo_id_param is null then
    return 0;
  end if;

  select coalesce(c.visualizacoes, 0)
  into v_total_visualizacoes
  from public.capitulos as c
  inner join public.obras as o on o.id = c.obra_id
  where c.id = capitulo_id_param
    and coalesce(c.publicado, false) = true
    and coalesce(o.publicado, false) = true
  limit 1;

  if not found then
    return 0;
  end if;

  if v_usuario_id is not null then
    v_chave_visitante := 'usuario:' || v_usuario_id::text;
  else
    begin
      v_cabecalhos := coalesce(
        nullif(current_setting('request.headers', true), '')::jsonb,
        '{}'::jsonb
      );
    exception
      when others then
        v_cabecalhos := '{}'::jsonb;
    end;

    v_ip_visitante := nullif(
      trim(
        coalesce(
          v_cabecalhos ->> 'cf-connecting-ip',
          split_part(
            coalesce(v_cabecalhos ->> 'x-forwarded-for', ''),
            ',',
            1
          ),
          v_cabecalhos ->> 'x-real-ip',
          ''
        )
      ),
      ''
    );

    v_user_agent := nullif(
      trim(coalesce(v_cabecalhos ->> 'user-agent', '')),
      ''
    );

    if v_ip_visitante is null then
      return v_total_visualizacoes;
    end if;

    v_chave_visitante :=
      'anon:' ||
      encode(
        digest(
          v_ip_visitante || '|' || coalesce(v_user_agent, ''),
          'sha256'
        ),
        'hex'
      );
  end if;

  insert into public.capitulo_visualizacoes_unicas (
    capitulo_id,
    chave_visitante,
    dia
  )
  values (
    capitulo_id_param,
    v_chave_visitante,
    current_date
  )
  on conflict (capitulo_id, chave_visitante, dia) do nothing;

  get diagnostics v_linhas_inseridas = row_count;

  if v_linhas_inseridas = 0 then
    return v_total_visualizacoes;
  end if;

  update public.capitulos as c
  set visualizacoes = coalesce(c.visualizacoes, 0) + 1
  where c.id = capitulo_id_param
    and coalesce(c.publicado, false) = true
  returning coalesce(c.visualizacoes, 0)
  into v_total_visualizacoes;

  return coalesce(v_total_visualizacoes, 0);
end;
$$;


ALTER FUNCTION "public"."incrementar_visualizacao_capitulo"("capitulo_id_param" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."incrementar_visualizacao_obra"("obra_id_param" "uuid") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public', 'extensions'
    AS $$
declare
  v_total_visualizacoes integer := 0;
  v_linhas_inseridas integer := 0;
  v_usuario_id uuid := auth.uid();
  v_cabecalhos jsonb := '{}'::jsonb;
  v_ip_visitante text := null;
  v_user_agent text := null;
  v_chave_visitante text := null;
begin
  if obra_id_param is null then
    return 0;
  end if;

  select coalesce(o.visualizacoes, 0)
  into v_total_visualizacoes
  from public.obras as o
  where o.id = obra_id_param
    and coalesce(o.publicado, false) = true
  limit 1;

  if not found then
    return 0;
  end if;

  if v_usuario_id is not null then
    v_chave_visitante := 'usuario:' || v_usuario_id::text;
  else
    begin
      v_cabecalhos := coalesce(
        nullif(current_setting('request.headers', true), '')::jsonb,
        '{}'::jsonb
      );
    exception
      when others then
        v_cabecalhos := '{}'::jsonb;
    end;

    v_ip_visitante := nullif(
      trim(
        coalesce(
          v_cabecalhos ->> 'cf-connecting-ip',
          split_part(
            coalesce(v_cabecalhos ->> 'x-forwarded-for', ''),
            ',',
            1
          ),
          v_cabecalhos ->> 'x-real-ip',
          ''
        )
      ),
      ''
    );

    v_user_agent := nullif(
      trim(coalesce(v_cabecalhos ->> 'user-agent', '')),
      ''
    );

    if v_ip_visitante is null then
      return v_total_visualizacoes;
    end if;

    v_chave_visitante :=
      'anon:' ||
      encode(
        digest(
          v_ip_visitante || '|' || coalesce(v_user_agent, ''),
          'sha256'
        ),
        'hex'
      );
  end if;

  insert into public.obra_visualizacoes_unicas (
    obra_id,
    chave_visitante,
    dia
  )
  values (
    obra_id_param,
    v_chave_visitante,
    current_date
  )
  on conflict (obra_id, chave_visitante, dia) do nothing;

  get diagnostics v_linhas_inseridas = row_count;

  if v_linhas_inseridas = 0 then
    return v_total_visualizacoes;
  end if;

  update public.obras as o
  set visualizacoes = coalesce(o.visualizacoes, 0) + 1
  where o.id = obra_id_param
    and coalesce(o.publicado, false) = true
  returning coalesce(o.visualizacoes, 0)
  into v_total_visualizacoes;

  return coalesce(v_total_visualizacoes, 0);
end;
$$;


ALTER FUNCTION "public"."incrementar_visualizacao_obra"("obra_id_param" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."listar_meus_problemas_tecnicos"("p_limite" integer DEFAULT 30) RETURNS TABLE("problema_id" "uuid", "categoria" "text", "titulo" "text", "descricao" "text", "pagina_url" "text", "status" "text", "prioridade" "text", "observacao_admin" "text", "criado_em" timestamp with time zone, "atualizado_em" timestamp with time zone)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public', 'auth', 'pg_temp'
    AS $$
  select
    problema.id,
    problema.categoria,
    problema.titulo,
    problema.descricao,
    problema.pagina_url,
    problema.status,
    problema.prioridade,
    problema.observacao_admin,
    problema.criado_em,
    problema.atualizado_em
  from public.problemas_tecnicos problema
  where auth.uid() is not null
    and problema.user_id = auth.uid()
  order by problema.criado_em desc
  limit greatest(
    1,
    least(coalesce(p_limite, 30), 100)
  );
$$;


ALTER FUNCTION "public"."listar_meus_problemas_tecnicos"("p_limite" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."listar_meus_problemas_tecnicos"("p_limite" integer) IS 'Lista somente os chamados técnicos pertencentes ao usuário autenticado.';



CREATE OR REPLACE FUNCTION "public"."listar_minhas_denuncias"("p_limite" integer DEFAULT 80) RETURNS TABLE("denuncia_id" "uuid", "alvo_tipo" "text", "alvo_id" "uuid", "status" "text", "analisado_em" timestamp with time zone, "criado_em" timestamp with time zone, "atualizado_em" timestamp with time zone)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public', 'pg_temp'
    AS $$
  select
    denuncia.id as denuncia_id,
    denuncia.alvo_tipo,
    denuncia.alvo_id,
    denuncia.status,
    denuncia.analisado_em,
    denuncia.criado_em,
    denuncia.atualizado_em
  from public.comunidade_denuncias denuncia
  where auth.uid() is not null
    and denuncia.denunciante_id = auth.uid()
  order by denuncia.criado_em desc
  limit greatest(1, least(coalesce(p_limite, 80), 100));
$$;


ALTER FUNCTION "public"."listar_minhas_denuncias"("p_limite" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."listar_minhas_denuncias"("p_limite" integer) IS 'Retorna somente campos seguros e somente denúncias pertencentes ao usuário autenticado.';



CREATE OR REPLACE FUNCTION "public"."listar_usuarios_bloqueados"("p_limite" integer DEFAULT 100) RETURNS TABLE("user_id" "uuid", "nome" "text", "username" "text", "avatar_url" "text", "bloqueado_em" timestamp with time zone)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public', 'auth', 'pg_temp'
    AS $$
  select
    bloqueio.bloqueado_id as user_id,
    coalesce(
      nullif(btrim(perfil.nome), ''),
      'Usuário'
    )::text as nome,
    coalesce(
      nullif(btrim(perfil.username), ''),
      ''
    )::text as username,
    coalesce(
      nullif(btrim(perfil.avatar_url), ''),
      ''
    )::text as avatar_url,
    bloqueio.criado_em as bloqueado_em
  from public.usuarios_bloqueados bloqueio
  left join lateral (
    select
      perfil_linha.nome,
      perfil_linha.username,
      perfil_linha.avatar_url
    from public.profiles perfil_linha
    where perfil_linha.user_id = bloqueio.bloqueado_id
       or perfil_linha.id = bloqueio.bloqueado_id
    order by
      case
        when perfil_linha.user_id = bloqueio.bloqueado_id then 0
        else 1
      end
    limit 1
  ) perfil on true
  where auth.uid() is not null
    and bloqueio.bloqueador_id = auth.uid()
  order by bloqueio.criado_em desc
  limit greatest(1, least(coalesce(p_limite, 100), 200));
$$;


ALTER FUNCTION "public"."listar_usuarios_bloqueados"("p_limite" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."marcar_notificacoes_lidas"("notificacao_ids" "text"[] DEFAULT NULL::"text"[], "novo_estado" boolean DEFAULT true) RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $_$
declare
  total_afetadas integer := 0;
  tem_notificacao_id boolean := false;
  tem_updated_at boolean := false;
  tem_atualizado_em boolean := false;
  sql_update text;
begin
  if auth.uid() is null then
    raise exception 'Usuário não autenticado.';
  end if;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'notificacoes'
      and column_name = 'notificacao_id'
  ) into tem_notificacao_id;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'notificacoes'
      and column_name = 'updated_at'
  ) into tem_updated_at;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'notificacoes'
      and column_name = 'atualizado_em'
  ) into tem_atualizado_em;

  sql_update := 'update public.notificacoes set lida = $1';

  if tem_updated_at then
    sql_update := sql_update || ', updated_at = now()';
  end if;

  if tem_atualizado_em then
    sql_update := sql_update || ', atualizado_em = now()';
  end if;

  sql_update := sql_update || ' where user_id = auth.uid() and ($2 is null or cardinality($2) = 0 or id::text = any($2)';

  if tem_notificacao_id then
    sql_update := sql_update || ' or notificacao_id::text = any($2)';
  end if;

  sql_update := sql_update || ')';

  execute sql_update using novo_estado, notificacao_ids;

  get diagnostics total_afetadas = row_count;

  return total_afetadas;
end;
$_$;


ALTER FUNCTION "public"."marcar_notificacoes_lidas"("notificacao_ids" "text"[], "novo_estado" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notificar_comentario_obra"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public', 'pg_temp'
    AS $_$
declare
  v_obra record;
  v_comentario_pai record;
  v_nome_comentarista text := 'Usuário';
  v_slug text;
  v_titulo_obra text;
  v_href text;
begin
  if new.id is null
    or new.obra_id is null
    or new.user_id is null
  then
    return new;
  end if;

  select
    obra.id,
    obra.user_id,
    obra.titulo,
    obra.slug,
    obra.publicado
  into v_obra
  from public.obras obra
  where obra.id = new.obra_id
  limit 1;

  if v_obra.id is null
    or coalesce(v_obra.publicado, false) = false
  then
    return new;
  end if;

  if to_regprocedure(
    'public.obter_nome_usuario_notificacao(uuid)'
  ) is not null then
    begin
      execute
        'select public.obter_nome_usuario_notificacao($1)'
      into v_nome_comentarista
      using new.user_id;
    exception
      when others then
        v_nome_comentarista := 'Usuário';
    end;
  end if;

  v_nome_comentarista := left(
    regexp_replace(
      coalesce(nullif(btrim(v_nome_comentarista), ''), 'Usuário'),
      E'[\n\r\t]+',
      ' ',
      'g'
    ),
    80
  );

  v_slug := nullif(btrim(coalesce(v_obra.slug, '')), '');
  v_titulo_obra := nullif(btrim(coalesce(v_obra.titulo, '')), '');
  v_href :=
    '/obra/' ||
    coalesce(v_slug, v_obra.id::text);

  if new.comentario_pai_id is not null then
    select
      comentario.id,
      comentario.user_id
    into v_comentario_pai
    from public.comentarios_obras comentario
    where comentario.id = new.comentario_pai_id
      and comentario.obra_id = new.obra_id
    limit 1;

    if v_comentario_pai.id is null
      or v_comentario_pai.user_id is null
      or v_comentario_pai.user_id = new.user_id
    then
      return new;
    end if;

    if to_regprocedure(
      'public.criar_notificacao_comunidade_interna(uuid,uuid,text,text,text,text,text)'
    ) is null then
      return new;
    end if;

    perform public.criar_notificacao_comunidade_interna(
      v_comentario_pai.user_id,
      new.user_id,
      'comentario-obra',
      'Nova resposta ao seu comentário',
      v_nome_comentarista ||
        ' respondeu ao seu comentário em "' ||
        left(coalesce(v_titulo_obra, 'uma obra'), 90) ||
        '".',
      v_href,
      'resposta-comentario-obra:' || new.id::text
    );

    return new;
  end if;

  if v_obra.user_id is null
    or v_obra.user_id = new.user_id
  then
    return new;
  end if;

  if to_regprocedure(
    'public.criar_notificacao_comunidade_interna(uuid,uuid,text,text,text,text,text)'
  ) is null then
    return new;
  end if;

  perform public.criar_notificacao_comunidade_interna(
    v_obra.user_id,
    new.user_id,
    'comentario-obra',
    'Novo comentário na sua obra',
    v_nome_comentarista ||
      ' comentou em "' ||
      left(coalesce(v_titulo_obra, 'sua obra'), 90) ||
      '".',
    v_href,
    'comentario-obra:' || new.id::text
  );

  return new;
exception
  when others then
    raise warning
      'Não foi possível criar notificação do comentário da obra %: %',
      new.obra_id,
      sqlerrm;

    return new;
end;
$_$;


ALTER FUNCTION "public"."notificar_comentario_obra"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notificar_comentario_post_comunidade"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public', 'pg_temp'
    AS $_$
declare
  v_post record;
  v_comentario_pai record;
  v_nome text := 'Usuário';
begin
  if new.id is null
    or new.post_id is null
    or new.autor_id is null
  then
    return new;
  end if;

  if to_regclass('public.comunidade_posts') is null
    or to_regclass('public.comunidade_comentarios') is null
    or to_regprocedure(
      'public.criar_notificacao_comunidade_interna(uuid,uuid,text,text,text,text,text)'
    ) is null
  then
    return new;
  end if;

  select post.id, post.autor_id
  into v_post
  from public.comunidade_posts post
  where post.id = new.post_id
  limit 1;

  if v_post.id is null or v_post.autor_id is null then
    return new;
  end if;

  v_nome :=
    nullif(
      btrim(coalesce(to_jsonb(new) ->> 'autor_nome', '')),
      ''
    );

  if v_nome is null
    and to_regprocedure(
      'public.obter_nome_usuario_notificacao(uuid)'
    ) is not null
  then
    begin
      execute
        'select public.obter_nome_usuario_notificacao($1)'
      into v_nome
      using new.autor_id;
    exception
      when others then
        v_nome := null;
    end;
  end if;

  v_nome := left(
    regexp_replace(
      coalesce(nullif(btrim(v_nome), ''), 'Usuário'),
      E'[\n\r\t]+',
      ' ',
      'g'
    ),
    80
  );

  if new.comentario_pai_id is not null then
    select comentario.id, comentario.autor_id
    into v_comentario_pai
    from public.comunidade_comentarios comentario
    where comentario.id = new.comentario_pai_id
      and comentario.post_id = new.post_id
    limit 1;

    if v_comentario_pai.id is null
      or v_comentario_pai.autor_id is null
      or v_comentario_pai.autor_id = new.autor_id
    then
      return new;
    end if;

    perform public.criar_notificacao_comunidade_interna(
      v_comentario_pai.autor_id,
      new.autor_id,
      'comunidade-resposta-comentario',
      'Nova resposta ao seu comentário',
      v_nome || ' respondeu ao seu comentário na Comunidade.',
      '/comunidade?post=' || new.post_id::text,
      'comunidade-resposta-comentario:' || new.id::text
    );

    return new;
  end if;

  if v_post.autor_id = new.autor_id then
    return new;
  end if;

  perform public.criar_notificacao_comunidade_interna(
    v_post.autor_id,
    new.autor_id,
    'comunidade-comentario-post',
    'Novo comentário na Comunidade',
    v_nome || ' comentou na sua publicação.',
    '/comunidade?post=' || new.post_id::text,
    'comunidade-comentario-post:' ||
      new.post_id::text ||
      ':' ||
      new.id::text
  );

  return new;
exception
  when others then
    raise warning
      'Não foi possível criar notificação do comentário da Comunidade %: %',
      new.id,
      sqlerrm;

    return new;
end;
$_$;


ALTER FUNCTION "public"."notificar_comentario_post_comunidade"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notificar_curtida_comentario_comunidade"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public', 'pg_temp'
    AS $$
declare
  v_comentario record;
  v_nome text;
begin
  if new.comentario_id is null
    or new.usuario_id is null
    or to_regclass('public.comunidade_comentarios') is null
    or to_regprocedure(
      'public.criar_notificacao_comunidade_interna(uuid,uuid,text,text,text,text,text)'
    ) is null
  then
    return new;
  end if;

  select
    comentario.id,
    comentario.post_id,
    comentario.autor_id
  into v_comentario
  from public.comunidade_comentarios comentario
  where comentario.id = new.comentario_id
  limit 1;

  if v_comentario.id is null
    or v_comentario.post_id is null
    or v_comentario.autor_id is null
    or v_comentario.autor_id = new.usuario_id
  then
    return new;
  end if;

  v_nome :=
    public.obter_nome_usuario_notificacao(new.usuario_id);

  perform public.criar_notificacao_comunidade_interna(
    v_comentario.autor_id,
    new.usuario_id,
    'comunidade-curtida-comentario',
    'Nova curtida no seu comentário',
    v_nome || ' curtiu seu comentário na Comunidade.',
    '/comunidade?post=' || v_comentario.post_id::text,
    'comunidade-curtida-comentario:' ||
      new.comentario_id::text ||
      ':' ||
      new.usuario_id::text
  );

  return new;
exception
  when others then
    raise warning
      'Falha no trigger notificar_curtida_comentario_comunidade: %',
      sqlerrm;

    return new;
end;
$$;


ALTER FUNCTION "public"."notificar_curtida_comentario_comunidade"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notificar_curtida_obra"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public', 'pg_temp'
    AS $_$
declare
  v_obra record;
  v_nome_usuario text := 'Usuário';
  v_slug text;
  v_titulo_obra text;
  v_href text;
begin
  if new.obra_id is null or new.user_id is null then
    return new;
  end if;

  select
    obra.id,
    obra.user_id,
    obra.titulo,
    obra.slug,
    obra.publicado
  into v_obra
  from public.obras obra
  where obra.id = new.obra_id
  limit 1;

  if v_obra.id is null
    or v_obra.user_id is null
    or coalesce(v_obra.publicado, false) = false
    or v_obra.user_id = new.user_id
  then
    return new;
  end if;

  if to_regprocedure(
    'public.obter_nome_usuario_notificacao(uuid)'
  ) is not null then
    begin
      execute
        'select public.obter_nome_usuario_notificacao($1)'
      into v_nome_usuario
      using new.user_id;
    exception
      when others then
        v_nome_usuario := 'Usuário';
    end;
  end if;

  v_nome_usuario := left(
    regexp_replace(
      coalesce(
        nullif(btrim(v_nome_usuario), ''),
        'Usuário'
      ),
      E'[\n\r\t]+',
      ' ',
      'g'
    ),
    80
  );

  v_slug := nullif(btrim(coalesce(v_obra.slug, '')), '');
  v_titulo_obra := nullif(
    btrim(coalesce(v_obra.titulo, '')),
    ''
  );
  v_href :=
    '/obra/' ||
    coalesce(v_slug, v_obra.id::text);

  perform public.criar_notificacao_comunidade_interna(
    v_obra.user_id,
    new.user_id,
    'curtida-obra',
    'Nova curtida na sua obra',
    v_nome_usuario ||
      ' curtiu "' ||
      left(coalesce(v_titulo_obra, 'sua obra'), 90) ||
      '".',
    v_href,
    'curtida-obra:' ||
      new.obra_id::text ||
      ':' ||
      new.user_id::text
  );

  return new;
exception
  when others then
    raise warning
      'Não foi possível criar notificação da curtida da obra %: %',
      new.obra_id,
      sqlerrm;

    return new;
end;
$_$;


ALTER FUNCTION "public"."notificar_curtida_obra"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notificar_curtida_post_comunidade"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public', 'pg_temp'
    AS $$
declare
  v_post record;
  v_nome text;
begin
  if new.post_id is null
    or new.usuario_id is null
    or to_regclass('public.comunidade_posts') is null
    or to_regprocedure(
      'public.criar_notificacao_comunidade_interna(uuid,uuid,text,text,text,text,text)'
    ) is null
  then
    return new;
  end if;

  select post.id, post.autor_id
  into v_post
  from public.comunidade_posts post
  where post.id = new.post_id
  limit 1;

  if v_post.id is null
    or v_post.autor_id is null
    or v_post.autor_id = new.usuario_id
  then
    return new;
  end if;

  v_nome :=
    public.obter_nome_usuario_notificacao(new.usuario_id);

  perform public.criar_notificacao_comunidade_interna(
    v_post.autor_id,
    new.usuario_id,
    'comunidade-curtida-post',
    'Nova curtida na Comunidade',
    v_nome || ' curtiu sua publicação.',
    '/comunidade?post=' || new.post_id::text,
    'comunidade-curtida-post:' ||
      new.post_id::text ||
      ':' ||
      new.usuario_id::text
  );

  return new;
exception
  when others then
    raise warning
      'Falha no trigger notificar_curtida_post_comunidade: %',
      sqlerrm;

    return new;
end;
$$;


ALTER FUNCTION "public"."notificar_curtida_post_comunidade"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."obter_nome_usuario_notificacao"("p_user_id" "uuid") RETURNS "text"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public', 'pg_temp'
    AS $_$
declare
  v_nome text;
  v_coluna text;
  v_predicados_usuario text[] := array[]::text[];
  v_expressoes_nome text[] := array[]::text[];
  v_sql text;
begin
  if p_user_id is null
    or to_regclass('public.profiles') is null
  then
    return 'Usuário';
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'user_id'
  ) then
    v_predicados_usuario := array_append(
      v_predicados_usuario,
      'user_id::text = $1::text'
    );
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'id'
  ) then
    v_predicados_usuario := array_append(
      v_predicados_usuario,
      'id::text = $1::text'
    );
  end if;

  if array_length(v_predicados_usuario, 1) is null then
    return 'Usuário';
  end if;

  foreach v_coluna in array array[
    'nome',
    'nome_usuario',
    'username',
    'display_name',
    'nome_exibicao',
    'apelido'
  ]
  loop
    if exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'profiles'
        and column_name = v_coluna
    ) then
      v_expressoes_nome := array_append(
        v_expressoes_nome,
        format(
          'nullif(btrim(%I::text), '''')',
          v_coluna
        )
      );
    end if;
  end loop;

  if array_length(v_expressoes_nome, 1) is null then
    return 'Usuário';
  end if;

  v_sql := format(
    'select coalesce(%s, ''Usuário'')
       from public.profiles
      where (%s)
      limit 1',
    array_to_string(v_expressoes_nome, ', '),
    array_to_string(v_predicados_usuario, ' or ')
  );

  execute v_sql
  into v_nome
  using p_user_id;

  return left(
    regexp_replace(
      coalesce(nullif(btrim(v_nome), ''), 'Usuário'),
      E'[\n\r\t]+',
      ' ',
      'g'
    ),
    80
  );
exception
  when others then
    return 'Usuário';
end;
$_$;


ALTER FUNCTION "public"."obter_nome_usuario_notificacao"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."perfil_motivo_denuncia_valido"("p_motivo" "text") RETURNS boolean
    LANGUAGE "sql" IMMUTABLE
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
  select lower(btrim(coalesce(p_motivo, ''))) in (
    'conteudo_inadequado',
    'spam',
    'assedio',
    'odio_discriminacao',
    'ameaca_violencia',
    'conteudo_sexual',
    'risco_menor',
    'informacoes_pessoais',
    'fraude',
    'perfil_falso',
    'outro',

    -- Códigos legados
    'ofensivo',
    'improprio'
  );
$$;


ALTER FUNCTION "public"."perfil_motivo_denuncia_valido"("p_motivo" "text") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."operacoes_exclusao_conta" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "subject_user_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'solicitada'::"text" NOT NULL,
    "buckets_pendentes" "text"[] DEFAULT ARRAY['avatars'::"text", 'capas-obras'::"text", 'arquivos-obras'::"text"] NOT NULL,
    "buckets_concluidos" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "arquivos_removidos_por_bucket" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "tentativas_storage" integer DEFAULT 0 NOT NULL,
    "tentativas_auth" integer DEFAULT 0 NOT NULL,
    "ultimo_erro_codigo" "text",
    "ultimo_erro_mensagem" "text",
    "ultima_falha_em" timestamp with time zone,
    "lock_token" "uuid",
    "lock_expira_em" timestamp with time zone,
    "criada_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    "iniciada_em" timestamp with time zone,
    "atualizada_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    "storage_limpo_em" timestamp with time zone,
    "auth_excluido_em" timestamp with time zone,
    "concluida_em" timestamp with time zone,
    CONSTRAINT "operacoes_exclusao_conta_arquivos_removidos_check" CHECK (("jsonb_typeof"("arquivos_removidos_por_bucket") = 'object'::"text")),
    CONSTRAINT "operacoes_exclusao_conta_buckets_concluidos_check" CHECK (("buckets_concluidos" <@ ARRAY['avatars'::"text", 'capas-obras'::"text", 'arquivos-obras'::"text"])),
    CONSTRAINT "operacoes_exclusao_conta_buckets_pendentes_check" CHECK (("buckets_pendentes" <@ ARRAY['avatars'::"text", 'capas-obras'::"text", 'arquivos-obras'::"text"])),
    CONSTRAINT "operacoes_exclusao_conta_buckets_sem_conflito_check" CHECK ((NOT ("buckets_pendentes" && "buckets_concluidos"))),
    CONSTRAINT "operacoes_exclusao_conta_concluida_check" CHECK ((("status" <> 'concluida'::"text") OR (("auth_excluido_em" IS NOT NULL) AND ("concluida_em" IS NOT NULL)))),
    CONSTRAINT "operacoes_exclusao_conta_erro_codigo_check" CHECK ((("ultimo_erro_codigo" IS NULL) OR ("char_length"("ultimo_erro_codigo") <= 100))),
    CONSTRAINT "operacoes_exclusao_conta_erro_mensagem_check" CHECK ((("ultimo_erro_mensagem" IS NULL) OR ("char_length"("ultimo_erro_mensagem") <= 4000))),
    CONSTRAINT "operacoes_exclusao_conta_falhou_check" CHECK ((("status" <> 'falhou'::"text") OR (NULLIF("btrim"("ultimo_erro_mensagem"), ''::"text") IS NOT NULL))),
    CONSTRAINT "operacoes_exclusao_conta_lock_check" CHECK ((("lock_token" IS NULL) = ("lock_expira_em" IS NULL))),
    CONSTRAINT "operacoes_exclusao_conta_status_check" CHECK (("status" = ANY (ARRAY['solicitada'::"text", 'limpando_storage'::"text", 'storage_limpo'::"text", 'excluindo_auth'::"text", 'concluida'::"text", 'falhou'::"text"]))),
    CONSTRAINT "operacoes_exclusao_conta_storage_limpo_check" CHECK ((("status" <> ALL (ARRAY['storage_limpo'::"text", 'excluindo_auth'::"text", 'concluida'::"text"])) OR (("cardinality"("buckets_pendentes") = 0) AND ("storage_limpo_em" IS NOT NULL)))),
    CONSTRAINT "operacoes_exclusao_conta_tentativas_auth_check" CHECK (("tentativas_auth" >= 0)),
    CONSTRAINT "operacoes_exclusao_conta_tentativas_storage_check" CHECK (("tentativas_storage" >= 0))
);


ALTER TABLE "public"."operacoes_exclusao_conta" OWNER TO "postgres";


COMMENT ON TABLE "public"."operacoes_exclusao_conta" IS 'Registra e permite retomar exclusões de conta interrompidas. O UUID do usuário não possui FK para auth.users porque precisa sobreviver à exclusão do Auth.';



COMMENT ON COLUMN "public"."operacoes_exclusao_conta"."subject_user_id" IS 'UUID original do usuário. Intencionalmente sem foreign key para auth.users.';



COMMENT ON COLUMN "public"."operacoes_exclusao_conta"."lock_token" IS 'Token temporário usado para impedir processamento concorrente da mesma exclusão.';



CREATE OR REPLACE FUNCTION "public"."reivindicar_operacao_exclusao_conta"("p_subject_user_id" "uuid", "p_lock_token" "uuid", "p_lock_duracao_segundos" integer DEFAULT 180) RETURNS "public"."operacoes_exclusao_conta"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
declare
  operacao public.operacoes_exclusao_conta;
  duracao_segundos integer;
begin
  if p_subject_user_id is null then
    raise exception
      using
        errcode = '22023',
        message = 'O usuário da exclusão é obrigatório.';
  end if;

  if p_lock_token is null then
    raise exception
      using
        errcode = '22023',
        message = 'O token de processamento é obrigatório.';
  end if;

  duracao_segundos := greatest(
    30,
    least(
      coalesce(p_lock_duracao_segundos, 180),
      900
    )
  );

  insert into public.operacoes_exclusao_conta (
    subject_user_id
  )
  values (
    p_subject_user_id
  )
  on conflict (subject_user_id) do nothing;

  update public.operacoes_exclusao_conta
  set
    lock_token = p_lock_token,
    lock_expira_em =
      clock_timestamp()
      + make_interval(secs => duracao_segundos)
  where subject_user_id = p_subject_user_id
    and status <> 'concluida'
    and (
      lock_token is null
      or lock_expira_em is null
      or lock_expira_em <= clock_timestamp()
      or lock_token = p_lock_token
    )
  returning *
  into operacao;

  if not found then
    raise exception
      using
        errcode = '55P03',
        message = 'operacao_exclusao_em_andamento';
  end if;

  return operacao;
end;
$$;


ALTER FUNCTION "public"."reivindicar_operacao_exclusao_conta"("p_subject_user_id" "uuid", "p_lock_token" "uuid", "p_lock_duracao_segundos" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."reivindicar_operacao_exclusao_conta"("p_subject_user_id" "uuid", "p_lock_token" "uuid", "p_lock_duracao_segundos" integer) IS 'Cria ou recupera uma operação de exclusão e adquire uma trava temporária para impedir processamento concorrente. Disponível somente para service_role.';



CREATE OR REPLACE FUNCTION "public"."remover_avaliacao_diario"("p_diario_user_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public', 'auth', 'pg_temp'
    AS $$
declare
  v_avaliador_id uuid := auth.uid();
begin
  if v_avaliador_id is null then
    raise exception 'Entre na sua conta para remover sua avaliação.'
      using errcode = '42501';
  end if;

  delete from public.diario_avaliacoes avaliacao
  where avaliacao.diario_user_id = p_diario_user_id
    and avaliacao.avaliador_id = v_avaliador_id;

  return public.carregar_avaliacao_diario(p_diario_user_id);
end;
$$;


ALTER FUNCTION "public"."remover_avaliacao_diario"("p_diario_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."remover_conteudo_denunciado_transacional"("p_alvo_tipo" "text", "p_alvo_id" "uuid", "p_observacao_admin" "text" DEFAULT ''::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public', 'auth', 'pg_temp'
    AS $$
declare
  v_moderador_id uuid := auth.uid();
  v_tipo text := lower(btrim(coalesce(p_alvo_tipo, '')));
  v_observacao text := btrim(coalesce(p_observacao_admin, ''));
  v_conteudos_removidos integer := 0;
  v_denuncias_resolvidas integer := 0;
  v_analisado_em timestamptz := now();
begin
  if v_moderador_id is null
    or not coalesce(public.usuario_e_admin(), false)
  then
    raise exception
      'Somente administradores e moderadores podem remover conteúdo denunciado.'
      using errcode = '42501';
  end if;

  if p_alvo_id is null then
    raise exception
      'O conteúdo denunciado não possui um identificador válido.'
      using errcode = '22023';
  end if;

  if v_tipo not in (
    'post',
    'comentario',
    'comentario_capitulo',
    'obra',
    'capitulo',
    'comentario_obra',
    'diario_anotacao',
    'comentario_diario'
  ) then
    raise exception
      'Tipo de conteúdo denunciado inválido: %.',
      coalesce(nullif(v_tipo, ''), '(vazio)')
      using errcode = '22023';
  end if;

  if char_length(v_observacao) > 1200 then
    raise exception
      'A observação administrativa pode ter no máximo 1200 caracteres.'
      using errcode = '22001';
  end if;

  case v_tipo
    when 'post' then
      delete from public.comunidade_posts
      where id = p_alvo_id;

    when 'comentario' then
      delete from public.comunidade_comentarios
      where id = p_alvo_id;

    when 'comentario_capitulo' then
      delete from public.comentarios_capitulos
      where id = p_alvo_id;

    when 'obra' then
      delete from public.obras
      where id = p_alvo_id;

    when 'capitulo' then
      delete from public.capitulos
      where id = p_alvo_id;

    when 'comentario_obra' then
      delete from public.comentarios_obras
      where id = p_alvo_id;

    when 'diario_anotacao' then
      delete from public.diario_anotacoes
      where id = p_alvo_id;

    when 'comentario_diario' then
      delete from public.diario_anotacao_comentarios
      where id = p_alvo_id;
  end case;

  get diagnostics v_conteudos_removidos = row_count;

  if v_conteudos_removidos <> 1 then
    raise exception
      'O conteúdo não foi encontrado ou o banco recusou a remoção.'
      using errcode = 'P0002';
  end if;

  update public.comunidade_denuncias
  set
    status = 'resolvida',
    observacao_admin = v_observacao,
    analisado_por = v_moderador_id,
    analisado_em = v_analisado_em,
    atualizado_em = v_analisado_em
  where alvo_tipo = v_tipo
    and alvo_id::text = p_alvo_id::text;

  get diagnostics v_denuncias_resolvidas = row_count;

  if v_denuncias_resolvidas < 1 then
    raise exception
      'Nenhuma denúncia correspondente foi encontrada para resolução.'
      using errcode = 'P0002';
  end if;

  return jsonb_build_object(
    'alvo_tipo', v_tipo,
    'alvo_id', p_alvo_id,
    'conteudos_removidos', v_conteudos_removidos,
    'denuncias_resolvidas', v_denuncias_resolvidas,
    'analisado_por', v_moderador_id,
    'analisado_em', v_analisado_em
  );
end;
$$;


ALTER FUNCTION "public"."remover_conteudo_denunciado_transacional"("p_alvo_tipo" "text", "p_alvo_id" "uuid", "p_observacao_admin" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."remover_conteudo_denunciado_transacional"("p_alvo_tipo" "text", "p_alvo_id" "uuid", "p_observacao_admin" "text") IS 'Remove um conteúdo denunciado e resolve suas denúncias em uma única transação.';



CREATE OR REPLACE FUNCTION "public"."remover_notificacoes_seguimento"("p_solicitante_id" "uuid", "p_destinatario_id" "uuid", "p_incluir_novo_seguidor" boolean) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $_$
declare
  v_ids text[];
begin
  if p_solicitante_id is null or p_destinatario_id is null then
    return;
  end if;

  if to_regclass('public.notificacoes') is null then
    return;
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'notificacoes'
      and column_name = 'user_id'
  ) or not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'notificacoes'
      and column_name = 'notificacao_id'
  ) then
    return;
  end if;

  v_ids := array[
    format(
      'solicitacao-seguidor:%s:%s',
      p_solicitante_id,
      p_destinatario_id
    )
  ];

  if coalesce(p_incluir_novo_seguidor, false) then
    v_ids := v_ids || array[
      format(
        'seguir-usuario:%s:%s',
        p_solicitante_id,
        p_destinatario_id
      ),
      format(
        'novo-seguidor:%s:%s',
        p_solicitante_id,
        p_destinatario_id
      )
    ];
  end if;

  execute
    'delete from public.notificacoes
      where user_id::text = $1
        and notificacao_id::text = any($2)'
  using p_destinatario_id::text, v_ids;
end;
$_$;


ALTER FUNCTION "public"."remover_notificacoes_seguimento"("p_solicitante_id" "uuid", "p_destinatario_id" "uuid", "p_incluir_novo_seguidor" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."remover_seguidor"("p_seguidor_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
declare
  v_seguido_id uuid := auth.uid();
begin
  if v_seguido_id is null or p_seguidor_id is null then
    return false;
  end if;

  delete from public.seguindo_usuarios relacao
  where relacao.seguidor_id = p_seguidor_id
    and relacao.seguido_id = v_seguido_id;

  delete from public.solicitacoes_seguidores solicitacao
  where solicitacao.solicitante_id = p_seguidor_id
    and solicitacao.destinatario_id = v_seguido_id;

  perform public.remover_notificacoes_seguimento(
    p_seguidor_id,
    v_seguido_id,
    true
  );

  return true;
end;
$$;


ALTER FUNCTION "public"."remover_seguidor"("p_seguidor_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."responder_solicitacao_seguidor"("p_solicitacao_id" "uuid", "p_aceitar" boolean) RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public', 'auth', 'pg_temp'
    AS $$
declare
  v_destinatario_id uuid := auth.uid();
  v_solicitante_id uuid;
begin
  if v_destinatario_id is null then
    raise exception
      'É necessário entrar na conta para responder solicitações.'
      using errcode = '42501';
  end if;

  if p_solicitacao_id is null then
    return 'nao_encontrada';
  end if;

  select solicitacao.solicitante_id
  into v_solicitante_id
  from public.solicitacoes_seguidores solicitacao
  where solicitacao.id = p_solicitacao_id
    and solicitacao.destinatario_id = v_destinatario_id
  for update;

  if not found then
    return 'nao_encontrada';
  end if;

  if public.usuarios_possuem_bloqueio(
    v_solicitante_id,
    v_destinatario_id
  ) then
    delete from public.solicitacoes_seguidores solicitacao
    where solicitacao.id = p_solicitacao_id;

    return 'recusada';
  end if;

  if coalesce(p_aceitar, false) then
    insert into public.seguindo_usuarios (
      seguidor_id,
      seguido_id
    )
    values (
      v_solicitante_id,
      v_destinatario_id
    )
    on conflict do nothing;
  end if;

  delete from public.solicitacoes_seguidores solicitacao
  where solicitacao.id = p_solicitacao_id
    and solicitacao.destinatario_id = v_destinatario_id;

  return case
    when coalesce(p_aceitar, false) then 'aceita'
    else 'recusada'
  end;
end;
$$;


ALTER FUNCTION "public"."responder_solicitacao_seguidor"("p_solicitacao_id" "uuid", "p_aceitar" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rls_auto_enable"() RETURNS "event_trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog'
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."rls_auto_enable"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."salvar_avaliacao_diario"("p_diario_user_id" "uuid", "p_nota" numeric) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public', 'auth', 'pg_temp'
    AS $$
declare
  v_avaliador_id uuid := auth.uid();
  v_nota numeric(2,1);
begin
  if v_avaliador_id is null then
    raise exception 'Entre na sua conta para avaliar este Diário.'
      using errcode = '42501';
  end if;

  if p_diario_user_id is null then
    raise exception 'O perfil do Diário não foi informado.'
      using errcode = '22023';
  end if;

  if p_nota is null
    or p_nota < 0.5
    or p_nota > 5.0
    or p_nota * 2 <> trunc(p_nota * 2)
  then
    raise exception 'A nota precisa estar entre 0,5 e 5 estrelas.'
      using errcode = '22023';
  end if;

  if not public.diario_pode_avaliar(
    p_diario_user_id,
    v_avaliador_id
  ) then
    raise exception 'Você não pode avaliar este Diário.'
      using errcode = '42501';
  end if;

  v_nota := p_nota::numeric(2,1);

  insert into public.diario_avaliacoes (
    diario_user_id,
    avaliador_id,
    nota,
    criado_em,
    atualizado_em
  ) values (
    p_diario_user_id,
    v_avaliador_id,
    v_nota,
    now(),
    now()
  )
  on conflict (diario_user_id, avaliador_id)
  do update set
    nota = excluded.nota,
    atualizado_em = now();

  return public.carregar_avaliacao_diario(p_diario_user_id);
end;
$$;


ALTER FUNCTION "public"."salvar_avaliacao_diario"("p_diario_user_id" "uuid", "p_nota" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sincronizar_comunidade_salvos_user_id"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
begin
  if new.user_id is null and new.usuario_id is not null then
    new.user_id := new.usuario_id;
  end if;

  if new.usuario_id is null and new.user_id is not null then
    new.usuario_id := new.user_id;
  end if;

  return new;
end;
$$;


ALTER FUNCTION "public"."sincronizar_comunidade_salvos_user_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."solicitar_ou_seguir_usuario"("p_seguido_id" "uuid") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public', 'auth', 'pg_temp'
    AS $$
declare
  v_seguidor_id uuid := auth.uid();
  v_perfil_privado boolean := false;
  v_exige_aprovacao boolean := false;
begin
  if v_seguidor_id is null then
    raise exception 'É necessário entrar na conta para seguir usuários.'
      using errcode = '42501';
  end if;

  if p_seguido_id is null then
    raise exception 'Usuário inválido.'
      using errcode = '22023';
  end if;

  if v_seguidor_id = p_seguido_id then
    return 'proprio_perfil';
  end if;

  if not exists (
    select 1
    from auth.users usuario
    where usuario.id = p_seguido_id
  ) then
    raise exception 'Usuário não encontrado.'
      using errcode = 'P0002';
  end if;

  if public.usuarios_possuem_bloqueio(
    v_seguidor_id,
    p_seguido_id
  ) then
    raise exception
      'Não é possível seguir este perfil porque existe um bloqueio.'
      using errcode = '42501';
  end if;

  if exists (
    select 1
    from public.seguindo_usuarios relacao
    where relacao.seguidor_id = v_seguidor_id
      and relacao.seguido_id = p_seguido_id
  ) then
    delete from public.solicitacoes_seguidores solicitacao
    where solicitacao.solicitante_id = v_seguidor_id
      and solicitacao.destinatario_id = p_seguido_id;

    return 'seguindo';
  end if;

  select
    coalesce(preferencias.perfil_privado, false),
    coalesce(preferencias.aprovar_novos_seguidores, false)
  into
    v_perfil_privado,
    v_exige_aprovacao
  from public.preferencias_privacidade preferencias
  where preferencias.user_id = p_seguido_id;

  if not found then
    v_perfil_privado := false;
    v_exige_aprovacao := false;
  end if;

  if not v_perfil_privado or not v_exige_aprovacao then
    insert into public.seguindo_usuarios (
      seguidor_id,
      seguido_id
    )
    values (
      v_seguidor_id,
      p_seguido_id
    )
    on conflict do nothing;

    delete from public.solicitacoes_seguidores solicitacao
    where solicitacao.solicitante_id = v_seguidor_id
      and solicitacao.destinatario_id = p_seguido_id;

    return 'seguindo';
  end if;

  insert into public.solicitacoes_seguidores (
    solicitante_id,
    destinatario_id,
    criado_em,
    atualizado_em
  )
  values (
    v_seguidor_id,
    p_seguido_id,
    now(),
    now()
  )
  on conflict (solicitante_id, destinatario_id)
  do update set atualizado_em = excluded.atualizado_em;

  return 'solicitado';
end;
$$;


ALTER FUNCTION "public"."solicitar_ou_seguir_usuario"("p_seguido_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."status_aceite_termos_publicacao"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
    AS $$
  select
    auth.uid() is not null
    and public.usuario_aceitou_termos_publicacao(auth.uid());
$$;


ALTER FUNCTION "public"."status_aceite_termos_publicacao"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."suporte_usuario_e_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'pg_catalog'
    AS $$
  with contexto as (
    select
      auth.uid() as usuario_id,
      coalesce(
        auth.jwt() -> 'app_metadata',
        '{}'::jsonb
      ) as app_metadata
  )
  select
    usuario_id is not null
    and (
      lower(btrim(coalesce(app_metadata ->> 'role', '')))
        in ('admin', 'moderador', 'moderator')
      or lower(btrim(coalesce(app_metadata ->> 'cargo', '')))
        in ('admin', 'moderador', 'moderator')
      or lower(btrim(coalesce(app_metadata ->> 'tipo_usuario', '')))
        in ('admin', 'moderador', 'moderator')
      or lower(btrim(coalesce(app_metadata ->> 'admin', '')))
        in ('true', '1', 'sim', 'yes')
      or lower(btrim(coalesce(app_metadata ->> 'is_admin', '')))
        in ('true', '1', 'sim', 'yes')
      or lower(btrim(coalesce(app_metadata ->> 'moderator', '')))
        in ('true', '1', 'sim', 'yes')
      or exists (
        select 1
        from jsonb_array_elements_text(
          case
            when jsonb_typeof(app_metadata -> 'roles') = 'array'
              then app_metadata -> 'roles'
            else '[]'::jsonb
          end
        ) as papel(valor)
        where lower(btrim(papel.valor))
          in ('admin', 'moderador', 'moderator')
      )
    )
  from contexto;
$$;


ALTER FUNCTION "public"."suporte_usuario_e_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."usuario_aceitou_termos_publicacao"("p_user_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
    AS $$
  select exists (
    select 1
    from public.profiles perfil
    where (perfil.user_id = p_user_id or perfil.id = p_user_id)
      and perfil.termos_uso_versao = '2026-08-05'
      and perfil.termos_uso_aceitos_em is not null
      and perfil.diretrizes_comunidade_versao = '2026-08-05'
      and perfil.diretrizes_comunidade_aceitas_em is not null
      and perfil.politica_privacidade_versao = '2026-08-05'
      and perfil.politica_privacidade_ciente_em is not null
  );
$$;


ALTER FUNCTION "public"."usuario_aceitou_termos_publicacao"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."usuario_e_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select coalesce(
    lower(coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '')) in ('admin', 'moderador', 'moderator')
    or lower(coalesce(auth.jwt() -> 'app_metadata' ->> 'cargo', '')) in ('admin', 'moderador', 'moderator')
    or lower(coalesce(auth.jwt() -> 'app_metadata' ->> 'tipo_usuario', '')) in ('admin', 'moderador', 'moderator')
    or lower(coalesce(auth.jwt() -> 'app_metadata' ->> 'admin', '')) in ('true', '1', 'yes')
    or lower(coalesce(auth.jwt() -> 'app_metadata' ->> 'is_admin', '')) in ('true', '1', 'yes')
    or lower(coalesce(auth.jwt() -> 'app_metadata' ->> 'moderator', '')) in ('true', '1', 'yes')
    or coalesce(auth.jwt() -> 'app_metadata' -> 'roles', '[]'::jsonb) ?| array['admin', 'moderador', 'moderator'],
    false
  );
$$;


ALTER FUNCTION "public"."usuario_e_admin"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."usuario_e_admin"() IS 'Retorna true somente quando o usuário autenticado possui privilégio administrativo em app_metadata.';



CREATE OR REPLACE FUNCTION "public"."usuario_pode_ver_aba_perfil"("p_user_id" "uuid", "p_visibilidade" "text") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public', 'auth', 'pg_temp'
    AS $$
  select
    p_user_id is not null
    and p_visibilidade in (
      'publico',
      'seguidores',
      'seguindo',
      'somente_eu'
    )
    and (
      auth.uid() = p_user_id
      or (
        not public.usuarios_possuem_bloqueio(
          auth.uid(),
          p_user_id
        )
        and (
          p_visibilidade = 'publico'
          or (
            p_visibilidade = 'seguidores'
            and auth.uid() is not null
            and exists (
              select 1
              from public.seguindo_usuarios relacao
              where relacao.seguidor_id = auth.uid()
                and relacao.seguido_id = p_user_id
            )
          )
          or (
            p_visibilidade = 'seguindo'
            and auth.uid() is not null
            and exists (
              select 1
              from public.seguindo_usuarios relacao
              where relacao.seguidor_id = p_user_id
                and relacao.seguido_id = auth.uid()
            )
          )
        )
      )
    );
$$;


ALTER FUNCTION "public"."usuario_pode_ver_aba_perfil"("p_user_id" "uuid", "p_visibilidade" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."usuario_pode_ver_perfil"("p_user_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public', 'auth', 'pg_temp'
    AS $$
  select
    p_user_id is not null
    and (
      auth.uid() = p_user_id
      or (
        not public.usuarios_possuem_bloqueio(
          auth.uid(),
          p_user_id
        )
        and (
          not coalesce(
            (
              select preferencias.perfil_privado
              from public.preferencias_privacidade preferencias
              where preferencias.user_id = p_user_id
            ),
            false
          )
          or exists (
            select 1
            from public.seguindo_usuarios relacao
            where relacao.seguidor_id = auth.uid()
              and relacao.seguido_id = p_user_id
          )
        )
      )
    );
$$;


ALTER FUNCTION "public"."usuario_pode_ver_perfil"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."usuarios_possuem_bloqueio"("p_usuario_a" "uuid", "p_usuario_b" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public', 'auth', 'pg_temp'
    AS $$
  select
    p_usuario_a is not null
    and p_usuario_b is not null
    and p_usuario_a <> p_usuario_b
    and exists (
      select 1
      from public.usuarios_bloqueados bloqueio
      where (
        bloqueio.bloqueador_id = p_usuario_a
        and bloqueio.bloqueado_id = p_usuario_b
      )
      or (
        bloqueio.bloqueador_id = p_usuario_b
        and bloqueio.bloqueado_id = p_usuario_a
      )
    );
$$;


ALTER FUNCTION "public"."usuarios_possuem_bloqueio"("p_usuario_a" "uuid", "p_usuario_b" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."usuarios_possuem_bloqueio"("p_usuario_a" "uuid", "p_usuario_b" "uuid") IS 'Retorna true quando existe bloqueio em qualquer direção entre dois usuários.';



CREATE OR REPLACE FUNCTION "public"."validar_comentario_diario"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public', 'auth', 'pg_temp'
    AS $$
declare
  v_parent_anotacao_id uuid;
  v_parent_parent_id uuid;
begin
  new.texto := btrim(coalesce(new.texto, ''));
  new.atualizado_em := now();

  if new.texto = '' then
    raise exception 'Escreva um comentário antes de enviar.'
      using errcode = '22023';
  end if;

  if char_length(new.texto) > 700 then
    raise exception 'O comentário pode ter no máximo 700 caracteres.'
      using errcode = '22001';
  end if;

  if new.parent_id is not null then
    select
      comentario.anotacao_id,
      comentario.parent_id
    into
      v_parent_anotacao_id,
      v_parent_parent_id
    from public.diario_anotacao_comentarios comentario
    where comentario.id = new.parent_id
    limit 1;

    if not found then
      raise exception 'O comentário respondido não existe mais.'
        using errcode = 'P0002';
    end if;

    if v_parent_anotacao_id is distinct from new.anotacao_id then
      raise exception 'A resposta pertence a outra anotação.'
        using errcode = '22023';
    end if;

    if v_parent_parent_id is not null then
      raise exception 'Responda diretamente ao comentário principal.'
        using errcode = '22023';
    end if;
  end if;

  return new;
end;
$$;


ALTER FUNCTION "public"."validar_comentario_diario"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validar_comunidade_denuncia"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public', 'auth', 'pg_temp'
    AS $$
declare
  v_usuario_atual uuid := auth.uid();
  v_service_role boolean :=
    coalesce(auth.role() = 'service_role', false);
  v_e_admin boolean :=
    coalesce(public.comunidade_usuario_e_admin(), false);
  v_alvo_texto text;
  v_alvo_uuid uuid;
  v_autor_alvo uuid;
  v_total_ultima_hora integer := 0;
begin
  if tg_op = 'INSERT' then
    new.alvo_tipo :=
      lower(btrim(coalesce(new.alvo_tipo, '')));
    new.motivo := btrim(coalesce(new.motivo, ''));
    new.detalhe := btrim(coalesce(new.detalhe, ''));

    if not v_service_role and v_usuario_atual is null then
      raise exception
        'Entre na sua conta para enviar uma denúncia.'
        using errcode = '42501';
    end if;

    if not v_service_role then
      if new.denunciante_id is distinct from v_usuario_atual then
        raise exception
          'O denunciante precisa ser o usuário autenticado.'
          using errcode = '42501';
      end if;
    elsif new.denunciante_id is null then
      raise exception
        'A denúncia precisa informar o denunciante.'
        using errcode = '23502';
    end if;

    if new.alvo_tipo not in (
      'post',
      'comentario',
      'comentario_capitulo',
      'obra',
      'capitulo',
      'comentario_obra',
      'diario_anotacao',
      'comentario_diario'
    ) then
      raise exception
        'Tipo de conteúdo denunciado inválido.'
        using errcode = '22023';
    end if;

    if new.alvo_id is null then
      raise exception
        'A denúncia precisa informar o conteúdo denunciado.'
        using errcode = '23502';
    end if;

    v_alvo_texto := btrim(new.alvo_id::text);

    if v_alvo_texto = ''
      or new.alvo_id::text is distinct from v_alvo_texto
    then
      raise exception
        'Identificador do conteúdo denunciado inválido.'
        using errcode = '22023';
    end if;

    begin
      v_alvo_uuid := v_alvo_texto::uuid;
    exception
      when invalid_text_representation then
        raise exception
          'Identificador do conteúdo denunciado inválido.'
          using errcode = '22023';
    end;

    if not public.comunidade_motivo_denuncia_valido(
      new.motivo
    ) then
      raise exception
        'Motivo da denúncia inválido.'
        using errcode = '22023';
    end if;

    if char_length(new.detalhe) > 1200 then
      raise exception
        'A explicação da denúncia pode ter no máximo 1200 caracteres.'
        using errcode = '22001';
    end if;

    if new.alvo_tipo = 'post' then
      select post.autor_id
      into v_autor_alvo
      from public.comunidade_posts post
      where post.id = v_alvo_uuid
      limit 1;

      if not found then
        raise exception
          'A publicação denunciada não existe mais.'
          using errcode = 'P0002';
      end if;

    elsif new.alvo_tipo = 'comentario' then
      select comentario.autor_id
      into v_autor_alvo
      from public.comunidade_comentarios comentario
      where comentario.id = v_alvo_uuid
      limit 1;

      if not found then
        raise exception
          'O comentário denunciado não existe mais.'
          using errcode = 'P0002';
      end if;

    elsif new.alvo_tipo = 'comentario_capitulo' then
      select comentario.user_id
      into v_autor_alvo
      from public.comentarios_capitulos comentario
      where comentario.id = v_alvo_uuid
      limit 1;

      if not found then
        raise exception
          'O comentário de capítulo denunciado não existe mais.'
          using errcode = 'P0002';
      end if;

    elsif new.alvo_tipo = 'obra' then
      select obra.user_id
      into v_autor_alvo
      from public.obras obra
      where obra.id = v_alvo_uuid
        and coalesce(obra.publicado, false) = true
      limit 1;

      if not found then
        raise exception
          'A obra denunciada não existe ou não está disponível.'
          using errcode = 'P0002';
      end if;

    elsif new.alvo_tipo = 'capitulo' then
      select capitulo.user_id
      into v_autor_alvo
      from public.capitulos capitulo
      inner join public.obras obra
        on obra.id = capitulo.obra_id
      where capitulo.id = v_alvo_uuid
        and coalesce(capitulo.publicado, false) = true
        and coalesce(obra.publicado, false) = true
      limit 1;

      if not found then
        raise exception
          'O capítulo denunciado não existe ou não está disponível.'
          using errcode = 'P0002';
      end if;

    elsif new.alvo_tipo = 'comentario_obra' then
      select comentario.user_id
      into v_autor_alvo
      from public.comentarios_obras comentario
      inner join public.obras obra
        on obra.id = comentario.obra_id
      where comentario.id = v_alvo_uuid
        and coalesce(obra.publicado, false) = true
      limit 1;

      if not found then
        raise exception
          'O comentário da obra denunciado não existe ou não está disponível.'
          using errcode = 'P0002';
      end if;

    elsif new.alvo_tipo = 'diario_anotacao' then
      select anotacao.user_id
      into v_autor_alvo
      from public.diario_anotacoes anotacao
      left join public.preferencias_privacidade preferencias
        on preferencias.user_id = anotacao.user_id
      where anotacao.id = v_alvo_uuid
        and coalesce(
          anotacao.visibilidade,
          'privado'
        ) in ('publico', 'parcial')
        and public.usuario_pode_ver_aba_perfil(
          anotacao.user_id,
          coalesce(
            preferencias.visibilidade_diario,
            'publico'
          )
        )
      limit 1;

      if not found then
        raise exception
          'A anotação do Diário não existe ou não está disponível.'
          using errcode = 'P0002';
      end if;

    else
      select comentario.user_id
      into v_autor_alvo
      from public.diario_anotacao_comentarios comentario
      inner join public.diario_anotacoes anotacao
        on anotacao.id = comentario.anotacao_id
      left join public.preferencias_privacidade preferencias
        on preferencias.user_id = anotacao.user_id
      where comentario.id = v_alvo_uuid
        and coalesce(
          anotacao.visibilidade,
          'privado'
        ) in ('publico', 'parcial')
        and public.usuario_pode_ver_aba_perfil(
          anotacao.user_id,
          coalesce(
            preferencias.visibilidade_diario,
            'publico'
          )
        )
      limit 1;

      if not found then
        raise exception
          'O comentário do Diário não existe ou não está disponível.'
          using errcode = 'P0002';
      end if;
    end if;

    if v_autor_alvo = new.denunciante_id then
      raise exception
        'Você não pode denunciar seu próprio conteúdo.'
        using errcode = '22023';
    end if;

    if not v_service_role and not v_e_admin then
      select count(*)::integer
      into v_total_ultima_hora
      from public.comunidade_denuncias denuncia
      where denuncia.denunciante_id =
        new.denunciante_id
        and denuncia.criado_em >=
          now() - interval '1 hour';

      if v_total_ultima_hora >= 20 then
        raise exception
          'Limite temporário de denúncias atingido. Tente novamente mais tarde.'
          using errcode = 'P0001';
      end if;
    end if;

    if new.status is distinct from 'pendente'
      or coalesce(new.arquivada, false)
      or btrim(
        coalesce(new.observacao_admin, '')
      ) <> ''
      or new.analisado_por is not null
      or new.analisado_em is not null
    then
      raise exception
        'Campos administrativos não podem ser definidos ao criar uma denúncia.'
        using errcode = '42501';
    end if;

    new.status := 'pendente';
    new.arquivada := false;
    new.observacao_admin := '';
    new.analisado_por := null;
    new.analisado_em := null;
    new.criado_em := now();
    new.atualizado_em := now();

    return new;
  end if;

  if tg_op = 'UPDATE' then
    if not v_service_role and not v_e_admin then
      raise exception
        'Somente administradores e moderadores podem atualizar denúncias.'
        using errcode = '42501';
    end if;

    if new.alvo_tipo is distinct from old.alvo_tipo
      or new.alvo_id is distinct from old.alvo_id
      or new.denunciante_id is distinct from old.denunciante_id
      or new.motivo is distinct from old.motivo
      or new.detalhe is distinct from old.detalhe
      or new.criado_em is distinct from old.criado_em
    then
      raise exception
        'Os dados originais da denúncia não podem ser alterados durante a moderação.'
        using errcode = '42501';
    end if;

    new.observacao_admin :=
      btrim(coalesce(new.observacao_admin, ''));

    if new.status not in (
      'pendente',
      'em_analise',
      'resolvida',
      'rejeitada'
    ) then
      raise exception
        'Status da denúncia inválido.'
        using errcode = '22023';
    end if;

    if char_length(new.observacao_admin) > 1200 then
      raise exception
        'A observação administrativa pode ter no máximo 1200 caracteres.'
        using errcode = '22001';
    end if;

    if new.status = 'pendente' then
      new.analisado_por := null;
      new.analisado_em := null;
    elsif new.status is distinct from old.status
      or new.analisado_em is null
    then
      if not v_service_role
        and v_usuario_atual is not null
      then
        new.analisado_por := v_usuario_atual;
      end if;

      new.analisado_em := now();
    end if;

    new.atualizado_em := now();
    return new;
  end if;

  return new;
end;
$$;


ALTER FUNCTION "public"."validar_comunidade_denuncia"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."validar_comunidade_denuncia"() IS 'Valida denúncias de Comunidade, obras, capítulos, Diário e comentários.';



CREATE OR REPLACE FUNCTION "public"."validar_denuncia_perfil"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public', 'auth', 'pg_temp'
    AS $$
declare
  v_usuario_atual uuid := auth.uid();
  v_service_role boolean := coalesce(auth.role() = 'service_role', false);
  v_e_admin boolean := coalesce(public.usuario_e_admin(), false);
  v_nome_perfil text := '';
  v_total_ultima_hora integer := 0;
begin
  if tg_op = 'INSERT' then
    if not v_service_role and v_usuario_atual is null then
      raise exception 'Entre na sua conta para enviar uma denúncia.'
        using errcode = '42501';
    end if;

    if not v_service_role then
      if new.denunciante_id is distinct from v_usuario_atual then
        raise exception 'O denunciante precisa ser o usuário autenticado.'
          using errcode = '42501';
      end if;
    elsif new.denunciante_id is null then
      raise exception 'A denúncia precisa informar o denunciante.'
        using errcode = '23502';
    end if;

    if new.denunciado_id is null then
      raise exception 'A denúncia precisa informar o perfil denunciado.'
        using errcode = '23502';
    end if;

    if new.denunciante_id = new.denunciado_id then
      raise exception 'Você não pode denunciar o próprio perfil.'
        using errcode = '22023';
    end if;

    if not exists (
      select 1
      from auth.users usuario
      where usuario.id = new.denunciado_id
    ) then
      raise exception 'O perfil denunciado não existe mais.'
        using errcode = 'P0002';
    end if;

    new.motivo := lower(btrim(coalesce(new.motivo, 'outro')));
    new.descricao := left(btrim(coalesce(new.descricao, '')), 1200);
    new.perfil_url := left(btrim(coalesce(new.perfil_url, '')), 1000);

    if not public.perfil_motivo_denuncia_valido(new.motivo) then
      raise exception 'Motivo da denúncia inválido.'
        using errcode = '22023';
    end if;

    select coalesce(nullif(btrim(perfil.nome), ''), '')
    into v_nome_perfil
    from public.profiles perfil
    where perfil.user_id = new.denunciado_id
       or perfil.id = new.denunciado_id
    order by
      case when perfil.user_id = new.denunciado_id then 0 else 1 end
    limit 1;

    new.perfil_nome := left(
      coalesce(
        nullif(v_nome_perfil, ''),
        nullif(btrim(coalesce(new.perfil_nome, '')), ''),
        'Usuário denunciado'
      ),
      120
    );

    if new.perfil_url = ''
      or not new.perfil_url ~ '^/[^/]'
    then
      new.perfil_url :=
        '/perfil-autor?userId=' || new.denunciado_id::text;
    end if;

    if not v_service_role and not v_e_admin then
      select count(*)::integer
      into v_total_ultima_hora
      from public.denuncias_perfis denuncia
      where denuncia.denunciante_id = new.denunciante_id
        and denuncia.criado_em >= now() - interval '1 hour';

      if v_total_ultima_hora >= 20 then
        raise exception
          'Limite temporário de denúncias atingido. Tente novamente mais tarde.'
          using errcode = 'P0001';
      end if;
    end if;

    if new.status is distinct from 'pendente' then
      raise exception
        'O status inicial da denúncia precisa ser pendente.'
        using errcode = '42501';
    end if;

    new.status := 'pendente';
    new.criado_em := now();
    new.atualizado_em := now();

    return new;
  end if;

  if tg_op = 'UPDATE' then
    if not v_service_role and not v_e_admin then
      raise exception
        'Somente administradores e moderadores podem atualizar denúncias.'
        using errcode = '42501';
    end if;

    if new.denunciante_id is distinct from old.denunciante_id
      or new.denunciado_id is distinct from old.denunciado_id
      or new.perfil_nome is distinct from old.perfil_nome
      or new.perfil_url is distinct from old.perfil_url
      or new.motivo is distinct from old.motivo
      or new.descricao is distinct from old.descricao
      or new.criado_em is distinct from old.criado_em
    then
      raise exception
        'Os dados originais da denúncia não podem ser alterados.'
        using errcode = '42501';
    end if;

    if new.status not in (
      'pendente',
      'analisada',
      'ignorada',
      'resolvida'
    ) then
      raise exception 'Status da denúncia inválido.'
        using errcode = '22023';
    end if;

    new.atualizado_em := now();
    return new;
  end if;

  return new;
end;
$$;


ALTER FUNCTION "public"."validar_denuncia_perfil"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."validar_denuncia_perfil"() IS 'Valida identidade, alvo, motivo, limite e campos administrativos de denúncias de perfis.';



CREATE OR REPLACE FUNCTION "public"."validar_operacao_exclusao_conta"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
begin
  if tg_op = 'INSERT' then
    if new.status <> 'solicitada' then
      raise exception
        using
          errcode = '23514',
          message = 'Uma operação de exclusão deve começar com o status solicitada.';
    end if;
  end if;

  if tg_op = 'UPDATE' then
    if new.id is distinct from old.id then
      raise exception
        using
          errcode = '23514',
          message = 'O identificador da operação não pode ser alterado.';
    end if;

    if new.subject_user_id is distinct from old.subject_user_id then
      raise exception
        using
          errcode = '23514',
          message = 'O usuário da operação não pode ser alterado.';
    end if;

    if new.criada_em is distinct from old.criada_em then
      raise exception
        using
          errcode = '23514',
          message = 'A data de criação da operação não pode ser alterada.';
    end if;

    if old.status = 'concluida' then
      raise exception
        using
          errcode = '23514',
          message = 'Uma operação concluída não pode ser alterada.';
    end if;

    if new.status is distinct from old.status then
      if not (
        (
          old.status = 'solicitada'
          and new.status in (
            'limpando_storage',
            'falhou'
          )
        )
        or (
          old.status = 'limpando_storage'
          and new.status in (
            'storage_limpo',
            'falhou'
          )
        )
        or (
          old.status = 'storage_limpo'
          and new.status in (
            'excluindo_auth',
            'falhou'
          )
        )
        or (
          old.status = 'excluindo_auth'
          and new.status in (
            'concluida',
            'falhou'
          )
        )
        or (
          old.status = 'falhou'
          and new.status in (
            'limpando_storage',
            'excluindo_auth'
          )
        )
      ) then
        raise exception
          using
            errcode = '23514',
            message = format(
              'Transição inválida da exclusão: %s para %s.',
              old.status,
              new.status
            );
      end if;
    end if;
  end if;

  new.atualizada_em := now();

  if new.status = 'limpando_storage' then
    new.iniciada_em := coalesce(
      new.iniciada_em,
      now()
    );
  end if;

  if new.status = 'storage_limpo' then
    if cardinality(new.buckets_pendentes) <> 0 then
      raise exception
        using
          errcode = '23514',
          message = 'Ainda existem buckets pendentes de limpeza.';
    end if;

    new.storage_limpo_em := coalesce(
      new.storage_limpo_em,
      now()
    );
  end if;

  if new.status = 'excluindo_auth' then
    if new.storage_limpo_em is null then
      raise exception
        using
          errcode = '23514',
          message = 'O Auth não pode ser excluído antes da limpeza do Storage.';
    end if;
  end if;

  if new.status = 'falhou' then
    if nullif(
      btrim(new.ultimo_erro_mensagem),
      ''
    ) is null then
      raise exception
        using
          errcode = '23514',
          message = 'Uma operação com falha precisa registrar o erro.';
    end if;

    new.ultima_falha_em := now();
    new.lock_token := null;
    new.lock_expira_em := null;
  end if;

  if new.status = 'concluida' then
    if new.storage_limpo_em is null then
      raise exception
        using
          errcode = '23514',
          message = 'A operação não pode ser concluída sem limpar o Storage.';
    end if;

    if new.auth_excluido_em is null then
      raise exception
        using
          errcode = '23514',
          message = 'A operação não pode ser concluída sem excluir o Auth.';
    end if;

    new.concluida_em := coalesce(
      new.concluida_em,
      now()
    );

    new.lock_token := null;
    new.lock_expira_em := null;
  end if;

  return new;
end;
$$;


ALTER FUNCTION "public"."validar_operacao_exclusao_conta"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validar_problema_tecnico"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public', 'auth', 'pg_temp'
    AS $$
declare
  v_usuario_id uuid := auth.uid();
  v_service_role boolean :=
    coalesce(auth.role() = 'service_role', false);
  v_admin boolean :=
    coalesce(public.suporte_usuario_e_admin(), false);
  v_total_ultima_hora integer := 0;
  v_total_ultimo_dia integer := 0;
begin
  if tg_op = 'INSERT' then
    new.email_contato :=
      lower(btrim(coalesce(new.email_contato, '')));
    new.categoria :=
      lower(btrim(coalesce(new.categoria, 'outro')));
    new.titulo :=
      btrim(coalesce(new.titulo, ''));
    new.descricao :=
      btrim(coalesce(new.descricao, ''));
    new.pagina_url :=
      btrim(coalesce(new.pagina_url, ''));
    new.navegador :=
      btrim(coalesce(new.navegador, ''));
    new.dispositivo :=
      btrim(coalesce(new.dispositivo, ''));

    if not v_service_role and v_usuario_id is null then
      raise exception
        'Entre na sua conta para relatar um problema técnico.'
        using errcode = '42501';
    end if;

    if not v_service_role
      and new.user_id is distinct from v_usuario_id
    then
      raise exception
        'O chamado precisa pertencer ao usuário autenticado.'
        using errcode = '42501';
    end if;

    if new.categoria not in (
      'conta_acesso',
      'publicacao',
      'leitura',
      'comunidade',
      'diario',
      'notificacoes',
      'privacidade',
      'desempenho',
      'outro'
    ) then
      raise exception
        'Categoria do problema técnico inválida.'
        using errcode = '22023';
    end if;

    if char_length(new.titulo) < 8
      or char_length(new.titulo) > 120
    then
      raise exception
        'O título precisa ter entre 8 e 120 caracteres.'
        using errcode = '22023';
    end if;

    if char_length(new.descricao) < 20
      or char_length(new.descricao) > 3000
    then
      raise exception
        'A descrição precisa ter entre 20 e 3000 caracteres.'
        using errcode = '22023';
    end if;

    if char_length(new.email_contato) > 320
      or char_length(new.pagina_url) > 700
      or char_length(new.navegador) > 500
      or char_length(new.dispositivo) > 160
    then
      raise exception
        'Uma das informações do ambiente excedeu o limite permitido.'
        using errcode = '22001';
    end if;

    if not v_service_role and not v_admin then
      select count(*)::integer
      into v_total_ultima_hora
      from public.problemas_tecnicos problema
      where problema.user_id = new.user_id
        and problema.criado_em >=
          now() - interval '1 hour';

      select count(*)::integer
      into v_total_ultimo_dia
      from public.problemas_tecnicos problema
      where problema.user_id = new.user_id
        and problema.criado_em >=
          now() - interval '24 hours';

      if v_total_ultima_hora >= 5
        or v_total_ultimo_dia >= 12
      then
        raise exception
          'Limite temporário de chamados atingido. Tente novamente mais tarde.'
          using errcode = 'P0001';
      end if;
    end if;

    if new.status is distinct from 'aberto'
      or new.prioridade is distinct from 'normal'
      or btrim(coalesce(new.observacao_admin, '')) <> ''
      or new.analisado_por is not null
      or new.analisado_em is not null
    then
      raise exception
        'Campos administrativos não podem ser definidos ao criar o chamado.'
        using errcode = '42501';
    end if;

    new.status := 'aberto';
    new.prioridade := 'normal';
    new.observacao_admin := '';
    new.analisado_por := null;
    new.analisado_em := null;
    new.criado_em := now();
    new.atualizado_em := now();

    return new;
  end if;

  if tg_op = 'UPDATE' then
    if not v_service_role and not v_admin then
      raise exception
        'Somente administradores e moderadores podem atualizar chamados técnicos.'
        using errcode = '42501';
    end if;

    if new.user_id is distinct from old.user_id
      or new.email_contato is distinct from old.email_contato
      or new.categoria is distinct from old.categoria
      or new.titulo is distinct from old.titulo
      or new.descricao is distinct from old.descricao
      or new.pagina_url is distinct from old.pagina_url
      or new.navegador is distinct from old.navegador
      or new.dispositivo is distinct from old.dispositivo
      or new.criado_em is distinct from old.criado_em
    then
      raise exception
        'As informações originais do chamado não podem ser alteradas.'
        using errcode = '42501';
    end if;

    new.observacao_admin :=
      btrim(coalesce(new.observacao_admin, ''));

    if new.status not in (
      'aberto',
      'em_analise',
      'aguardando_usuario',
      'resolvido',
      'fechado'
    ) then
      raise exception
        'Status do chamado técnico inválido.'
        using errcode = '22023';
    end if;

    if new.prioridade not in (
      'baixa',
      'normal',
      'alta',
      'urgente'
    ) then
      raise exception
        'Prioridade do chamado técnico inválida.'
        using errcode = '22023';
    end if;

    if char_length(new.observacao_admin) > 3000 then
      raise exception
        'A observação administrativa pode ter no máximo 3000 caracteres.'
        using errcode = '22001';
    end if;

    if new.status is distinct from old.status
      or new.prioridade is distinct from old.prioridade
      or new.observacao_admin is distinct from old.observacao_admin
    then
      if not v_service_role and v_usuario_id is not null then
        new.analisado_por := v_usuario_id;
      end if;

      new.analisado_em := now();
    end if;

    new.atualizado_em := now();
    return new;
  end if;

  return new;
end;
$$;


ALTER FUNCTION "public"."validar_problema_tecnico"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validar_resposta_comentario_capitulo"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public', 'pg_temp'
    AS $$
declare
  v_capitulo_pai_id uuid;
begin
  if new.comentario_pai_id is null then
    return new;
  end if;

  if new.id is not null and new.comentario_pai_id = new.id then
    raise exception 'Um comentário não pode responder a ele mesmo.';
  end if;

  select comentario.capitulo_id
  into v_capitulo_pai_id
  from public.comentarios_capitulos comentario
  where comentario.id = new.comentario_pai_id
  limit 1;

  if v_capitulo_pai_id is null then
    raise exception 'Comentário principal não encontrado.';
  end if;

  if v_capitulo_pai_id <> new.capitulo_id then
    raise exception
      'A resposta precisa pertencer ao mesmo capítulo do comentário principal.';
  end if;

  return new;
end;
$$;


ALTER FUNCTION "public"."validar_resposta_comentario_capitulo"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validar_resposta_comentario_comunidade"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public', 'pg_temp'
    AS $$
declare
  v_post_pai_id uuid;
begin
  if new.comentario_pai_id is null then
    return new;
  end if;

  if new.id is not null and new.comentario_pai_id = new.id then
    raise exception 'Um comentário não pode responder a ele mesmo.';
  end if;

  select comentario.post_id
  into v_post_pai_id
  from public.comunidade_comentarios comentario
  where comentario.id = new.comentario_pai_id
  limit 1;

  if v_post_pai_id is null then
    raise exception 'Comentário principal não encontrado.';
  end if;

  if v_post_pai_id <> new.post_id then
    raise exception
      'A resposta precisa pertencer à mesma publicação do comentário principal.';
  end if;

  return new;
end;
$$;


ALTER FUNCTION "public"."validar_resposta_comentario_comunidade"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validar_resposta_comentario_obra"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public', 'pg_temp'
    AS $$
declare
  v_obra_pai_id uuid;
begin
  if new.comentario_pai_id is null then
    return new;
  end if;

  if new.id is not null and new.comentario_pai_id = new.id then
    raise exception 'Um comentário não pode responder a ele mesmo.';
  end if;

  select comentario.obra_id
  into v_obra_pai_id
  from public.comentarios_obras comentario
  where comentario.id = new.comentario_pai_id
  limit 1;

  if v_obra_pai_id is null then
    raise exception 'Comentário principal não encontrado.';
  end if;

  if v_obra_pai_id <> new.obra_id then
    raise exception
      'A resposta precisa pertencer à mesma obra do comentário principal.';
  end if;

  return new;
end;
$$;


ALTER FUNCTION "public"."validar_resposta_comentario_obra"() OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."autor_avaliacoes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "autor_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "nota" numeric(2,1) NOT NULL,
    "criado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    "atualizado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "autor_avaliacoes_nota_check" CHECK ((("nota" >= 0.5) AND ("nota" <= (5)::numeric))),
    CONSTRAINT "autor_avaliacoes_sem_autoavaliacao_check" CHECK (("autor_id" <> "user_id"))
);


ALTER TABLE "public"."autor_avaliacoes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."capitulo_visualizacoes_unicas" (
    "capitulo_id" "uuid" NOT NULL,
    "chave_visitante" "text" NOT NULL,
    "dia" "date" DEFAULT CURRENT_DATE NOT NULL,
    "criada_em" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."capitulo_visualizacoes_unicas" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."capitulos" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "obra_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "titulo" "text" DEFAULT ''::"text" NOT NULL,
    "texto" "text" DEFAULT ''::"text" NOT NULL,
    "ordem" integer DEFAULT 1 NOT NULL,
    "publicado" boolean DEFAULT true NOT NULL,
    "criado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    "atualizado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    "visualizacoes" integer DEFAULT 0 NOT NULL,
    CONSTRAINT "capitulos_ordem_check" CHECK (("ordem" >= 1)),
    CONSTRAINT "capitulos_titulo_check" CHECK (("char_length"(TRIM(BOTH FROM "titulo")) >= 1))
);


ALTER TABLE "public"."capitulos" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."comentarios_capitulos" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "capitulo_id" "uuid" NOT NULL,
    "comentario" "text" DEFAULT ''::"text" NOT NULL,
    "criado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    "atualizado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    "obra_id" "uuid",
    "comentario_pai_id" "uuid"
);


ALTER TABLE "public"."comentarios_capitulos" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."comentarios_capitulos_curtidas" (
    "comentario_id" "uuid" NOT NULL,
    "usuario_id" "uuid" NOT NULL,
    "criado_em" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."comentarios_capitulos_curtidas" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."comentarios_obras" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "obra_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "comentario" "text" NOT NULL,
    "criado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    "comentario_pai_id" "uuid"
);


ALTER TABLE "public"."comentarios_obras" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."comentarios_obras_curtidas" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "comentario_id" "uuid" NOT NULL,
    "usuario_id" "uuid" NOT NULL,
    "criado_em" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."comentarios_obras_curtidas" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."comunidade_comentario_curtidas" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "comentario_id" "uuid" NOT NULL,
    "usuario_id" "uuid" NOT NULL,
    "criado_em" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."comunidade_comentario_curtidas" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."comunidade_comentarios" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "post_id" "uuid" NOT NULL,
    "autor_id" "uuid" NOT NULL,
    "autor_nome" "text" NOT NULL,
    "texto" "text" NOT NULL,
    "criado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    "comentario_pai_id" "uuid",
    CONSTRAINT "comunidade_comentarios_autor_nome_check" CHECK ((("char_length"(TRIM(BOTH FROM "autor_nome")) >= 1) AND ("char_length"(TRIM(BOTH FROM "autor_nome")) <= 80))),
    CONSTRAINT "comunidade_comentarios_texto_check" CHECK ((("char_length"(TRIM(BOTH FROM "texto")) >= 1) AND ("char_length"(TRIM(BOTH FROM "texto")) <= 420)))
);


ALTER TABLE "public"."comunidade_comentarios" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."comunidade_comentarios_salvos" (
    "comentario_id" "uuid" NOT NULL,
    "usuario_id" "uuid" NOT NULL,
    "criado_em" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."comunidade_comentarios_salvos" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."comunidade_curtidas" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "post_id" "uuid" NOT NULL,
    "usuario_id" "uuid" NOT NULL,
    "criado_em" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."comunidade_curtidas" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."comunidade_denuncias" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "alvo_tipo" "text" NOT NULL,
    "alvo_id" "uuid" NOT NULL,
    "denunciante_id" "uuid" NOT NULL,
    "motivo" "text" DEFAULT 'Conteúdo inadequado'::"text" NOT NULL,
    "detalhe" "text" DEFAULT ''::"text" NOT NULL,
    "criado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    "status" "text" DEFAULT 'pendente'::"text" NOT NULL,
    "observacao_admin" "text" DEFAULT ''::"text" NOT NULL,
    "analisado_por" "uuid",
    "analisado_em" timestamp with time zone,
    "arquivada" boolean DEFAULT false NOT NULL,
    "atualizado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "comunidade_denuncias_alvo_id_uuid_check" CHECK ((("alvo_id")::"text" ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'::"text")),
    CONSTRAINT "comunidade_denuncias_alvo_tipo_check" CHECK (("alvo_tipo" = ANY (ARRAY['post'::"text", 'comentario'::"text", 'comentario_capitulo'::"text", 'obra'::"text", 'capitulo'::"text", 'comentario_obra'::"text", 'diario_anotacao'::"text", 'comentario_diario'::"text"]))),
    CONSTRAINT "comunidade_denuncias_analise_coerente_check" CHECK (((("status" = 'pendente'::"text") AND ("analisado_por" IS NULL) AND ("analisado_em" IS NULL)) OR ("status" = ANY (ARRAY['em_analise'::"text", 'resolvida'::"text", 'rejeitada'::"text"])))),
    CONSTRAINT "comunidade_denuncias_detalhe_check" CHECK (("char_length"("detalhe") <= 400)),
    CONSTRAINT "comunidade_denuncias_detalhe_tamanho_check" CHECK (("char_length"("detalhe") <= 1200)),
    CONSTRAINT "comunidade_denuncias_motivo_check" CHECK ((("char_length"(TRIM(BOTH FROM "motivo")) >= 3) AND ("char_length"(TRIM(BOTH FROM "motivo")) <= 80))),
    CONSTRAINT "comunidade_denuncias_motivo_tamanho_check" CHECK ((("char_length"("btrim"("motivo")) >= 2) AND ("char_length"("btrim"("motivo")) <= 80))),
    CONSTRAINT "comunidade_denuncias_observacao_tamanho_check" CHECK (("char_length"("observacao_admin") <= 1200)),
    CONSTRAINT "comunidade_denuncias_status_check" CHECK (("status" = ANY (ARRAY['pendente'::"text", 'em_analise'::"text", 'resolvida'::"text", 'rejeitada'::"text"])))
);


ALTER TABLE "public"."comunidade_denuncias" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."comunidade_enquete_votos" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "post_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "opcao" "text" NOT NULL,
    "criado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    "atualizado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "comunidade_enquete_votos_opcao_check" CHECK ((("char_length"(TRIM(BOTH FROM "opcao")) >= 1) AND ("char_length"("opcao") <= 120)))
);


ALTER TABLE "public"."comunidade_enquete_votos" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."comunidade_post_salvos" (
    "post_id" "uuid" NOT NULL,
    "usuario_id" "uuid" NOT NULL,
    "criado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_id" "uuid"
);


ALTER TABLE "public"."comunidade_post_salvos" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."comunidade_posts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "autor_id" "uuid" NOT NULL,
    "autor_nome" "text" NOT NULL,
    "categoria" "text" DEFAULT 'Geral'::"text" NOT NULL,
    "texto" "text" NOT NULL,
    "obra_relacionada" "text" DEFAULT ''::"text" NOT NULL,
    "criado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    "tipo_publicacao" "text" DEFAULT 'Discussão'::"text" NOT NULL,
    "tem_spoiler" boolean DEFAULT false NOT NULL,
    "fixado" boolean DEFAULT false NOT NULL,
    "fixado_em" timestamp with time zone,
    "fixado_por" "uuid",
    "visibilidade" "text" DEFAULT 'publico'::"text" NOT NULL,
    CONSTRAINT "comunidade_posts_autor_nome_check" CHECK ((("char_length"(TRIM(BOTH FROM "autor_nome")) >= 1) AND ("char_length"(TRIM(BOTH FROM "autor_nome")) <= 80))),
    CONSTRAINT "comunidade_posts_categoria_check" CHECK (("categoria" = ANY (ARRAY['Geral'::"text", 'Divulgação'::"text", 'Recomendações'::"text", 'Discussão'::"text", 'Dúvidas'::"text"]))),
    CONSTRAINT "comunidade_posts_obra_check" CHECK (("char_length"("obra_relacionada") <= 90)),
    CONSTRAINT "comunidade_posts_texto_check" CHECK ((("char_length"(TRIM(BOTH FROM "texto")) >= 8) AND ("char_length"(TRIM(BOTH FROM "texto")) <= 700))),
    CONSTRAINT "comunidade_posts_tipo_publicacao_check" CHECK (("tipo_publicacao" = ANY (ARRAY['Discussão'::"text", 'Teoria'::"text", 'Pedido de indicação'::"text", 'Divulgação'::"text", 'Review'::"text", 'Aviso de capítulo'::"text", 'Dúvida'::"text"]))),
    CONSTRAINT "comunidade_posts_visibilidade_check" CHECK (("visibilidade" = ANY (ARRAY['publico'::"text", 'seguidores'::"text", 'seguindo'::"text", 'somente_eu'::"text"])))
);


ALTER TABLE "public"."comunidade_posts" OWNER TO "postgres";


COMMENT ON COLUMN "public"."comunidade_posts"."visibilidade" IS 'Quem pode ver a publicação: publico, seguidores, seguindo ou somente_eu.';



CREATE TABLE IF NOT EXISTS "public"."comunidade_salvos" (
    "post_id" "uuid" NOT NULL,
    "usuario_id" "uuid" NOT NULL,
    "criado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_id" "uuid"
);


ALTER TABLE "public"."comunidade_salvos" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."concluidas" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "obra_id" "uuid" NOT NULL,
    "criado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    "visibilidade" "text" DEFAULT 'publico'::"text" NOT NULL,
    CONSTRAINT "concluidas_visibilidade_check" CHECK (("visibilidade" = ANY (ARRAY['publico'::"text", 'parcial'::"text", 'privado'::"text"])))
);


ALTER TABLE "public"."concluidas" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."curtidas_capitulos" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "capitulo_id" "uuid" NOT NULL,
    "criado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    "obra_id" "uuid"
);


ALTER TABLE "public"."curtidas_capitulos" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."denuncias_perfis" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "denunciante_id" "uuid" NOT NULL,
    "denunciado_id" "uuid" NOT NULL,
    "perfil_nome" "text" DEFAULT ''::"text" NOT NULL,
    "perfil_url" "text" DEFAULT ''::"text" NOT NULL,
    "motivo" "text" DEFAULT 'outro'::"text" NOT NULL,
    "descricao" "text" DEFAULT ''::"text" NOT NULL,
    "status" "text" DEFAULT 'pendente'::"text" NOT NULL,
    "criado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    "atualizado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "denuncias_perfis_descricao_length_check" CHECK (("char_length"("descricao") <= 1200)),
    CONSTRAINT "denuncias_perfis_motivo_check" CHECK ("public"."perfil_motivo_denuncia_valido"("motivo")),
    CONSTRAINT "denuncias_perfis_nao_denunciar_proprio" CHECK (("denunciante_id" <> "denunciado_id")),
    CONSTRAINT "denuncias_perfis_perfil_nome_length_check" CHECK (("char_length"("perfil_nome") <= 120)),
    CONSTRAINT "denuncias_perfis_perfil_url_length_check" CHECK (("char_length"("perfil_url") <= 1000)),
    CONSTRAINT "denuncias_perfis_status_check" CHECK (("status" = ANY (ARRAY['pendente'::"text", 'analisada'::"text", 'ignorada'::"text", 'resolvida'::"text"]))),
    CONSTRAINT "denuncias_perfis_usuarios_diferentes_check" CHECK (("denunciante_id" <> "denunciado_id"))
);


ALTER TABLE "public"."denuncias_perfis" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."diario_anotacao_comentarios" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "anotacao_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "texto" "text" NOT NULL,
    "criado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    "atualizado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    "parent_id" "uuid",
    CONSTRAINT "diario_anotacao_comentarios_texto_check" CHECK ((("char_length"(TRIM(BOTH FROM "texto")) >= 1) AND ("char_length"(TRIM(BOTH FROM "texto")) <= 700))),
    CONSTRAINT "diario_comentarios_parent_diferente_check" CHECK ((("parent_id" IS NULL) OR ("parent_id" <> "id")))
);


ALTER TABLE "public"."diario_anotacao_comentarios" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."diario_anotacao_curtidas" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "anotacao_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "criado_em" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."diario_anotacao_curtidas" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."diario_anotacoes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "obra_id" "uuid" NOT NULL,
    "tipo" "text" NOT NULL,
    "texto" "text" NOT NULL,
    "visibilidade" "text" DEFAULT 'privado'::"text" NOT NULL,
    "criado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    "atualizado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    "contem_spoiler" boolean DEFAULT false NOT NULL,
    "quem_pode_comentar" "text" DEFAULT 'herdar'::"text" NOT NULL,
    "visibilidade_comentarios" "text" DEFAULT 'herdar'::"text" NOT NULL,
    "permitir_curtidas" boolean DEFAULT true NOT NULL,
    CONSTRAINT "diario_anotacoes_quem_comenta_check" CHECK (("quem_pode_comentar" = ANY (ARRAY['herdar'::"text", 'todos'::"text", 'seguidores'::"text", 'ninguem'::"text"]))),
    CONSTRAINT "diario_anotacoes_texto_check" CHECK ((("char_length"(TRIM(BOTH FROM "texto")) >= 1) AND ("char_length"(TRIM(BOTH FROM "texto")) <= 700))),
    CONSTRAINT "diario_anotacoes_tipo_check" CHECK (("tipo" = ANY (ARRAY['lendo'::"text", 'quero_ler'::"text", 'favorita'::"text", 'concluida'::"text", 'avaliacao'::"text", 'review'::"text", 'atividade'::"text"]))),
    CONSTRAINT "diario_anotacoes_visibilidade_check" CHECK (("visibilidade" = ANY (ARRAY['publico'::"text", 'parcial'::"text", 'privado'::"text"]))),
    CONSTRAINT "diario_anotacoes_visibilidade_comentarios_check" CHECK (("visibilidade_comentarios" = ANY (ARRAY['herdar'::"text", 'publico'::"text", 'seguidores'::"text", 'somente_eu'::"text"])))
);


ALTER TABLE "public"."diario_anotacoes" OWNER TO "postgres";


COMMENT ON COLUMN "public"."diario_anotacoes"."visibilidade" IS 'publico: visitantes autorizados; parcial: seguidores; privado: somente o dono.';



COMMENT ON COLUMN "public"."diario_anotacoes"."contem_spoiler" IS 'Indica se o texto da anotação deve começar oculto por conter spoiler.';



COMMENT ON COLUMN "public"."diario_anotacoes"."quem_pode_comentar" IS 'Permissão da anotação: herdar, todos, seguidores ou ninguem.';



COMMENT ON COLUMN "public"."diario_anotacoes"."visibilidade_comentarios" IS 'Visibilidade dos comentários: herdar, publico, seguidores ou somente_eu.';



COMMENT ON COLUMN "public"."diario_anotacoes"."permitir_curtidas" IS 'Permite ou bloqueia novas curtidas nesta anotação.';



CREATE TABLE IF NOT EXISTS "public"."diario_atividades" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "tipo" "text" NOT NULL,
    "obra_id" "uuid",
    "capitulo_id" "uuid",
    "nota" numeric(2,1),
    "texto" "text",
    "visibilidade" "text" DEFAULT 'privado'::"text" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "criado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    "atualizado_em" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "diario_atividades_nota_check" CHECK ((("nota" IS NULL) OR (("nota" >= 0.5) AND ("nota" <= 5.0)))),
    CONSTRAINT "diario_atividades_tipo_check" CHECK (("tipo" = ANY (ARRAY['comecou_ler'::"text", 'leu_capitulo'::"text", 'concluiu_obra'::"text", 'avaliou_obra'::"text", 'favoritou_obra'::"text", 'salvou_obra'::"text", 'publicou_review'::"text", 'criou_lista'::"text"]))),
    CONSTRAINT "diario_atividades_visibilidade_check" CHECK (("visibilidade" = ANY (ARRAY['publico'::"text", 'parcial'::"text", 'privado'::"text"])))
);


ALTER TABLE "public"."diario_atividades" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."diario_avaliacoes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "diario_user_id" "uuid" NOT NULL,
    "avaliador_id" "uuid" NOT NULL,
    "nota" numeric(2,1) NOT NULL,
    "criado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    "atualizado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "diario_avaliacoes_nota_check" CHECK ((("nota" >= 0.5) AND ("nota" <= 5.0) AND (("nota" * (2)::numeric) = "trunc"(("nota" * (2)::numeric))))),
    CONSTRAINT "diario_avaliacoes_sem_autoavaliacao_check" CHECK (("diario_user_id" <> "avaliador_id")),
    CONSTRAINT "diario_avaliacoes_usuarios_diferentes_check" CHECK (("diario_user_id" <> "avaliador_id"))
);


ALTER TABLE "public"."diario_avaliacoes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."diario_comentario_curtidas" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "comentario_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "criado_em" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."diario_comentario_curtidas" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."diario_configuracoes" (
    "user_id" "uuid" NOT NULL,
    "modo" "text" DEFAULT 'parcial'::"text" NOT NULL,
    "mostrar_lendo_agora" boolean DEFAULT false NOT NULL,
    "mostrar_quero_ler" boolean DEFAULT false NOT NULL,
    "mostrar_concluidas" boolean DEFAULT true NOT NULL,
    "mostrar_favoritas" boolean DEFAULT true NOT NULL,
    "mostrar_avaliacoes" boolean DEFAULT true NOT NULL,
    "mostrar_reviews" boolean DEFAULT true NOT NULL,
    "criado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    "atualizado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "diario_configuracoes_modo_check" CHECK (("modo" = ANY (ARRAY['publico'::"text", 'parcial'::"text", 'privado'::"text"])))
);


ALTER TABLE "public"."diario_configuracoes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."favoritos" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "obra_id" "uuid" NOT NULL,
    "criado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    "visibilidade" "text" DEFAULT 'publico'::"text" NOT NULL,
    CONSTRAINT "favoritos_visibilidade_check" CHECK (("visibilidade" = ANY (ARRAY['publico'::"text", 'parcial'::"text", 'privado'::"text"])))
);


ALTER TABLE "public"."favoritos" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notificacoes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "obra_id" "uuid",
    "capitulo_id" "uuid",
    "titulo" "text" DEFAULT 'Nova notificação'::"text" NOT NULL,
    "mensagem" "text" DEFAULT 'Você recebeu uma nova notificação.'::"text" NOT NULL,
    "tipo" "text" DEFAULT 'atividade-comunidade'::"text" NOT NULL,
    "link" "text" DEFAULT ''::"text" NOT NULL,
    "lida" boolean DEFAULT false NOT NULL,
    "criada_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    "notificacao_id" "text" NOT NULL,
    "autor_id" "uuid",
    "autor_nome" "text" DEFAULT ''::"text" NOT NULL,
    "autor_avatar" "text" DEFAULT ''::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "notificacoes_link_check" CHECK (("char_length"("link") <= 300)),
    CONSTRAINT "notificacoes_mensagem_check" CHECK ((("char_length"(TRIM(BOTH FROM "mensagem")) >= 1) AND ("char_length"("mensagem") <= 300))),
    CONSTRAINT "notificacoes_tipo_check" CHECK ((("char_length"(TRIM(BOTH FROM "tipo")) >= 1) AND ("char_length"("tipo") <= 80))),
    CONSTRAINT "notificacoes_titulo_check" CHECK ((("char_length"(TRIM(BOTH FROM "titulo")) >= 1) AND ("char_length"("titulo") <= 120)))
);


ALTER TABLE "public"."notificacoes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."obra_avaliacoes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "obra_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "nota" numeric(2,1) NOT NULL,
    "criado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    "atualizado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    "visibilidade" "text" DEFAULT 'publico'::"text" NOT NULL,
    CONSTRAINT "obra_avaliacoes_nota_meia_estrela_check" CHECK ((("nota" >= 0.5) AND ("nota" <= 5.0) AND (("nota" * (2)::numeric) = "trunc"(("nota" * (2)::numeric))))),
    CONSTRAINT "obra_avaliacoes_visibilidade_check" CHECK (("visibilidade" = ANY (ARRAY['publico'::"text", 'parcial'::"text", 'privado'::"text"])))
);


ALTER TABLE "public"."obra_avaliacoes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."obra_comentario_curtidas" (
    "comentario_id" "uuid" NOT NULL,
    "usuario_id" "uuid" NOT NULL,
    "criado_em" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."obra_comentario_curtidas" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."obra_comentarios" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "obra_id" "uuid" NOT NULL,
    "autor_id" "uuid" NOT NULL,
    "autor_nome" "text",
    "texto" "text" NOT NULL,
    "criado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "obra_comentarios_texto_check" CHECK ((("char_length"(TRIM(BOTH FROM "texto")) >= 1) AND ("char_length"(TRIM(BOTH FROM "texto")) <= 420)))
);


ALTER TABLE "public"."obra_comentarios" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."obra_curtidas" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "obra_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "criado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    "visibilidade" "text" DEFAULT 'publico'::"text"
);


ALTER TABLE "public"."obra_curtidas" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."obra_visualizacoes_unicas" (
    "obra_id" "uuid" NOT NULL,
    "chave_visitante" "text" NOT NULL,
    "dia" "date" DEFAULT CURRENT_DATE NOT NULL,
    "criada_em" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."obra_visualizacoes_unicas" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."obras" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "titulo" "text" DEFAULT ''::"text" NOT NULL,
    "autor" "text" DEFAULT ''::"text" NOT NULL,
    "genero" "text" DEFAULT ''::"text" NOT NULL,
    "formato" "text" DEFAULT ''::"text" NOT NULL,
    "classificacao_indicativa" "text" DEFAULT ''::"text" NOT NULL,
    "sinopse" "text" DEFAULT ''::"text" NOT NULL,
    "tags" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "capa_url" "text" DEFAULT ''::"text" NOT NULL,
    "capa_nome" "text" DEFAULT ''::"text" NOT NULL,
    "arquivo_url" "text" DEFAULT ''::"text" NOT NULL,
    "arquivo_nome" "text" DEFAULT ''::"text" NOT NULL,
    "arquivo_tipo" "text" DEFAULT ''::"text" NOT NULL,
    "arquivo_tamanho" bigint DEFAULT 0 NOT NULL,
    "arquivo_categoria" "text" DEFAULT 'outro'::"text" NOT NULL,
    "publicado" boolean DEFAULT false NOT NULL,
    "slug" "text" NOT NULL,
    "link" "text" DEFAULT ''::"text" NOT NULL,
    "criada_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    "atualizado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    "visualizacoes" integer DEFAULT 0 NOT NULL,
    "avisos_conteudo" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    CONSTRAINT "obras_arquivo_tamanho_check" CHECK (("arquivo_tamanho" >= 0)),
    CONSTRAINT "obras_autor_check" CHECK (("char_length"(TRIM(BOTH FROM "autor")) >= 1)),
    CONSTRAINT "obras_avisos_conteudo_check" CHECK ((("avisos_conteudo" <@ ARRAY['violencia_intensa'::"text", 'drogas'::"text", 'linguagem_forte'::"text", 'terror'::"text", 'tema_sexual_nao_explicito'::"text", 'outro_tema_adulto'::"text"]) AND ((("classificacao_indicativa" = '18+'::"text") AND ("cardinality"("avisos_conteudo") > 0)) OR ((COALESCE("classificacao_indicativa", ''::"text") <> '18+'::"text") AND ("cardinality"("avisos_conteudo") = 0))))),
    CONSTRAINT "obras_classificacao_indicativa_check" CHECK ((("classificacao_indicativa" IS NULL) OR ("classificacao_indicativa" = ANY (ARRAY['Livre'::"text", '10+'::"text", '12+'::"text", '14+'::"text", '16+'::"text", '18+'::"text"])))),
    CONSTRAINT "obras_formato_check" CHECK ((("formato" IS NULL) OR (("char_length"("btrim"("formato")) >= 2) AND ("char_length"("btrim"("formato")) <= 40)))),
    CONSTRAINT "obras_genero_check" CHECK ((("genero" IS NULL) OR (("length"("btrim"("genero")) >= 3) AND ("length"("btrim"("genero")) <= 40)))),
    CONSTRAINT "obras_slug_check" CHECK (("char_length"(TRIM(BOTH FROM "slug")) >= 1)),
    CONSTRAINT "obras_titulo_check" CHECK (("char_length"(TRIM(BOTH FROM "titulo")) >= 1)),
    CONSTRAINT "obras_visualizacoes_check" CHECK (("visualizacoes" >= 0))
);


ALTER TABLE "public"."obras" OWNER TO "postgres";


COMMENT ON COLUMN "public"."obras"."avisos_conteudo" IS 'Avisos obrigatórios para obras 18+: violência intensa, drogas, linguagem forte, terror, tema sexual não explícito ou outro tema adulto.';



CREATE TABLE IF NOT EXISTS "public"."preferencias_privacidade" (
    "user_id" "uuid" NOT NULL,
    "mostrar_diario_perfil" boolean DEFAULT true NOT NULL,
    "anotacoes_privadas_padrao" boolean DEFAULT true NOT NULL,
    "mostrar_atividades_leitura" boolean DEFAULT true NOT NULL,
    "mostrar_progresso_leitura" boolean DEFAULT false NOT NULL,
    "mostrar_avaliacoes" boolean DEFAULT true NOT NULL,
    "mostrar_favoritos" boolean DEFAULT true NOT NULL,
    "mostrar_concluidas" boolean DEFAULT true NOT NULL,
    "mostrar_quero_ler" boolean DEFAULT false NOT NULL,
    "mostrar_historico_leitura" boolean DEFAULT false NOT NULL,
    "quem_pode_comentar_diario" "text" DEFAULT 'seguidores'::"text" NOT NULL,
    "criado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    "atualizado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    "perfil_privado" boolean DEFAULT false NOT NULL,
    "aprovar_novos_seguidores" boolean DEFAULT false NOT NULL,
    "mostrar_obras_para_todos" boolean DEFAULT true NOT NULL,
    "mostrar_sobre_para_todos" boolean DEFAULT true NOT NULL,
    "visibilidade_obras" "text" DEFAULT 'publico'::"text" NOT NULL,
    "visibilidade_sobre" "text" DEFAULT 'publico'::"text" NOT NULL,
    "visibilidade_diario" "text" DEFAULT 'publico'::"text" NOT NULL,
    "visibilidade_comunidade" "text" DEFAULT 'publico'::"text" NOT NULL,
    "visibilidade_biblioteca" "text" DEFAULT 'somente_eu'::"text" NOT NULL,
    "visibilidade_atividades" "text" DEFAULT 'seguidores'::"text" NOT NULL,
    "mostrar_avaliacao_diario" boolean DEFAULT true NOT NULL,
    "permitir_avaliacao_diario" boolean DEFAULT true NOT NULL,
    "quem_pode_avaliar_diario" "text" DEFAULT 'todos'::"text" NOT NULL,
    "visibilidade_avaliacao_diario" "text" DEFAULT 'publico'::"text" NOT NULL,
    CONSTRAINT "preferencias_privacidade_avaliacao_diario_check" CHECK (("quem_pode_avaliar_diario" = ANY (ARRAY['todos'::"text", 'seguidores'::"text", 'ninguem'::"text"]))),
    CONSTRAINT "preferencias_privacidade_comentarios_check" CHECK (("quem_pode_comentar_diario" = ANY (ARRAY['todos'::"text", 'seguidores'::"text", 'ninguem'::"text"]))),
    CONSTRAINT "preferencias_privacidade_comentarios_diario_check" CHECK (("quem_pode_comentar_diario" = ANY (ARRAY['todos'::"text", 'seguidores'::"text", 'seguindo'::"text", 'ninguem'::"text"]))),
    CONSTRAINT "preferencias_privacidade_visibilidade_atividades_check" CHECK (("visibilidade_atividades" = ANY (ARRAY['publico'::"text", 'seguidores'::"text", 'seguindo'::"text", 'somente_eu'::"text"]))),
    CONSTRAINT "preferencias_privacidade_visibilidade_avaliacao_diario_check" CHECK (("visibilidade_avaliacao_diario" = ANY (ARRAY['publico'::"text", 'seguidores'::"text", 'seguindo'::"text", 'somente_eu'::"text"]))),
    CONSTRAINT "preferencias_privacidade_visibilidade_biblioteca_check" CHECK (("visibilidade_biblioteca" = ANY (ARRAY['publico'::"text", 'seguidores'::"text", 'seguindo'::"text", 'somente_eu'::"text"]))),
    CONSTRAINT "preferencias_privacidade_visibilidade_comunidade_check" CHECK (("visibilidade_comunidade" = ANY (ARRAY['publico'::"text", 'seguidores'::"text", 'seguindo'::"text", 'somente_eu'::"text"]))),
    CONSTRAINT "preferencias_privacidade_visibilidade_diario_check" CHECK (("visibilidade_diario" = ANY (ARRAY['publico'::"text", 'seguidores'::"text", 'seguindo'::"text", 'somente_eu'::"text"]))),
    CONSTRAINT "preferencias_privacidade_visibilidade_obras_check" CHECK (("visibilidade_obras" = ANY (ARRAY['publico'::"text", 'seguidores'::"text", 'seguindo'::"text", 'somente_eu'::"text"]))),
    CONSTRAINT "preferencias_privacidade_visibilidade_sobre_check" CHECK (("visibilidade_sobre" = ANY (ARRAY['publico'::"text", 'seguidores'::"text", 'seguindo'::"text", 'somente_eu'::"text"])))
);


ALTER TABLE "public"."preferencias_privacidade" OWNER TO "postgres";


COMMENT ON COLUMN "public"."preferencias_privacidade"."quem_pode_comentar_diario" IS 'Quem pode comentar no Diário: todos, seguidores, seguindo ou ninguem.';



COMMENT ON COLUMN "public"."preferencias_privacidade"."mostrar_obras_para_todos" IS 'Quando verdadeiro, qualquer visitante pode visualizar a aba Obras do perfil.';



COMMENT ON COLUMN "public"."preferencias_privacidade"."mostrar_sobre_para_todos" IS 'Quando verdadeiro, qualquer visitante pode visualizar a aba Sobre do perfil.';



COMMENT ON COLUMN "public"."preferencias_privacidade"."visibilidade_obras" IS 'Visibilidade da aba Obras: publico, seguidores, seguindo ou somente_eu.';



COMMENT ON COLUMN "public"."preferencias_privacidade"."visibilidade_sobre" IS 'Visibilidade da aba Sobre: publico, seguidores, seguindo ou somente_eu.';



COMMENT ON COLUMN "public"."preferencias_privacidade"."visibilidade_diario" IS 'Visibilidade da aba Diário: publico, seguidores, seguindo ou somente_eu.';



COMMENT ON COLUMN "public"."preferencias_privacidade"."visibilidade_comunidade" IS 'Visibilidade da aba Comunidade: publico, seguidores, seguindo ou somente_eu.';



COMMENT ON COLUMN "public"."preferencias_privacidade"."visibilidade_biblioteca" IS 'Visibilidade da aba Biblioteca: publico, seguidores, seguindo ou somente_eu.';



COMMENT ON COLUMN "public"."preferencias_privacidade"."visibilidade_atividades" IS 'Visibilidade das atividades: publico, seguidores, seguindo ou somente_eu.';



COMMENT ON COLUMN "public"."preferencias_privacidade"."mostrar_avaliacao_diario" IS 'Define se a média pública da Avaliação do Diário pode ser exibida.';



COMMENT ON COLUMN "public"."preferencias_privacidade"."permitir_avaliacao_diario" IS 'Define se novas avaliações do Diário estão habilitadas.';



COMMENT ON COLUMN "public"."preferencias_privacidade"."quem_pode_avaliar_diario" IS 'Quem pode avaliar o Diário: todos, seguidores ou ninguem.';



COMMENT ON COLUMN "public"."preferencias_privacidade"."visibilidade_avaliacao_diario" IS 'Quem pode ver a média e as estrelas do Diário: publico, seguidores, seguindo ou somente_eu.';



CREATE TABLE IF NOT EXISTS "public"."problemas_tecnicos" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "email_contato" "text" DEFAULT ''::"text" NOT NULL,
    "categoria" "text" DEFAULT 'outro'::"text" NOT NULL,
    "titulo" "text" NOT NULL,
    "descricao" "text" NOT NULL,
    "pagina_url" "text" DEFAULT ''::"text" NOT NULL,
    "navegador" "text" DEFAULT ''::"text" NOT NULL,
    "dispositivo" "text" DEFAULT ''::"text" NOT NULL,
    "status" "text" DEFAULT 'aberto'::"text" NOT NULL,
    "prioridade" "text" DEFAULT 'normal'::"text" NOT NULL,
    "observacao_admin" "text" DEFAULT ''::"text" NOT NULL,
    "analisado_por" "uuid",
    "analisado_em" timestamp with time zone,
    "criado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    "atualizado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "problemas_tecnicos_categoria_check" CHECK (("categoria" = ANY (ARRAY['conta_acesso'::"text", 'publicacao'::"text", 'leitura'::"text", 'comunidade'::"text", 'diario'::"text", 'notificacoes'::"text", 'privacidade'::"text", 'desempenho'::"text", 'outro'::"text"]))),
    CONSTRAINT "problemas_tecnicos_descricao_tamanho_check" CHECK ((("char_length"("descricao") >= 20) AND ("char_length"("descricao") <= 3000))),
    CONSTRAINT "problemas_tecnicos_dispositivo_tamanho_check" CHECK (("char_length"("dispositivo") <= 160)),
    CONSTRAINT "problemas_tecnicos_email_tamanho_check" CHECK (("char_length"("email_contato") <= 320)),
    CONSTRAINT "problemas_tecnicos_navegador_tamanho_check" CHECK (("char_length"("navegador") <= 500)),
    CONSTRAINT "problemas_tecnicos_observacao_tamanho_check" CHECK (("char_length"("observacao_admin") <= 3000)),
    CONSTRAINT "problemas_tecnicos_pagina_url_tamanho_check" CHECK (("char_length"("pagina_url") <= 700)),
    CONSTRAINT "problemas_tecnicos_prioridade_check" CHECK (("prioridade" = ANY (ARRAY['baixa'::"text", 'normal'::"text", 'alta'::"text", 'urgente'::"text"]))),
    CONSTRAINT "problemas_tecnicos_status_check" CHECK (("status" = ANY (ARRAY['aberto'::"text", 'em_analise'::"text", 'aguardando_usuario'::"text", 'resolvido'::"text", 'fechado'::"text"]))),
    CONSTRAINT "problemas_tecnicos_titulo_tamanho_check" CHECK ((("char_length"("titulo") >= 8) AND ("char_length"("titulo") <= 120)))
);


ALTER TABLE "public"."problemas_tecnicos" OWNER TO "postgres";


COMMENT ON TABLE "public"."problemas_tecnicos" IS 'Chamados de falhas técnicas separados das denúncias de violações das regras.';



CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "nome" "text" DEFAULT ''::"text" NOT NULL,
    "avatar_url" "text" DEFAULT ''::"text" NOT NULL,
    "bio" "text" DEFAULT ''::"text" NOT NULL,
    "tipo" "text" DEFAULT 'leitor'::"text" NOT NULL,
    "criado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    "atualizado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    "is_admin" boolean DEFAULT false NOT NULL,
    "sobre_bio" "text",
    "username" "text",
    "termos_uso_versao" "text",
    "termos_uso_aceitos_em" timestamp with time zone,
    "diretrizes_comunidade_versao" "text",
    "diretrizes_comunidade_aceitas_em" timestamp with time zone,
    "politica_privacidade_versao" "text",
    "politica_privacidade_ciente_em" timestamp with time zone,
    CONSTRAINT "profiles_nome_check" CHECK (("char_length"(TRIM(BOTH FROM "nome")) >= 1)),
    CONSTRAINT "profiles_tipo_check" CHECK (("tipo" = ANY (ARRAY['leitor'::"text", 'autor'::"text"])))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


COMMENT ON COLUMN "public"."profiles"."termos_uso_versao" IS 'Versão dos Termos de Uso aceita pelo usuário.';



COMMENT ON COLUMN "public"."profiles"."termos_uso_aceitos_em" IS 'Data e hora em que o usuário aceitou os Termos de Uso.';



COMMENT ON COLUMN "public"."profiles"."diretrizes_comunidade_versao" IS 'Versão das Diretrizes da Comunidade aceita pelo usuário.';



COMMENT ON COLUMN "public"."profiles"."diretrizes_comunidade_aceitas_em" IS 'Data e hora em que o usuário aceitou as Diretrizes da Comunidade.';



COMMENT ON COLUMN "public"."profiles"."politica_privacidade_versao" IS 'Versão da Política de Privacidade apresentada ao usuário.';



COMMENT ON COLUMN "public"."profiles"."politica_privacidade_ciente_em" IS 'Data e hora em que o usuário confirmou ciência da Política de Privacidade.';



CREATE TABLE IF NOT EXISTS "public"."progresso_leitura" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "obra_id" "uuid" NOT NULL,
    "capitulo_id" "uuid",
    "progresso" integer DEFAULT 0 NOT NULL,
    "lido" boolean DEFAULT false NOT NULL,
    "criado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    "atualizado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    "visibilidade" "text" DEFAULT 'privado'::"text" NOT NULL,
    CONSTRAINT "progresso_leitura_progresso_check" CHECK ((("progresso" >= 0) AND ("progresso" <= 100))),
    CONSTRAINT "progresso_leitura_visibilidade_check" CHECK (("visibilidade" = ANY (ARRAY['publico'::"text", 'parcial'::"text", 'privado'::"text"])))
);


ALTER TABLE "public"."progresso_leitura" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."salvos_capitulos" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "capitulo_id" "uuid" NOT NULL,
    "criado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    "obra_id" "uuid"
);


ALTER TABLE "public"."salvos_capitulos" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."seguindo_autores" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "autor_nome" "text" NOT NULL,
    "criado_em" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."seguindo_autores" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."seguindo_obras" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "obra_id" "uuid" NOT NULL,
    "criado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    "visibilidade" "text" DEFAULT 'privado'::"text" NOT NULL,
    CONSTRAINT "seguindo_obras_visibilidade_check" CHECK (("visibilidade" = ANY (ARRAY['publico'::"text", 'parcial'::"text", 'privado'::"text"])))
);


ALTER TABLE "public"."seguindo_obras" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."seguindo_usuarios" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "seguidor_id" "uuid" NOT NULL,
    "seguido_id" "uuid" NOT NULL,
    "criado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "seguindo_usuarios_nao_seguir_si" CHECK (("seguidor_id" <> "seguido_id")),
    CONSTRAINT "seguindo_usuarios_nao_seguir_si_mesmo" CHECK (("seguidor_id" <> "seguido_id"))
);


ALTER TABLE "public"."seguindo_usuarios" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."solicitacoes_exclusao_conta" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" "text" NOT NULL,
    "motivo" "text",
    "origem" "text" DEFAULT 'pagina_publica'::"text" NOT NULL,
    "status" "text" DEFAULT 'pendente'::"text" NOT NULL,
    "user_agent" "text",
    "criada_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    "atualizada_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    "processada_em" timestamp with time zone,
    "observacao_interna" "text",
    CONSTRAINT "solicitacoes_exclusao_conta_email_check" CHECK ((("char_length"("email") >= 3) AND ("char_length"("email") <= 254))),
    CONSTRAINT "solicitacoes_exclusao_conta_motivo_check" CHECK ((("motivo" IS NULL) OR ("char_length"("motivo") <= 1000))),
    CONSTRAINT "solicitacoes_exclusao_conta_origem_check" CHECK (("origem" = ANY (ARRAY['pagina_publica'::"text", 'suporte'::"text", 'administracao'::"text"]))),
    CONSTRAINT "solicitacoes_exclusao_conta_status_check" CHECK (("status" = ANY (ARRAY['pendente'::"text", 'verificando'::"text", 'concluida'::"text", 'recusada'::"text", 'cancelada'::"text"])))
);


ALTER TABLE "public"."solicitacoes_exclusao_conta" OWNER TO "postgres";


COMMENT ON TABLE "public"."solicitacoes_exclusao_conta" IS 'Fila privada para solicitações de exclusão recebidas fora da conta autenticada. A identidade deve ser verificada antes do processamento manual.';



CREATE TABLE IF NOT EXISTS "public"."solicitacoes_seguidores" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "solicitante_id" "uuid" NOT NULL,
    "destinatario_id" "uuid" NOT NULL,
    "criado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    "atualizado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "solicitacoes_seguidores_usuarios_diferentes_check" CHECK (("solicitante_id" <> "destinatario_id"))
);


ALTER TABLE "public"."solicitacoes_seguidores" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."top5_curtidas" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "perfil_user_id" "uuid" NOT NULL,
    "usuario_id" "uuid" NOT NULL,
    "criado_em" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."top5_curtidas" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."usuarios_bloqueados" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "bloqueador_id" "uuid" NOT NULL,
    "bloqueado_id" "uuid" NOT NULL,
    "criado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "usuarios_bloqueados_usuarios_diferentes_check" CHECK (("bloqueador_id" <> "bloqueado_id"))
);


ALTER TABLE "public"."usuarios_bloqueados" OWNER TO "postgres";


COMMENT ON TABLE "public"."usuarios_bloqueados" IS 'Relações privadas de bloqueio. Somente o bloqueador consulta sua lista.';



ALTER TABLE ONLY "public"."autor_avaliacoes"
    ADD CONSTRAINT "autor_avaliacoes_autor_user_unique" UNIQUE ("autor_id", "user_id");



ALTER TABLE ONLY "public"."autor_avaliacoes"
    ADD CONSTRAINT "autor_avaliacoes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."capitulo_visualizacoes_unicas"
    ADD CONSTRAINT "capitulo_visualizacoes_unicas_pkey" PRIMARY KEY ("capitulo_id", "chave_visitante", "dia");



ALTER TABLE ONLY "public"."capitulos"
    ADD CONSTRAINT "capitulos_obra_id_ordem_key" UNIQUE ("obra_id", "ordem");



ALTER TABLE ONLY "public"."capitulos"
    ADD CONSTRAINT "capitulos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."comentarios_capitulos_curtidas"
    ADD CONSTRAINT "comentarios_capitulos_curtidas_pkey" PRIMARY KEY ("comentario_id", "usuario_id");



ALTER TABLE ONLY "public"."comentarios_capitulos"
    ADD CONSTRAINT "comentarios_capitulos_pkey" PRIMARY KEY ("id");



ALTER TABLE "public"."comentarios_obras"
    ADD CONSTRAINT "comentarios_obras_comentario_tamanho_check" CHECK ((("char_length"("btrim"("comentario")) >= 2) AND ("char_length"("btrim"("comentario")) <= 600))) NOT VALID;



ALTER TABLE ONLY "public"."comentarios_obras_curtidas"
    ADD CONSTRAINT "comentarios_obras_curtidas_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."comentarios_obras"
    ADD CONSTRAINT "comentarios_obras_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."comunidade_comentario_curtidas"
    ADD CONSTRAINT "comunidade_comentario_curtidas_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."comunidade_comentario_curtidas"
    ADD CONSTRAINT "comunidade_comentario_curtidas_unica_por_usuario" UNIQUE ("comentario_id", "usuario_id");



ALTER TABLE ONLY "public"."comunidade_comentario_curtidas"
    ADD CONSTRAINT "comunidade_comentario_curtidas_usuario_comentario_unique" UNIQUE ("usuario_id", "comentario_id");



ALTER TABLE ONLY "public"."comunidade_comentarios"
    ADD CONSTRAINT "comunidade_comentarios_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."comunidade_comentarios_salvos"
    ADD CONSTRAINT "comunidade_comentarios_salvos_pkey" PRIMARY KEY ("comentario_id", "usuario_id");



ALTER TABLE ONLY "public"."comunidade_curtidas"
    ADD CONSTRAINT "comunidade_curtidas_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."comunidade_curtidas"
    ADD CONSTRAINT "comunidade_curtidas_unica_por_usuario" UNIQUE ("post_id", "usuario_id");



ALTER TABLE ONLY "public"."comunidade_denuncias"
    ADD CONSTRAINT "comunidade_denuncias_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."comunidade_denuncias"
    ADD CONSTRAINT "comunidade_denuncias_unica_por_usuario" UNIQUE ("alvo_tipo", "alvo_id", "denunciante_id");



ALTER TABLE ONLY "public"."comunidade_enquete_votos"
    ADD CONSTRAINT "comunidade_enquete_votos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."comunidade_enquete_votos"
    ADD CONSTRAINT "comunidade_enquete_votos_post_id_user_id_key" UNIQUE ("post_id", "user_id");



ALTER TABLE ONLY "public"."comunidade_enquete_votos"
    ADD CONSTRAINT "comunidade_enquete_votos_user_post_unique" UNIQUE ("user_id", "post_id");



ALTER TABLE ONLY "public"."comunidade_post_salvos"
    ADD CONSTRAINT "comunidade_post_salvos_pkey" PRIMARY KEY ("post_id", "usuario_id");



ALTER TABLE ONLY "public"."comunidade_posts"
    ADD CONSTRAINT "comunidade_posts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."comunidade_salvos"
    ADD CONSTRAINT "comunidade_salvos_pkey" PRIMARY KEY ("post_id", "usuario_id");



ALTER TABLE ONLY "public"."concluidas"
    ADD CONSTRAINT "concluidas_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."concluidas"
    ADD CONSTRAINT "concluidas_user_id_obra_id_key" UNIQUE ("user_id", "obra_id");



ALTER TABLE ONLY "public"."curtidas_capitulos"
    ADD CONSTRAINT "curtidas_capitulos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."curtidas_capitulos"
    ADD CONSTRAINT "curtidas_capitulos_user_id_capitulo_id_key" UNIQUE ("user_id", "capitulo_id");



ALTER TABLE ONLY "public"."denuncias_perfis"
    ADD CONSTRAINT "denuncias_perfis_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."diario_anotacao_comentarios"
    ADD CONSTRAINT "diario_anotacao_comentarios_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."diario_anotacao_curtidas"
    ADD CONSTRAINT "diario_anotacao_curtidas_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."diario_anotacao_curtidas"
    ADD CONSTRAINT "diario_anotacao_curtidas_usuario_unico" UNIQUE ("anotacao_id", "user_id");



ALTER TABLE ONLY "public"."diario_anotacoes"
    ADD CONSTRAINT "diario_anotacoes_pkey" PRIMARY KEY ("id");



ALTER TABLE "public"."diario_anotacoes"
    ADD CONSTRAINT "diario_anotacoes_texto_tamanho_check" CHECK ((("char_length"("btrim"(COALESCE("texto", ''::"text"))) >= 1) AND ("char_length"("btrim"(COALESCE("texto", ''::"text"))) <= 700))) NOT VALID;



ALTER TABLE ONLY "public"."diario_atividades"
    ADD CONSTRAINT "diario_atividades_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."diario_avaliacoes"
    ADD CONSTRAINT "diario_avaliacoes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."diario_avaliacoes"
    ADD CONSTRAINT "diario_avaliacoes_usuario_avaliador_unique" UNIQUE ("diario_user_id", "avaliador_id");



ALTER TABLE ONLY "public"."diario_comentario_curtidas"
    ADD CONSTRAINT "diario_comentario_curtidas_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."diario_comentario_curtidas"
    ADD CONSTRAINT "diario_comentario_curtidas_unique" UNIQUE ("comentario_id", "user_id");



ALTER TABLE "public"."diario_anotacao_comentarios"
    ADD CONSTRAINT "diario_comentarios_texto_tamanho_check" CHECK ((("char_length"("btrim"(COALESCE("texto", ''::"text"))) >= 1) AND ("char_length"("btrim"(COALESCE("texto", ''::"text"))) <= 700))) NOT VALID;



ALTER TABLE ONLY "public"."diario_configuracoes"
    ADD CONSTRAINT "diario_configuracoes_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."favoritos"
    ADD CONSTRAINT "favoritos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."favoritos"
    ADD CONSTRAINT "favoritos_user_id_obra_id_key" UNIQUE ("user_id", "obra_id");



ALTER TABLE ONLY "public"."notificacoes"
    ADD CONSTRAINT "notificacoes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."obra_avaliacoes"
    ADD CONSTRAINT "obra_avaliacoes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."obra_avaliacoes"
    ADD CONSTRAINT "obra_avaliacoes_unica_por_usuario" UNIQUE ("obra_id", "user_id");



ALTER TABLE ONLY "public"."obra_avaliacoes"
    ADD CONSTRAINT "obra_avaliacoes_user_obra_unique" UNIQUE ("user_id", "obra_id");



ALTER TABLE ONLY "public"."obra_comentario_curtidas"
    ADD CONSTRAINT "obra_comentario_curtidas_pkey" PRIMARY KEY ("comentario_id", "usuario_id");



ALTER TABLE ONLY "public"."obra_comentarios"
    ADD CONSTRAINT "obra_comentarios_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."obra_curtidas"
    ADD CONSTRAINT "obra_curtidas_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."obra_curtidas"
    ADD CONSTRAINT "obra_curtidas_unica_por_usuario" UNIQUE ("obra_id", "user_id");



ALTER TABLE ONLY "public"."obra_curtidas"
    ADD CONSTRAINT "obra_curtidas_user_obra_unique" UNIQUE ("user_id", "obra_id");



ALTER TABLE ONLY "public"."obra_visualizacoes_unicas"
    ADD CONSTRAINT "obra_visualizacoes_unicas_pkey" PRIMARY KEY ("obra_id", "chave_visitante", "dia");



ALTER TABLE ONLY "public"."obras"
    ADD CONSTRAINT "obras_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."obras"
    ADD CONSTRAINT "obras_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."operacoes_exclusao_conta"
    ADD CONSTRAINT "operacoes_exclusao_conta_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."operacoes_exclusao_conta"
    ADD CONSTRAINT "operacoes_exclusao_conta_subject_user_id_key" UNIQUE ("subject_user_id");



ALTER TABLE ONLY "public"."preferencias_privacidade"
    ADD CONSTRAINT "preferencias_privacidade_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."problemas_tecnicos"
    ADD CONSTRAINT "problemas_tecnicos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_user_id_key" UNIQUE ("user_id");



ALTER TABLE "public"."progresso_leitura"
    ADD CONSTRAINT "progresso_leitura_capitulo_id_obrigatorio" CHECK (("capitulo_id" IS NOT NULL)) NOT VALID;



ALTER TABLE ONLY "public"."progresso_leitura"
    ADD CONSTRAINT "progresso_leitura_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."progresso_leitura"
    ADD CONSTRAINT "progresso_leitura_user_obra_capitulo_key" UNIQUE ("user_id", "obra_id", "capitulo_id");



ALTER TABLE ONLY "public"."salvos_capitulos"
    ADD CONSTRAINT "salvos_capitulos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."salvos_capitulos"
    ADD CONSTRAINT "salvos_capitulos_user_id_capitulo_id_key" UNIQUE ("user_id", "capitulo_id");



ALTER TABLE ONLY "public"."seguindo_autores"
    ADD CONSTRAINT "seguindo_autores_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."seguindo_autores"
    ADD CONSTRAINT "seguindo_autores_user_id_autor_nome_key" UNIQUE ("user_id", "autor_nome");



ALTER TABLE ONLY "public"."seguindo_obras"
    ADD CONSTRAINT "seguindo_obras_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."seguindo_obras"
    ADD CONSTRAINT "seguindo_obras_user_id_obra_id_key" UNIQUE ("user_id", "obra_id");



ALTER TABLE ONLY "public"."seguindo_usuarios"
    ADD CONSTRAINT "seguindo_usuarios_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."seguindo_usuarios"
    ADD CONSTRAINT "seguindo_usuarios_unico" UNIQUE ("seguidor_id", "seguido_id");



ALTER TABLE ONLY "public"."solicitacoes_exclusao_conta"
    ADD CONSTRAINT "solicitacoes_exclusao_conta_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."solicitacoes_seguidores"
    ADD CONSTRAINT "solicitacoes_seguidores_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."solicitacoes_seguidores"
    ADD CONSTRAINT "solicitacoes_seguidores_relacao_unique" UNIQUE ("solicitante_id", "destinatario_id");



ALTER TABLE ONLY "public"."top5_curtidas"
    ADD CONSTRAINT "top5_curtidas_perfil_user_id_usuario_id_key" UNIQUE ("perfil_user_id", "usuario_id");



ALTER TABLE ONLY "public"."top5_curtidas"
    ADD CONSTRAINT "top5_curtidas_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."usuarios_bloqueados"
    ADD CONSTRAINT "usuarios_bloqueados_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."usuarios_bloqueados"
    ADD CONSTRAINT "usuarios_bloqueados_relacao_unique" UNIQUE ("bloqueador_id", "bloqueado_id");



CREATE INDEX "autor_avaliacoes_autor_id_idx" ON "public"."autor_avaliacoes" USING "btree" ("autor_id");



CREATE INDEX "autor_avaliacoes_user_id_idx" ON "public"."autor_avaliacoes" USING "btree" ("user_id");



CREATE INDEX "capitulo_visualizacoes_unicas_dia_idx" ON "public"."capitulo_visualizacoes_unicas" USING "btree" ("dia" DESC);



CREATE INDEX "capitulos_publicado_obra_ordem_idx" ON "public"."capitulos" USING "btree" ("publicado", "obra_id", "ordem");



CREATE INDEX "capitulos_user_id_idx" ON "public"."capitulos" USING "btree" ("user_id");



CREATE INDEX "capitulos_visualizacoes_idx" ON "public"."capitulos" USING "btree" ("visualizacoes" DESC);



CREATE INDEX "comentarios_capitulos_capitulo_id_idx" ON "public"."comentarios_capitulos" USING "btree" ("capitulo_id");



CREATE INDEX "comentarios_capitulos_comentario_pai_id_idx" ON "public"."comentarios_capitulos" USING "btree" ("comentario_pai_id", "criado_em");



CREATE INDEX "comentarios_capitulos_curtidas_comentario_id_idx" ON "public"."comentarios_capitulos_curtidas" USING "btree" ("comentario_id");



CREATE UNIQUE INDEX "comentarios_capitulos_curtidas_comentario_usuario_uidx" ON "public"."comentarios_capitulos_curtidas" USING "btree" ("comentario_id", "usuario_id");



CREATE INDEX "comentarios_capitulos_curtidas_usuario_id_idx" ON "public"."comentarios_capitulos_curtidas" USING "btree" ("usuario_id");



CREATE INDEX "comentarios_obras_comentario_pai_id_idx" ON "public"."comentarios_obras" USING "btree" ("comentario_pai_id", "criado_em");



CREATE INDEX "comentarios_obras_curtidas_comentario_id_idx" ON "public"."comentarios_obras_curtidas" USING "btree" ("comentario_id");



CREATE UNIQUE INDEX "comentarios_obras_curtidas_comentario_usuario_uidx" ON "public"."comentarios_obras_curtidas" USING "btree" ("comentario_id", "usuario_id");



CREATE INDEX "comentarios_obras_curtidas_usuario_id_idx" ON "public"."comentarios_obras_curtidas" USING "btree" ("usuario_id");



CREATE INDEX "comentarios_obras_obra_criado_em_idx" ON "public"."comentarios_obras" USING "btree" ("obra_id", "criado_em" DESC);



CREATE INDEX "comentarios_obras_user_id_idx" ON "public"."comentarios_obras" USING "btree" ("user_id");



CREATE INDEX "comunidade_comentario_curtidas_comentario_id_idx" ON "public"."comunidade_comentario_curtidas" USING "btree" ("comentario_id");



CREATE UNIQUE INDEX "comunidade_comentario_curtidas_comentario_usuario_uidx" ON "public"."comunidade_comentario_curtidas" USING "btree" ("comentario_id", "usuario_id");



CREATE UNIQUE INDEX "comunidade_comentario_curtidas_unica_idx" ON "public"."comunidade_comentario_curtidas" USING "btree" ("comentario_id", "usuario_id");



CREATE INDEX "comunidade_comentarios_autor_id_idx" ON "public"."comunidade_comentarios" USING "btree" ("autor_id");



CREATE INDEX "comunidade_comentarios_comentario_pai_id_idx" ON "public"."comunidade_comentarios" USING "btree" ("comentario_pai_id", "criado_em");



CREATE INDEX "comunidade_comentarios_post_id_idx" ON "public"."comunidade_comentarios" USING "btree" ("post_id", "criado_em");



CREATE INDEX "comunidade_comentarios_salvos_comentario_id_idx" ON "public"."comunidade_comentarios_salvos" USING "btree" ("comentario_id");



CREATE UNIQUE INDEX "comunidade_comentarios_salvos_unico_idx" ON "public"."comunidade_comentarios_salvos" USING "btree" ("comentario_id", "usuario_id");



CREATE INDEX "comunidade_curtidas_post_id_idx" ON "public"."comunidade_curtidas" USING "btree" ("post_id");



CREATE UNIQUE INDEX "comunidade_curtidas_post_usuario_uidx" ON "public"."comunidade_curtidas" USING "btree" ("post_id", "usuario_id");



CREATE UNIQUE INDEX "comunidade_curtidas_unica_idx" ON "public"."comunidade_curtidas" USING "btree" ("post_id", "usuario_id");



CREATE INDEX "comunidade_denuncias_alvo_idx" ON "public"."comunidade_denuncias" USING "btree" ("alvo_tipo", "alvo_id");



CREATE UNIQUE INDEX "comunidade_denuncias_ativa_uidx" ON "public"."comunidade_denuncias" USING "btree" ("alvo_tipo", "alvo_id", "denunciante_id") WHERE ("status" = ANY (ARRAY['pendente'::"text", 'em_analise'::"text"]));



CREATE INDEX "comunidade_denuncias_criado_em_idx" ON "public"."comunidade_denuncias" USING "btree" ("criado_em" DESC);



CREATE INDEX "comunidade_denuncias_denunciante_criado_idx" ON "public"."comunidade_denuncias" USING "btree" ("denunciante_id", "criado_em" DESC);



CREATE INDEX "comunidade_denuncias_denunciante_id_idx" ON "public"."comunidade_denuncias" USING "btree" ("denunciante_id");



CREATE INDEX "comunidade_denuncias_status_arquivada_criado_idx" ON "public"."comunidade_denuncias" USING "btree" ("status", "arquivada", "criado_em" DESC);



CREATE INDEX "comunidade_denuncias_status_idx" ON "public"."comunidade_denuncias" USING "btree" ("status");



CREATE INDEX "comunidade_enquete_votos_post_id_idx" ON "public"."comunidade_enquete_votos" USING "btree" ("post_id");



CREATE UNIQUE INDEX "comunidade_enquete_votos_post_usuario_uidx" ON "public"."comunidade_enquete_votos" USING "btree" ("post_id", "user_id");



CREATE UNIQUE INDEX "comunidade_enquete_votos_unico_idx" ON "public"."comunidade_enquete_votos" USING "btree" ("post_id", "user_id");



CREATE INDEX "comunidade_post_salvos_post_id_idx" ON "public"."comunidade_post_salvos" USING "btree" ("post_id");



CREATE UNIQUE INDEX "comunidade_post_salvos_post_usuario_uidx" ON "public"."comunidade_post_salvos" USING "btree" ("post_id", "user_id");



CREATE UNIQUE INDEX "comunidade_post_salvos_unico_idx" ON "public"."comunidade_post_salvos" USING "btree" ("post_id", "user_id");



CREATE INDEX "comunidade_posts_autor_id_idx" ON "public"."comunidade_posts" USING "btree" ("autor_id");



CREATE INDEX "comunidade_posts_autor_visibilidade_criado_idx" ON "public"."comunidade_posts" USING "btree" ("autor_id", "visibilidade", "criado_em" DESC);



CREATE INDEX "comunidade_posts_criado_em_idx" ON "public"."comunidade_posts" USING "btree" ("criado_em" DESC);



CREATE INDEX "comunidade_posts_fixado_idx" ON "public"."comunidade_posts" USING "btree" ("fixado", "fixado_em" DESC);



CREATE INDEX "comunidade_posts_visibilidade_idx" ON "public"."comunidade_posts" USING "btree" ("visibilidade");



CREATE INDEX "comunidade_salvos_post_id_idx" ON "public"."comunidade_salvos" USING "btree" ("post_id");



CREATE UNIQUE INDEX "comunidade_salvos_post_usuario_uidx" ON "public"."comunidade_salvos" USING "btree" ("post_id", "user_id");



CREATE UNIQUE INDEX "comunidade_salvos_unico_idx" ON "public"."comunidade_salvos" USING "btree" ("post_id", "user_id");



CREATE INDEX "concluidas_user_criado_idx" ON "public"."concluidas" USING "btree" ("user_id", "criado_em" DESC);



CREATE UNIQUE INDEX "concluidas_user_id_obra_id_unique" ON "public"."concluidas" USING "btree" ("user_id", "obra_id");



CREATE INDEX "curtidas_capitulos_capitulo_id_idx" ON "public"."curtidas_capitulos" USING "btree" ("capitulo_id");



CREATE UNIQUE INDEX "denuncias_perfis_ativa_uidx" ON "public"."denuncias_perfis" USING "btree" ("denunciante_id", "denunciado_id") WHERE ("status" = ANY (ARRAY['pendente'::"text", 'analisada'::"text"]));



CREATE INDEX "denuncias_perfis_criado_em_idx" ON "public"."denuncias_perfis" USING "btree" ("criado_em" DESC);



CREATE INDEX "denuncias_perfis_denunciado_id_idx" ON "public"."denuncias_perfis" USING "btree" ("denunciado_id");



CREATE INDEX "denuncias_perfis_denunciado_idx" ON "public"."denuncias_perfis" USING "btree" ("denunciado_id");



CREATE INDEX "denuncias_perfis_denunciante_id_idx" ON "public"."denuncias_perfis" USING "btree" ("denunciante_id");



CREATE INDEX "denuncias_perfis_denunciante_idx" ON "public"."denuncias_perfis" USING "btree" ("denunciante_id");



CREATE INDEX "denuncias_perfis_status_idx" ON "public"."denuncias_perfis" USING "btree" ("status");



CREATE INDEX "diario_anotacao_comentarios_anotacao_data_idx" ON "public"."diario_anotacao_comentarios" USING "btree" ("anotacao_id", "criado_em");



CREATE INDEX "diario_anotacao_comentarios_usuario_idx" ON "public"."diario_anotacao_comentarios" USING "btree" ("user_id");



CREATE INDEX "diario_anotacao_curtidas_anotacao_idx" ON "public"."diario_anotacao_curtidas" USING "btree" ("anotacao_id");



CREATE INDEX "diario_anotacao_curtidas_usuario_idx" ON "public"."diario_anotacao_curtidas" USING "btree" ("user_id");



CREATE INDEX "diario_anotacoes_obra_idx" ON "public"."diario_anotacoes" USING "btree" ("obra_id");



CREATE INDEX "diario_anotacoes_usuario_atualizado_idx" ON "public"."diario_anotacoes" USING "btree" ("user_id", "atualizado_em" DESC);



CREATE UNIQUE INDEX "diario_anotacoes_usuario_obra_tipo_uidx" ON "public"."diario_anotacoes" USING "btree" ("user_id", "obra_id", "tipo");



CREATE UNIQUE INDEX "diario_anotacoes_usuario_obra_tipo_unico" ON "public"."diario_anotacoes" USING "btree" ("user_id", "obra_id", "tipo");



CREATE INDEX "diario_atividades_capitulo_idx" ON "public"."diario_atividades" USING "btree" ("capitulo_id") WHERE ("capitulo_id" IS NOT NULL);



CREATE INDEX "diario_atividades_metadata_gin_idx" ON "public"."diario_atividades" USING "gin" ("metadata");



CREATE INDEX "diario_atividades_obra_data_idx" ON "public"."diario_atividades" USING "btree" ("obra_id", "criado_em" DESC) WHERE ("obra_id" IS NOT NULL);



CREATE INDEX "diario_atividades_obra_id_idx" ON "public"."diario_atividades" USING "btree" ("obra_id");



CREATE INDEX "diario_atividades_obra_idx" ON "public"."diario_atividades" USING "btree" ("obra_id", "criado_em" DESC);



CREATE INDEX "diario_atividades_tipo_idx" ON "public"."diario_atividades" USING "btree" ("tipo", "criado_em" DESC);



CREATE INDEX "diario_atividades_user_id_criado_em_idx" ON "public"."diario_atividades" USING "btree" ("user_id", "criado_em" DESC);



CREATE INDEX "diario_atividades_user_idx" ON "public"."diario_atividades" USING "btree" ("user_id", "criado_em" DESC);



CREATE INDEX "diario_atividades_usuario_data_idx" ON "public"."diario_atividades" USING "btree" ("user_id", "criado_em" DESC);



CREATE INDEX "diario_atividades_usuario_tipo_obra_idx" ON "public"."diario_atividades" USING "btree" ("user_id", "tipo", "obra_id");



CREATE INDEX "diario_atividades_visibilidade_data_idx" ON "public"."diario_atividades" USING "btree" ("visibilidade", "criado_em" DESC);



CREATE INDEX "diario_atividades_visibilidade_idx" ON "public"."diario_atividades" USING "btree" ("visibilidade", "criado_em" DESC);



CREATE INDEX "diario_avaliacoes_avaliador_idx" ON "public"."diario_avaliacoes" USING "btree" ("avaliador_id", "atualizado_em" DESC);



CREATE INDEX "diario_avaliacoes_diario_user_idx" ON "public"."diario_avaliacoes" USING "btree" ("diario_user_id", "atualizado_em" DESC);



CREATE INDEX "diario_comentario_curtidas_comentario_idx" ON "public"."diario_comentario_curtidas" USING "btree" ("comentario_id");



CREATE INDEX "diario_comentario_curtidas_user_idx" ON "public"."diario_comentario_curtidas" USING "btree" ("user_id");



CREATE INDEX "diario_comentarios_anotacao_criado_idx" ON "public"."diario_anotacao_comentarios" USING "btree" ("anotacao_id", "criado_em" DESC);



CREATE INDEX "diario_comentarios_parent_idx" ON "public"."diario_anotacao_comentarios" USING "btree" ("parent_id") WHERE ("parent_id" IS NOT NULL);



CREATE INDEX "favoritos_user_criado_idx" ON "public"."favoritos" USING "btree" ("user_id", "criado_em" DESC);



CREATE UNIQUE INDEX "favoritos_user_id_obra_id_unique" ON "public"."favoritos" USING "btree" ("user_id", "obra_id");



CREATE INDEX "notificacoes_capitulo_idx" ON "public"."notificacoes" USING "btree" ("capitulo_id") WHERE ("capitulo_id" IS NOT NULL);



CREATE INDEX "notificacoes_obra_idx" ON "public"."notificacoes" USING "btree" ("obra_id") WHERE ("obra_id" IS NOT NULL);



CREATE INDEX "notificacoes_user_id_criada_em_idx" ON "public"."notificacoes" USING "btree" ("user_id", "criada_em" DESC);



CREATE INDEX "notificacoes_user_id_lida_idx" ON "public"."notificacoes" USING "btree" ("user_id", "lida");



CREATE UNIQUE INDEX "notificacoes_user_notificacao_id_unique" ON "public"."notificacoes" USING "btree" ("user_id", "notificacao_id") WHERE (("notificacao_id" IS NOT NULL) AND ("btrim"("notificacao_id") <> ''::"text"));



CREATE INDEX "notificacoes_usuario_data_idx" ON "public"."notificacoes" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "notificacoes_usuario_lida_data_idx" ON "public"."notificacoes" USING "btree" ("user_id", "lida", "created_at" DESC);



CREATE UNIQUE INDEX "notificacoes_usuario_notificacao_uidx" ON "public"."notificacoes" USING "btree" ("user_id", "notificacao_id");



CREATE INDEX "notificacoes_usuario_tipo_data_idx" ON "public"."notificacoes" USING "btree" ("user_id", "tipo", "created_at" DESC);



CREATE INDEX "obra_avaliacoes_obra_id_idx" ON "public"."obra_avaliacoes" USING "btree" ("obra_id");



CREATE UNIQUE INDEX "obra_avaliacoes_obra_user_unique" ON "public"."obra_avaliacoes" USING "btree" ("obra_id", "user_id");



CREATE INDEX "obra_avaliacoes_user_criado_idx" ON "public"."obra_avaliacoes" USING "btree" ("user_id", "criado_em" DESC);



CREATE INDEX "obra_comentario_curtidas_usuario_id_idx" ON "public"."obra_comentario_curtidas" USING "btree" ("usuario_id");



CREATE INDEX "obra_comentarios_autor_id_idx" ON "public"."obra_comentarios" USING "btree" ("autor_id");



CREATE INDEX "obra_comentarios_obra_id_criado_em_idx" ON "public"."obra_comentarios" USING "btree" ("obra_id", "criado_em");



CREATE INDEX "obra_curtidas_obra_id_idx" ON "public"."obra_curtidas" USING "btree" ("obra_id");



CREATE UNIQUE INDEX "obra_curtidas_user_id_obra_id_unique" ON "public"."obra_curtidas" USING "btree" ("user_id", "obra_id");



CREATE INDEX "obra_visualizacoes_unicas_dia_idx" ON "public"."obra_visualizacoes_unicas" USING "btree" ("dia" DESC);



CREATE INDEX "obras_publicado_criada_em_idx" ON "public"."obras" USING "btree" ("publicado", "criada_em" DESC);



CREATE INDEX "obras_user_id_idx" ON "public"."obras" USING "btree" ("user_id");



CREATE INDEX "obras_visualizacoes_idx" ON "public"."obras" USING "btree" ("visualizacoes" DESC);



CREATE INDEX "operacoes_exclusao_conta_lock_expira_idx" ON "public"."operacoes_exclusao_conta" USING "btree" ("lock_expira_em") WHERE ("lock_expira_em" IS NOT NULL);



CREATE INDEX "operacoes_exclusao_conta_status_atualizada_idx" ON "public"."operacoes_exclusao_conta" USING "btree" ("status", "atualizada_em");



CREATE INDEX "problemas_tecnicos_categoria_data_idx" ON "public"."problemas_tecnicos" USING "btree" ("categoria", "criado_em" DESC);



CREATE INDEX "problemas_tecnicos_status_data_idx" ON "public"."problemas_tecnicos" USING "btree" ("status", "criado_em" DESC);



CREATE INDEX "problemas_tecnicos_usuario_data_idx" ON "public"."problemas_tecnicos" USING "btree" ("user_id", "criado_em" DESC);



CREATE UNIQUE INDEX "profiles_username_unique" ON "public"."profiles" USING "btree" ("lower"("username")) WHERE ("username" IS NOT NULL);



CREATE INDEX "progresso_leitura_user_criado_idx" ON "public"."progresso_leitura" USING "btree" ("user_id", "atualizado_em" DESC);



CREATE INDEX "salvos_capitulos_capitulo_id_idx" ON "public"."salvos_capitulos" USING "btree" ("capitulo_id");



CREATE INDEX "seguindo_obras_obra_id_idx" ON "public"."seguindo_obras" USING "btree" ("obra_id");



CREATE INDEX "seguindo_obras_obra_idx" ON "public"."seguindo_obras" USING "btree" ("obra_id", "criado_em" DESC);



CREATE INDEX "seguindo_obras_user_criado_idx" ON "public"."seguindo_obras" USING "btree" ("user_id", "criado_em" DESC);



CREATE INDEX "seguindo_obras_user_idx" ON "public"."seguindo_obras" USING "btree" ("user_id", "criado_em" DESC);



CREATE INDEX "seguindo_usuarios_seguido_id_idx" ON "public"."seguindo_usuarios" USING "btree" ("seguido_id");



CREATE INDEX "seguindo_usuarios_seguido_idx" ON "public"."seguindo_usuarios" USING "btree" ("seguido_id", "criado_em" DESC);



CREATE INDEX "seguindo_usuarios_seguidor_id_idx" ON "public"."seguindo_usuarios" USING "btree" ("seguidor_id");



CREATE INDEX "seguindo_usuarios_seguidor_idx" ON "public"."seguindo_usuarios" USING "btree" ("seguidor_id", "criado_em" DESC);



CREATE UNIQUE INDEX "seguindo_usuarios_seguidor_seguido_uidx" ON "public"."seguindo_usuarios" USING "btree" ("seguidor_id", "seguido_id");



CREATE UNIQUE INDEX "solicitacoes_exclusao_conta_email_ativa_uidx" ON "public"."solicitacoes_exclusao_conta" USING "btree" ("lower"("email")) WHERE ("status" = ANY (ARRAY['pendente'::"text", 'verificando'::"text"]));



CREATE INDEX "solicitacoes_exclusao_conta_status_criada_idx" ON "public"."solicitacoes_exclusao_conta" USING "btree" ("status", "criada_em" DESC);



CREATE INDEX "solicitacoes_seguidores_destinatario_idx" ON "public"."solicitacoes_seguidores" USING "btree" ("destinatario_id", "criado_em" DESC);



CREATE INDEX "solicitacoes_seguidores_solicitante_idx" ON "public"."solicitacoes_seguidores" USING "btree" ("solicitante_id", "criado_em" DESC);



CREATE INDEX "top5_curtidas_perfil_user_id_idx" ON "public"."top5_curtidas" USING "btree" ("perfil_user_id");



CREATE UNIQUE INDEX "top5_curtidas_unica_idx" ON "public"."top5_curtidas" USING "btree" ("perfil_user_id", "usuario_id");



CREATE INDEX "usuarios_bloqueados_bloqueado_idx" ON "public"."usuarios_bloqueados" USING "btree" ("bloqueado_id", "criado_em" DESC);



CREATE INDEX "usuarios_bloqueados_bloqueador_idx" ON "public"."usuarios_bloqueados" USING "btree" ("bloqueador_id", "criado_em" DESC);



CREATE OR REPLACE TRIGGER "comentarios_capitulos_validar_resposta" BEFORE INSERT OR UPDATE OF "comentario_pai_id", "capitulo_id" ON "public"."comentarios_capitulos" FOR EACH ROW EXECUTE FUNCTION "public"."validar_resposta_comentario_capitulo"();



CREATE OR REPLACE TRIGGER "comentarios_obras_notificar_autor" AFTER INSERT ON "public"."comentarios_obras" FOR EACH ROW EXECUTE FUNCTION "public"."notificar_comentario_obra"();



CREATE OR REPLACE TRIGGER "comentarios_obras_validar_resposta" BEFORE INSERT OR UPDATE OF "comentario_pai_id", "obra_id" ON "public"."comentarios_obras" FOR EACH ROW EXECUTE FUNCTION "public"."validar_resposta_comentario_obra"();



CREATE OR REPLACE TRIGGER "comunidade_comentarios_validar_resposta" BEFORE INSERT OR UPDATE OF "comentario_pai_id", "post_id" ON "public"."comunidade_comentarios" FOR EACH ROW EXECUTE FUNCTION "public"."validar_resposta_comentario_comunidade"();



CREATE OR REPLACE TRIGGER "comunidade_denuncias_validar_integridade" BEFORE INSERT OR UPDATE ON "public"."comunidade_denuncias" FOR EACH ROW EXECUTE FUNCTION "public"."validar_comunidade_denuncia"();



CREATE OR REPLACE TRIGGER "comunidade_post_salvos_sync_user_id" BEFORE INSERT OR UPDATE ON "public"."comunidade_post_salvos" FOR EACH ROW EXECUTE FUNCTION "public"."sincronizar_comunidade_salvos_user_id"();



CREATE OR REPLACE TRIGGER "comunidade_posts_definir_fixacao" BEFORE UPDATE OF "fixado" ON "public"."comunidade_posts" FOR EACH ROW EXECUTE FUNCTION "public"."definir_fixacao_comunidade_post"();



CREATE OR REPLACE TRIGGER "comunidade_salvos_sync_user_id" BEFORE INSERT OR UPDATE ON "public"."comunidade_salvos" FOR EACH ROW EXECUTE FUNCTION "public"."sincronizar_comunidade_salvos_user_id"();



CREATE OR REPLACE TRIGGER "denuncias_perfis_validar_integridade" BEFORE INSERT OR UPDATE ON "public"."denuncias_perfis" FOR EACH ROW EXECUTE FUNCTION "public"."validar_denuncia_perfil"();



CREATE OR REPLACE TRIGGER "diario_anotacao_comentarios_atualizado_em_trigger" BEFORE UPDATE ON "public"."diario_anotacao_comentarios" FOR EACH ROW EXECUTE FUNCTION "public"."atualizar_diario_atualizado_em"();



CREATE OR REPLACE TRIGGER "diario_anotacoes_atualizado_em_trigger" BEFORE UPDATE ON "public"."diario_anotacoes" FOR EACH ROW EXECUTE FUNCTION "public"."atualizar_diario_atualizado_em"();



CREATE OR REPLACE TRIGGER "diario_atividades_atualizado_em_trigger" BEFORE UPDATE ON "public"."diario_atividades" FOR EACH ROW EXECUTE FUNCTION "public"."atualizar_diario_atualizado_em"();



CREATE OR REPLACE TRIGGER "exigir_aceite_termos_publicacao" BEFORE INSERT ON "public"."capitulos" FOR EACH ROW EXECUTE FUNCTION "public"."exigir_aceite_termos_antes_de_publicar"();



CREATE OR REPLACE TRIGGER "exigir_aceite_termos_publicacao" BEFORE INSERT ON "public"."comunidade_posts" FOR EACH ROW EXECUTE FUNCTION "public"."exigir_aceite_termos_antes_de_publicar"();



CREATE OR REPLACE TRIGGER "exigir_aceite_termos_publicacao" BEFORE INSERT ON "public"."obras" FOR EACH ROW EXECUTE FUNCTION "public"."exigir_aceite_termos_antes_de_publicar"();



CREATE OR REPLACE TRIGGER "impedir_autoavaliacao_obra" BEFORE INSERT OR UPDATE OF "obra_id", "user_id" ON "public"."obra_avaliacoes" FOR EACH ROW EXECUTE FUNCTION "public"."bloquear_autoavaliacao_obra"();



CREATE OR REPLACE TRIGGER "notificacoes_evitar_duplicada" BEFORE INSERT ON "public"."notificacoes" FOR EACH ROW EXECUTE FUNCTION "public"."evitar_notificacao_duplicada"();



CREATE OR REPLACE TRIGGER "notificacoes_updated_at_trigger" BEFORE UPDATE ON "public"."notificacoes" FOR EACH ROW EXECUTE FUNCTION "public"."atualizar_notificacoes_updated_at"();



CREATE OR REPLACE TRIGGER "obra_curtidas_notificar_autor" AFTER INSERT ON "public"."obra_curtidas" FOR EACH ROW EXECUTE FUNCTION "public"."notificar_curtida_obra"();



CREATE OR REPLACE TRIGGER "trg_notificar_comentario_post_comunidade" AFTER INSERT ON "public"."comunidade_comentarios" FOR EACH ROW EXECUTE FUNCTION "public"."notificar_comentario_post_comunidade"();



CREATE OR REPLACE TRIGGER "trg_notificar_curtida_comentario_comunidade" AFTER INSERT ON "public"."comunidade_comentario_curtidas" FOR EACH ROW EXECUTE FUNCTION "public"."notificar_curtida_comentario_comunidade"();



CREATE OR REPLACE TRIGGER "trg_notificar_curtida_post_comunidade" AFTER INSERT ON "public"."comunidade_curtidas" FOR EACH ROW EXECUTE FUNCTION "public"."notificar_curtida_post_comunidade"();



CREATE OR REPLACE TRIGGER "trigger_atualizar_fixado_comunidade" BEFORE UPDATE OF "fixado" ON "public"."comunidade_posts" FOR EACH ROW EXECUTE FUNCTION "public"."atualizar_fixado_comunidade"();



CREATE OR REPLACE TRIGGER "trigger_capitulos_atualizado_em" BEFORE UPDATE ON "public"."capitulos" FOR EACH ROW EXECUTE FUNCTION "public"."atualizar_atualizado_em"();



CREATE OR REPLACE TRIGGER "trigger_comunidade_enquete_votos_atualizado_em" BEFORE UPDATE ON "public"."comunidade_enquete_votos" FOR EACH ROW EXECUTE FUNCTION "public"."atualizar_atualizado_em"();



CREATE OR REPLACE TRIGGER "trigger_obras_atualizado_em" BEFORE UPDATE ON "public"."obras" FOR EACH ROW EXECUTE FUNCTION "public"."atualizar_atualizado_em"();



CREATE OR REPLACE TRIGGER "trigger_profiles_atualizado_em" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."atualizar_atualizado_em"();



CREATE OR REPLACE TRIGGER "validar_comentario_diario_trigger" BEFORE INSERT OR UPDATE OF "texto", "anotacao_id", "parent_id" ON "public"."diario_anotacao_comentarios" FOR EACH ROW EXECUTE FUNCTION "public"."validar_comentario_diario"();



CREATE OR REPLACE TRIGGER "validar_operacao_exclusao_conta_trigger" BEFORE INSERT OR UPDATE ON "public"."operacoes_exclusao_conta" FOR EACH ROW EXECUTE FUNCTION "public"."validar_operacao_exclusao_conta"();



CREATE OR REPLACE TRIGGER "validar_problema_tecnico_trigger" BEFORE INSERT OR UPDATE ON "public"."problemas_tecnicos" FOR EACH ROW EXECUTE FUNCTION "public"."validar_problema_tecnico"();



ALTER TABLE ONLY "public"."autor_avaliacoes"
    ADD CONSTRAINT "autor_avaliacoes_autor_id_fkey" FOREIGN KEY ("autor_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."autor_avaliacoes"
    ADD CONSTRAINT "autor_avaliacoes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."capitulo_visualizacoes_unicas"
    ADD CONSTRAINT "capitulo_visualizacoes_unicas_capitulo_id_fkey" FOREIGN KEY ("capitulo_id") REFERENCES "public"."capitulos"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."capitulos"
    ADD CONSTRAINT "capitulos_obra_id_fkey" FOREIGN KEY ("obra_id") REFERENCES "public"."obras"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."capitulos"
    ADD CONSTRAINT "capitulos_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comentarios_capitulos"
    ADD CONSTRAINT "comentarios_capitulos_capitulo_id_fkey" FOREIGN KEY ("capitulo_id") REFERENCES "public"."capitulos"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comentarios_capitulos"
    ADD CONSTRAINT "comentarios_capitulos_comentario_pai_id_fkey" FOREIGN KEY ("comentario_pai_id") REFERENCES "public"."comentarios_capitulos"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comentarios_capitulos_curtidas"
    ADD CONSTRAINT "comentarios_capitulos_curtidas_comentario_id_fkey" FOREIGN KEY ("comentario_id") REFERENCES "public"."comentarios_capitulos"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comentarios_capitulos_curtidas"
    ADD CONSTRAINT "comentarios_capitulos_curtidas_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comentarios_capitulos"
    ADD CONSTRAINT "comentarios_capitulos_obra_id_fkey" FOREIGN KEY ("obra_id") REFERENCES "public"."obras"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comentarios_capitulos"
    ADD CONSTRAINT "comentarios_capitulos_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comentarios_obras"
    ADD CONSTRAINT "comentarios_obras_comentario_pai_id_fkey" FOREIGN KEY ("comentario_pai_id") REFERENCES "public"."comentarios_obras"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comentarios_obras_curtidas"
    ADD CONSTRAINT "comentarios_obras_curtidas_comentario_id_fkey" FOREIGN KEY ("comentario_id") REFERENCES "public"."comentarios_obras"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comentarios_obras_curtidas"
    ADD CONSTRAINT "comentarios_obras_curtidas_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comentarios_obras"
    ADD CONSTRAINT "comentarios_obras_obra_id_fkey" FOREIGN KEY ("obra_id") REFERENCES "public"."obras"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comentarios_obras"
    ADD CONSTRAINT "comentarios_obras_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comunidade_comentario_curtidas"
    ADD CONSTRAINT "comunidade_comentario_curtidas_comentario_id_fkey" FOREIGN KEY ("comentario_id") REFERENCES "public"."comunidade_comentarios"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comunidade_comentario_curtidas"
    ADD CONSTRAINT "comunidade_comentario_curtidas_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comunidade_comentarios"
    ADD CONSTRAINT "comunidade_comentarios_autor_id_fkey" FOREIGN KEY ("autor_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comunidade_comentarios"
    ADD CONSTRAINT "comunidade_comentarios_comentario_pai_id_fkey" FOREIGN KEY ("comentario_pai_id") REFERENCES "public"."comunidade_comentarios"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comunidade_comentarios"
    ADD CONSTRAINT "comunidade_comentarios_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."comunidade_posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comunidade_comentarios_salvos"
    ADD CONSTRAINT "comunidade_comentarios_salvos_comentario_id_fkey" FOREIGN KEY ("comentario_id") REFERENCES "public"."comunidade_comentarios"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comunidade_comentarios_salvos"
    ADD CONSTRAINT "comunidade_comentarios_salvos_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comunidade_curtidas"
    ADD CONSTRAINT "comunidade_curtidas_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."comunidade_posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comunidade_curtidas"
    ADD CONSTRAINT "comunidade_curtidas_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comunidade_denuncias"
    ADD CONSTRAINT "comunidade_denuncias_analisado_por_fkey" FOREIGN KEY ("analisado_por") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."comunidade_denuncias"
    ADD CONSTRAINT "comunidade_denuncias_denunciante_id_fkey" FOREIGN KEY ("denunciante_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comunidade_enquete_votos"
    ADD CONSTRAINT "comunidade_enquete_votos_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."comunidade_posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comunidade_enquete_votos"
    ADD CONSTRAINT "comunidade_enquete_votos_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comunidade_post_salvos"
    ADD CONSTRAINT "comunidade_post_salvos_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."comunidade_posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comunidade_post_salvos"
    ADD CONSTRAINT "comunidade_post_salvos_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comunidade_posts"
    ADD CONSTRAINT "comunidade_posts_autor_id_fkey" FOREIGN KEY ("autor_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comunidade_posts"
    ADD CONSTRAINT "comunidade_posts_fixado_por_fkey" FOREIGN KEY ("fixado_por") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."comunidade_salvos"
    ADD CONSTRAINT "comunidade_salvos_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."comunidade_posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comunidade_salvos"
    ADD CONSTRAINT "comunidade_salvos_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."concluidas"
    ADD CONSTRAINT "concluidas_obra_id_fkey" FOREIGN KEY ("obra_id") REFERENCES "public"."obras"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."concluidas"
    ADD CONSTRAINT "concluidas_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."curtidas_capitulos"
    ADD CONSTRAINT "curtidas_capitulos_capitulo_id_fkey" FOREIGN KEY ("capitulo_id") REFERENCES "public"."capitulos"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."curtidas_capitulos"
    ADD CONSTRAINT "curtidas_capitulos_obra_id_fkey" FOREIGN KEY ("obra_id") REFERENCES "public"."obras"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."curtidas_capitulos"
    ADD CONSTRAINT "curtidas_capitulos_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."denuncias_perfis"
    ADD CONSTRAINT "denuncias_perfis_denunciado_id_fkey" FOREIGN KEY ("denunciado_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."denuncias_perfis"
    ADD CONSTRAINT "denuncias_perfis_denunciante_id_fkey" FOREIGN KEY ("denunciante_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."diario_anotacao_comentarios"
    ADD CONSTRAINT "diario_anotacao_comentarios_anotacao_id_fkey" FOREIGN KEY ("anotacao_id") REFERENCES "public"."diario_anotacoes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."diario_anotacao_comentarios"
    ADD CONSTRAINT "diario_anotacao_comentarios_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."diario_anotacao_comentarios"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."diario_anotacao_comentarios"
    ADD CONSTRAINT "diario_anotacao_comentarios_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."diario_anotacao_curtidas"
    ADD CONSTRAINT "diario_anotacao_curtidas_anotacao_id_fkey" FOREIGN KEY ("anotacao_id") REFERENCES "public"."diario_anotacoes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."diario_anotacao_curtidas"
    ADD CONSTRAINT "diario_anotacao_curtidas_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."diario_anotacoes"
    ADD CONSTRAINT "diario_anotacoes_obra_id_fkey" FOREIGN KEY ("obra_id") REFERENCES "public"."obras"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."diario_anotacoes"
    ADD CONSTRAINT "diario_anotacoes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."diario_atividades"
    ADD CONSTRAINT "diario_atividades_capitulo_id_fkey" FOREIGN KEY ("capitulo_id") REFERENCES "public"."capitulos"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."diario_atividades"
    ADD CONSTRAINT "diario_atividades_obra_id_fkey" FOREIGN KEY ("obra_id") REFERENCES "public"."obras"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."diario_atividades"
    ADD CONSTRAINT "diario_atividades_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."diario_avaliacoes"
    ADD CONSTRAINT "diario_avaliacoes_avaliador_id_fkey" FOREIGN KEY ("avaliador_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."diario_avaliacoes"
    ADD CONSTRAINT "diario_avaliacoes_diario_user_id_fkey" FOREIGN KEY ("diario_user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."diario_comentario_curtidas"
    ADD CONSTRAINT "diario_comentario_curtidas_comentario_id_fkey" FOREIGN KEY ("comentario_id") REFERENCES "public"."diario_anotacao_comentarios"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."diario_comentario_curtidas"
    ADD CONSTRAINT "diario_comentario_curtidas_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."diario_configuracoes"
    ADD CONSTRAINT "diario_configuracoes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."favoritos"
    ADD CONSTRAINT "favoritos_obra_id_fkey" FOREIGN KEY ("obra_id") REFERENCES "public"."obras"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."favoritos"
    ADD CONSTRAINT "favoritos_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notificacoes"
    ADD CONSTRAINT "notificacoes_autor_id_fkey" FOREIGN KEY ("autor_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notificacoes"
    ADD CONSTRAINT "notificacoes_capitulo_id_fkey" FOREIGN KEY ("capitulo_id") REFERENCES "public"."capitulos"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."notificacoes"
    ADD CONSTRAINT "notificacoes_obra_id_fkey" FOREIGN KEY ("obra_id") REFERENCES "public"."obras"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."notificacoes"
    ADD CONSTRAINT "notificacoes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."obra_avaliacoes"
    ADD CONSTRAINT "obra_avaliacoes_obra_id_fkey" FOREIGN KEY ("obra_id") REFERENCES "public"."obras"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."obra_avaliacoes"
    ADD CONSTRAINT "obra_avaliacoes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."obra_comentario_curtidas"
    ADD CONSTRAINT "obra_comentario_curtidas_comentario_id_fkey" FOREIGN KEY ("comentario_id") REFERENCES "public"."obra_comentarios"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."obra_comentario_curtidas"
    ADD CONSTRAINT "obra_comentario_curtidas_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."obra_comentarios"
    ADD CONSTRAINT "obra_comentarios_autor_id_fkey" FOREIGN KEY ("autor_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."obra_comentarios"
    ADD CONSTRAINT "obra_comentarios_obra_id_fkey" FOREIGN KEY ("obra_id") REFERENCES "public"."obras"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."obra_curtidas"
    ADD CONSTRAINT "obra_curtidas_obra_id_fkey" FOREIGN KEY ("obra_id") REFERENCES "public"."obras"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."obra_curtidas"
    ADD CONSTRAINT "obra_curtidas_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."obra_visualizacoes_unicas"
    ADD CONSTRAINT "obra_visualizacoes_unicas_obra_id_fkey" FOREIGN KEY ("obra_id") REFERENCES "public"."obras"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."obras"
    ADD CONSTRAINT "obras_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."preferencias_privacidade"
    ADD CONSTRAINT "preferencias_privacidade_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."problemas_tecnicos"
    ADD CONSTRAINT "problemas_tecnicos_analisado_por_fkey" FOREIGN KEY ("analisado_por") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."problemas_tecnicos"
    ADD CONSTRAINT "problemas_tecnicos_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."progresso_leitura"
    ADD CONSTRAINT "progresso_leitura_capitulo_id_fkey" FOREIGN KEY ("capitulo_id") REFERENCES "public"."capitulos"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."progresso_leitura"
    ADD CONSTRAINT "progresso_leitura_obra_id_fkey" FOREIGN KEY ("obra_id") REFERENCES "public"."obras"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."progresso_leitura"
    ADD CONSTRAINT "progresso_leitura_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."salvos_capitulos"
    ADD CONSTRAINT "salvos_capitulos_capitulo_id_fkey" FOREIGN KEY ("capitulo_id") REFERENCES "public"."capitulos"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."salvos_capitulos"
    ADD CONSTRAINT "salvos_capitulos_obra_id_fkey" FOREIGN KEY ("obra_id") REFERENCES "public"."obras"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."salvos_capitulos"
    ADD CONSTRAINT "salvos_capitulos_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."seguindo_autores"
    ADD CONSTRAINT "seguindo_autores_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."seguindo_obras"
    ADD CONSTRAINT "seguindo_obras_obra_id_fkey" FOREIGN KEY ("obra_id") REFERENCES "public"."obras"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."seguindo_obras"
    ADD CONSTRAINT "seguindo_obras_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."seguindo_usuarios"
    ADD CONSTRAINT "seguindo_usuarios_seguido_id_fkey" FOREIGN KEY ("seguido_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."seguindo_usuarios"
    ADD CONSTRAINT "seguindo_usuarios_seguidor_id_fkey" FOREIGN KEY ("seguidor_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."solicitacoes_seguidores"
    ADD CONSTRAINT "solicitacoes_seguidores_destinatario_id_fkey" FOREIGN KEY ("destinatario_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."solicitacoes_seguidores"
    ADD CONSTRAINT "solicitacoes_seguidores_solicitante_id_fkey" FOREIGN KEY ("solicitante_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."top5_curtidas"
    ADD CONSTRAINT "top5_curtidas_perfil_user_id_fkey" FOREIGN KEY ("perfil_user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."top5_curtidas"
    ADD CONSTRAINT "top5_curtidas_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."usuarios_bloqueados"
    ADD CONSTRAINT "usuarios_bloqueados_bloqueado_id_fkey" FOREIGN KEY ("bloqueado_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."usuarios_bloqueados"
    ADD CONSTRAINT "usuarios_bloqueados_bloqueador_id_fkey" FOREIGN KEY ("bloqueador_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE "public"."autor_avaliacoes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "autor_avaliacoes_delete_proprio" ON "public"."autor_avaliacoes" FOR DELETE USING ((("auth"."uid"() IS NOT NULL) AND ("user_id" = "auth"."uid"())));



CREATE POLICY "autor_avaliacoes_insert_proprio" ON "public"."autor_avaliacoes" FOR INSERT TO "authenticated" WITH CHECK ((("auth"."uid"() IS NOT NULL) AND ("user_id" = "auth"."uid"()) AND ("autor_id" <> "auth"."uid"())));



CREATE POLICY "autor_avaliacoes_select_publico" ON "public"."autor_avaliacoes" FOR SELECT USING (true);



CREATE POLICY "autor_avaliacoes_update_proprio" ON "public"."autor_avaliacoes" FOR UPDATE TO "authenticated" USING ((("auth"."uid"() IS NOT NULL) AND ("user_id" = "auth"."uid"()))) WITH CHECK ((("auth"."uid"() IS NOT NULL) AND ("user_id" = "auth"."uid"()) AND ("autor_id" <> "auth"."uid"())));



ALTER TABLE "public"."capitulo_visualizacoes_unicas" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."capitulos" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "capitulos_delete_proprios" ON "public"."capitulos" FOR DELETE USING ((("auth"."uid"() IS NOT NULL) AND (("user_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."obras" "o"
  WHERE (("o"."id" = "capitulos"."obra_id") AND ("o"."user_id" = "auth"."uid"())))))));



CREATE POLICY "capitulos_insert_proprios" ON "public"."capitulos" FOR INSERT WITH CHECK ((("auth"."uid"() IS NOT NULL) AND (("user_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."obras" "o"
  WHERE (("o"."id" = "capitulos"."obra_id") AND ("o"."user_id" = "auth"."uid"())))))));



CREATE POLICY "capitulos_select_publicados_ou_proprios" ON "public"."capitulos" FOR SELECT USING ((((COALESCE("publicado", false) = true) AND (EXISTS ( SELECT 1
   FROM "public"."obras" "o"
  WHERE (("o"."id" = "capitulos"."obra_id") AND (COALESCE("o"."publicado", false) = true))))) OR ("user_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."obras" "o"
  WHERE (("o"."id" = "capitulos"."obra_id") AND ("o"."user_id" = "auth"."uid"()))))));



CREATE POLICY "capitulos_update_proprios" ON "public"."capitulos" FOR UPDATE USING ((("auth"."uid"() IS NOT NULL) AND (("user_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."obras" "o"
  WHERE (("o"."id" = "capitulos"."obra_id") AND ("o"."user_id" = "auth"."uid"()))))))) WITH CHECK ((("auth"."uid"() IS NOT NULL) AND (("user_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."obras" "o"
  WHERE (("o"."id" = "capitulos"."obra_id") AND ("o"."user_id" = "auth"."uid"())))))));



ALTER TABLE "public"."comentarios_capitulos" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."comentarios_capitulos_curtidas" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "comentarios_capitulos_curtidas_delete_proprio" ON "public"."comentarios_capitulos_curtidas" FOR DELETE TO "authenticated" USING ((("auth"."uid"() IS NOT NULL) AND ("usuario_id" = "auth"."uid"())));



CREATE POLICY "comentarios_capitulos_curtidas_delete_proprio_usuario" ON "public"."comentarios_capitulos_curtidas" FOR DELETE USING (("auth"."uid"() = "usuario_id"));



CREATE POLICY "comentarios_capitulos_curtidas_insert_proprio" ON "public"."comentarios_capitulos_curtidas" FOR INSERT TO "authenticated" WITH CHECK ((("auth"."uid"() IS NOT NULL) AND ("usuario_id" = "auth"."uid"())));



CREATE POLICY "comentarios_capitulos_curtidas_insert_proprio_usuario" ON "public"."comentarios_capitulos_curtidas" FOR INSERT WITH CHECK (("auth"."uid"() = "usuario_id"));



CREATE POLICY "comentarios_capitulos_curtidas_select_publico" ON "public"."comentarios_capitulos_curtidas" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "comentarios_capitulos_curtidas_update_bloqueado" ON "public"."comentarios_capitulos_curtidas" FOR UPDATE TO "authenticated" USING (false) WITH CHECK (false);



CREATE POLICY "comentarios_capitulos_delete_proprio_ou_admin" ON "public"."comentarios_capitulos" FOR DELETE TO "authenticated" USING ((("auth"."uid"() IS NOT NULL) AND (("user_id" = "auth"."uid"()) OR "public"."usuario_e_admin"())));



CREATE POLICY "comentarios_capitulos_insert_proprio" ON "public"."comentarios_capitulos" FOR INSERT WITH CHECK ((("auth"."uid"() IS NOT NULL) AND ("user_id" = "auth"."uid"())));



CREATE POLICY "comentarios_capitulos_select_admin_moderacao" ON "public"."comentarios_capitulos" FOR SELECT TO "authenticated" USING ("public"."usuario_e_admin"());



CREATE POLICY "comentarios_capitulos_select_publico_ou_proprio" ON "public"."comentarios_capitulos" FOR SELECT USING ((("user_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM ("public"."capitulos" "c"
     JOIN "public"."obras" "o" ON (("o"."id" = "c"."obra_id")))
  WHERE (("c"."id" = "comentarios_capitulos"."capitulo_id") AND (COALESCE("c"."publicado", false) = true) AND (COALESCE("o"."publicado", false) = true))))));



CREATE POLICY "comentarios_capitulos_update_proprio" ON "public"."comentarios_capitulos" FOR UPDATE USING ((("auth"."uid"() IS NOT NULL) AND ("user_id" = "auth"."uid"()))) WITH CHECK ((("auth"."uid"() IS NOT NULL) AND ("user_id" = "auth"."uid"())));



ALTER TABLE "public"."comentarios_obras" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."comentarios_obras_curtidas" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "comentarios_obras_curtidas_delete_proprio" ON "public"."comentarios_obras_curtidas" FOR DELETE TO "authenticated" USING ((("auth"."uid"() IS NOT NULL) AND ("usuario_id" = "auth"."uid"())));



CREATE POLICY "comentarios_obras_curtidas_insert_proprio" ON "public"."comentarios_obras_curtidas" FOR INSERT TO "authenticated" WITH CHECK ((("auth"."uid"() IS NOT NULL) AND ("usuario_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM ("public"."comentarios_obras" "comentario"
     JOIN "public"."obras" "obra" ON (("obra"."id" = "comentario"."obra_id")))
  WHERE (("comentario"."id" = "comentarios_obras_curtidas"."comentario_id") AND ((COALESCE("obra"."publicado", false) = true) OR ("obra"."user_id" = "auth"."uid"())))))));



CREATE POLICY "comentarios_obras_curtidas_select_publico" ON "public"."comentarios_obras_curtidas" FOR SELECT TO "authenticated", "anon" USING ((EXISTS ( SELECT 1
   FROM ("public"."comentarios_obras" "comentario"
     JOIN "public"."obras" "obra" ON (("obra"."id" = "comentario"."obra_id")))
  WHERE (("comentario"."id" = "comentarios_obras_curtidas"."comentario_id") AND ((COALESCE("obra"."publicado", false) = true) OR (("auth"."uid"() IS NOT NULL) AND ("obra"."user_id" = "auth"."uid"())))))));



CREATE POLICY "comentarios_obras_curtidas_update_bloqueado" ON "public"."comentarios_obras_curtidas" FOR UPDATE TO "authenticated" USING (false) WITH CHECK (false);



CREATE POLICY "comentarios_obras_delete_proprio_ou_admin" ON "public"."comentarios_obras" FOR DELETE TO "authenticated" USING ((("auth"."uid"() IS NOT NULL) AND (("user_id" = "auth"."uid"()) OR "public"."usuario_e_admin"())));



CREATE POLICY "comentarios_obras_insert_proprio" ON "public"."comentarios_obras" FOR INSERT TO "authenticated" WITH CHECK ((("auth"."uid"() IS NOT NULL) AND ("user_id" = "auth"."uid"()) AND (("char_length"("btrim"("comentario")) >= 2) AND ("char_length"("btrim"("comentario")) <= 600)) AND (EXISTS ( SELECT 1
   FROM "public"."obras" "obra"
  WHERE (("obra"."id" = "comentarios_obras"."obra_id") AND ((COALESCE("obra"."publicado", false) = true) OR ("obra"."user_id" = "auth"."uid"())))))));



CREATE POLICY "comentarios_obras_select_publicadas_ou_proprias" ON "public"."comentarios_obras" FOR SELECT TO "authenticated", "anon" USING ((EXISTS ( SELECT 1
   FROM "public"."obras" "obra"
  WHERE (("obra"."id" = "comentarios_obras"."obra_id") AND ((COALESCE("obra"."publicado", false) = true) OR (("auth"."uid"() IS NOT NULL) AND ("obra"."user_id" = "auth"."uid"())))))));



CREATE POLICY "comentarios_obras_update_bloqueado" ON "public"."comentarios_obras" FOR UPDATE TO "authenticated" USING (false) WITH CHECK (false);



ALTER TABLE "public"."comunidade_comentario_curtidas" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "comunidade_comentario_curtidas_delete_proprio" ON "public"."comunidade_comentario_curtidas" FOR DELETE TO "authenticated" USING ((("auth"."uid"() IS NOT NULL) AND ("usuario_id" = "auth"."uid"())));



CREATE POLICY "comunidade_comentario_curtidas_insert_proprio_post_visivel" ON "public"."comunidade_comentario_curtidas" FOR INSERT TO "authenticated" WITH CHECK ((("auth"."uid"() IS NOT NULL) AND ("usuario_id" = "auth"."uid"()) AND "public"."comunidade_pode_ver_comentario"("comentario_id")));



CREATE POLICY "comunidade_comentario_curtidas_select_post_visivel" ON "public"."comunidade_comentario_curtidas" FOR SELECT TO "authenticated", "anon" USING ("public"."comunidade_pode_ver_comentario"("comentario_id"));



ALTER TABLE "public"."comunidade_comentarios" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "comunidade_comentarios_delete_proprio_ou_admin" ON "public"."comunidade_comentarios" FOR DELETE TO "authenticated" USING ((("auth"."uid"() IS NOT NULL) AND (("autor_id" = "auth"."uid"()) OR "public"."comunidade_usuario_e_admin"())));



CREATE POLICY "comunidade_comentarios_insert_proprio_post_visivel" ON "public"."comunidade_comentarios" FOR INSERT TO "authenticated" WITH CHECK ((("auth"."uid"() IS NOT NULL) AND ("autor_id" = "auth"."uid"()) AND "public"."comunidade_pode_ver_post"("post_id")));



ALTER TABLE "public"."comunidade_comentarios_salvos" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "comunidade_comentarios_salvos_delete_proprio" ON "public"."comunidade_comentarios_salvos" FOR DELETE USING ((("auth"."uid"() IS NOT NULL) AND (("usuario_id")::"text" = ("auth"."uid"())::"text")));



CREATE POLICY "comunidade_comentarios_salvos_insert_proprio" ON "public"."comunidade_comentarios_salvos" FOR INSERT WITH CHECK ((("auth"."uid"() IS NOT NULL) AND (("usuario_id")::"text" = ("auth"."uid"())::"text")));



CREATE POLICY "comunidade_comentarios_salvos_select_publico" ON "public"."comunidade_comentarios_salvos" FOR SELECT USING (true);



CREATE POLICY "comunidade_comentarios_select_post_visivel" ON "public"."comunidade_comentarios" FOR SELECT TO "authenticated", "anon" USING ("public"."comunidade_pode_ver_post"("post_id"));



CREATE POLICY "comunidade_comentarios_update_proprio_post_visivel" ON "public"."comunidade_comentarios" FOR UPDATE TO "authenticated" USING ((("auth"."uid"() IS NOT NULL) AND ("autor_id" = "auth"."uid"()) AND "public"."comunidade_pode_ver_post"("post_id"))) WITH CHECK ((("auth"."uid"() IS NOT NULL) AND ("autor_id" = "auth"."uid"()) AND "public"."comunidade_pode_ver_post"("post_id")));



ALTER TABLE "public"."comunidade_curtidas" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "comunidade_curtidas_delete_proprio" ON "public"."comunidade_curtidas" FOR DELETE TO "authenticated" USING ((("auth"."uid"() IS NOT NULL) AND ("usuario_id" = "auth"."uid"())));



CREATE POLICY "comunidade_curtidas_insert_proprio_post_visivel" ON "public"."comunidade_curtidas" FOR INSERT TO "authenticated" WITH CHECK ((("auth"."uid"() IS NOT NULL) AND ("usuario_id" = "auth"."uid"()) AND "public"."comunidade_pode_ver_post"("post_id")));



CREATE POLICY "comunidade_curtidas_select_post_visivel" ON "public"."comunidade_curtidas" FOR SELECT TO "authenticated", "anon" USING ("public"."comunidade_pode_ver_post"("post_id"));



ALTER TABLE "public"."comunidade_denuncias" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "comunidade_denuncias_delete_admin" ON "public"."comunidade_denuncias" FOR DELETE USING ("public"."usuario_e_admin"());



CREATE POLICY "comunidade_denuncias_select_admin" ON "public"."comunidade_denuncias" FOR SELECT USING ((("auth"."uid"() IS NOT NULL) AND "public"."usuario_e_admin"()));



CREATE POLICY "comunidade_denuncias_update_admin" ON "public"."comunidade_denuncias" FOR UPDATE USING ("public"."usuario_e_admin"()) WITH CHECK ("public"."usuario_e_admin"());



ALTER TABLE "public"."comunidade_enquete_votos" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "comunidade_enquete_votos_delete_proprio" ON "public"."comunidade_enquete_votos" FOR DELETE TO "authenticated" USING ((("auth"."uid"() IS NOT NULL) AND ("user_id" = "auth"."uid"())));



CREATE POLICY "comunidade_enquete_votos_insert_proprio_post_visivel" ON "public"."comunidade_enquete_votos" FOR INSERT TO "authenticated" WITH CHECK ((("auth"."uid"() IS NOT NULL) AND ("user_id" = "auth"."uid"()) AND "public"."comunidade_pode_ver_post"("post_id")));



CREATE POLICY "comunidade_enquete_votos_select_post_visivel" ON "public"."comunidade_enquete_votos" FOR SELECT TO "authenticated", "anon" USING ("public"."comunidade_pode_ver_post"("post_id"));



CREATE POLICY "comunidade_enquete_votos_update_proprio_post_visivel" ON "public"."comunidade_enquete_votos" FOR UPDATE TO "authenticated" USING ((("auth"."uid"() IS NOT NULL) AND ("user_id" = "auth"."uid"()) AND "public"."comunidade_pode_ver_post"("post_id"))) WITH CHECK ((("auth"."uid"() IS NOT NULL) AND ("user_id" = "auth"."uid"()) AND "public"."comunidade_pode_ver_post"("post_id")));



ALTER TABLE "public"."comunidade_post_salvos" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "comunidade_post_salvos_delete_proprio" ON "public"."comunidade_post_salvos" FOR DELETE TO "authenticated" USING ((("auth"."uid"() IS NOT NULL) AND ("user_id" = "auth"."uid"())));



CREATE POLICY "comunidade_post_salvos_insert_proprio_post_visivel" ON "public"."comunidade_post_salvos" FOR INSERT TO "authenticated" WITH CHECK ((("auth"."uid"() IS NOT NULL) AND ("user_id" = "auth"."uid"()) AND "public"."comunidade_pode_ver_post"("post_id")));



CREATE POLICY "comunidade_post_salvos_select_proprio" ON "public"."comunidade_post_salvos" FOR SELECT TO "authenticated" USING ((("auth"."uid"() IS NOT NULL) AND ("user_id" = "auth"."uid"())));



ALTER TABLE "public"."comunidade_posts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "comunidade_posts_delete_proprio_ou_admin" ON "public"."comunidade_posts" FOR DELETE TO "authenticated" USING ((("auth"."uid"() IS NOT NULL) AND (("autor_id" = "auth"."uid"()) OR "public"."comunidade_usuario_e_admin"())));



CREATE POLICY "comunidade_posts_insert_autenticado" ON "public"."comunidade_posts" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "autor_id"));



CREATE POLICY "comunidade_posts_insert_proprio_visibilidade" ON "public"."comunidade_posts" FOR INSERT TO "authenticated" WITH CHECK ((("auth"."uid"() IS NOT NULL) AND ("autor_id" = "auth"."uid"()) AND ("visibilidade" = ANY (ARRAY['publico'::"text", 'seguidores'::"text", 'seguindo'::"text", 'somente_eu'::"text"]))));



CREATE POLICY "comunidade_posts_select_visibilidade" ON "public"."comunidade_posts" FOR SELECT TO "authenticated", "anon" USING ("public"."comunidade_pode_ver_post"("id"));



CREATE POLICY "comunidade_posts_update_proprio_ou_admin_visibilidade" ON "public"."comunidade_posts" FOR UPDATE TO "authenticated" USING ((("auth"."uid"() IS NOT NULL) AND (("autor_id" = "auth"."uid"()) OR "public"."comunidade_usuario_e_admin"()))) WITH CHECK ((("auth"."uid"() IS NOT NULL) AND ("visibilidade" = ANY (ARRAY['publico'::"text", 'seguidores'::"text", 'seguindo'::"text", 'somente_eu'::"text"])) AND (("autor_id" = "auth"."uid"()) OR "public"."comunidade_usuario_e_admin"())));



ALTER TABLE "public"."comunidade_salvos" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "comunidade_salvos_delete_proprio" ON "public"."comunidade_salvos" FOR DELETE TO "authenticated" USING ((("auth"."uid"() IS NOT NULL) AND ("user_id" = "auth"."uid"())));



CREATE POLICY "comunidade_salvos_insert_proprio_post_visivel" ON "public"."comunidade_salvos" FOR INSERT TO "authenticated" WITH CHECK ((("auth"."uid"() IS NOT NULL) AND ("user_id" = "auth"."uid"()) AND "public"."comunidade_pode_ver_post"("post_id")));



CREATE POLICY "comunidade_salvos_select_proprio" ON "public"."comunidade_salvos" FOR SELECT TO "authenticated" USING ((("auth"."uid"() IS NOT NULL) AND ("user_id" = "auth"."uid"())));



ALTER TABLE "public"."concluidas" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "concluidas_delete_proprio" ON "public"."concluidas" FOR DELETE USING ((("auth"."uid"() IS NOT NULL) AND ("user_id" = "auth"."uid"())));



CREATE POLICY "concluidas_insert_proprio" ON "public"."concluidas" FOR INSERT WITH CHECK ((("auth"."uid"() IS NOT NULL) AND ("user_id" = "auth"."uid"())));



CREATE POLICY "concluidas_select_publico" ON "public"."concluidas" FOR SELECT USING (true);



ALTER TABLE "public"."curtidas_capitulos" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "curtidas_capitulos_delete_proprio" ON "public"."curtidas_capitulos" FOR DELETE USING ((("auth"."uid"() IS NOT NULL) AND ("user_id" = "auth"."uid"())));



CREATE POLICY "curtidas_capitulos_insert_proprio" ON "public"."curtidas_capitulos" FOR INSERT WITH CHECK ((("auth"."uid"() IS NOT NULL) AND ("user_id" = "auth"."uid"())));



CREATE POLICY "curtidas_capitulos_select_publico" ON "public"."curtidas_capitulos" FOR SELECT USING (true);



ALTER TABLE "public"."denuncias_perfis" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "denuncias_perfis_delete_admin" ON "public"."denuncias_perfis" FOR DELETE USING ("public"."usuario_e_admin"());



CREATE POLICY "denuncias_perfis_select_admin" ON "public"."denuncias_perfis" FOR SELECT USING ((("auth"."uid"() IS NOT NULL) AND "public"."usuario_e_admin"()));



CREATE POLICY "denuncias_perfis_update_admin" ON "public"."denuncias_perfis" FOR UPDATE USING ("public"."usuario_e_admin"()) WITH CHECK ("public"."usuario_e_admin"());



ALTER TABLE "public"."diario_anotacao_comentarios" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "diario_anotacao_comentarios_delete_proprio" ON "public"."diario_anotacao_comentarios" FOR DELETE TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "diario_anotacao_comentarios_insert_proprio" ON "public"."diario_anotacao_comentarios" FOR INSERT TO "authenticated" WITH CHECK ((("auth"."uid"() IS NOT NULL) AND ("user_id" = "auth"."uid"()) AND "public"."diario_pode_comentar"("anotacao_id")));



CREATE POLICY "diario_anotacao_comentarios_select_visiveis" ON "public"."diario_anotacao_comentarios" FOR SELECT TO "authenticated", "anon" USING ((("user_id" = "auth"."uid"()) OR "public"."diario_pode_ver_comentarios"("anotacao_id")));



CREATE POLICY "diario_anotacao_comentarios_update_proprio" ON "public"."diario_anotacao_comentarios" FOR UPDATE TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK ((("user_id" = "auth"."uid"()) AND "public"."diario_pode_comentar"("anotacao_id")));



ALTER TABLE "public"."diario_anotacao_curtidas" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "diario_anotacao_curtidas_delete_proprio" ON "public"."diario_anotacao_curtidas" FOR DELETE TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "diario_anotacao_curtidas_insert_proprio" ON "public"."diario_anotacao_curtidas" FOR INSERT TO "authenticated" WITH CHECK ((("auth"."uid"() IS NOT NULL) AND ("user_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."diario_anotacoes" "anotacao"
  WHERE (("anotacao"."id" = "diario_anotacao_curtidas"."anotacao_id") AND "anotacao"."permitir_curtidas" AND "public"."diario_pode_ver_anotacao"("anotacao"."id") AND "public"."diario_sem_bloqueio_com_usuario_atual"("anotacao"."user_id"))))));



CREATE POLICY "diario_anotacao_curtidas_select_visiveis" ON "public"."diario_anotacao_curtidas" FOR SELECT TO "authenticated", "anon" USING ("public"."diario_pode_ver_anotacao"("anotacao_id"));



ALTER TABLE "public"."diario_anotacoes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "diario_anotacoes_delete_admin_moderacao" ON "public"."diario_anotacoes" FOR DELETE TO "authenticated" USING ("public"."usuario_e_admin"());



CREATE POLICY "diario_anotacoes_delete_proprio" ON "public"."diario_anotacoes" FOR DELETE TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "diario_anotacoes_insert_proprio" ON "public"."diario_anotacoes" FOR INSERT TO "authenticated" WITH CHECK ((("auth"."uid"() IS NOT NULL) AND ("user_id" = "auth"."uid"())));



CREATE POLICY "diario_anotacoes_select_admin_moderacao" ON "public"."diario_anotacoes" FOR SELECT TO "authenticated" USING ("public"."usuario_e_admin"());



CREATE POLICY "diario_anotacoes_select_visiveis" ON "public"."diario_anotacoes" FOR SELECT TO "authenticated", "anon" USING ("public"."diario_pode_ver_anotacao"("id"));



CREATE POLICY "diario_anotacoes_update_proprio" ON "public"."diario_anotacoes" FOR UPDATE TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."diario_atividades" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "diario_atividades_delete_proprio" ON "public"."diario_atividades" FOR DELETE USING ((("auth"."uid"() IS NOT NULL) AND ("user_id" = "auth"."uid"())));



CREATE POLICY "diario_atividades_insert_proprio" ON "public"."diario_atividades" FOR INSERT WITH CHECK ((("auth"."uid"() IS NOT NULL) AND ("user_id" = "auth"."uid"())));



CREATE POLICY "diario_atividades_select_visiveis" ON "public"."diario_atividades" FOR SELECT USING ((("user_id" = "auth"."uid"()) OR ("public"."usuario_pode_ver_perfil"("user_id") AND (COALESCE("visibilidade", 'privado'::"text") = ANY (ARRAY['publico'::"text", 'parcial'::"text"])) AND COALESCE(( SELECT "preferencias"."mostrar_diario_perfil"
   FROM "public"."preferencias_privacidade" "preferencias"
  WHERE ("preferencias"."user_id" = "diario_atividades"."user_id")), true) AND COALESCE(( SELECT "preferencias"."mostrar_atividades_leitura"
   FROM "public"."preferencias_privacidade" "preferencias"
  WHERE ("preferencias"."user_id" = "diario_atividades"."user_id")), true) AND
CASE
    WHEN ("tipo" = ANY (ARRAY['leu_capitulo'::"text", 'comecou_ler'::"text"])) THEN COALESCE(( SELECT "preferencias"."mostrar_historico_leitura"
       FROM "public"."preferencias_privacidade" "preferencias"
      WHERE ("preferencias"."user_id" = "diario_atividades"."user_id")), false)
    WHEN ("tipo" = 'favoritou_obra'::"text") THEN COALESCE(( SELECT "preferencias"."mostrar_favoritos"
       FROM "public"."preferencias_privacidade" "preferencias"
      WHERE ("preferencias"."user_id" = "diario_atividades"."user_id")), true)
    WHEN ("tipo" = 'concluiu_obra'::"text") THEN COALESCE(( SELECT "preferencias"."mostrar_concluidas"
       FROM "public"."preferencias_privacidade" "preferencias"
      WHERE ("preferencias"."user_id" = "diario_atividades"."user_id")), true)
    WHEN ("tipo" = ANY (ARRAY['avaliou_obra'::"text", 'publicou_review'::"text"])) THEN COALESCE(( SELECT "preferencias"."mostrar_avaliacoes"
       FROM "public"."preferencias_privacidade" "preferencias"
      WHERE ("preferencias"."user_id" = "diario_atividades"."user_id")), true)
    WHEN ("tipo" = 'salvou_obra'::"text") THEN COALESCE(( SELECT "preferencias"."mostrar_quero_ler"
       FROM "public"."preferencias_privacidade" "preferencias"
      WHERE ("preferencias"."user_id" = "diario_atividades"."user_id")), false)
    ELSE true
END)));



CREATE POLICY "diario_atividades_update_proprio" ON "public"."diario_atividades" FOR UPDATE USING ((("auth"."uid"() IS NOT NULL) AND ("user_id" = "auth"."uid"()))) WITH CHECK ((("auth"."uid"() IS NOT NULL) AND ("user_id" = "auth"."uid"())));



ALTER TABLE "public"."diario_avaliacoes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "diario_avaliacoes_delete_direto_bloqueado" ON "public"."diario_avaliacoes" FOR DELETE TO "authenticated" USING (false);



CREATE POLICY "diario_avaliacoes_insert_direto_bloqueado" ON "public"."diario_avaliacoes" FOR INSERT TO "authenticated" WITH CHECK (false);



CREATE POLICY "diario_avaliacoes_select_participantes" ON "public"."diario_avaliacoes" FOR SELECT TO "authenticated" USING ((("avaliador_id" = "auth"."uid"()) OR ("diario_user_id" = "auth"."uid"()) OR COALESCE("public"."usuario_e_admin"(), false)));



CREATE POLICY "diario_avaliacoes_update_direto_bloqueado" ON "public"."diario_avaliacoes" FOR UPDATE TO "authenticated" USING (false) WITH CHECK (false);



ALTER TABLE "public"."diario_comentario_curtidas" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "diario_comentario_curtidas_delete_proprio" ON "public"."diario_comentario_curtidas" FOR DELETE TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "diario_comentario_curtidas_insert_proprio" ON "public"."diario_comentario_curtidas" FOR INSERT TO "authenticated" WITH CHECK ((("auth"."uid"() IS NOT NULL) AND ("user_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM ("public"."diario_anotacao_comentarios" "comentario"
     JOIN "public"."diario_anotacoes" "anotacao" ON (("anotacao"."id" = "comentario"."anotacao_id")))
  WHERE (("comentario"."id" = "diario_comentario_curtidas"."comentario_id") AND "public"."diario_pode_ver_comentarios"("comentario"."anotacao_id") AND "public"."diario_sem_bloqueio_com_usuario_atual"("comentario"."user_id") AND "public"."diario_sem_bloqueio_com_usuario_atual"("anotacao"."user_id"))))));



CREATE POLICY "diario_comentario_curtidas_select_visiveis" ON "public"."diario_comentario_curtidas" FOR SELECT TO "authenticated", "anon" USING ((EXISTS ( SELECT 1
   FROM "public"."diario_anotacao_comentarios" "comentario"
  WHERE (("comentario"."id" = "diario_comentario_curtidas"."comentario_id") AND (("comentario"."user_id" = "auth"."uid"()) OR "public"."diario_pode_ver_comentarios"("comentario"."anotacao_id"))))));



CREATE POLICY "diario_comentarios_delete_admin_moderacao" ON "public"."diario_anotacao_comentarios" FOR DELETE TO "authenticated" USING ("public"."usuario_e_admin"());



CREATE POLICY "diario_comentarios_select_admin_moderacao" ON "public"."diario_anotacao_comentarios" FOR SELECT TO "authenticated" USING ("public"."usuario_e_admin"());



ALTER TABLE "public"."diario_configuracoes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "diario_configuracoes_delete_proprio" ON "public"."diario_configuracoes" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "diario_configuracoes_insert_proprio" ON "public"."diario_configuracoes" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "diario_configuracoes_select_proprio" ON "public"."diario_configuracoes" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "diario_configuracoes_update_proprio" ON "public"."diario_configuracoes" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."favoritos" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "favoritos_delete_proprio" ON "public"."favoritos" FOR DELETE TO "authenticated" USING ((("auth"."uid"() IS NOT NULL) AND ("user_id" = "auth"."uid"())));



CREATE POLICY "favoritos_insert_proprio" ON "public"."favoritos" FOR INSERT TO "authenticated" WITH CHECK ((("auth"."uid"() IS NOT NULL) AND ("user_id" = "auth"."uid"())));



CREATE POLICY "favoritos_select_publico" ON "public"."favoritos" FOR SELECT TO "authenticated", "anon" USING (true);



ALTER TABLE "public"."notificacoes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "notificacoes_delete_proprio" ON "public"."notificacoes" FOR DELETE TO "authenticated" USING ((("auth"."uid"() IS NOT NULL) AND (("user_id")::"text" = ("auth"."uid"())::"text")));



CREATE POLICY "notificacoes_select_proprio" ON "public"."notificacoes" FOR SELECT TO "authenticated" USING ((("auth"."uid"() IS NOT NULL) AND (("user_id")::"text" = ("auth"."uid"())::"text")));



CREATE POLICY "notificacoes_update_proprio" ON "public"."notificacoes" FOR UPDATE TO "authenticated" USING ((("auth"."uid"() IS NOT NULL) AND (("user_id")::"text" = ("auth"."uid"())::"text"))) WITH CHECK ((("auth"."uid"() IS NOT NULL) AND (("user_id")::"text" = ("auth"."uid"())::"text")));



ALTER TABLE "public"."obra_avaliacoes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "obra_avaliacoes_delete_proprio" ON "public"."obra_avaliacoes" FOR DELETE USING ((("auth"."uid"() IS NOT NULL) AND ("user_id" = "auth"."uid"())));



CREATE POLICY "obra_avaliacoes_insert_proprio" ON "public"."obra_avaliacoes" FOR INSERT TO "authenticated" WITH CHECK ((("auth"."uid"() IS NOT NULL) AND ("user_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."obras" "obra"
  WHERE (("obra"."id" = "obra_avaliacoes"."obra_id") AND ("obra"."user_id" <> "auth"."uid"()))))));



CREATE POLICY "obra_avaliacoes_select_publico" ON "public"."obra_avaliacoes" FOR SELECT USING (true);



CREATE POLICY "obra_avaliacoes_update_proprio" ON "public"."obra_avaliacoes" FOR UPDATE TO "authenticated" USING ((("auth"."uid"() IS NOT NULL) AND ("user_id" = "auth"."uid"()))) WITH CHECK ((("auth"."uid"() IS NOT NULL) AND ("user_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."obras" "obra"
  WHERE (("obra"."id" = "obra_avaliacoes"."obra_id") AND ("obra"."user_id" <> "auth"."uid"()))))));



ALTER TABLE "public"."obra_comentario_curtidas" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "obra_comentario_curtidas_deletar_proprio" ON "public"."obra_comentario_curtidas" FOR DELETE USING (("auth"."uid"() = "usuario_id"));



CREATE POLICY "obra_comentario_curtidas_delete_propria" ON "public"."obra_comentario_curtidas" FOR DELETE USING ((("auth"."uid"() IS NOT NULL) AND ("usuario_id" = "auth"."uid"())));



CREATE POLICY "obra_comentario_curtidas_inserir_proprio" ON "public"."obra_comentario_curtidas" FOR INSERT WITH CHECK (("auth"."uid"() = "usuario_id"));



CREATE POLICY "obra_comentario_curtidas_insert_propria" ON "public"."obra_comentario_curtidas" FOR INSERT WITH CHECK ((("auth"."uid"() IS NOT NULL) AND ("usuario_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM ("public"."obra_comentarios" "c"
     JOIN "public"."obras" "o" ON (("o"."id" = "c"."obra_id")))
  WHERE (("c"."id" = "obra_comentario_curtidas"."comentario_id") AND ((COALESCE("o"."publicado", false) = true) OR ("o"."user_id" = "auth"."uid"())))))));



CREATE POLICY "obra_comentario_curtidas_leitura_publica" ON "public"."obra_comentario_curtidas" FOR SELECT USING (true);



CREATE POLICY "obra_comentario_curtidas_select_visivel" ON "public"."obra_comentario_curtidas" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."obra_comentarios" "c"
     JOIN "public"."obras" "o" ON (("o"."id" = "c"."obra_id")))
  WHERE (("c"."id" = "obra_comentario_curtidas"."comentario_id") AND ((COALESCE("o"."publicado", false) = true) OR ("o"."user_id" = "auth"."uid"()))))));



ALTER TABLE "public"."obra_comentarios" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "obra_comentarios_deletar_proprio" ON "public"."obra_comentarios" FOR DELETE USING (("auth"."uid"() = "autor_id"));



CREATE POLICY "obra_comentarios_delete_proprio" ON "public"."obra_comentarios" FOR DELETE USING ((("auth"."uid"() IS NOT NULL) AND ("autor_id" = "auth"."uid"())));



CREATE POLICY "obra_comentarios_inserir_proprio" ON "public"."obra_comentarios" FOR INSERT WITH CHECK (("auth"."uid"() = "autor_id"));



CREATE POLICY "obra_comentarios_insert_logado" ON "public"."obra_comentarios" FOR INSERT WITH CHECK ((("auth"."uid"() IS NOT NULL) AND ("autor_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."obras" "o"
  WHERE (("o"."id" = "obra_comentarios"."obra_id") AND ((COALESCE("o"."publicado", false) = true) OR ("o"."user_id" = "auth"."uid"())))))));



CREATE POLICY "obra_comentarios_leitura_publica" ON "public"."obra_comentarios" FOR SELECT USING (true);



CREATE POLICY "obra_comentarios_select_publica_ou_propria" ON "public"."obra_comentarios" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."obras" "o"
  WHERE (("o"."id" = "obra_comentarios"."obra_id") AND ((COALESCE("o"."publicado", false) = true) OR ("o"."user_id" = "auth"."uid"()))))));



CREATE POLICY "obra_comentarios_update_proprio" ON "public"."obra_comentarios" FOR UPDATE USING ((("auth"."uid"() IS NOT NULL) AND ("autor_id" = "auth"."uid"()))) WITH CHECK ((("auth"."uid"() IS NOT NULL) AND ("autor_id" = "auth"."uid"())));



ALTER TABLE "public"."obra_curtidas" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "obra_curtidas_delete_proprio" ON "public"."obra_curtidas" FOR DELETE USING ((("auth"."uid"() IS NOT NULL) AND ("user_id" = "auth"."uid"())));



CREATE POLICY "obra_curtidas_insert_proprio" ON "public"."obra_curtidas" FOR INSERT WITH CHECK ((("auth"."uid"() IS NOT NULL) AND ("user_id" = "auth"."uid"())));



CREATE POLICY "obra_curtidas_select_publico" ON "public"."obra_curtidas" FOR SELECT USING (true);



ALTER TABLE "public"."obra_visualizacoes_unicas" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."obras" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "obras_delete_proprias" ON "public"."obras" FOR DELETE USING ((("auth"."uid"() IS NOT NULL) AND ("user_id" = "auth"."uid"())));



CREATE POLICY "obras_insert_proprias" ON "public"."obras" FOR INSERT WITH CHECK ((("auth"."uid"() IS NOT NULL) AND ("user_id" = "auth"."uid"())));



CREATE POLICY "obras_select_publicadas_ou_proprias" ON "public"."obras" FOR SELECT USING (((COALESCE("publicado", false) = true) OR ("user_id" = "auth"."uid"())));



CREATE POLICY "obras_update_proprias" ON "public"."obras" FOR UPDATE USING ((("auth"."uid"() IS NOT NULL) AND ("user_id" = "auth"."uid"()))) WITH CHECK ((("auth"."uid"() IS NOT NULL) AND ("user_id" = "auth"."uid"())));



ALTER TABLE "public"."operacoes_exclusao_conta" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."preferencias_privacidade" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "preferencias_privacidade_delete_proprio" ON "public"."preferencias_privacidade" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "preferencias_privacidade_insert_proprio" ON "public"."preferencias_privacidade" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "preferencias_privacidade_select_publico" ON "public"."preferencias_privacidade" FOR SELECT USING (true);



CREATE POLICY "preferencias_privacidade_update_proprio" ON "public"."preferencias_privacidade" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."problemas_tecnicos" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "problemas_tecnicos_delete_admin" ON "public"."problemas_tecnicos" FOR DELETE TO "authenticated" USING ("public"."suporte_usuario_e_admin"());



CREATE POLICY "problemas_tecnicos_insert_bloqueado" ON "public"."problemas_tecnicos" FOR INSERT TO "authenticated" WITH CHECK (false);



CREATE POLICY "problemas_tecnicos_select_proprio_ou_admin" ON "public"."problemas_tecnicos" FOR SELECT TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR "public"."suporte_usuario_e_admin"()));



CREATE POLICY "problemas_tecnicos_update_admin" ON "public"."problemas_tecnicos" FOR UPDATE TO "authenticated" USING ("public"."suporte_usuario_e_admin"()) WITH CHECK ("public"."suporte_usuario_e_admin"());



ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "profiles_delete_proprio" ON "public"."profiles" FOR DELETE USING ((("auth"."uid"() IS NOT NULL) AND (("id" = "auth"."uid"()) OR ("user_id" = "auth"."uid"()))));



CREATE POLICY "profiles_insert_proprio" ON "public"."profiles" FOR INSERT WITH CHECK ((("auth"."uid"() IS NOT NULL) AND (("id" = "auth"."uid"()) OR ("user_id" = "auth"."uid"()))));



CREATE POLICY "profiles_select_publico" ON "public"."profiles" FOR SELECT USING (true);



CREATE POLICY "profiles_update_proprio" ON "public"."profiles" FOR UPDATE TO "authenticated" USING ((("auth"."uid"() IS NOT NULL) AND (COALESCE(("user_id")::"text", ("id")::"text") = ("auth"."uid"())::"text"))) WITH CHECK ((("auth"."uid"() IS NOT NULL) AND (COALESCE(("user_id")::"text", ("id")::"text") = ("auth"."uid"())::"text")));



ALTER TABLE "public"."progresso_leitura" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "progresso_leitura_delete_proprio" ON "public"."progresso_leitura" FOR DELETE USING ((("auth"."uid"() IS NOT NULL) AND ("user_id" = "auth"."uid"())));



CREATE POLICY "progresso_leitura_insert_proprio" ON "public"."progresso_leitura" FOR INSERT WITH CHECK ((("auth"."uid"() IS NOT NULL) AND ("user_id" = "auth"."uid"())));



CREATE POLICY "progresso_leitura_select_proprio" ON "public"."progresso_leitura" FOR SELECT USING ((("auth"."uid"() IS NOT NULL) AND ("user_id" = "auth"."uid"())));



CREATE POLICY "progresso_leitura_update_proprio" ON "public"."progresso_leitura" FOR UPDATE USING ((("auth"."uid"() IS NOT NULL) AND ("user_id" = "auth"."uid"()))) WITH CHECK ((("auth"."uid"() IS NOT NULL) AND ("user_id" = "auth"."uid"())));



ALTER TABLE "public"."salvos_capitulos" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "salvos_capitulos_delete_proprio" ON "public"."salvos_capitulos" FOR DELETE USING ((("auth"."uid"() IS NOT NULL) AND ("user_id" = "auth"."uid"())));



CREATE POLICY "salvos_capitulos_insert_proprio" ON "public"."salvos_capitulos" FOR INSERT WITH CHECK ((("auth"."uid"() IS NOT NULL) AND ("user_id" = "auth"."uid"())));



CREATE POLICY "salvos_capitulos_select_publico" ON "public"."salvos_capitulos" FOR SELECT USING (true);



ALTER TABLE "public"."seguindo_autores" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "seguindo_autores_delete_proprio" ON "public"."seguindo_autores" FOR DELETE USING ((("auth"."uid"() IS NOT NULL) AND ("user_id" = "auth"."uid"())));



CREATE POLICY "seguindo_autores_insert_proprio" ON "public"."seguindo_autores" FOR INSERT WITH CHECK ((("auth"."uid"() IS NOT NULL) AND ("user_id" = "auth"."uid"())));



CREATE POLICY "seguindo_autores_select_publico" ON "public"."seguindo_autores" FOR SELECT USING (true);



ALTER TABLE "public"."seguindo_obras" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "seguindo_obras_delete_proprio" ON "public"."seguindo_obras" FOR DELETE USING ((("auth"."uid"() IS NOT NULL) AND ("user_id" = "auth"."uid"())));



CREATE POLICY "seguindo_obras_insert_proprio" ON "public"."seguindo_obras" FOR INSERT WITH CHECK ((("auth"."uid"() IS NOT NULL) AND ("user_id" = "auth"."uid"())));



CREATE POLICY "seguindo_obras_select_publico" ON "public"."seguindo_obras" FOR SELECT USING (true);



ALTER TABLE "public"."seguindo_usuarios" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "seguindo_usuarios_delete_proprio" ON "public"."seguindo_usuarios" FOR DELETE TO "authenticated" USING ((("auth"."uid"() IS NOT NULL) AND ("seguidor_id" = "auth"."uid"())));



CREATE POLICY "seguindo_usuarios_insert_proprio" ON "public"."seguindo_usuarios" FOR INSERT TO "authenticated" WITH CHECK ((("auth"."uid"() IS NOT NULL) AND ("seguidor_id" = "auth"."uid"()) AND ("seguido_id" <> "auth"."uid"()) AND (NOT "public"."usuarios_possuem_bloqueio"("seguidor_id", "seguido_id"))));



CREATE POLICY "seguindo_usuarios_select_publico" ON "public"."seguindo_usuarios" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "seguindo_usuarios_update_bloqueado" ON "public"."seguindo_usuarios" FOR UPDATE TO "authenticated" USING (false) WITH CHECK (false);



ALTER TABLE "public"."solicitacoes_exclusao_conta" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."solicitacoes_seguidores" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "solicitacoes_seguidores_delete_participantes" ON "public"."solicitacoes_seguidores" FOR DELETE TO "authenticated" USING ((("auth"."uid"() = "solicitante_id") OR ("auth"."uid"() = "destinatario_id")));



CREATE POLICY "solicitacoes_seguidores_insert_propria" ON "public"."solicitacoes_seguidores" FOR INSERT TO "authenticated" WITH CHECK ((("auth"."uid"() = "solicitante_id") AND ("solicitante_id" <> "destinatario_id") AND (NOT "public"."usuarios_possuem_bloqueio"("solicitante_id", "destinatario_id")) AND (NOT (EXISTS ( SELECT 1
   FROM "public"."seguindo_usuarios" "relacao"
  WHERE (("relacao"."seguidor_id" = "solicitacoes_seguidores"."solicitante_id") AND ("relacao"."seguido_id" = "solicitacoes_seguidores"."destinatario_id"))))) AND COALESCE(( SELECT "preferencias"."perfil_privado"
   FROM "public"."preferencias_privacidade" "preferencias"
  WHERE ("preferencias"."user_id" = "solicitacoes_seguidores"."destinatario_id")), false) AND COALESCE(( SELECT "preferencias"."aprovar_novos_seguidores"
   FROM "public"."preferencias_privacidade" "preferencias"
  WHERE ("preferencias"."user_id" = "solicitacoes_seguidores"."destinatario_id")), false)));



CREATE POLICY "solicitacoes_seguidores_select_participantes" ON "public"."solicitacoes_seguidores" FOR SELECT TO "authenticated" USING ((("auth"."uid"() = "solicitante_id") OR ("auth"."uid"() = "destinatario_id")));



ALTER TABLE "public"."top5_curtidas" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "top5_curtidas_delete_proprio" ON "public"."top5_curtidas" FOR DELETE USING ((("auth"."uid"() IS NOT NULL) AND (("usuario_id")::"text" = ("auth"."uid"())::"text")));



CREATE POLICY "top5_curtidas_insert_proprio" ON "public"."top5_curtidas" FOR INSERT WITH CHECK ((("auth"."uid"() IS NOT NULL) AND (("usuario_id")::"text" = ("auth"."uid"())::"text") AND (("perfil_user_id")::"text" <> ("auth"."uid"())::"text")));



CREATE POLICY "top5_curtidas_select_publico" ON "public"."top5_curtidas" FOR SELECT USING (true);



CREATE POLICY "usuarios podem criar publicacoes" ON "public"."comunidade_posts" FOR INSERT TO "authenticated" WITH CHECK ((("auth"."uid"())::"text" = ("autor_id")::"text"));



ALTER TABLE "public"."usuarios_bloqueados" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "usuarios_bloqueados_delete_direto_bloqueado" ON "public"."usuarios_bloqueados" FOR DELETE TO "authenticated" USING (false);



CREATE POLICY "usuarios_bloqueados_insert_direto_bloqueado" ON "public"."usuarios_bloqueados" FOR INSERT TO "authenticated" WITH CHECK (false);



CREATE POLICY "usuarios_bloqueados_select_proprios" ON "public"."usuarios_bloqueados" FOR SELECT TO "authenticated" USING (("bloqueador_id" = "auth"."uid"()));



CREATE POLICY "usuarios_bloqueados_update_bloqueado" ON "public"."usuarios_bloqueados" FOR UPDATE TO "authenticated" USING (false) WITH CHECK (false);



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



REVOKE ALL ON FUNCTION "public"."aceitar_termos_publicacao"("p_termos_versao" "text", "p_diretrizes_versao" "text", "p_politica_versao" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."aceitar_termos_publicacao"("p_termos_versao" "text", "p_diretrizes_versao" "text", "p_politica_versao" "text") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."bloquear_autoavaliacao_obra"() FROM PUBLIC;



REVOKE ALL ON FUNCTION "public"."bloquear_usuario"("p_bloqueado_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."bloquear_usuario"("p_bloqueado_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."cancelar_solicitacao_seguidor"("p_seguido_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."cancelar_solicitacao_seguidor"("p_seguido_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."carregar_avaliacao_diario"("p_diario_user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."carregar_avaliacao_diario"("p_diario_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."carregar_avaliacao_diario"("p_diario_user_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."carregar_estado_bloqueio_usuario"("p_outro_user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."carregar_estado_bloqueio_usuario"("p_outro_user_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."carregar_permissoes_abas_perfil"("p_user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."carregar_permissoes_abas_perfil"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."carregar_permissoes_abas_perfil"("p_user_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."comunidade_enquete_resultados"("p_post_ids" "uuid"[]) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."comunidade_enquete_resultados"("p_post_ids" "uuid"[]) TO "authenticated";



REVOKE ALL ON FUNCTION "public"."comunidade_motivo_denuncia_valido"("p_motivo" "text") FROM PUBLIC;



REVOKE ALL ON FUNCTION "public"."comunidade_pode_ver_comentario"("p_comentario_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."comunidade_pode_ver_comentario"("p_comentario_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."comunidade_pode_ver_comentario"("p_comentario_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."comunidade_pode_ver_post"("p_post_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."comunidade_pode_ver_post"("p_post_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."comunidade_pode_ver_post"("p_post_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."comunidade_usuario_e_admin"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."comunidade_usuario_e_admin"() TO "authenticated";



REVOKE ALL ON FUNCTION "public"."criar_denuncia"("p_alvo_tipo" "text", "p_alvo_id" "uuid", "p_motivo" "text", "p_detalhe" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."criar_denuncia"("p_alvo_tipo" "text", "p_alvo_id" "uuid", "p_motivo" "text", "p_detalhe" "text") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."criar_denuncia_perfil"("p_denunciado_id" "uuid", "p_perfil_nome" "text", "p_perfil_url" "text", "p_motivo" "text", "p_descricao" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."criar_denuncia_perfil"("p_denunciado_id" "uuid", "p_perfil_nome" "text", "p_perfil_url" "text", "p_motivo" "text", "p_descricao" "text") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."criar_notificacao_comunidade_interna"("p_user_id" "uuid", "p_ator_id" "uuid", "p_tipo" "text", "p_titulo" "text", "p_mensagem" "text", "p_link" "text", "p_notificacao_id" "text") FROM PUBLIC;



REVOKE ALL ON FUNCTION "public"."criar_notificacao_interacao_capitulo"("p_capitulo_id" "uuid", "p_comentario_id" "uuid", "p_tipo" "text", "p_titulo" "text", "p_mensagem" "text", "p_link" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."criar_notificacao_interacao_capitulo"("p_capitulo_id" "uuid", "p_comentario_id" "uuid", "p_tipo" "text", "p_titulo" "text", "p_mensagem" "text", "p_link" "text") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."criar_notificacao_social"("p_user_id" "uuid", "p_tipo" "text", "p_titulo" "text", "p_mensagem" "text", "p_link" "text", "p_notificacao_id" "text", "p_obra_id" "uuid", "p_capitulo_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."criar_notificacao_social"("p_user_id" "uuid", "p_tipo" "text", "p_titulo" "text", "p_mensagem" "text", "p_link" "text", "p_notificacao_id" "text", "p_obra_id" "uuid", "p_capitulo_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."criar_notificacoes_capitulo"("p_obra_id" "uuid", "p_capitulo_id" "uuid", "p_titulo" "text", "p_mensagem" "text", "p_href" "text", "p_tipo" "text", "p_criado_em" timestamp with time zone) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."criar_notificacoes_capitulo"("p_obra_id" "uuid", "p_capitulo_id" "uuid", "p_titulo" "text", "p_mensagem" "text", "p_href" "text", "p_tipo" "text", "p_criado_em" timestamp with time zone) TO "authenticated";



REVOKE ALL ON FUNCTION "public"."criar_problema_tecnico"("p_categoria" "text", "p_titulo" "text", "p_descricao" "text", "p_pagina_url" "text", "p_navegador" "text", "p_dispositivo" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."criar_problema_tecnico"("p_categoria" "text", "p_titulo" "text", "p_descricao" "text", "p_pagina_url" "text", "p_navegador" "text", "p_dispositivo" "text") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."deixar_de_seguir_usuario"("p_seguido_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."deixar_de_seguir_usuario"("p_seguido_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."desbloquear_usuario"("p_bloqueado_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."desbloquear_usuario"("p_bloqueado_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."diario_pode_avaliar"("p_diario_user_id" "uuid", "p_avaliador_id" "uuid") FROM PUBLIC;



REVOKE ALL ON FUNCTION "public"."diario_pode_comentar"("p_anotacao_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."diario_pode_comentar"("p_anotacao_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."diario_pode_comentar"("p_anotacao_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."diario_pode_ver_anotacao"("p_anotacao_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."diario_pode_ver_anotacao"("p_anotacao_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."diario_pode_ver_anotacao"("p_anotacao_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."diario_pode_ver_comentarios"("p_anotacao_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."diario_pode_ver_comentarios"("p_anotacao_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."diario_pode_ver_comentarios"("p_anotacao_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."diario_sem_bloqueio_com_usuario_atual"("p_outro_user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."diario_sem_bloqueio_com_usuario_atual"("p_outro_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."diario_sem_bloqueio_com_usuario_atual"("p_outro_user_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."diario_usuario_e_seguidor"("p_seguidor_id" "uuid", "p_seguido_id" "uuid") FROM PUBLIC;



REVOKE ALL ON FUNCTION "public"."diario_usuarios_sem_bloqueio"("p_usuario_a" "uuid", "p_usuario_b" "uuid") FROM PUBLIC;



REVOKE ALL ON FUNCTION "public"."evitar_notificacao_duplicada"() FROM PUBLIC;



REVOKE ALL ON FUNCTION "public"."excluir_notificacoes_lidas"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."excluir_notificacoes_lidas"() TO "authenticated";



REVOKE ALL ON FUNCTION "public"."exigir_aceite_termos_antes_de_publicar"() FROM PUBLIC;



REVOKE ALL ON FUNCTION "public"."historietas_nome_publico_usuario"("p_user_id" "uuid") FROM PUBLIC;



REVOKE ALL ON FUNCTION "public"."incrementar_visualizacao_capitulo"("capitulo_id_param" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."incrementar_visualizacao_capitulo"("capitulo_id_param" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."incrementar_visualizacao_capitulo"("capitulo_id_param" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."incrementar_visualizacao_obra"("obra_id_param" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."incrementar_visualizacao_obra"("obra_id_param" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."incrementar_visualizacao_obra"("obra_id_param" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."listar_meus_problemas_tecnicos"("p_limite" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."listar_meus_problemas_tecnicos"("p_limite" integer) TO "authenticated";



REVOKE ALL ON FUNCTION "public"."listar_minhas_denuncias"("p_limite" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."listar_minhas_denuncias"("p_limite" integer) TO "authenticated";



REVOKE ALL ON FUNCTION "public"."listar_usuarios_bloqueados"("p_limite" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."listar_usuarios_bloqueados"("p_limite" integer) TO "authenticated";



REVOKE ALL ON FUNCTION "public"."marcar_notificacoes_lidas"("notificacao_ids" "text"[], "novo_estado" boolean) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."marcar_notificacoes_lidas"("notificacao_ids" "text"[], "novo_estado" boolean) TO "authenticated";



REVOKE ALL ON FUNCTION "public"."notificar_comentario_obra"() FROM PUBLIC;



REVOKE ALL ON FUNCTION "public"."notificar_comentario_post_comunidade"() FROM PUBLIC;



REVOKE ALL ON FUNCTION "public"."notificar_curtida_comentario_comunidade"() FROM PUBLIC;



REVOKE ALL ON FUNCTION "public"."notificar_curtida_obra"() FROM PUBLIC;



REVOKE ALL ON FUNCTION "public"."notificar_curtida_post_comunidade"() FROM PUBLIC;



REVOKE ALL ON FUNCTION "public"."obter_nome_usuario_notificacao"("p_user_id" "uuid") FROM PUBLIC;



REVOKE ALL ON FUNCTION "public"."perfil_motivo_denuncia_valido"("p_motivo" "text") FROM PUBLIC;



GRANT ALL ON TABLE "public"."operacoes_exclusao_conta" TO "service_role";



REVOKE ALL ON FUNCTION "public"."reivindicar_operacao_exclusao_conta"("p_subject_user_id" "uuid", "p_lock_token" "uuid", "p_lock_duracao_segundos" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."reivindicar_operacao_exclusao_conta"("p_subject_user_id" "uuid", "p_lock_token" "uuid", "p_lock_duracao_segundos" integer) TO "service_role";



REVOKE ALL ON FUNCTION "public"."remover_avaliacao_diario"("p_diario_user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."remover_avaliacao_diario"("p_diario_user_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."remover_conteudo_denunciado_transacional"("p_alvo_tipo" "text", "p_alvo_id" "uuid", "p_observacao_admin" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."remover_conteudo_denunciado_transacional"("p_alvo_tipo" "text", "p_alvo_id" "uuid", "p_observacao_admin" "text") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."remover_notificacoes_seguimento"("p_solicitante_id" "uuid", "p_destinatario_id" "uuid", "p_incluir_novo_seguidor" boolean) FROM PUBLIC;



REVOKE ALL ON FUNCTION "public"."remover_seguidor"("p_seguidor_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."remover_seguidor"("p_seguidor_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."responder_solicitacao_seguidor"("p_solicitacao_id" "uuid", "p_aceitar" boolean) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."responder_solicitacao_seguidor"("p_solicitacao_id" "uuid", "p_aceitar" boolean) TO "authenticated";



REVOKE ALL ON FUNCTION "public"."salvar_avaliacao_diario"("p_diario_user_id" "uuid", "p_nota" numeric) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."salvar_avaliacao_diario"("p_diario_user_id" "uuid", "p_nota" numeric) TO "authenticated";



REVOKE ALL ON FUNCTION "public"."solicitar_ou_seguir_usuario"("p_seguido_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."solicitar_ou_seguir_usuario"("p_seguido_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."status_aceite_termos_publicacao"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."status_aceite_termos_publicacao"() TO "authenticated";



REVOKE ALL ON FUNCTION "public"."suporte_usuario_e_admin"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."suporte_usuario_e_admin"() TO "authenticated";



REVOKE ALL ON FUNCTION "public"."usuario_aceitou_termos_publicacao"("p_user_id" "uuid") FROM PUBLIC;



REVOKE ALL ON FUNCTION "public"."usuario_e_admin"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."usuario_e_admin"() TO "authenticated";



REVOKE ALL ON FUNCTION "public"."usuario_pode_ver_aba_perfil"("p_user_id" "uuid", "p_visibilidade" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."usuario_pode_ver_aba_perfil"("p_user_id" "uuid", "p_visibilidade" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."usuario_pode_ver_aba_perfil"("p_user_id" "uuid", "p_visibilidade" "text") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."usuario_pode_ver_perfil"("p_user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."usuario_pode_ver_perfil"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."usuario_pode_ver_perfil"("p_user_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."usuarios_possuem_bloqueio"("p_usuario_a" "uuid", "p_usuario_b" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."usuarios_possuem_bloqueio"("p_usuario_a" "uuid", "p_usuario_b" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."validar_comentario_diario"() FROM PUBLIC;



REVOKE ALL ON FUNCTION "public"."validar_comunidade_denuncia"() FROM PUBLIC;



REVOKE ALL ON FUNCTION "public"."validar_denuncia_perfil"() FROM PUBLIC;



REVOKE ALL ON FUNCTION "public"."validar_operacao_exclusao_conta"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."validar_operacao_exclusao_conta"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."validar_problema_tecnico"() FROM PUBLIC;



REVOKE ALL ON FUNCTION "public"."validar_resposta_comentario_capitulo"() FROM PUBLIC;



REVOKE ALL ON FUNCTION "public"."validar_resposta_comentario_comunidade"() FROM PUBLIC;



REVOKE ALL ON FUNCTION "public"."validar_resposta_comentario_obra"() FROM PUBLIC;



GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."autor_avaliacoes" TO "anon";
GRANT ALL ON TABLE "public"."autor_avaliacoes" TO "authenticated";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."autor_avaliacoes" TO "service_role";



GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."capitulo_visualizacoes_unicas" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."capitulos" TO "anon";
GRANT ALL ON TABLE "public"."capitulos" TO "authenticated";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."capitulos" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."comentarios_capitulos" TO "anon";
GRANT ALL ON TABLE "public"."comentarios_capitulos" TO "authenticated";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."comentarios_capitulos" TO "service_role";



GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."comentarios_capitulos_curtidas" TO "service_role";
GRANT SELECT ON TABLE "public"."comentarios_capitulos_curtidas" TO "anon";
GRANT SELECT,INSERT,DELETE ON TABLE "public"."comentarios_capitulos_curtidas" TO "authenticated";



GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."comentarios_obras" TO "service_role";
GRANT SELECT ON TABLE "public"."comentarios_obras" TO "anon";
GRANT SELECT,INSERT,DELETE ON TABLE "public"."comentarios_obras" TO "authenticated";



GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."comentarios_obras_curtidas" TO "service_role";
GRANT SELECT ON TABLE "public"."comentarios_obras_curtidas" TO "anon";
GRANT SELECT,INSERT,DELETE ON TABLE "public"."comentarios_obras_curtidas" TO "authenticated";



GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."comunidade_comentario_curtidas" TO "service_role";
GRANT SELECT ON TABLE "public"."comunidade_comentario_curtidas" TO "anon";
GRANT SELECT,INSERT,DELETE ON TABLE "public"."comunidade_comentario_curtidas" TO "authenticated";



GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."comunidade_comentarios" TO "service_role";
GRANT SELECT ON TABLE "public"."comunidade_comentarios" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."comunidade_comentarios" TO "authenticated";



GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."comunidade_comentarios_salvos" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."comunidade_comentarios_salvos" TO "authenticated";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."comunidade_comentarios_salvos" TO "service_role";



GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."comunidade_curtidas" TO "service_role";
GRANT SELECT ON TABLE "public"."comunidade_curtidas" TO "anon";
GRANT SELECT,INSERT,DELETE ON TABLE "public"."comunidade_curtidas" TO "authenticated";



GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."comunidade_denuncias" TO "service_role";
GRANT SELECT,DELETE,UPDATE ON TABLE "public"."comunidade_denuncias" TO "authenticated";



GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."comunidade_enquete_votos" TO "service_role";
GRANT SELECT ON TABLE "public"."comunidade_enquete_votos" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."comunidade_enquete_votos" TO "authenticated";



GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."comunidade_post_salvos" TO "service_role";
GRANT SELECT,INSERT,DELETE ON TABLE "public"."comunidade_post_salvos" TO "authenticated";
GRANT SELECT ON TABLE "public"."comunidade_post_salvos" TO "anon";



GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."comunidade_posts" TO "service_role";
GRANT SELECT ON TABLE "public"."comunidade_posts" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."comunidade_posts" TO "authenticated";



GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."comunidade_salvos" TO "service_role";
GRANT SELECT,INSERT,DELETE ON TABLE "public"."comunidade_salvos" TO "authenticated";
GRANT SELECT ON TABLE "public"."comunidade_salvos" TO "anon";



GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."concluidas" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."concluidas" TO "authenticated";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."concluidas" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."curtidas_capitulos" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."curtidas_capitulos" TO "authenticated";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."curtidas_capitulos" TO "service_role";



GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."denuncias_perfis" TO "anon";
GRANT SELECT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "public"."denuncias_perfis" TO "authenticated";
GRANT ALL ON TABLE "public"."denuncias_perfis" TO "service_role";



GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."diario_anotacao_comentarios" TO "service_role";
GRANT SELECT ON TABLE "public"."diario_anotacao_comentarios" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."diario_anotacao_comentarios" TO "authenticated";



GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."diario_anotacao_curtidas" TO "service_role";
GRANT SELECT ON TABLE "public"."diario_anotacao_curtidas" TO "anon";
GRANT SELECT,INSERT,DELETE ON TABLE "public"."diario_anotacao_curtidas" TO "authenticated";



GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."diario_anotacoes" TO "service_role";
GRANT SELECT ON TABLE "public"."diario_anotacoes" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."diario_anotacoes" TO "authenticated";



GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."diario_atividades" TO "service_role";
GRANT SELECT ON TABLE "public"."diario_atividades" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."diario_atividades" TO "authenticated";



GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."diario_avaliacoes" TO "anon";
GRANT ALL ON TABLE "public"."diario_avaliacoes" TO "authenticated";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."diario_avaliacoes" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."diario_comentario_curtidas" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."diario_comentario_curtidas" TO "authenticated";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."diario_comentario_curtidas" TO "service_role";



GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."diario_configuracoes" TO "anon";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."diario_configuracoes" TO "authenticated";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."diario_configuracoes" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."favoritos" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."favoritos" TO "authenticated";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."favoritos" TO "service_role";



GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."notificacoes" TO "service_role";
GRANT SELECT,DELETE ON TABLE "public"."notificacoes" TO "authenticated";



GRANT UPDATE("lida") ON TABLE "public"."notificacoes" TO "authenticated";



GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."obra_avaliacoes" TO "anon";
GRANT ALL ON TABLE "public"."obra_avaliacoes" TO "authenticated";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."obra_avaliacoes" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."obra_comentario_curtidas" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."obra_comentario_curtidas" TO "authenticated";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."obra_comentario_curtidas" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."obra_comentarios" TO "anon";
GRANT ALL ON TABLE "public"."obra_comentarios" TO "authenticated";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."obra_comentarios" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."obra_curtidas" TO "anon";
GRANT ALL ON TABLE "public"."obra_curtidas" TO "authenticated";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."obra_curtidas" TO "service_role";



GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."obra_visualizacoes_unicas" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."obras" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."obras" TO "authenticated";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."obras" TO "service_role";



GRANT UPDATE("titulo") ON TABLE "public"."obras" TO "authenticated";



GRANT UPDATE("autor") ON TABLE "public"."obras" TO "authenticated";



GRANT UPDATE("genero") ON TABLE "public"."obras" TO "authenticated";



GRANT UPDATE("formato") ON TABLE "public"."obras" TO "authenticated";



GRANT UPDATE("classificacao_indicativa") ON TABLE "public"."obras" TO "authenticated";



GRANT UPDATE("sinopse") ON TABLE "public"."obras" TO "authenticated";



GRANT UPDATE("tags") ON TABLE "public"."obras" TO "authenticated";



GRANT UPDATE("capa_url") ON TABLE "public"."obras" TO "authenticated";



GRANT UPDATE("capa_nome") ON TABLE "public"."obras" TO "authenticated";



GRANT UPDATE("arquivo_url") ON TABLE "public"."obras" TO "authenticated";



GRANT UPDATE("arquivo_nome") ON TABLE "public"."obras" TO "authenticated";



GRANT UPDATE("arquivo_tipo") ON TABLE "public"."obras" TO "authenticated";



GRANT UPDATE("arquivo_tamanho") ON TABLE "public"."obras" TO "authenticated";



GRANT UPDATE("arquivo_categoria") ON TABLE "public"."obras" TO "authenticated";



GRANT UPDATE("publicado") ON TABLE "public"."obras" TO "authenticated";



GRANT UPDATE("slug") ON TABLE "public"."obras" TO "authenticated";



GRANT UPDATE("link") ON TABLE "public"."obras" TO "authenticated";



GRANT UPDATE("atualizado_em") ON TABLE "public"."obras" TO "authenticated";



GRANT UPDATE("avisos_conteudo") ON TABLE "public"."obras" TO "authenticated";



GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."preferencias_privacidade" TO "anon";
GRANT ALL ON TABLE "public"."preferencias_privacidade" TO "authenticated";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."preferencias_privacidade" TO "service_role";



GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."problemas_tecnicos" TO "service_role";
GRANT SELECT,DELETE,UPDATE ON TABLE "public"."problemas_tecnicos" TO "authenticated";



GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."profiles" TO "anon";
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."profiles" TO "authenticated";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."profiles" TO "service_role";



GRANT SELECT("id"),INSERT("id") ON TABLE "public"."profiles" TO "authenticated";
GRANT SELECT("id") ON TABLE "public"."profiles" TO "anon";



GRANT SELECT("user_id"),INSERT("user_id"),UPDATE("user_id") ON TABLE "public"."profiles" TO "authenticated";
GRANT SELECT("user_id") ON TABLE "public"."profiles" TO "anon";



GRANT SELECT("nome"),INSERT("nome"),UPDATE("nome") ON TABLE "public"."profiles" TO "authenticated";
GRANT SELECT("nome") ON TABLE "public"."profiles" TO "anon";



GRANT SELECT("avatar_url"),INSERT("avatar_url"),UPDATE("avatar_url") ON TABLE "public"."profiles" TO "authenticated";
GRANT SELECT("avatar_url") ON TABLE "public"."profiles" TO "anon";



GRANT SELECT("bio"),UPDATE("bio") ON TABLE "public"."profiles" TO "authenticated";
GRANT SELECT("bio") ON TABLE "public"."profiles" TO "anon";



GRANT INSERT("tipo") ON TABLE "public"."profiles" TO "authenticated";



GRANT SELECT("criado_em"),INSERT("criado_em") ON TABLE "public"."profiles" TO "authenticated";
GRANT SELECT("criado_em") ON TABLE "public"."profiles" TO "anon";



GRANT SELECT("atualizado_em"),INSERT("atualizado_em"),UPDATE("atualizado_em") ON TABLE "public"."profiles" TO "authenticated";
GRANT SELECT("atualizado_em") ON TABLE "public"."profiles" TO "anon";



GRANT SELECT("sobre_bio"),UPDATE("sobre_bio") ON TABLE "public"."profiles" TO "authenticated";
GRANT SELECT("sobre_bio") ON TABLE "public"."profiles" TO "anon";



GRANT SELECT("username"),UPDATE("username") ON TABLE "public"."profiles" TO "authenticated";
GRANT SELECT("username") ON TABLE "public"."profiles" TO "anon";



GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."progresso_leitura" TO "anon";
GRANT ALL ON TABLE "public"."progresso_leitura" TO "authenticated";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."progresso_leitura" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."salvos_capitulos" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."salvos_capitulos" TO "authenticated";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."salvos_capitulos" TO "service_role";



GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."seguindo_autores" TO "anon";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."seguindo_autores" TO "authenticated";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."seguindo_autores" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."seguindo_obras" TO "anon";
GRANT ALL ON TABLE "public"."seguindo_obras" TO "authenticated";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."seguindo_obras" TO "service_role";



GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."seguindo_usuarios" TO "service_role";
GRANT SELECT ON TABLE "public"."seguindo_usuarios" TO "anon";
GRANT SELECT,INSERT,DELETE ON TABLE "public"."seguindo_usuarios" TO "authenticated";



GRANT ALL ON TABLE "public"."solicitacoes_exclusao_conta" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."solicitacoes_seguidores" TO "authenticated";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."solicitacoes_seguidores" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."top5_curtidas" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."top5_curtidas" TO "authenticated";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."top5_curtidas" TO "service_role";



GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."usuarios_bloqueados" TO "service_role";
GRANT SELECT ON TABLE "public"."usuarios_bloqueados" TO "authenticated";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLES TO "service_role";







