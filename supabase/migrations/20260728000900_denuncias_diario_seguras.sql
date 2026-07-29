-- 20260728000900_denuncias_diario_seguras.sql
-- Adiciona denúncias seguras para anotações e comentários do Diário.
-- Também permite que administradores visualizem e removam esses alvos.

begin;

-- ============================================================
-- PRÉ-REQUISITOS
-- ============================================================

do $$
declare
  v_tabela text;
begin
  foreach v_tabela in array array[
    'comunidade_denuncias',
    'comunidade_posts',
    'comunidade_comentarios',
    'comentarios_capitulos',
    'obras',
    'capitulos',
    'comentarios_obras',
    'diario_anotacoes',
    'diario_anotacao_comentarios',
    'preferencias_privacidade'
  ]
  loop
    if to_regclass(format('public.%I', v_tabela)) is null then
      raise exception
        'A tabela public.% precisa existir antes desta migration.',
        v_tabela;
    end if;
  end loop;

  if to_regprocedure(
    'public.comunidade_motivo_denuncia_valido(text)'
  ) is null then
    raise exception
      'A função public.comunidade_motivo_denuncia_valido(text) precisa existir.';
  end if;

  if to_regprocedure(
    'public.comunidade_usuario_e_admin()'
  ) is null then
    raise exception
      'A função public.comunidade_usuario_e_admin() precisa existir.';
  end if;

  if to_regprocedure(
    'public.usuario_e_admin()'
  ) is null then
    raise exception
      'A função public.usuario_e_admin() precisa existir.';
  end if;

  if to_regprocedure(
    'public.usuario_pode_ver_aba_perfil(uuid,text)'
  ) is null then
    raise exception
      'A função public.usuario_pode_ver_aba_perfil(uuid,text) precisa existir.';
  end if;
end
$$;

-- ============================================================
-- TIPOS DE ALVO
-- ============================================================

alter table public.comunidade_denuncias
  drop constraint if exists comunidade_denuncias_alvo_tipo_check;

alter table public.comunidade_denuncias
  add constraint comunidade_denuncias_alvo_tipo_check
  check (
    alvo_tipo in (
      'post',
      'comentario',
      'comentario_capitulo',
      'obra',
      'capitulo',
      'comentario_obra',
      'diario_anotacao',
      'comentario_diario'
    )
  );

-- ============================================================
-- VALIDAÇÃO SEGURA
-- ============================================================

create or replace function public.validar_comunidade_denuncia()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, auth, pg_temp
as $$
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

comment on function public.validar_comunidade_denuncia() is
  'Valida denúncias de Comunidade, obras, capítulos, Diário e comentários.';

revoke all
  on function public.validar_comunidade_denuncia()
  from public, anon, authenticated;

-- ============================================================
-- RPC SEGURA
-- ============================================================

create or replace function public.criar_denuncia(
  p_alvo_tipo text,
  p_alvo_id uuid,
  p_motivo text default 'Conteúdo inadequado',
  p_detalhe text default ''
)
returns table (
  denuncia_id uuid,
  denuncia_status text,
  denuncia_criado_em timestamptz
)
language plpgsql
security definer
set search_path = pg_catalog, public, auth, pg_temp
as $$
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

comment on function public.criar_denuncia(
  text,
  uuid,
  text,
  text
) is
  'Cria denúncias seguras para Comunidade, obras, capítulos, Diário e comentários.';

revoke all
  on function public.criar_denuncia(
    text,
    uuid,
    text,
    text
  )
  from public, anon, authenticated;

grant execute
  on function public.criar_denuncia(
    text,
    uuid,
    text,
    text
  )
  to authenticated;

-- ============================================================
-- MODERAÇÃO ADMINISTRATIVA
-- ============================================================

alter table public.diario_anotacoes
  enable row level security;

alter table public.diario_anotacao_comentarios
  enable row level security;

drop policy if exists
  "diario_anotacoes_select_admin_moderacao"
  on public.diario_anotacoes;

create policy
  "diario_anotacoes_select_admin_moderacao"
  on public.diario_anotacoes
  for select
  to authenticated
  using (public.usuario_e_admin());

drop policy if exists
  "diario_anotacoes_delete_admin_moderacao"
  on public.diario_anotacoes;

create policy
  "diario_anotacoes_delete_admin_moderacao"
  on public.diario_anotacoes
  for delete
  to authenticated
  using (public.usuario_e_admin());

drop policy if exists
  "diario_comentarios_select_admin_moderacao"
  on public.diario_anotacao_comentarios;

create policy
  "diario_comentarios_select_admin_moderacao"
  on public.diario_anotacao_comentarios
  for select
  to authenticated
  using (public.usuario_e_admin());

drop policy if exists
  "diario_comentarios_delete_admin_moderacao"
  on public.diario_anotacao_comentarios;

create policy
  "diario_comentarios_delete_admin_moderacao"
  on public.diario_anotacao_comentarios
  for delete
  to authenticated
  using (public.usuario_e_admin());

grant select, delete
  on public.diario_anotacoes
  to authenticated;

grant select, delete
  on public.diario_anotacao_comentarios
  to authenticated;

commit;