begin;

-- Centraliza a autorização das interações fora do schema exposto pela Data API.
-- Os helpers são SECURITY DEFINER para consultar bloqueios e objetos-pai sem
-- depender das policies das tabelas consultadas, mas retornam true somente para
-- conteúdo que o usuário atual realmente pode acessar.

create schema if not exists historietas_privado authorization postgres;

grant usage on schema historietas_privado
  to authenticated;

create or replace function historietas_privado.pode_interagir_obra(
  p_obra_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  with usuario_atual as (
    select auth.uid() as id
  )
  select exists (
    select 1
    from usuario_atual
    join public.obras obra
      on obra.id = p_obra_id
    where usuario_atual.id is not null
      and (
        obra.user_id = usuario_atual.id
        or (
          coalesce(obra.publicado, false) = true
          and obra.classificacao_indicativa in (
            'Livre',
            '10+',
            '12+',
            '14+',
            '16+'
          )
        )
      )
      and not public.usuarios_possuem_bloqueio(
        usuario_atual.id,
        obra.user_id
      )
  );
$$;

create or replace function historietas_privado.pode_interagir_capitulo(
  p_capitulo_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  with usuario_atual as (
    select auth.uid() as id
  )
  select exists (
    select 1
    from usuario_atual
    join public.capitulos capitulo
      on capitulo.id = p_capitulo_id
    join public.obras obra
      on obra.id = capitulo.obra_id
    where usuario_atual.id is not null
      and (
        obra.user_id = usuario_atual.id
        or (
          capitulo.user_id = obra.user_id
          and coalesce(capitulo.publicado, false) = true
          and coalesce(obra.publicado, false) = true
          and obra.classificacao_indicativa in (
            'Livre',
            '10+',
            '12+',
            '14+',
            '16+'
          )
        )
      )
      and not public.usuarios_possuem_bloqueio(
        usuario_atual.id,
        capitulo.user_id
      )
      and not public.usuarios_possuem_bloqueio(
        usuario_atual.id,
        obra.user_id
      )
  );
$$;

create or replace function historietas_privado.pode_interagir_comentario_obra(
  p_comentario_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  with usuario_atual as (
    select auth.uid() as id
  )
  select exists (
    select 1
    from usuario_atual
    join public.comentarios_obras comentario
      on comentario.id = p_comentario_id
    where usuario_atual.id is not null
      and historietas_privado.pode_interagir_obra(comentario.obra_id)
      and not public.usuarios_possuem_bloqueio(
        usuario_atual.id,
        comentario.user_id
      )
  );
$$;

create or replace function historietas_privado.pode_interagir_comentario_capitulo(
  p_comentario_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  with usuario_atual as (
    select auth.uid() as id
  )
  select exists (
    select 1
    from usuario_atual
    join public.comentarios_capitulos comentario
      on comentario.id = p_comentario_id
    where usuario_atual.id is not null
      and historietas_privado.pode_interagir_capitulo(comentario.capitulo_id)
      and not public.usuarios_possuem_bloqueio(
        usuario_atual.id,
        comentario.user_id
      )
  );
$$;

revoke all on function historietas_privado.pode_interagir_obra(uuid)
  from public, anon, authenticated, service_role;
revoke all on function historietas_privado.pode_interagir_capitulo(uuid)
  from public, anon, authenticated, service_role;
revoke all on function historietas_privado.pode_interagir_comentario_obra(uuid)
  from public, anon, authenticated, service_role;
revoke all on function historietas_privado.pode_interagir_comentario_capitulo(uuid)
  from public, anon, authenticated, service_role;

grant execute on function historietas_privado.pode_interagir_obra(uuid)
  to authenticated;
grant execute on function historietas_privado.pode_interagir_capitulo(uuid)
  to authenticated;
grant execute on function historietas_privado.pode_interagir_comentario_obra(uuid)
  to authenticated;
grant execute on function historietas_privado.pode_interagir_comentario_capitulo(uuid)
  to authenticated;

comment on function historietas_privado.pode_interagir_obra(uuid) is
  'Autoriza interação somente em obra própria ou publicada, não adulta e sem bloqueio.';
comment on function historietas_privado.pode_interagir_capitulo(uuid) is
  'Autoriza interação somente em capítulo de obra própria ou publicamente visível e sem bloqueio.';
comment on function historietas_privado.pode_interagir_comentario_obra(uuid) is
  'Autoriza interação com comentário somente quando a obra está acessível e não existe bloqueio relacionado.';
comment on function historietas_privado.pode_interagir_comentario_capitulo(uuid) is
  'Autoriza interação com comentário somente quando o capítulo está acessível e não existe bloqueio relacionado.';

-- Curtidas de obras.

drop policy if exists obra_curtidas_delete_proprio
  on public.obra_curtidas;
drop policy if exists obra_curtidas_insert_proprio
  on public.obra_curtidas;
drop policy if exists obra_curtidas_insert_proprio_visivel_sem_bloqueio
  on public.obra_curtidas;
drop policy if exists obra_curtidas_select_publico
  on public.obra_curtidas;
drop policy if exists obra_curtidas_select_obras_visiveis
  on public.obra_curtidas;

create policy obra_curtidas_delete_proprio
on public.obra_curtidas
for delete
to authenticated
using (
  user_id = (select auth.uid())
);

create policy obra_curtidas_insert_proprio_visivel_sem_bloqueio
on public.obra_curtidas
for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and historietas_privado.pode_interagir_obra(obra_id)
);

create policy obra_curtidas_select_obras_visiveis
on public.obra_curtidas
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.obras obra
    where obra.id = obra_curtidas.obra_id
      and (
        obra.user_id = (select auth.uid())
        or (
          coalesce(obra.publicado, false) = true
          and obra.classificacao_indicativa in (
            'Livre',
            '10+',
            '12+',
            '14+',
            '16+'
          )
        )
      )
  )
);

-- Curtidas de capítulos.

drop policy if exists curtidas_capitulos_delete_proprio
  on public.curtidas_capitulos;
drop policy if exists curtidas_capitulos_insert_proprio
  on public.curtidas_capitulos;
drop policy if exists curtidas_capitulos_insert_proprio_sem_bloqueio
  on public.curtidas_capitulos;
drop policy if exists curtidas_capitulos_select_publico
  on public.curtidas_capitulos;
drop policy if exists curtidas_capitulos_select_capitulos_visiveis
  on public.curtidas_capitulos;

create policy curtidas_capitulos_delete_proprio
on public.curtidas_capitulos
for delete
to authenticated
using (
  user_id = (select auth.uid())
);

create policy curtidas_capitulos_insert_proprio_sem_bloqueio
on public.curtidas_capitulos
for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and historietas_privado.pode_interagir_capitulo(capitulo_id)
);

create policy curtidas_capitulos_select_capitulos_visiveis
on public.curtidas_capitulos
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.capitulos capitulo
    join public.obras obra
      on obra.id = capitulo.obra_id
    where capitulo.id = curtidas_capitulos.capitulo_id
      and (
        obra.user_id = (select auth.uid())
        or (
          capitulo.user_id = obra.user_id
          and coalesce(capitulo.publicado, false) = true
          and coalesce(obra.publicado, false) = true
          and obra.classificacao_indicativa in (
            'Livre',
            '10+',
            '12+',
            '14+',
            '16+'
          )
        )
      )
  )
);

-- Comentários de capítulos e respectivas curtidas.

drop policy if exists comentarios_capitulos_insert_proprio
  on public.comentarios_capitulos;
drop policy if exists comentarios_capitulos_insert_proprio_sem_bloqueio
  on public.comentarios_capitulos;
drop policy if exists comentarios_capitulos_update_proprio
  on public.comentarios_capitulos;
drop policy if exists comentarios_capitulos_update_proprio_sem_bloqueio
  on public.comentarios_capitulos;
drop policy if exists comentarios_capitulos_select_publico_ou_proprio
  on public.comentarios_capitulos;
drop policy if exists comentarios_capitulos_select_capitulo_visivel
  on public.comentarios_capitulos;

create policy comentarios_capitulos_insert_proprio_sem_bloqueio
on public.comentarios_capitulos
for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and historietas_privado.pode_interagir_capitulo(capitulo_id)
  and (
    comentario_pai_id is null
    or historietas_privado.pode_interagir_comentario_capitulo(
      comentario_pai_id
    )
  )
);

create policy comentarios_capitulos_update_proprio_sem_bloqueio
on public.comentarios_capitulos
for update
to authenticated
using (
  user_id = (select auth.uid())
  and historietas_privado.pode_interagir_capitulo(capitulo_id)
  and (
    comentario_pai_id is null
    or historietas_privado.pode_interagir_comentario_capitulo(
      comentario_pai_id
    )
  )
)
with check (
  user_id = (select auth.uid())
  and historietas_privado.pode_interagir_capitulo(capitulo_id)
  and (
    comentario_pai_id is null
    or historietas_privado.pode_interagir_comentario_capitulo(
      comentario_pai_id
    )
  )
);

create policy comentarios_capitulos_select_capitulo_visivel
on public.comentarios_capitulos
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.capitulos capitulo
    join public.obras obra
      on obra.id = capitulo.obra_id
    where capitulo.id = comentarios_capitulos.capitulo_id
      and (
        obra.user_id = (select auth.uid())
        or (
          capitulo.user_id = obra.user_id
          and coalesce(capitulo.publicado, false) = true
          and coalesce(obra.publicado, false) = true
          and obra.classificacao_indicativa in (
            'Livre',
            '10+',
            '12+',
            '14+',
            '16+'
          )
        )
      )
  )
);

drop policy if exists comentarios_capitulos_curtidas_delete_proprio
  on public.comentarios_capitulos_curtidas;
drop policy if exists comentarios_capitulos_curtidas_delete_proprio_usuario
  on public.comentarios_capitulos_curtidas;
drop policy if exists comentarios_capitulos_curtidas_insert_proprio
  on public.comentarios_capitulos_curtidas;
drop policy if exists comentarios_capitulos_curtidas_insert_proprio_usuario
  on public.comentarios_capitulos_curtidas;
drop policy if exists comentarios_capitulos_curtidas_insert_sem_bloqueio
  on public.comentarios_capitulos_curtidas;
drop policy if exists comentarios_capitulos_curtidas_select_publico
  on public.comentarios_capitulos_curtidas;
drop policy if exists comentarios_capitulos_curtidas_select_capitulo_visivel
  on public.comentarios_capitulos_curtidas;

create policy comentarios_capitulos_curtidas_delete_proprio
on public.comentarios_capitulos_curtidas
for delete
to authenticated
using (
  usuario_id = (select auth.uid())
);

create policy comentarios_capitulos_curtidas_insert_sem_bloqueio
on public.comentarios_capitulos_curtidas
for insert
to authenticated
with check (
  usuario_id = (select auth.uid())
  and historietas_privado.pode_interagir_comentario_capitulo(
    comentario_id
  )
);

create policy comentarios_capitulos_curtidas_select_capitulo_visivel
on public.comentarios_capitulos_curtidas
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.comentarios_capitulos comentario
    join public.capitulos capitulo
      on capitulo.id = comentario.capitulo_id
    join public.obras obra
      on obra.id = capitulo.obra_id
    where comentario.id = comentarios_capitulos_curtidas.comentario_id
      and (
        obra.user_id = (select auth.uid())
        or (
          capitulo.user_id = obra.user_id
          and coalesce(capitulo.publicado, false) = true
          and coalesce(obra.publicado, false) = true
          and obra.classificacao_indicativa in (
            'Livre',
            '10+',
            '12+',
            '14+',
            '16+'
          )
        )
      )
  )
);

-- Comentários de obras e respectivas curtidas.

drop policy if exists comentarios_obras_insert_proprio
  on public.comentarios_obras;
drop policy if exists comentarios_obras_insert_proprio_sem_bloqueio
  on public.comentarios_obras;
drop policy if exists comentarios_obras_select_publicadas_ou_proprias
  on public.comentarios_obras;
drop policy if exists comentarios_obras_select_obra_visivel
  on public.comentarios_obras;

create policy comentarios_obras_insert_proprio_sem_bloqueio
on public.comentarios_obras
for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and char_length(btrim(comentario)) between 2 and 600
  and historietas_privado.pode_interagir_obra(obra_id)
  and (
    comentario_pai_id is null
    or historietas_privado.pode_interagir_comentario_obra(
      comentario_pai_id
    )
  )
);

create policy comentarios_obras_select_obra_visivel
on public.comentarios_obras
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.obras obra
    where obra.id = comentarios_obras.obra_id
      and (
        obra.user_id = (select auth.uid())
        or (
          coalesce(obra.publicado, false) = true
          and obra.classificacao_indicativa in (
            'Livre',
            '10+',
            '12+',
            '14+',
            '16+'
          )
        )
      )
  )
);

drop policy if exists comentarios_obras_curtidas_insert_proprio
  on public.comentarios_obras_curtidas;
drop policy if exists comentarios_obras_curtidas_insert_sem_bloqueio
  on public.comentarios_obras_curtidas;
drop policy if exists comentarios_obras_curtidas_select_publico
  on public.comentarios_obras_curtidas;
drop policy if exists comentarios_obras_curtidas_select_obra_visivel
  on public.comentarios_obras_curtidas;

create policy comentarios_obras_curtidas_insert_sem_bloqueio
on public.comentarios_obras_curtidas
for insert
to authenticated
with check (
  usuario_id = (select auth.uid())
  and historietas_privado.pode_interagir_comentario_obra(
    comentario_id
  )
);

create policy comentarios_obras_curtidas_select_obra_visivel
on public.comentarios_obras_curtidas
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.comentarios_obras comentario
    join public.obras obra
      on obra.id = comentario.obra_id
    where comentario.id = comentarios_obras_curtidas.comentario_id
      and (
        obra.user_id = (select auth.uid())
        or (
          coalesce(obra.publicado, false) = true
          and obra.classificacao_indicativa in (
            'Livre',
            '10+',
            '12+',
            '14+',
            '16+'
          )
        )
      )
  )
);

-- Os helpers antigos deixavam funções SECURITY DEFINER acessíveis como RPCs.
-- O DROP sem CASCADE faz a migration falhar se alguma dependência não mapeada
-- ainda existir, em vez de removê-la silenciosamente.

drop function if exists public.pode_interagir_comentario_capitulo(uuid);
drop function if exists public.pode_interagir_comentario_obra(uuid);
drop function if exists public.pode_interagir_capitulo(uuid);
drop function if exists public.pode_interagir_obra(uuid);

-- Privilégios das tabelas ativas: navegador recebe somente as operações usadas
-- pelo produto. TRUNCATE, TRIGGER e REFERENCES não são necessários ao cliente e
-- não são protegidos da mesma forma que as operações cobertas por RLS.

revoke all privileges on table public.obra_curtidas
  from public, anon, authenticated;
revoke all privileges on table public.curtidas_capitulos
  from public, anon, authenticated;
revoke all privileges on table public.comentarios_capitulos
  from public, anon, authenticated;
revoke all privileges on table public.comentarios_capitulos_curtidas
  from public, anon, authenticated;
revoke all privileges on table public.comentarios_obras
  from public, anon, authenticated;
revoke all privileges on table public.comentarios_obras_curtidas
  from public, anon, authenticated;

grant select on table
  public.obra_curtidas,
  public.curtidas_capitulos,
  public.comentarios_capitulos,
  public.comentarios_capitulos_curtidas,
  public.comentarios_obras,
  public.comentarios_obras_curtidas
to anon;

grant select, insert, delete on table
  public.obra_curtidas,
  public.curtidas_capitulos,
  public.comentarios_capitulos_curtidas,
  public.comentarios_obras,
  public.comentarios_obras_curtidas
to authenticated;

grant select, insert, update, delete on table
  public.comentarios_capitulos
to authenticated;

-- Quarentena das duas tabelas legadas. Elas permanecem fisicamente presentes
-- nesta etapa para tornar a mudança reversível, mas nenhum papel da API pode
-- ler ou gravar nelas e nenhuma policy permissiva continua ativa.

drop trigger if exists exigir_aceite_termos_obra_comentarios
  on public.obra_comentarios;

drop policy if exists obra_comentarios_deletar_proprio
  on public.obra_comentarios;
drop policy if exists obra_comentarios_delete_proprio
  on public.obra_comentarios;
drop policy if exists obra_comentarios_inserir_proprio
  on public.obra_comentarios;
drop policy if exists obra_comentarios_insert_logado
  on public.obra_comentarios;
drop policy if exists obra_comentarios_leitura_publica
  on public.obra_comentarios;
drop policy if exists obra_comentarios_select_publica_ou_propria
  on public.obra_comentarios;
drop policy if exists obra_comentarios_update_proprio
  on public.obra_comentarios;

drop policy if exists obra_comentario_curtidas_deletar_proprio
  on public.obra_comentario_curtidas;
drop policy if exists obra_comentario_curtidas_delete_propria
  on public.obra_comentario_curtidas;
drop policy if exists obra_comentario_curtidas_inserir_proprio
  on public.obra_comentario_curtidas;
drop policy if exists obra_comentario_curtidas_insert_propria
  on public.obra_comentario_curtidas;
drop policy if exists obra_comentario_curtidas_leitura_publica
  on public.obra_comentario_curtidas;
drop policy if exists obra_comentario_curtidas_select_visivel
  on public.obra_comentario_curtidas;

alter table public.obra_comentarios enable row level security;
alter table public.obra_comentario_curtidas enable row level security;

revoke all privileges on table public.obra_comentarios
  from public, anon, authenticated, service_role;
revoke all privileges on table public.obra_comentario_curtidas
  from public, anon, authenticated, service_role;

comment on table public.obra_comentarios is
  'Tabela legada em quarentena: sem acesso pela Data API; use public.comentarios_obras.';
comment on table public.obra_comentario_curtidas is
  'Tabela legada em quarentena: sem acesso pela Data API; use public.comentarios_obras_curtidas.';

-- A sincronização de perfil não deve mais manter dados na tabela legada.

create or replace function public.sincronizar_nome_perfil_denormalizado()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.nome is not distinct from old.nome
     and new.avatar_url is not distinct from old.avatar_url then
    return new;
  end if;

  if new.nome is distinct from old.nome then
    update public.obras
       set autor = new.nome
     where user_id = new.user_id
       and autor is distinct from new.nome;

    update public.comunidade_posts
       set autor_nome = new.nome
     where autor_id = new.user_id
       and autor_nome is distinct from new.nome;

    update public.comunidade_comentarios
       set autor_nome = new.nome
     where autor_id = new.user_id
       and autor_nome is distinct from new.nome;

    update public.notificacoes
       set autor_nome = new.nome
     where autor_id = new.user_id
       and autor_nome is distinct from new.nome;
  end if;

  if new.avatar_url is distinct from old.avatar_url then
    update public.notificacoes
       set autor_avatar = new.avatar_url
     where autor_id = new.user_id
       and autor_avatar is distinct from new.avatar_url;
  end if;

  return new;
end;
$$;

revoke all on function public.sincronizar_nome_perfil_denormalizado()
  from public, anon, authenticated, service_role;

-- Pós-condições: a migration aborta se a quarentena ou a remoção das policies
-- de leitura irrestrita ficar incompleta.

do $$
begin
  if exists (
    select 1
    from pg_catalog.pg_policies
    where schemaname = 'public'
      and tablename in (
        'obra_comentarios',
        'obra_comentario_curtidas'
      )
  ) then
    raise exception
      'A quarentena falhou: ainda existem policies nas tabelas legadas.';
  end if;

  if exists (
    select 1
    from information_schema.role_table_grants
    where table_schema = 'public'
      and table_name in (
        'obra_comentarios',
        'obra_comentario_curtidas'
      )
      and grantee in (
        'PUBLIC',
        'anon',
        'authenticated',
        'service_role'
      )
  ) then
    raise exception
      'A quarentena falhou: ainda existem grants nas tabelas legadas.';
  end if;

  if exists (
    select 1
    from pg_catalog.pg_policies
    where schemaname = 'public'
      and tablename in (
        'obra_curtidas',
        'curtidas_capitulos',
        'comentarios_capitulos',
        'comentarios_capitulos_curtidas',
        'comentarios_obras',
        'comentarios_obras_curtidas'
      )
      and cmd = 'SELECT'
      and lower(btrim(qual)) = 'true'
  ) then
    raise exception
      'A correção falhou: ainda existe SELECT irrestrito em interação ativa.';
  end if;
end;
$$;

commit;
