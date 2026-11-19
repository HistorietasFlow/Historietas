begin;
set local lock_timeout = '5s';
drop function public.qa5_recomendar_obras_autorizadas(
  text,text,text,text,text,text,integer,numeric,timestamptz,uuid,text
) restrict;
notify pgrst, 'reload schema';
commit;
