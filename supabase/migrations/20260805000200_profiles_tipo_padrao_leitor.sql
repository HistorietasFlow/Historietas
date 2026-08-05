-- Garante que todo perfil novo comece com um tipo aceito pela regra
-- profiles_tipo_check. O código também envia tipo = 'leitor' explicitamente,
-- mas o default protege criações feitas por outros fluxos ou pelo painel.

begin;

alter table public.profiles
  alter column tipo set default 'leitor';

update public.profiles
set tipo = 'leitor'
where tipo is null;

commit;
