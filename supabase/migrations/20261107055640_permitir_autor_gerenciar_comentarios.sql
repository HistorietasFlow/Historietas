drop policy if exists comentarios_obras_delete_proprio_ou_admin
  on public.comentarios_obras;

create policy comentarios_obras_delete_proprio_ou_admin
on public.comentarios_obras
for delete
to authenticated
using (
  (select auth.uid()) is not null
  and (
    user_id = (select auth.uid())
    or public.usuario_e_admin()
    or exists (
      select 1
      from public.obras obra
      where obra.id = comentarios_obras.obra_id
        and obra.user_id = (select auth.uid())
    )
  )
);

drop policy if exists comentarios_capitulos_delete_proprio_ou_admin
  on public.comentarios_capitulos;

create policy comentarios_capitulos_delete_proprio_ou_admin
on public.comentarios_capitulos
for delete
to authenticated
using (
  (select auth.uid()) is not null
  and (
    user_id = (select auth.uid())
    or public.usuario_e_admin()
    or exists (
      select 1
      from public.capitulos capitulo
      join public.obras obra on obra.id = capitulo.obra_id
      where capitulo.id = comentarios_capitulos.capitulo_id
        and obra.user_id = (select auth.uid())
    )
  )
);
