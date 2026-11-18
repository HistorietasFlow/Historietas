-- Apenas no banco descartável, depois de verificar a instalação inativa.
-- Este adaptador existe exclusivamente para a suíte HTTP do piloto.
begin;
grant usage on schema previa_interno to anon;
grant execute on function previa_interno.abertura_obra(text) to anon, authenticated;
create function public.previa_abertura_local(p_slug text)
returns table(trecho text)
language sql stable security invoker set search_path = ''
begin atomic
  select p.trecho from previa_interno.abertura_obra(p_slug) as p;
end;
revoke all on function public.previa_abertura_local(text) from public, anon, authenticated, service_role;
grant execute on function public.previa_abertura_local(text) to anon, authenticated;
notify pgrst, 'reload schema';
commit;
