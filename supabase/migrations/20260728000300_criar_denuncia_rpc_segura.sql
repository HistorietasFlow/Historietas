-- 20260728000300_criar_denuncia_rpc_segura.sql
-- Cria o ponto único e seguro para o envio de denúncias da Comunidade.
--
-- Pré-requisito:
--   20260728000200_comunidade_denuncias_validacoes.sql
--
-- Uso no frontend:
--
-- const { data, error } = await supabase.rpc("criar_denuncia", {
--   p_alvo_tipo: "comentario_capitulo",
--   p_alvo_id: comentarioId,
--   p_motivo: "Conteúdo inadequado",
--   p_detalhe: "Comentário em capítulo",
-- });
--
-- Nesta etapa, o INSERT direto na tabela é mantido temporariamente para
-- preservar os botões atuais. Depois que o frontend inteiro usar esta RPC,
-- uma migration posterior deverá revogar INSERT de authenticated na tabela.

begin;

-- ============================================================
-- PRÉ-REQUISITOS
-- ============================================================

do $$
declare
  v_tipo_alvo_id text;
begin
  if to_regclass('public.comunidade_denuncias') is null then
    raise exception
      'A tabela public.comunidade_denuncias precisa existir antes desta migration.';
  end if;

  if to_regprocedure('public.validar_comunidade_denuncia()') is null then
    raise exception
      'A função public.validar_comunidade_denuncia() precisa existir antes desta migration.';
  end if;

  if to_regprocedure('public.comunidade_motivo_denuncia_valido(text)') is null then
    raise exception
      'A função public.comunidade_motivo_denuncia_valido(text) precisa existir antes desta migration.';
  end if;

  select format_type(atributo.atttypid, atributo.atttypmod)
  into v_tipo_alvo_id
  from pg_catalog.pg_attribute atributo
  where atributo.attrelid = 'public.comunidade_denuncias'::regclass
    and atributo.attname = 'alvo_id'
    and not atributo.attisdropped;

  if v_tipo_alvo_id is distinct from 'uuid' then
    raise exception
      'A coluna public.comunidade_denuncias.alvo_id precisa ser uuid, mas atualmente é %.',
      coalesce(v_tipo_alvo_id, 'inexistente');
  end if;

  if not exists (
    select 1
    from pg_catalog.pg_indexes indice
    where indice.schemaname = 'public'
      and indice.tablename = 'comunidade_denuncias'
      and indice.indexname = 'comunidade_denuncias_ativa_uidx'
  ) then
    raise exception
      'O índice public.comunidade_denuncias_ativa_uidx precisa existir antes desta migration.';
  end if;
end
$$;

-- ============================================================
-- RPC SEGURA
-- ============================================================

create or replace function public.criar_denuncia(
  p_alvo_tipo text,
  p_alvo_id uuid,
  p_motivo text default 'Conteúdo inadequado',
  p_detalhe text default ''
)
returns table (
  denuncia_id uuid,
  denuncia_status text,
  denuncia_criado_em timestamptz
)
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  v_usuario_id uuid := auth.uid();
  v_alvo_tipo text := lower(btrim(coalesce(p_alvo_tipo, '')));
  v_motivo text := btrim(coalesce(p_motivo, ''));
  v_detalhe text := btrim(coalesce(p_detalhe, ''));
  v_denuncia_id uuid;
  v_denuncia_status text;
  v_denuncia_criado_em timestamptz;
begin
  -- A identidade sempre vem da sessão autenticada.
  if v_usuario_id is null then
    raise exception 'Entre na sua conta para enviar uma denúncia.'
      using errcode = '42501';
  end if;

  -- Apenas os tipos já suportados pelo painel e pelo trigger atual.
  if v_alvo_tipo not in ('post', 'comentario', 'comentario_capitulo') then
    raise exception 'Tipo de conteúdo denunciado inválido.'
      using errcode = '22023';
  end if;

  if p_alvo_id is null then
    raise exception 'A denúncia precisa informar o conteúdo denunciado.'
      using errcode = '23502';
  end if;

  if not public.comunidade_motivo_denuncia_valido(v_motivo) then
    raise exception 'Motivo da denúncia inválido.'
      using errcode = '22023';
  end if;

  if char_length(v_detalhe) > 1200 then
    raise exception 'A explicação da denúncia pode ter no máximo 1200 caracteres.'
      using errcode = '22001';
  end if;

  -- Retorno antecipado com código estável usado pelo frontend.
  -- O índice parcial ainda protege contra corrida entre requisições.
  if exists (
    select 1
    from public.comunidade_denuncias denuncia
    where denuncia.alvo_tipo = v_alvo_tipo
      and denuncia.alvo_id = p_alvo_id
      and denuncia.denunciante_id = v_usuario_id
      and denuncia.status in ('pendente', 'em_analise')
  ) then
    raise exception 'Você já possui uma denúncia ativa para este conteúdo.'
      using
        errcode = '23505',
        constraint = 'comunidade_denuncias_ativa_uidx';
  end if;

  -- Somente os campos públicos entram no INSERT.
  -- O trigger public.validar_comunidade_denuncia() confirma:
  --   - existência e autoria do alvo;
  --   - auto-denúncia;
  --   - limite por hora;
  --   - motivo e tamanhos;
  --   - status e campos administrativos.
  insert into public.comunidade_denuncias (
    alvo_tipo,
    alvo_id,
    denunciante_id,
    motivo,
    detalhe
  )
  values (
    v_alvo_tipo,
    p_alvo_id,
    v_usuario_id,
    v_motivo,
    v_detalhe
  )
  returning
    id,
    status,
    criado_em
  into
    v_denuncia_id,
    v_denuncia_status,
    v_denuncia_criado_em;

  return query
  select
    v_denuncia_id,
    v_denuncia_status,
    v_denuncia_criado_em;

exception
  when unique_violation then
    -- Trata também a corrida em que duas requisições passam pela
    -- verificação anterior antes que uma delas conclua o INSERT.
    raise exception 'Você já possui uma denúncia ativa para este conteúdo.'
      using
        errcode = '23505',
        constraint = 'comunidade_denuncias_ativa_uidx';
end;
$$;

comment on function public.criar_denuncia(text, uuid, text, text) is
  'Cria denúncia usando auth.uid(), sem aceitar status ou campos administrativos enviados pelo cliente.';

-- Funções recebem EXECUTE de PUBLIC por padrão no PostgreSQL.
-- Retiramos esse acesso e liberamos somente para usuários autenticados.
revoke all
  on function public.criar_denuncia(text, uuid, text, text)
  from public;

revoke all
  on function public.criar_denuncia(text, uuid, text, text)
  from anon;

revoke all
  on function public.criar_denuncia(text, uuid, text, text)
  from authenticated;

grant execute
  on function public.criar_denuncia(text, uuid, text, text)
  to authenticated;

commit;