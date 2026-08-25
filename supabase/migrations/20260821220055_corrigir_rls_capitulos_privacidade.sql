begin;

-- Funções internas ficam fora do schema exposto pela Data API.
create schema if not exists historietas_privado authorization postgres;

revoke all on schema historietas_privado
  from public, anon, authenticated, service_role;

-- Garante no banco que um capítulo sempre pertence ao mesmo usuário da obra.
create or replace function public.validar_autoria_capitulo()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_autor_obra_id uuid;
begin
  select obra.user_id
  into v_autor_obra_id
  from public.obras obra
  where obra.id = new.obra_id
  limit 1;

  if v_autor_obra_id is null then
    raise exception 'A obra informada não existe.'
      using errcode = '23503';
  end if;

  if new.user_id is distinct from v_autor_obra_id then
    raise exception 'O capítulo deve pertencer ao autor da obra.'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

revoke all on function public.validar_autoria_capitulo()
  from public, anon, authenticated;

drop trigger if exists capitulos_validar_autoria on public.capitulos;

create trigger capitulos_validar_autoria
before insert or update
on public.capitulos
for each row
execute function public.validar_autoria_capitulo();

drop policy if exists capitulos_insert_proprios on public.capitulos;
drop policy if exists capitulos_update_proprios on public.capitulos;
drop policy if exists capitulos_delete_proprios on public.capitulos;
drop policy if exists capitulos_select_publicados_ou_proprios on public.capitulos;

create policy capitulos_insert_autor_obra
on public.capitulos
for insert
to authenticated
with check (
  auth.uid() is not null
  and user_id = auth.uid()
  and exists (
    select 1
    from public.obras obra
    where obra.id = capitulos.obra_id
      and obra.user_id = auth.uid()
  )
);

create policy capitulos_update_autor_obra
on public.capitulos
for update
to authenticated
using (
  auth.uid() is not null
  and user_id = auth.uid()
  and exists (
    select 1
    from public.obras obra
    where obra.id = capitulos.obra_id
      and obra.user_id = auth.uid()
  )
)
with check (
  auth.uid() is not null
  and user_id = auth.uid()
  and exists (
    select 1
    from public.obras obra
    where obra.id = capitulos.obra_id
      and obra.user_id = auth.uid()
  )
);

create policy capitulos_delete_autor_obra
on public.capitulos
for delete
to authenticated
using (
  auth.uid() is not null
  and user_id = auth.uid()
  and exists (
    select 1
    from public.obras obra
    where obra.id = capitulos.obra_id
      and obra.user_id = auth.uid()
  )
);

create policy capitulos_select_publicados_ou_autor_obra
on public.capitulos
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.obras obra
    where obra.id = capitulos.obra_id
      and (
        obra.user_id = auth.uid()
        or (
          capitulos.user_id = obra.user_id
          and coalesce(capitulos.publicado, false) = true
          and coalesce(obra.publicado, false) = true
        )
      )
  )
);

-- Centraliza a decisão de leitura das coleções da Biblioteca sem criar uma RPC
-- pública. A função é usada somente pelas policies abaixo.
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
as $$
  select
    p_user_id is not null
    and (
      auth.uid() = p_user_id
      or (
        coalesce(p_visibilidade, 'privado') in ('publico', 'parcial')
        and public.usuario_pode_ver_aba_perfil(
          p_user_id,
          coalesce(
            (
              select preferencias.visibilidade_biblioteca
              from public.preferencias_privacidade preferencias
              where preferencias.user_id = p_user_id
            ),
            'somente_eu'
          )
        )
        and coalesce(
          (
            select case p_categoria
              when 'favoritos' then preferencias.mostrar_favoritos
              when 'concluidas' then preferencias.mostrar_concluidas
              when 'obra_avaliacoes' then preferencias.mostrar_avaliacoes
              when 'seguindo_obras' then preferencias.mostrar_quero_ler
              when 'salvos_capitulos' then preferencias.mostrar_historico_leitura
              else false
            end
            from public.preferencias_privacidade preferencias
            where preferencias.user_id = p_user_id
          ),
          false
        )
      )
    );
$$;

revoke all on function historietas_privado.usuario_pode_ver_registro_biblioteca(uuid, text, text)
  from public, anon, authenticated, service_role;

drop policy if exists favoritos_select_publico on public.favoritos;
create policy favoritos_select_visiveis
on public.favoritos
for select
to anon, authenticated
using (
  historietas_privado.usuario_pode_ver_registro_biblioteca(
    user_id,
    visibilidade,
    'favoritos'
  )
);

drop policy if exists concluidas_select_publico on public.concluidas;
create policy concluidas_select_visiveis
on public.concluidas
for select
to anon, authenticated
using (
  historietas_privado.usuario_pode_ver_registro_biblioteca(
    user_id,
    visibilidade,
    'concluidas'
  )
);

drop policy if exists obra_avaliacoes_select_publico on public.obra_avaliacoes;
create policy obra_avaliacoes_select_visiveis
on public.obra_avaliacoes
for select
to anon, authenticated
using (
  historietas_privado.usuario_pode_ver_registro_biblioteca(
    user_id,
    visibilidade,
    'obra_avaliacoes'
  )
);

drop policy if exists seguindo_obras_select_publico on public.seguindo_obras;
create policy seguindo_obras_select_visiveis
on public.seguindo_obras
for select
to anon, authenticated
using (
  historietas_privado.usuario_pode_ver_registro_biblioteca(
    user_id,
    visibilidade,
    'seguindo_obras'
  )
);

drop policy if exists salvos_capitulos_select_publico on public.salvos_capitulos;
create policy salvos_capitulos_select_visiveis
on public.salvos_capitulos
for select
to anon, authenticated
using (
  historietas_privado.usuario_pode_ver_registro_biblioteca(
    user_id,
    'parcial',
    'salvos_capitulos'
  )
);

-- A lista de autores seguidos é pessoal e deve funcionar para o próprio usuário.
drop policy if exists seguindo_autores_select_publico on public.seguindo_autores;
create policy seguindo_autores_select_proprio
on public.seguindo_autores
for select
to authenticated
using (
  auth.uid() is not null
  and user_id = auth.uid()
);

drop policy if exists seguindo_autores_update_proprio on public.seguindo_autores;
create policy seguindo_autores_update_proprio
on public.seguindo_autores
for update
to authenticated
using (
  auth.uid() is not null
  and user_id = auth.uid()
)
with check (
  auth.uid() is not null
  and user_id = auth.uid()
);

-- Preferências completas ficam restritas ao dono. A função pública retorna
-- somente regras necessárias para a interface decidir o que pode exibir.
drop policy if exists preferencias_privacidade_select_publico
  on public.preferencias_privacidade;
create policy preferencias_privacidade_select_proprio
on public.preferencias_privacidade
for select
to authenticated
using (
  auth.uid() is not null
  and user_id = auth.uid()
);

create or replace function public.carregar_preferencias_privacidade_publicas(
  p_user_id uuid
)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (
      select jsonb_build_object(
        'perfil_privado', preferencias.perfil_privado,
        'aprovar_novos_seguidores', preferencias.aprovar_novos_seguidores,
        'visibilidade_obras', preferencias.visibilidade_obras,
        'visibilidade_sobre', preferencias.visibilidade_sobre,
        'visibilidade_diario', preferencias.visibilidade_diario,
        'visibilidade_comunidade', preferencias.visibilidade_comunidade,
        'visibilidade_biblioteca', preferencias.visibilidade_biblioteca,
        'visibilidade_atividades', preferencias.visibilidade_atividades,
        'anotacoes_privadas_padrao',
          case
            when auth.uid() = preferencias.user_id
              then preferencias.anotacoes_privadas_padrao
            else true
          end,
        'quem_pode_comentar_diario', preferencias.quem_pode_comentar_diario
      )
      from public.preferencias_privacidade preferencias
      where preferencias.user_id = p_user_id
    ),
    jsonb_build_object(
      'perfil_privado', false,
      'aprovar_novos_seguidores', false,
      'visibilidade_obras', 'publico',
      'visibilidade_sobre', 'publico',
      'visibilidade_diario', 'publico',
      'visibilidade_comunidade', 'publico',
      'visibilidade_biblioteca', 'somente_eu',
      'visibilidade_atividades', 'seguidores',
      'anotacoes_privadas_padrao', true,
      'quem_pode_comentar_diario', 'todos'
    )
  );
$$;

revoke all on function public.carregar_preferencias_privacidade_publicas(uuid)
  from public;
grant execute on function public.carregar_preferencias_privacidade_publicas(uuid)
  to anon, authenticated, service_role;

-- O acesso privilegiado fica restrito a esta função, fora do schema exposto.
-- Ela só devolve bio/sobre já mascarados e também elimina perfis bloqueados.
create or replace function historietas_privado.carregar_bios_perfil_publicas(
  p_user_id uuid
)
returns table (
  bio text,
  sobre_bio text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    case
      when (select auth.uid()) = perfil.user_id
        or public.usuario_pode_ver_aba_perfil(
          perfil.user_id,
          coalesce(preferencias.visibilidade_sobre, 'publico')
        )
        then perfil.bio
      else null
    end as bio,
    case
      when (select auth.uid()) = perfil.user_id
        or public.usuario_pode_ver_aba_perfil(
          perfil.user_id,
          coalesce(preferencias.visibilidade_sobre, 'publico')
        )
        then perfil.sobre_bio
      else null
    end as sobre_bio
  from public.profiles perfil
  left join public.preferencias_privacidade preferencias
    on preferencias.user_id = perfil.user_id
  where perfil.user_id = p_user_id
    and (
      (select auth.uid()) = perfil.user_id
      or public.usuario_pode_ver_aba_perfil(perfil.user_id, 'publico')
    );
$$;

revoke all on function historietas_privado.carregar_bios_perfil_publicas(uuid)
  from public, anon, authenticated, service_role;

-- A view roda com os privilégios do chamador e enxerga apenas as colunas
-- públicas de profiles. O único acesso a bio/sobre ocorre pela função acima.
drop view if exists public.profiles_publicos;

create view public.profiles_publicos
with (security_invoker = true, security_barrier = true)
as
select
  perfil.id,
  perfil.user_id,
  perfil.nome,
  perfil.avatar_url,
  bios.bio,
  perfil.tipo,
  perfil.criado_em,
  perfil.atualizado_em,
  bios.sobre_bio,
  perfil.username
from public.profiles perfil
cross join lateral historietas_privado.carregar_bios_perfil_publicas(
  perfil.user_id
) bios;

alter view public.profiles_publicos owner to postgres;

revoke all on table public.profiles_publicos
  from public, anon, authenticated;
grant select on table public.profiles_publicos
  to anon, authenticated, service_role;

grant usage on schema historietas_privado
  to anon, authenticated, service_role;
grant execute on function historietas_privado.carregar_bios_perfil_publicas(uuid)
  to anon, authenticated, service_role;

revoke all privileges on table public.profiles
  from public, anon, authenticated;
revoke select (bio, sobre_bio) on table public.profiles
  from public, anon, authenticated;
grant select (
  id,
  user_id,
  nome,
  avatar_url,
  tipo,
  criado_em,
  atualizado_em,
  username
) on table public.profiles to anon, authenticated;
grant insert (
  id,
  user_id,
  nome,
  avatar_url,
  bio,
  tipo,
  criado_em,
  atualizado_em,
  sobre_bio,
  username
) on table public.profiles to authenticated;
grant update (
  user_id,
  nome,
  avatar_url,
  bio,
  atualizado_em,
  sobre_bio,
  username
) on table public.profiles to authenticated;
grant delete on table public.profiles to authenticated;
grant all privileges on table public.profiles to service_role;

-- Remove privilégios administrativos herdados do dump e concede apenas o
-- necessário para o cliente. RLS continua decidindo quais linhas são visíveis.
revoke all privileges on table public.capitulos
  from anon, authenticated;
grant select on table public.capitulos to anon;
grant select, insert, update, delete on table public.capitulos to authenticated;
grant all privileges on table public.capitulos to service_role;

revoke all privileges on table public.favoritos
  from anon, authenticated;
grant select on table public.favoritos to anon;
grant select, insert, delete on table public.favoritos to authenticated;
grant all privileges on table public.favoritos to service_role;

revoke all privileges on table public.concluidas
  from anon, authenticated;
grant select on table public.concluidas to anon;
grant select, insert, delete on table public.concluidas to authenticated;
grant all privileges on table public.concluidas to service_role;

revoke all privileges on table public.obra_avaliacoes
  from anon, authenticated;
grant select on table public.obra_avaliacoes to anon;
grant select, insert, update, delete on table public.obra_avaliacoes to authenticated;
grant all privileges on table public.obra_avaliacoes to service_role;

revoke all privileges on table public.salvos_capitulos
  from anon, authenticated;
grant select on table public.salvos_capitulos to anon;
grant select, insert, delete on table public.salvos_capitulos to authenticated;
grant all privileges on table public.salvos_capitulos to service_role;

revoke all privileges on table public.seguindo_obras
  from anon, authenticated;
grant select on table public.seguindo_obras to anon;
grant select, insert, delete on table public.seguindo_obras to authenticated;
grant all privileges on table public.seguindo_obras to service_role;

revoke all privileges on table public.seguindo_autores
  from anon, authenticated;
grant select, insert, update, delete on table public.seguindo_autores
  to authenticated;
grant all privileges on table public.seguindo_autores to service_role;

revoke all privileges on table public.preferencias_privacidade
  from anon, authenticated;
grant select, insert, update, delete on table public.preferencias_privacidade
  to authenticated;
grant all privileges on table public.preferencias_privacidade to service_role;

comment on function public.validar_autoria_capitulo() is
  'Impede capítulos vinculados a uma obra de receberem user_id diferente do autor da obra.';

comment on function historietas_privado.usuario_pode_ver_registro_biblioteca(uuid, text, text) is
  'Aplica visibilidade da Biblioteca, relacionamento, bloqueios e preferência específica da coleção.';

comment on function public.carregar_preferencias_privacidade_publicas(uuid) is
  'Retorna somente regras de exibição necessárias ao cliente e preserva preferências internas do usuário.';

comment on function historietas_privado.carregar_bios_perfil_publicas(uuid) is
  'Retorna bio/sobre já mascarados pela visibilidade e omite perfis bloqueados.';

comment on view public.profiles_publicos is
  'View security invoker que expõe identidade pública e recebe bio/sobre_bio já mascarados.';

commit;
