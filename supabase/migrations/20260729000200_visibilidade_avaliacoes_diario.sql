-- 20260729000200_visibilidade_avaliacoes_diario.sql
-- Adiciona controles de visibilidade às avaliações do Diário:
--   mostrar: publico, seguidores, seguindo ou somente_eu;
--   permitir: todos, seguidores, seguindo ou ninguem.

begin;

alter table public.preferencias_privacidade
  add column if not exists visibilidade_avaliacao_diario text;

update public.preferencias_privacidade
set
  visibilidade_avaliacao_diario = case
    when visibilidade_avaliacao_diario in (
      'publico',
      'seguidores',
      'seguindo',
      'somente_eu'
    ) then visibilidade_avaliacao_diario
    when coalesce(mostrar_avaliacao_diario, true) then 'publico'
    else 'somente_eu'
  end,
  quem_pode_avaliar_diario = case
    when quem_pode_avaliar_diario in (
      'todos',
      'seguidores',
      'seguindo',
      'ninguem'
    ) then quem_pode_avaliar_diario
    when coalesce(permitir_avaliacao_diario, true) then 'seguidores'
    else 'ninguem'
  end;

update public.preferencias_privacidade
set
  mostrar_avaliacao_diario =
    visibilidade_avaliacao_diario <> 'somente_eu',
  permitir_avaliacao_diario =
    quem_pode_avaliar_diario <> 'ninguem';

alter table public.preferencias_privacidade
  alter column visibilidade_avaliacao_diario set default 'publico',
  alter column visibilidade_avaliacao_diario set not null,
  alter column quem_pode_avaliar_diario set default 'seguidores';

alter table public.preferencias_privacidade
  drop constraint if exists
    preferencias_privacidade_avaliacao_diario_check,
  drop constraint if exists
    preferencias_privacidade_visibilidade_avaliacao_diario_check;

alter table public.preferencias_privacidade
  add constraint
    preferencias_privacidade_visibilidade_avaliacao_diario_check
  check (
    visibilidade_avaliacao_diario in (
      'publico',
      'seguidores',
      'seguindo',
      'somente_eu'
    )
  ),
  add constraint preferencias_privacidade_avaliacao_diario_check
  check (
    quem_pode_avaliar_diario in (
      'todos',
      'seguidores',
      'seguindo',
      'ninguem'
    )
  );

comment on column
  public.preferencias_privacidade.visibilidade_avaliacao_diario is
  'Quem pode ver a média e as estrelas do Diário: publico, seguidores, seguindo ou somente_eu.';

comment on column
  public.preferencias_privacidade.quem_pode_avaliar_diario is
  'Quem pode avaliar o Diário: todos, seguidores, seguindo ou ninguem.';

create or replace function public.diario_pode_avaliar(
  p_diario_user_id uuid,
  p_avaliador_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public, auth, pg_temp
as $$
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
      'seguidores'
    )
      when 'todos' then true
      when 'seguidores' then public.diario_usuario_e_seguidor(
        p_avaliador_id,
        p_diario_user_id
      )
      when 'seguindo' then public.diario_usuario_e_seguidor(
        p_diario_user_id,
        p_avaliador_id
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

create or replace function public.carregar_avaliacao_diario(
  p_diario_user_id uuid
)
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, public, auth, pg_temp
as $$
declare
  v_usuario_atual uuid := auth.uid();
  v_visibilidade text := 'publico';
  v_mostrar boolean := true;
  v_permitir boolean := true;
  v_quem text := 'seguidores';
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
    coalesce(
      preferencias.visibilidade_avaliacao_diario,
      case
        when coalesce(preferencias.mostrar_avaliacao_diario, true)
          then 'publico'
        else 'somente_eu'
      end
    ),
    coalesce(preferencias.permitir_avaliacao_diario, true),
    coalesce(preferencias.quem_pode_avaliar_diario, 'seguidores')
  into v_visibilidade, v_permitir, v_quem
  from public.preferencias_privacidade preferencias
  where preferencias.user_id = p_diario_user_id;

  if not found then
    v_visibilidade := 'publico';
    v_permitir := true;
    v_quem := 'seguidores';
  end if;

  v_mostrar := v_visibilidade <> 'somente_eu';

  v_pode_ver :=
    (
      v_usuario_atual = p_diario_user_id
      or coalesce(public.usuario_e_admin(), false)
      or (
        public.diario_usuarios_sem_bloqueio(
          v_usuario_atual,
          p_diario_user_id
        )
        and public.usuario_pode_ver_aba_perfil(
          p_diario_user_id,
          v_visibilidade
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
    'visibilidade', v_visibilidade,
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

grant execute
  on function public.carregar_avaliacao_diario(uuid)
  to anon, authenticated;

grant execute
  on function public.diario_pode_avaliar(uuid, uuid)
  to authenticated;

commit;