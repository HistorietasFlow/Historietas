begin;
set local lock_timeout = '5s';
set local search_path = pg_catalog;

-- A reversão aborta em caso de dependências adicionais.
drop function public.qa5_generos_interacoes_autorizadas() restrict;
drop function qa5_sinais_interno.autores_visiveis(uuid[]) restrict;
drop schema qa5_sinais_interno restrict;

notify pgrst, 'reload schema';
commit;
