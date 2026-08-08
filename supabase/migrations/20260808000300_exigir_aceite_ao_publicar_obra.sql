-- Exige aceite vigente também quando uma obra existente é publicada por UPDATE.
-- Mantém o gatilho atual de INSERT e cobre apenas a transição de rascunho para publicado.

drop trigger if exists "exigir_aceite_termos_ao_publicar_obra" on public.obras;

create trigger "exigir_aceite_termos_ao_publicar_obra"
before update of publicado on public.obras
for each row
when (
  old.publicado is distinct from true
  and new.publicado is true
)
execute function public.exigir_aceite_termos_antes_de_publicar();