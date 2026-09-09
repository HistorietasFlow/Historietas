-- Limita ações sociais no próprio banco. Assim, chamadas diretas à Data API
-- e inserções feitas pelas RPCs autorizadas compartilham a mesma proteção.

begin;

do $precondicoes$
declare
  v_tabela text;
begin
  if to_regprocedure(
    'historietas_privado.consumir_limite_requisicao(text,text,integer,integer,integer)'
  ) is null then
    raise exception
      'Precondição falhou: o limitador privado de requisições não existe.';
  end if;

  foreach v_tabela in array array[
    'comunidade_posts',
    'comunidade_comentarios',
    'comunidade_curtidas',
    'comunidade_comentario_curtidas',
    'seguindo_usuarios',
    'solicitacoes_seguidores',
    'seguindo_obras',
    'seguindo_autores'
  ] loop
    if to_regclass('public.' || v_tabela) is null then
      raise exception
        'Precondição falhou: a tabela public.% não existe.',
        v_tabela;
    end if;
  end loop;
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
        'message', format(
          'Muitas ações de % em pouco tempo. Tente novamente em %s segundos.',
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

create or replace function historietas_privado.limitar_spam_comunidade()
returns trigger
language plpgsql
volatile
security definer
set search_path = ''
as $gatilho$
declare
  v_usuario_id uuid := auth.uid();
  v_dono_acao_id uuid;
  v_tipo_acao text;
begin
  -- Migrações, seeds e tarefas internas sem JWT não são limitados. O
  -- service_role também não envia auth.uid() nas rotinas administrativas.
  if v_usuario_id is null then
    return new;
  end if;

  case tg_table_name
    when 'comunidade_posts' then
      v_dono_acao_id := new.autor_id;
      v_tipo_acao := 'post';
    when 'comunidade_comentarios' then
      v_dono_acao_id := new.autor_id;
      v_tipo_acao := 'comentario';
    when 'comunidade_curtidas' then
      v_dono_acao_id := new.usuario_id;
      v_tipo_acao := 'curtida';
    when 'comunidade_comentario_curtidas' then
      v_dono_acao_id := new.usuario_id;
      v_tipo_acao := 'curtida';
    when 'seguindo_usuarios' then
      v_dono_acao_id := new.seguidor_id;
      v_tipo_acao := 'seguimento';
    when 'solicitacoes_seguidores' then
      v_dono_acao_id := new.solicitante_id;
      v_tipo_acao := 'seguimento';
    when 'seguindo_obras' then
      v_dono_acao_id := new.user_id;
      v_tipo_acao := 'seguimento';
    when 'seguindo_autores' then
      v_dono_acao_id := new.user_id;
      v_tipo_acao := 'seguimento';
    else
      raise exception using
        errcode = '22023',
        message = 'Tabela não reconhecida pelo limitador da Comunidade.';
  end case;

  -- Não consome a cota de uma vítima quando uma linha forjada for recusada
  -- pela RLS. Também preserva a aceitação legítima de um seguidor, em que o
  -- destinatário insere a relação em nome do solicitante por uma RPC segura.
  if v_dono_acao_id is distinct from v_usuario_id then
    return new;
  end if;

  case v_tipo_acao
    when 'post' then
      perform historietas_privado.exigir_limite_comunidade(
        v_usuario_id,
        'comunidade:post:10m',
        5,
        600,
        'publicação'
      );
      perform historietas_privado.exigir_limite_comunidade(
        v_usuario_id,
        'comunidade:post:dia',
        30,
        86400,
        'publicação'
      );
    when 'comentario' then
      perform historietas_privado.exigir_limite_comunidade(
        v_usuario_id,
        'comunidade:comentario:5m',
        15,
        300,
        'comentário'
      );
      perform historietas_privado.exigir_limite_comunidade(
        v_usuario_id,
        'comunidade:comentario:dia',
        150,
        86400,
        'comentário'
      );
    when 'curtida' then
      perform historietas_privado.exigir_limite_comunidade(
        v_usuario_id,
        'comunidade:curtida:minuto',
        60,
        60,
        'curtida'
      );
      perform historietas_privado.exigir_limite_comunidade(
        v_usuario_id,
        'comunidade:curtida:dia',
        500,
        86400,
        'curtida'
      );
    when 'seguimento' then
      perform historietas_privado.exigir_limite_comunidade(
        v_usuario_id,
        'comunidade:seguimento:10m',
        20,
        600,
        'seguimento'
      );
      perform historietas_privado.exigir_limite_comunidade(
        v_usuario_id,
        'comunidade:seguimento:dia',
        100,
        86400,
        'seguimento'
      );
  end case;

  return new;
end;
$gatilho$;

alter function historietas_privado.limitar_spam_comunidade()
owner to postgres;

revoke all on function historietas_privado.limitar_spam_comunidade()
from public, anon, authenticated, service_role;

comment on function historietas_privado.limitar_spam_comunidade() is
  'Gatilho privado que limita posts, comentários, curtidas e seguimentos por auth.uid().';

drop trigger if exists limitar_spam_comunidade_posts
  on public.comunidade_posts;
create trigger limitar_spam_comunidade_posts
before insert on public.comunidade_posts
for each row execute function historietas_privado.limitar_spam_comunidade();

drop trigger if exists limitar_spam_comunidade_comentarios
  on public.comunidade_comentarios;
create trigger limitar_spam_comunidade_comentarios
before insert on public.comunidade_comentarios
for each row execute function historietas_privado.limitar_spam_comunidade();

drop trigger if exists limitar_spam_comunidade_curtidas
  on public.comunidade_curtidas;
create trigger limitar_spam_comunidade_curtidas
before insert on public.comunidade_curtidas
for each row execute function historietas_privado.limitar_spam_comunidade();

drop trigger if exists limitar_spam_comunidade_comentario_curtidas
  on public.comunidade_comentario_curtidas;
create trigger limitar_spam_comunidade_comentario_curtidas
before insert on public.comunidade_comentario_curtidas
for each row execute function historietas_privado.limitar_spam_comunidade();

drop trigger if exists limitar_spam_seguindo_usuarios
  on public.seguindo_usuarios;
create trigger limitar_spam_seguindo_usuarios
before insert on public.seguindo_usuarios
for each row execute function historietas_privado.limitar_spam_comunidade();

drop trigger if exists limitar_spam_solicitacoes_seguidores
  on public.solicitacoes_seguidores;
create trigger limitar_spam_solicitacoes_seguidores
before insert on public.solicitacoes_seguidores
for each row execute function historietas_privado.limitar_spam_comunidade();

drop trigger if exists limitar_spam_seguindo_obras
  on public.seguindo_obras;
create trigger limitar_spam_seguindo_obras
before insert on public.seguindo_obras
for each row execute function historietas_privado.limitar_spam_comunidade();

drop trigger if exists limitar_spam_seguindo_autores
  on public.seguindo_autores;
create trigger limitar_spam_seguindo_autores
before insert on public.seguindo_autores
for each row execute function historietas_privado.limitar_spam_comunidade();

-- A decisão entre seguir imediatamente e criar uma solicitação depende de
-- preferências privadas. Fechamos os INSERTs diretos e mantemos como única
-- entrada a RPC solicitar_ou_seguir_usuario, que valida bloqueios, privacidade
-- e identidade antes de inserir. Os gatilhos acima também rodam dentro da RPC.
revoke insert on table public.seguindo_usuarios
from anon, authenticated;

revoke insert on table public.solicitacoes_seguidores
from anon, authenticated;

do $pos_condicoes$
declare
  v_funcao_limite oid := to_regprocedure(
    'historietas_privado.exigir_limite_comunidade(uuid,text,integer,integer,text)'
  );
  v_funcao_gatilho oid := to_regprocedure(
    'historietas_privado.limitar_spam_comunidade()'
  );
  v_tabelas regclass[] := array[
    'public.comunidade_posts'::regclass,
    'public.comunidade_comentarios'::regclass,
    'public.comunidade_curtidas'::regclass,
    'public.comunidade_comentario_curtidas'::regclass,
    'public.seguindo_usuarios'::regclass,
    'public.solicitacoes_seguidores'::regclass,
    'public.seguindo_obras'::regclass,
    'public.seguindo_autores'::regclass
  ];
begin
  if v_funcao_limite is null or v_funcao_gatilho is null then
    raise exception 'As funções privadas contra spam não foram criadas.';
  end if;

  if (
    select count(*)
    from pg_catalog.pg_proc as funcao
    where funcao.oid in (v_funcao_limite, v_funcao_gatilho)
      and funcao.proconfig @> array['search_path=""']::text[]
      and pg_catalog.pg_get_userbyid(funcao.proowner) = 'postgres'
  ) <> 2 then
    raise exception
      'As funções contra spam precisam pertencer a postgres e ter search_path vazio.';
  end if;

  if not (
    select funcao.prosecdef
    from pg_catalog.pg_proc as funcao
    where funcao.oid = v_funcao_gatilho
  ) or (
    select funcao.prosecdef
    from pg_catalog.pg_proc as funcao
    where funcao.oid = v_funcao_limite
  ) then
    raise exception
      'Somente o gatilho contra spam pode usar SECURITY DEFINER.';
  end if;

  if exists (
    select 1
    from pg_catalog.pg_proc as funcao
    cross join lateral pg_catalog.aclexplode(
      coalesce(
        funcao.proacl,
        pg_catalog.acldefault('f', funcao.proowner)
      )
    ) as permissao
    where funcao.oid in (v_funcao_limite, v_funcao_gatilho)
      and permissao.grantee <> funcao.proowner
      and permissao.privilege_type = 'EXECUTE'
  ) then
    raise exception
      'As funções contra spam não podem ser executadas diretamente por papéis clientes.';
  end if;

  if (
    select count(*)
    from pg_catalog.pg_trigger as gatilho
    where gatilho.tgrelid = any(v_tabelas)
      and gatilho.tgfoid = v_funcao_gatilho
      and not gatilho.tgisinternal
      and gatilho.tgenabled <> 'D'
  ) <> cardinality(v_tabelas) then
    raise exception
      'Nem todas as ações sociais receberam o gatilho contra spam.';
  end if;

  if pg_catalog.has_table_privilege(
    'anon',
    'public.seguindo_usuarios',
    'INSERT'
  ) or pg_catalog.has_table_privilege(
    'authenticated',
    'public.seguindo_usuarios',
    'INSERT'
  ) or pg_catalog.has_table_privilege(
    'anon',
    'public.solicitacoes_seguidores',
    'INSERT'
  ) or pg_catalog.has_table_privilege(
    'authenticated',
    'public.solicitacoes_seguidores',
    'INSERT'
  ) then
    raise exception
      'As tabelas de seguidores ainda aceitam INSERT direto pela Data API.';
  end if;
end;
$pos_condicoes$;

commit;
