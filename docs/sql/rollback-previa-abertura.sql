-- Executar somente após aprovação, na versão correspondente a 01_migration_proposta.sql.
begin;
set local lock_timeout = '5s';
set local search_path = pg_catalog;
drop function previa_interno.abertura_obra(text) restrict;
drop function previa_interno.sessao_atual_ativa() restrict;
drop schema previa_interno restrict;
commit;
