-- Somente infraestrutura. Ativacao administrativa permanece desligada.
begin;
set local lock_timeout='5s';
set local statement_timeout='30s';
set local search_path='';
create table historietas_privado.diario_edicao_config (
 chave boolean primary key default true check(chave),
 habilitado boolean not null default false,
 check_anterior text not null, leitura_anterior text not null
);
alter table historietas_privado.diario_edicao_config enable row level security;
revoke all on table historietas_privado.diario_edicao_config from public,anon,authenticated,service_role;
insert into historietas_privado.diario_edicao_config(check_anterior,leitura_anterior)
select (select pg_get_expr(conbin,conrelid) from pg_constraint where conrelid='public.diario_atividades'::regclass and conname='diario_atividades_tipo_check'),
 (select pg_get_expr(polqual,polrelid) from pg_policy where polrelid='public.diario_atividades'::regclass and polname='diario_atividades_select_visiveis');
do $migration$
declare v text;
begin
 select check_anterior into strict v from historietas_privado.diario_edicao_config;
 alter table public.diario_atividades drop constraint diario_atividades_tipo_check;
 execute 'alter table public.diario_atividades add constraint diario_atividades_tipo_check check (('||v||') or tipo = ''editou_capitulo'')';
end;
$migration$;
-- NULL legado/INSERT. Clientes nunca escolhem nem restauram o token.
alter table public.capitulos add column diario_edicao_versao uuid;
create function historietas_privado.definir_versao_diario_edicao()
returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if tg_op='INSERT' then new.diario_edicao_versao:=null;
 elsif row(new.obra_id,new.user_id,new.tipo_conteudo,new.publicado,new.ordem) is distinct from
       row(old.obra_id,old.user_id,old.tipo_conteudo,old.publicado,old.ordem) then new.diario_edicao_versao:=null;
 elsif new.tipo_conteudo='texto' and row(new.titulo,new.texto) is distinct from row(old.titulo,old.texto) then
   new.diario_edicao_versao:=gen_random_uuid();
 else new.diario_edicao_versao:=old.diario_edicao_versao;
 end if;
 return new;
end;
$$;
alter function historietas_privado.definir_versao_diario_edicao() owner to postgres;
revoke all on function historietas_privado.definir_versao_diario_edicao() from public,anon,authenticated,service_role;
create trigger z_capitulos_versao_diario_edicao before insert or update on public.capitulos
for each row execute function historietas_privado.definir_versao_diario_edicao();
-- Sem FK no alvo: o tombstone sobrevive a exclusao/recriacao de capitulo.
create table historietas_privado.diario_edicao_recibos (
 versao uuid primary key, capitulo_id uuid not null, obra_id uuid not null, autor_id uuid not null,
 atividade_id uuid unique references public.diario_atividades(id) on delete set null
);
alter table historietas_privado.diario_edicao_recibos enable row level security;
revoke all on table historietas_privado.diario_edicao_recibos from public,anon,authenticated,service_role;
-- Helper privado booleano: nao revela preferencias, titulos ou recibos.
create function historietas_privado.edicao_diario_visivel(p_autor uuid,p_obra uuid,p_capitulo uuid,p_visibilidade text)
returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.capitulos c join public.obras o on o.id=c.obra_id
   where c.id=p_capitulo and o.id=p_obra and c.user_id=p_autor and o.user_id=p_autor
   and c.tipo_conteudo='texto' and c.publicado is true and o.publicado is true
   and o.classificacao_indicativa in ('Livre','10+','12+','14+','16+'))
 and (p_autor=(select auth.uid()) or (p_visibilidade in ('publico','parcial')
   and historietas_privado.usuario_pode_ver_perfil(p_autor)
   and coalesce((select mostrar_diario_perfil from public.preferencias_privacidade where user_id=p_autor),true)
   and coalesce((select mostrar_atividades_leitura from public.preferencias_privacidade where user_id=p_autor),true)));
$$;
alter function historietas_privado.edicao_diario_visivel(uuid,uuid,uuid,text) owner to postgres;
revoke all on function historietas_privado.edicao_diario_visivel(uuid,uuid,uuid,text) from public,anon,authenticated,service_role;
grant execute on function historietas_privado.edicao_diario_visivel(uuid,uuid,uuid,text) to anon,authenticated;
do $migration$
declare v text;
begin
 select leitura_anterior into strict v from historietas_privado.diario_edicao_config;
 execute 'alter policy diario_atividades_select_visiveis on public.diario_atividades using
 (case when tipo=''editou_capitulo'' then historietas_privado.edicao_diario_visivel(user_id,obra_id,capitulo_id,visibilidade)
 else ('||v||') end)';
end;
$migration$;
create policy diario_edicao_leitura on public.diario_atividades as restrictive for select to anon,authenticated
using(tipo<>'editou_capitulo' or historietas_privado.edicao_diario_visivel(user_id,obra_id,capitulo_id,visibilidade));
create policy diario_edicao_insert_rpc on public.diario_atividades as restrictive for insert to authenticated
with check(tipo<>'editou_capitulo');
create policy diario_edicao_imutavel on public.diario_atividades as restrictive for update to authenticated
using(tipo<>'editou_capitulo') with check(tipo<>'editou_capitulo');

create function historietas_privado.registrar_diario_edicao(p_capitulo uuid,p_versao uuid)
returns uuid language plpgsql volatile security definer set search_path='' as $$
declare
 v_uid uuid:=(select auth.uid()); v_session text:=(select auth.jwt()->>'session_id');
 v_obra_id uuid; v_obra public.obras; v_cap public.capitulos;
 v_recibo historietas_privado.diario_edicao_recibos; v_id uuid; v_habilitado boolean;
begin
 if v_uid is null or v_session is null or v_session !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' then
   raise exception 'Sessao autenticada necessaria.' using errcode='42501';
 end if;
 perform 1 from auth.sessions where id=v_session::uuid and user_id=v_uid
   and (not_after is null or not_after>clock_timestamp()) for share;
 if not found or not exists(select 1 from auth.users where id=v_uid and deleted_at is null
   and (banned_until is null or banned_until<clock_timestamp())) then
   raise exception 'Sessao indisponivel.' using errcode='42501';
 end if;
 select habilitado into strict v_habilitado from historietas_privado.diario_edicao_config where chave for share;
 if not v_habilitado then raise exception 'Evento de edicao desativado.' using errcode='55000'; end if;
 -- Ordem pai/filho serializa chamadas concorrentes, exclusao e edicao do alvo.
 select obra_id into v_obra_id from public.capitulos where id=p_capitulo and user_id=v_uid;
 select * into v_obra from public.obras where id=v_obra_id and user_id=v_uid for share;
 if not found then raise exception 'Capitulo indisponivel.' using errcode='42501'; end if;
 select * into v_cap from public.capitulos where id=p_capitulo and obra_id=v_obra_id and user_id=v_uid for update;
 if not found or v_cap.tipo_conteudo is distinct from 'texto' or v_cap.publicado is not true
   or v_obra.publicado is not true or (v_obra.classificacao_indicativa in ('Livre','10+','12+','14+','16+')) is not true then
   raise exception 'Edicao indisponivel para o Diario.' using errcode='42501';
 end if;
 if public.usuario_aceitou_termos_publicacao(v_uid) is not true then
   raise exception 'ACEITE_TERMOS_PUBLICACAO_OBRIGATORIO' using errcode='42501';
 end if;
 select * into v_recibo from historietas_privado.diario_edicao_recibos where versao=p_versao;
 if found then
   if row(v_recibo.autor_id,v_recibo.obra_id,v_recibo.capitulo_id) is distinct from row(v_uid,v_obra_id,p_capitulo) then
     raise exception 'Recibo indisponivel.' using errcode='42501';
   end if;
   return v_recibo.atividade_id; -- NULL apos remocao voluntaria; nunca recria.
 end if;
 if p_versao is null or v_cap.diario_edicao_versao is distinct from p_versao then
   raise exception 'Versao de edicao divergente.' using errcode='PT409';
 end if;
 -- Sem snapshots de titulo, texto privado, href ou metadata fornecida pelo cliente.
 insert into public.diario_atividades(user_id,tipo,obra_id,capitulo_id,texto,metadata,visibilidade)
 values(v_uid,'editou_capitulo',v_obra_id,p_capitulo,'','{}'::jsonb,'publico') returning id into v_id;
 insert into historietas_privado.diario_edicao_recibos(versao,capitulo_id,obra_id,autor_id,atividade_id)
 values(p_versao,p_capitulo,v_obra_id,v_uid,v_id);
 return v_id;
end;
$$;
alter function historietas_privado.registrar_diario_edicao(uuid,uuid) owner to postgres;
revoke all on function historietas_privado.registrar_diario_edicao(uuid,uuid) from public,anon,authenticated,service_role;
grant execute on function historietas_privado.registrar_diario_edicao(uuid,uuid) to authenticated;
create function public.registrar_diario_edicao_capitulo(p_capitulo_id uuid,p_versao uuid)
returns uuid language sql volatile security invoker set search_path='' as $$
 select historietas_privado.registrar_diario_edicao(p_capitulo_id,p_versao);
$$;
revoke all on function public.registrar_diario_edicao_capitulo(uuid,uuid) from public,anon,authenticated,service_role;
grant execute on function public.registrar_diario_edicao_capitulo(uuid,uuid) to authenticated;
comment on column public.capitulos.diario_edicao_versao is
 'Token opaco de edicao, NULL legado/INSERT. Retornar no UPDATE confirmado para RPC idempotente. Nunca inferir sucesso de resposta perdida a partir de token relido.';
notify pgrst,'reload schema';
commit;
