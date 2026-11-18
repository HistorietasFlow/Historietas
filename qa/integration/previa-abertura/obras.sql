-- Dados exclusivamente fictícios. Os IDs e o prefixo pertencem a esta execução.
begin;
insert into public.profiles(id,user_id,nome,tipo)
select id,id,'QA prévia',case when id=:'autor'::uuid then 'autor' else 'leitor' end
from auth.users where id in (:'autor',:'leitor',:'bloqueado',:'bloqueador')
on conflict (user_id) do nothing;
insert into public.preferencias_privacidade(user_id,visibilidade_obras)
values (:'autor','seguidores')
on conflict (user_id) do update set visibilidade_obras = excluded.visibilidade_obras;
insert into public.seguindo_usuarios(seguidor_id,seguido_id)
values (:'leitor',:'autor'),(:'bloqueado',:'autor'),(:'bloqueador',:'autor');
insert into public.usuarios_bloqueados(bloqueador_id,bloqueado_id)
values (:'autor',:'bloqueado'),(:'bloqueador',:'autor');
select set_config('request.jwt.claim.sub',:'autor',true);
select public.aceitar_termos_publicacao('2026-08-05','2026-08-05','2026-08-05');
insert into public.obras(user_id,titulo,autor,genero,formato,classificacao_indicativa,avisos_conteudo,publicado,slug)
select :'autor',caso,'QA','Fantasia','Romance',
  case when caso='adulto' then '18+' else 'Livre' end,
  case when caso='adulto' then array['terror'] else '{}'::text[] end,
  caso<>'rascunho', :'prefixo' || caso
from unnest(array['publicada','adulto','rascunho','capitulo-privado','sem-abertura']) caso;
insert into public.capitulos(obra_id,user_id,titulo,texto,ordem,publicado)
select id,user_id,'Capítulo QA',repeat('A',599) || '🌿' || 'FIM',
  case when slug=:'prefixo'||'sem-abertura' then 2 else 1 end,
  slug<>:'prefixo'||'capitulo-privado'
from public.obras where user_id=:'autor';
commit;
