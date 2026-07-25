-- Privacidade simplificada por aba do perfil.
-- Mantém as colunas antigas temporariamente para compatibilidade com versões
-- anteriores do aplicativo e migra os valores existentes para o novo modelo.

begin;

alter table public.preferencias_privacidade
  add column if not exists visibilidade_obras text,
  add column if not exists visibilidade_sobre text,
  add column if not exists visibilidade_diario text,
  add column if not exists visibilidade_comunidade text,
  add column if not exists visibilidade_biblioteca text,
  add column if not exists visibilidade_atividades text;

-- Converte as escolhas antigas para o novo modelo sem perder configurações.
update public.preferencias_privacidade
set
  visibilidade_obras = coalesce(
    visibilidade_obras,
    case
      when coalesce(mostrar_obras_para_todos, true) then 'publico'
      else 'seguidores'
    end
  ),
  visibilidade_sobre = coalesce(
    visibilidade_sobre,
    case
      when coalesce(mostrar_sobre_para_todos, true) then 'publico'
      else 'seguidores'
    end
  ),
  visibilidade_diario = coalesce(
    visibilidade_diario,
    case
      when not coalesce(mostrar_diario_perfil, true) then 'somente_eu'
      when coalesce(perfil_privado, false) then 'seguidores'
      else 'publico'
    end
  ),
  visibilidade_comunidade = coalesce(
    visibilidade_comunidade,
    case
      when coalesce(perfil_privado, false) then 'seguidores'
      else 'publico'
    end
  ),
  visibilidade_biblioteca = coalesce(
    visibilidade_biblioteca,
    case
      when coalesce(perfil_privado, false) then 'seguidores'
      else 'somente_eu'
    end
  ),
  visibilidade_atividades = coalesce(
    visibilidade_atividades,
    case
      when not coalesce(mostrar_atividades_leitura, true) then 'somente_eu'
      when coalesce(perfil_privado, false) then 'seguidores'
      else 'publico'
    end
  );

alter table public.preferencias_privacidade
  alter column visibilidade_obras set default 'publico',
  alter column visibilidade_obras set not null,
  alter column visibilidade_sobre set default 'publico',
  alter column visibilidade_sobre set not null,
  alter column visibilidade_diario set default 'publico',
  alter column visibilidade_diario set not null,
  alter column visibilidade_comunidade set default 'publico',
  alter column visibilidade_comunidade set not null,
  alter column visibilidade_biblioteca set default 'somente_eu',
  alter column visibilidade_biblioteca set not null,
  alter column visibilidade_atividades set default 'seguidores',
  alter column visibilidade_atividades set not null;

alter table public.preferencias_privacidade
  drop constraint if exists preferencias_privacidade_visibilidade_obras_check,
  drop constraint if exists preferencias_privacidade_visibilidade_sobre_check,
  drop constraint if exists preferencias_privacidade_visibilidade_diario_check,
  drop constraint if exists preferencias_privacidade_visibilidade_comunidade_check,
  drop constraint if exists preferencias_privacidade_visibilidade_biblioteca_check,
  drop constraint if exists preferencias_privacidade_visibilidade_atividades_check;

alter table public.preferencias_privacidade
  add constraint preferencias_privacidade_visibilidade_obras_check
    check (visibilidade_obras in ('publico', 'seguidores', 'seguindo', 'somente_eu')),
  add constraint preferencias_privacidade_visibilidade_sobre_check
    check (visibilidade_sobre in ('publico', 'seguidores', 'seguindo', 'somente_eu')),
  add constraint preferencias_privacidade_visibilidade_diario_check
    check (visibilidade_diario in ('publico', 'seguidores', 'seguindo', 'somente_eu')),
  add constraint preferencias_privacidade_visibilidade_comunidade_check
    check (visibilidade_comunidade in ('publico', 'seguidores', 'seguindo', 'somente_eu')),
  add constraint preferencias_privacidade_visibilidade_biblioteca_check
    check (visibilidade_biblioteca in ('publico', 'seguidores', 'seguindo', 'somente_eu')),
  add constraint preferencias_privacidade_visibilidade_atividades_check
    check (visibilidade_atividades in ('publico', 'seguidores', 'seguindo', 'somente_eu'));

comment on column public.preferencias_privacidade.visibilidade_obras is
  'Visibilidade da aba Obras: publico, seguidores, seguindo ou somente_eu.';
comment on column public.preferencias_privacidade.visibilidade_sobre is
  'Visibilidade da aba Sobre: publico, seguidores, seguindo ou somente_eu.';
comment on column public.preferencias_privacidade.visibilidade_diario is
  'Visibilidade da aba Diário: publico, seguidores, seguindo ou somente_eu.';
comment on column public.preferencias_privacidade.visibilidade_comunidade is
  'Visibilidade da aba Comunidade: publico, seguidores, seguindo ou somente_eu.';
comment on column public.preferencias_privacidade.visibilidade_biblioteca is
  'Visibilidade da aba Biblioteca: publico, seguidores, seguindo ou somente_eu.';
comment on column public.preferencias_privacidade.visibilidade_atividades is
  'Visibilidade das atividades: publico, seguidores, seguindo ou somente_eu.';

-- Verifica uma regra de visibilidade para o visitante atual.
-- "seguidores": o visitante segue o dono do perfil.
-- "seguindo": o dono do perfil segue o visitante.
create or replace function public.usuario_pode_ver_aba_perfil(
  p_user_id uuid,
  p_visibilidade text
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    p_user_id is not null
    and p_visibilidade in ('publico', 'seguidores', 'seguindo', 'somente_eu')
    and (
      auth.uid() = p_user_id
      or p_visibilidade = 'publico'
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
    );
$$;

revoke all
  on function public.usuario_pode_ver_aba_perfil(uuid, text)
  from public;

grant execute
  on function public.usuario_pode_ver_aba_perfil(uuid, text)
  to anon, authenticated;

-- Entrega todas as permissões em uma única chamada para a página de perfil.
create or replace function public.carregar_permissoes_abas_perfil(
  p_user_id uuid
)
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
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

revoke all
  on function public.carregar_permissoes_abas_perfil(uuid)
  from public;

grant execute
  on function public.carregar_permissoes_abas_perfil(uuid)
  to anon, authenticated;

-- O banco passa a proteger o Diário e as atividades pelas novas regras gerais.
drop policy if exists "diario_atividades_select_visiveis"
  on public.diario_atividades;

create policy "diario_atividades_select_visiveis"
  on public.diario_atividades
  for select
  using (
    user_id = auth.uid()
    or (
      coalesce(visibilidade, 'privado') in ('publico', 'parcial')
      and public.usuario_pode_ver_aba_perfil(
        user_id,
        coalesce(
          (
            select preferencias.visibilidade_atividades
            from public.preferencias_privacidade preferencias
            where preferencias.user_id = diario_atividades.user_id
          ),
          'seguidores'
        )
      )
    )
  );

drop policy if exists "diario_anotacoes_select_visiveis"
  on public.diario_anotacoes;

create policy "diario_anotacoes_select_visiveis"
  on public.diario_anotacoes
  for select
  using (
    user_id = auth.uid()
    or (
      coalesce(visibilidade, 'privado') in ('publico', 'parcial')
      and public.usuario_pode_ver_aba_perfil(
        user_id,
        coalesce(
          (
            select preferencias.visibilidade_diario
            from public.preferencias_privacidade preferencias
            where preferencias.user_id = diario_anotacoes.user_id
          ),
          'publico'
        )
      )
    )
  );

drop policy if exists "diario_anotacao_comentarios_insert_proprio"
  on public.diario_anotacao_comentarios;

create policy "diario_anotacao_comentarios_insert_proprio"
  on public.diario_anotacao_comentarios
  for insert
  to authenticated
  with check (
    auth.uid() is not null
    and user_id = auth.uid()
    and exists (
      select 1
      from public.diario_anotacoes anotacao
      left join public.preferencias_privacidade preferencias
        on preferencias.user_id = anotacao.user_id
      where anotacao.id = diario_anotacao_comentarios.anotacao_id
        and public.usuario_pode_ver_aba_perfil(
          anotacao.user_id,
          coalesce(preferencias.visibilidade_diario, 'publico')
        )
        and (
          anotacao.user_id = auth.uid()
          or coalesce(preferencias.quem_pode_comentar_diario, 'todos') = 'todos'
          or (
            coalesce(preferencias.quem_pode_comentar_diario, 'todos') = 'seguidores'
            and exists (
              select 1
              from public.seguindo_usuarios relacao
              where relacao.seguidor_id = auth.uid()
                and relacao.seguido_id = anotacao.user_id
            )
          )
        )
    )
  );

commit;