begin;

do $precondicoes$
begin
  if to_regprocedure(
    'historietas_privado.exigir_limite_comunidade(uuid,text,integer,integer,text)'
  ) is null then
    raise exception
      'Precondição falhou: a função privada de limite da Comunidade não existe.';
  end if;
end;
$precondicoes$;

create or replace function historietas_privado.exigir_limite_comunidade(
  p_usuario_id uuid,
  p_escopo text,
  p_limite integer,
  p_janela_segundos integer,
  p_rotulo text
)
returns void
language plpgsql
volatile
security invoker
set search_path = ''
as $funcao$
declare
  v_chave_hash text;
  v_permitido boolean := false;
  v_tentar_novamente integer := 1;
begin
  if p_usuario_id is null then
    raise exception using
      errcode = '22023',
      message = 'Usuário inválido para o limitador da Comunidade.';
  end if;

  if p_escopo is null
    or p_escopo !~ '^comunidade:[a-z0-9:_-]+$'
    or char_length(p_escopo) > 64
    or p_limite is null
    or p_limite not between 1 and 10000
    or p_janela_segundos is null
    or p_janela_segundos not between 1 and 604800
    or p_rotulo is null
    or char_length(btrim(p_rotulo)) not between 1 and 40
  then
    raise exception using
      errcode = '22023',
      message = 'Configuração inválida do limitador da Comunidade.';
  end if;

  v_chave_hash := pg_catalog.encode(
    pg_catalog.sha256(
      pg_catalog.convert_to(p_usuario_id::text, 'UTF8')
    ),
    'hex'
  );

  select
    resultado.permitido,
    resultado.tentar_novamente_segundos
  into
    v_permitido,
    v_tentar_novamente
  from historietas_privado.consumir_limite_requisicao(
    p_escopo,
    v_chave_hash,
    p_limite,
    p_janela_segundos,
    0
  ) as resultado;

  if not coalesce(v_permitido, false) then
    v_tentar_novamente := greatest(
      1,
      coalesce(v_tentar_novamente, 1)
    );

    raise sqlstate 'PGRST' using
      message = pg_catalog.json_build_object(
        'code', 'HISTORIETAS_RATE_LIMIT',
        'message', pg_catalog.format(
          'Muitas ações de %s em pouco tempo. Tente novamente em %s segundos.',
          p_rotulo,
          v_tentar_novamente
        ),
        'details', 'O limite protege a Comunidade contra spam e automação.',
        'hint', 'Aguarde o tempo indicado antes de tentar novamente.'
      )::text,
      detail = pg_catalog.json_build_object(
        'status', 429,
        'status_text', 'Too Many Requests',
        'headers', pg_catalog.json_build_object(
          'Retry-After', v_tentar_novamente::text
        )
      )::text;
  end if;
end;
$funcao$;

alter function historietas_privado.exigir_limite_comunidade(
  uuid,
  text,
  integer,
  integer,
  text
) owner to postgres;

revoke all on function historietas_privado.exigir_limite_comunidade(
  uuid,
  text,
  integer,
  integer,
  text
) from public, anon, authenticated, service_role;

comment on function historietas_privado.exigir_limite_comunidade(
  uuid,
  text,
  integer,
  integer,
  text
) is
  'Consome um bucket privado por usuário e devolve HTTP 429 pela Data API quando o limite é excedido.';

do $pos_condicoes$
declare
  v_funcao oid := to_regprocedure(
    'historietas_privado.exigir_limite_comunidade(uuid,text,integer,integer,text)'
  );
  v_definicao text;
begin
  select pg_get_functiondef(v_funcao)
  into v_definicao;

  if position(
    'Muitas ações de %s em pouco tempo. Tente novamente em %s segundos.'
    in v_definicao
  ) = 0 then
    raise exception
      'Pós-condição falhou: a mensagem do limite ainda não usa placeholders válidos.';
  end if;

  if has_function_privilege(
    'anon',
    v_funcao,
    'EXECUTE'
  ) or has_function_privilege(
    'authenticated',
    v_funcao,
    'EXECUTE'
  ) or has_function_privilege(
    'service_role',
    v_funcao,
    'EXECUTE'
  ) then
    raise exception
      'Pós-condição falhou: o helper privado recebeu EXECUTE pela API.';
  end if;
end;
$pos_condicoes$;

commit;
