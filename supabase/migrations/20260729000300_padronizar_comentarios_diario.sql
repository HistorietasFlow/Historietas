-- 20260729000300_padronizar_comentarios_diario.sql
-- Padroniza "Quem pode comentar no meu Diário":
-- publico, seguidores, pessoas que sigo ou ninguem.

begin;

update public.preferencias_privacidade
set quem_pode_comentar_diario = case
  when quem_pode_comentar_diario in (
    'todos',
    'seguidores',
    'seguindo',
    'ninguem'
  ) then quem_pode_comentar_diario
  else 'seguidores'
end;

alter table public.preferencias_privacidade
  alter column quem_pode_comentar_diario set default 'seguidores';

alter table public.preferencias_privacidade
  drop constraint if exists
    preferencias_privacidade_comentarios_diario_check;

alter table public.preferencias_privacidade
  add constraint
    preferencias_privacidade_comentarios_diario_check
  check (
    quem_pode_comentar_diario in (
      'todos',
      'seguidores',
      'seguindo',
      'ninguem'
    )
  );

comment on column
  public.preferencias_privacidade.quem_pode_comentar_diario is
  'Quem pode comentar no Diário: todos, seguidores, seguindo ou ninguem.';

create or replace function public.diario_pode_comentar(
  p_anotacao_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public, auth, pg_temp
as $$
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
                'seguidores'
              )
                when 'todos' then true
                when 'seguidores' then public.diario_usuario_e_seguidor(
                  auth.uid(),
                  anotacao.user_id
                )
                when 'seguindo' then public.diario_usuario_e_seguidor(
                  anotacao.user_id,
                  auth.uid()
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

revoke all
  on function public.diario_pode_comentar(uuid)
  from public, anon, authenticated;

grant execute
  on function public.diario_pode_comentar(uuid)
  to anon, authenticated;

commit;