-- Proposta aditiva sobre 20261118021209. Instalação inativa, sem chave ou grants de leitura.
begin;
set local search_path = pg_catalog;
set local lock_timeout = '5s';
do $base$
begin
  if current_user <> 'postgres'
     or to_regprocedure('previa_interno.abertura_obra(text)') is null
     or to_regprocedure('previa_interno.sessao_atual_ativa()') is null
     or to_regprocedure('extensions.hmac(bytea,bytea,text)') is null then
    raise exception 'Base inativa, pgcrypto em extensions e proprietário postgres são necessários.';
  end if;
  if to_regprocedure('public.previa_abertura_local(text)') is not null
     or to_regprocedure('public.previa_abertura_atestada_local(text)') is not null
     or has_schema_privilege('anon','previa_interno','USAGE')
     or not has_function_privilege('authenticated','previa_interno.sessao_atual_ativa()','EXECUTE')
     or exists(select 1 from unnest(array['anon','authenticated']) r
        where has_function_privilege(r,'previa_interno.abertura_obra(text)','EXECUTE')
           or has_any_column_privilege(r,'auth.sessions','SELECT'))
     or exists(select 1 from pg_roles where rolname in ('anon','authenticated') and (rolsuper or rolbypassrls))
     or not (select bool_and(relrowsecurity) from pg_class
        where oid in ('public.obras'::regclass,'public.capitulos'::regclass)) then
    raise exception 'Revisar o isolamento, a RLS e as permissões da base.';
  end if;
end $base$;

create schema previa_assinatura authorization postgres;
revoke all on schema previa_assinatura from public, anon, authenticated, service_role;
create table previa_assinatura.chave_ativa (
  unica boolean primary key check (unica),
  id_vault uuid not null
);
alter table previa_assinatura.chave_ativa enable row level security;
revoke all on table previa_assinatura.chave_ativa from public, anon, authenticated, service_role;

create function previa_assinatura.prova_confere(p_slug text) returns boolean
language plpgsql stable security definer set search_path = ''
as $$
declare
  cab jsonb := current_setting('request.headers', true)::jsonb;
  prazo text := cab ->> 'x-historietas-previa-exp';
  assinatura text := cab ->> 'x-historietas-previa-prova';
  agora bigint := floor(extract(epoch from statement_timestamp()));
  identidade text := case when auth.uid() is null then 'anon'
                          else auth.uid()::text || '/' || (auth.jwt() ->> 'session_id') end;
  mensagem text;
  esperada bytea;
  referencia uuid;
  material text;
begin
  if prazo is null or prazo !~ '^[0-9]{10}$'
     or assinatura is null or assinatura !~ '^[0-9a-f]{64}$'
     or identidade is null or p_slug is null then
    return false;
  end if;
  if prazo::bigint <= agora or prazo::bigint > agora + 30 then return false; end if;
  mensagem := concat_ws(chr(10), 'historietas/previa/v1', prazo, identidade, p_slug);
  select c.id_vault into referencia from previa_assinatura.chave_ativa c where c.unica;
  if referencia is null then return false; end if;
  -- O cliente não pode selecionar o segredo. A referência é administrativa.
  select v.decrypted_secret into material from vault.decrypted_secrets v
    where v.id = referencia and v.name ~ '^historietas_previa_v1_[A-Za-z0-9-]{1,64}$';
  if material is null or material !~ '^[0-9a-f]{64}$' then return false; end if;
  esperada := extensions.hmac(convert_to(mensagem, 'UTF8'), decode(material, 'hex'), 'sha256');
  return coalesce(sha256(esperada) = sha256(decode(assinatura, 'hex')), false);
end $$;
revoke all on function previa_assinatura.prova_confere(text) from public, anon, authenticated, service_role;

create function public.previa_abertura_assinada(p_slug text)
returns table(trecho text)
language plpgsql stable security invoker
set search_path = ''
as $previa$
declare
  headers jsonb := pg_catalog.current_setting('request.headers', true)::jsonb;
begin
  if previa_assinatura.prova_confere(p_slug) is not true then
    raise sqlstate 'PT403' using message = 'Prévia indisponível.';
  end if;

  if current_user = 'authenticated' then
    if (select auth.uid()) is null
       or coalesce(((select auth.jwt()) ->> 'exp')::numeric, 0)
          <= extract(epoch from pg_catalog.statement_timestamp())
       or not previa_interno.sessao_atual_ativa() then
      raise sqlstate 'PT401' using message = 'Sessão inválida.';
    end if;
  elsif current_user = 'anon' then
    if headers ? 'authorization' and
       coalesce(headers ->> 'authorization', '') !~* '^Bearer[[:space:]]+[^[:space:]]+$' then
      raise sqlstate 'PT401' using message = 'Sessão inválida.';
    end if;
  else
    raise insufficient_privilege using message = 'Papel não habilitado para leitura.';
  end if;

  return query
  select pg_catalog.left(capitulo.texto, 600)
  from public.obras as obra
  cross join lateral (
    select c.texto, c.tipo_conteudo
    from public.capitulos as c
    where c.ordem = 1
      and c.obra_id = obra.id
      and c.user_id = obra.user_id
      and c.publicado is true
    order by c.id
    limit 1
  ) as capitulo
  where obra.slug = p_slug
    and obra.publicado is true
    and obra.classificacao_indicativa in ('Livre', '10+', '12+', '14+', '16+')
    and public.usuario_pode_ver_perfil(obra.user_id)
    and (public.carregar_permissoes_abas_perfil(obra.user_id) ->> 'obras') = 'true'
    and capitulo.tipo_conteudo = 'texto'
    and pg_catalog.btrim(pg_catalog.left(capitulo.texto, 600)) <> '';
end;
$previa$;
revoke all on function public.previa_abertura_assinada(text) from public, anon, authenticated, service_role;
-- Recusa privilégios adicionais, inclusive concessões padrão a outros papéis.
do $acl$
begin
  if exists (
    select 1 from (
      select nspowner dono, nspacl acl, 'n'::"char" tipo from pg_namespace where oid='previa_assinatura'::regnamespace
      union all select relowner, relacl, 'r'::"char" from pg_class where oid='previa_assinatura.chave_ativa'::regclass
      union all select proowner, proacl, 'f'::"char" from pg_proc
        where oid in ('previa_assinatura.prova_confere(text)'::regprocedure,'public.previa_abertura_assinada(text)'::regprocedure)
    ) o cross join lateral aclexplode(coalesce(o.acl,acldefault(o.tipo,o.dono))) a
    where o.dono <> 'postgres'::regrole or a.grantee <> o.dono
  ) then raise exception 'Propriedade ou ACL inesperada na instalação inativa.'; end if;
end $acl$;
notify pgrst, 'reload schema';
commit;
