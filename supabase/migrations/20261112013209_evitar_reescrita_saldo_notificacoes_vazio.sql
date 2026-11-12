-- PH-1 parcial: remover somente o UPDATE sem debito. Nao reserva disco/WAL.
begin;
set local lock_timeout='5s';
set local statement_timeout='30s';

do $migration$
declare
  alvo regprocedure := 'historietas_privado.admitir_notificacoes_capitulo(jsonb)'::regprocedure;
  definicao text;
  ancora text := '  -- Escrita da mesma linha impede que snapshot RR antigo admita saldo obsoleto.';
  dono oid;
  acl aclitem[];
begin
  if not exists(select 1 from historietas_privado.capitulo_runner_controle where singleton and not habilitado) then
    raise exception 'Instalacao exige runner desativado.' using errcode='55000';
  end if;
  select replace(pg_get_functiondef(oid),E'\r\n',E'\n'),proowner,proacl
    into strict definicao,dono,acl from pg_proc where oid=alvo and not prosecdef;
  if length(definicao)-length(replace(definicao,ancora,''))<>length(ancora)
    or strpos(definicao,'where singleton for update;')=0
    or strpos(definicao,'if d>c.limite_destinatarios')=0
    or strpos(definicao,'then return false; end if;')=0
    or strpos(definicao,'then return false; end if;')>strpos(definicao,ancora)
    or strpos(definicao,'if n=0 then return true; end if;')>0 then
    raise exception 'Contrato da admissao divergiu; revisar PH-1 antes da instalacao.';
  end if;
  -- O plano ja passou por TODAS as validacoes, com advisory/row locks mantidos.
  -- Sem linhas nao ha debito. Com linhas, a barreira de escrita RR e identica.
  execute replace(definicao,ancora,
    '  if n=0 then return true; end if;'||chr(10)||ancora);
  if exists(select 1 from pg_proc where oid=alvo
    and (proowner is distinct from dono or proacl is distinct from acl or prosecdef)) then
    raise exception 'Identidade ou ACL da admissao foi alterada.';
  end if;
end;
$migration$;
commit;
