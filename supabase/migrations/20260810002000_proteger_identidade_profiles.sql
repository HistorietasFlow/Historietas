begin;

drop policy if exists profiles_insert_proprio on public.profiles;

create policy profiles_insert_proprio
on public.profiles
for insert
to authenticated
with check (
  auth.uid() is not null
  and id = auth.uid()
  and user_id = auth.uid()
);

drop policy if exists profiles_delete_proprio on public.profiles;

create policy profiles_delete_proprio
on public.profiles
for delete
to authenticated
using (
  auth.uid() is not null
  and user_id = auth.uid()
);

commit;
