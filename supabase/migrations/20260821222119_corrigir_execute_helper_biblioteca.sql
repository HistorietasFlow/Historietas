begin;

-- As policies de leitura são executadas como anon/authenticated e, por isso,
-- precisam poder chamar o helper. O schema continua fora dos schemas expostos
-- pela Data API e a função retorna somente a decisão booleana de acesso.
grant usage on schema historietas_privado
  to anon, authenticated;

revoke execute on function historietas_privado.usuario_pode_ver_registro_biblioteca(uuid, text, text)
  from public, service_role;

grant execute on function historietas_privado.usuario_pode_ver_registro_biblioteca(uuid, text, text)
  to anon, authenticated;

comment on function historietas_privado.usuario_pode_ver_registro_biblioteca(uuid, text, text) is
  'Função booleana interna usada pelas policies da Biblioteca; EXECUTE é limitado aos papéis que avaliam essas policies.';

commit;
