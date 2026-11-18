begin;
drop function public.previa_abertura_local(text) restrict;
revoke execute on function previa_interno.abertura_obra(text) from anon, authenticated;
revoke usage on schema previa_interno from anon;
notify pgrst, 'reload schema';
commit;
