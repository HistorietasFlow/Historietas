begin;

revoke insert on table public.profiles from authenticated;

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

commit;