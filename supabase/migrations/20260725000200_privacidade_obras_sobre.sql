begin;

alter table public.preferencias_privacidade
  add column if not exists mostrar_obras_para_todos boolean,
  add column if not exists mostrar_sobre_para_todos boolean;

update public.preferencias_privacidade
set
  mostrar_obras_para_todos = coalesce(mostrar_obras_para_todos, true),
  mostrar_sobre_para_todos = coalesce(mostrar_sobre_para_todos, true)
where
  mostrar_obras_para_todos is null
  or mostrar_sobre_para_todos is null;

alter table public.preferencias_privacidade
  alter column mostrar_obras_para_todos set default true,
  alter column mostrar_obras_para_todos set not null,
  alter column mostrar_sobre_para_todos set default true,
  alter column mostrar_sobre_para_todos set not null;

comment on column public.preferencias_privacidade.mostrar_obras_para_todos is
  'Quando verdadeiro, qualquer visitante pode visualizar a aba Obras do perfil.';

comment on column public.preferencias_privacidade.mostrar_sobre_para_todos is
  'Quando verdadeiro, qualquer visitante pode visualizar a aba Sobre do perfil.';

commit;