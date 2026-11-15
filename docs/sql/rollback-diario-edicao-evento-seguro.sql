-- OPCIONAL e manual: somente apos desativacao e com ZERO eventos/recibos.
-- Rollback operacional preferido: desligar gate e manter guards/tombstones.
begin;
set local lock_timeout='5s';
set local statement_timeout='30s';
set local search_path='';
lock table historietas_privado.diario_edicao_config in access exclusive mode;
update historietas_privado.diario_edicao_config set habilitado=false;
lock table historietas_privado.diario_edicao_recibos in access exclusive mode;
lock table public.diario_atividades in access exclusive mode;
do $rollback$
declare v_check text; v_leitura text;
begin
 if exists(select 1 from historietas_privado.diario_edicao_recibos)
 or exists(select 1 from public.diario_atividades where tipo='editou_capitulo') then
   raise exception 'Rollback fisico recusado: preservar eventos e tombstones.' using errcode='55000';
 end if;
 select check_anterior,leitura_anterior into strict v_check,v_leitura from historietas_privado.diario_edicao_config;
 alter table public.diario_atividades drop constraint diario_atividades_tipo_check;
 execute 'alter table public.diario_atividades add constraint diario_atividades_tipo_check check ('||v_check||')';
 execute 'alter policy diario_atividades_select_visiveis on public.diario_atividades using ('||v_leitura||')';
end;
$rollback$;
drop policy diario_edicao_leitura on public.diario_atividades;
drop policy diario_edicao_insert_rpc on public.diario_atividades;
drop policy diario_edicao_imutavel on public.diario_atividades;
drop function public.registrar_diario_edicao_capitulo(uuid,uuid);
drop function historietas_privado.registrar_diario_edicao(uuid,uuid);
drop function historietas_privado.edicao_diario_visivel(uuid,uuid,uuid,text);
drop trigger z_capitulos_versao_diario_edicao on public.capitulos;
drop function historietas_privado.definir_versao_diario_edicao();
alter table public.capitulos drop column diario_edicao_versao;
drop table historietas_privado.diario_edicao_recibos;
drop table historietas_privado.diario_edicao_config;
notify pgrst,'reload schema';
commit;
