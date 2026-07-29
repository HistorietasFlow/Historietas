-- 20260728000200_comunidade_denuncias_validacoes.sql
-- Fortalece a integridade e a segurança das denúncias atuais da Comunidade.
-- Compatível com bancos em que comunidade_denuncias.alvo_id já é uuid.
-- Tipos suportados nesta etapa:
--   post, comentario e comentario_capitulo.
--
-- Esta migration:
-- - normaliza os registros existentes;
-- - restringe tipos, status, tamanhos e formato do alvo;
-- - confirma que o alvo existe antes de aceitar uma denúncia;
-- - impede denúncia do próprio conteúdo;
-- - impede manipulação de campos administrativos no INSERT;
-- - limita o volume de denúncias por usuário;
-- - permite uma nova denúncia depois que a anterior for encerrada;
-- - protege campos imutáveis durante a análise administrativa;
-- - mantém atualizado_em e os dados de análise consistentes.

begin;

-- ============================================================
-- PRÉ-REQUISITOS
-- ============================================================

do $$
begin
  if to_regclass('public.comunidade_denuncias') is null then
    raise exception
      'A tabela public.comunidade_denuncias precisa existir antes desta migration.';
  end if;

  if to_regclass('public.comunidade_posts') is null then
    raise exception
      'A tabela public.comunidade_posts precisa existir antes desta migration.';
  end if;

  if to_regclass('public.comunidade_comentarios') is null then
    raise exception
      'A tabela public.comunidade_comentarios precisa existir antes desta migration.';
  end if;

  if to_regclass('public.comentarios_capitulos') is null then
    raise exception
      'A tabela public.comentarios_capitulos precisa existir antes desta migration.';
  end if;

  if to_regprocedure('public.comunidade_usuario_e_admin()') is null then
    raise exception
      'A função public.comunidade_usuario_e_admin() precisa existir antes desta migration.';
  end if;
end
$$;

alter table public.comunidade_denuncias
  enable row level security;

-- ============================================================
-- NORMALIZAÇÃO DEFENSIVA DOS REGISTROS EXISTENTES
-- ============================================================

update public.comunidade_denuncias
set
  alvo_tipo = case lower(btrim(coalesce(alvo_tipo, '')))
    when 'post' then 'post'
    when 'post_comunidade' then 'post'
    when 'publicacao' then 'post'
    when 'publicação' then 'post'
    when 'comentario' then 'comentario'
    when 'comentário' then 'comentario'
    when 'comentario_comunidade' then 'comentario'
    when 'comentário_comunidade' then 'comentario'
    when 'comentario_capitulo' then 'comentario_capitulo'
    when 'comentário_capítulo' then 'comentario_capitulo'
    when 'comentario_capítulo' then 'comentario_capitulo'
    when 'comentário_capitulo' then 'comentario_capitulo'
    else lower(btrim(coalesce(alvo_tipo, '')))
  end,
  motivo = coalesce(nullif(btrim(motivo), ''), 'Conteúdo inadequado'),
  detalhe = btrim(coalesce(detalhe, '')),
  status = case lower(btrim(coalesce(status, '')))
    when 'pendente' then 'pendente'
    when 'em_analise' then 'em_analise'
    when 'em análise' then 'em_analise'
    when 'em analise' then 'em_analise'
    when 'analisando' then 'em_analise'
    when 'resolvida' then 'resolvida'
    when 'resolvido' then 'resolvida'
    when 'rejeitada' then 'rejeitada'
    when 'rejeitado' then 'rejeitada'
    else lower(btrim(coalesce(status, '')))
  end,
  arquivada = coalesce(arquivada, false),
  observacao_admin = btrim(coalesce(observacao_admin, '')),
  criado_em = coalesce(criado_em, now()),
  atualizado_em = coalesce(atualizado_em, criado_em, now());

-- Uma denúncia pendente ainda não foi analisada.
update public.comunidade_denuncias
set
  analisado_por = null,
  analisado_em = null
where status = 'pendente';

-- Registros já processados recebem uma data de análise defensiva caso
-- tenham sido criados por versões antigas que não preenchiam esse campo.
update public.comunidade_denuncias
set analisado_em = coalesce(analisado_em, atualizado_em, criado_em, now())
where status in ('em_analise', 'resolvida', 'rejeitada')
  and analisado_em is null;

-- Interrompe a migration com uma mensagem clara em vez de apagar ou
-- reinterpretar silenciosamente um registro histórico desconhecido.
do $$
declare
  v_tipos_invalidos text;
  v_status_invalidos text;
  v_ids_invalidos bigint;
begin
  select string_agg(distinct quote_literal(alvo_tipo), ', ' order by quote_literal(alvo_tipo))
  into v_tipos_invalidos
  from public.comunidade_denuncias
  where alvo_tipo not in ('post', 'comentario', 'comentario_capitulo');

  if v_tipos_invalidos is not null then
    raise exception
      'Existem tipos de alvo desconhecidos em comunidade_denuncias: %. Corrija-os antes de aplicar esta migration.',
      v_tipos_invalidos;
  end if;

  select string_agg(distinct quote_literal(status), ', ' order by quote_literal(status))
  into v_status_invalidos
  from public.comunidade_denuncias
  where status not in ('pendente', 'em_analise', 'resolvida', 'rejeitada');

  if v_status_invalidos is not null then
    raise exception
      'Existem status desconhecidos em comunidade_denuncias: %. Corrija-os antes de aplicar esta migration.',
      v_status_invalidos;
  end if;

  select count(*)
  into v_ids_invalidos
  from public.comunidade_denuncias
  where alvo_id is null
     or alvo_id::text !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

  if v_ids_invalidos > 0 then
    raise exception
      'Existem % identificadores de alvo que não são UUID válidos em comunidade_denuncias.',
      v_ids_invalidos;
  end if;

  if exists (
    select 1
    from public.comunidade_denuncias
    where char_length(btrim(motivo)) not between 2 and 80
  ) then
    raise exception
      'Existem motivos vazios ou com mais de 80 caracteres em comunidade_denuncias.';
  end if;

  if exists (
    select 1
    from public.comunidade_denuncias
    where char_length(detalhe) > 1200
  ) then
    raise exception
      'Existem detalhes com mais de 1200 caracteres em comunidade_denuncias.';
  end if;

  if exists (
    select 1
    from public.comunidade_denuncias
    where char_length(observacao_admin) > 1200
  ) then
    raise exception
      'Existem observações administrativas com mais de 1200 caracteres em comunidade_denuncias.';
  end if;
end
$$;

-- ============================================================
-- COLUNAS, DEFAULTS E RESTRIÇÕES
-- ============================================================

alter table public.comunidade_denuncias
  alter column alvo_tipo set not null,
  alter column alvo_id set not null,
  alter column denunciante_id set not null,
  alter column motivo set default 'Conteúdo inadequado',
  alter column motivo set not null,
  alter column detalhe set default '',
  alter column detalhe set not null,
  alter column status set default 'pendente',
  alter column status set not null,
  alter column arquivada set default false,
  alter column arquivada set not null,
  alter column observacao_admin set default '',
  alter column observacao_admin set not null,
  alter column criado_em set default now(),
  alter column criado_em set not null,
  alter column atualizado_em set default now(),
  alter column atualizado_em set not null;

alter table public.comunidade_denuncias
  drop constraint if exists comunidade_denuncias_alvo_tipo_check,
  drop constraint if exists comunidade_denuncias_alvo_id_uuid_check,
  drop constraint if exists comunidade_denuncias_status_check,
  drop constraint if exists comunidade_denuncias_motivo_tamanho_check,
  drop constraint if exists comunidade_denuncias_detalhe_tamanho_check,
  drop constraint if exists comunidade_denuncias_observacao_tamanho_check,
  drop constraint if exists comunidade_denuncias_analise_coerente_check;

alter table public.comunidade_denuncias
  add constraint comunidade_denuncias_alvo_tipo_check
    check (alvo_tipo in ('post', 'comentario', 'comentario_capitulo')),
  add constraint comunidade_denuncias_alvo_id_uuid_check
    check (
      alvo_id::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    ),
  add constraint comunidade_denuncias_status_check
    check (status in ('pendente', 'em_analise', 'resolvida', 'rejeitada')),
  add constraint comunidade_denuncias_motivo_tamanho_check
    check (char_length(btrim(motivo)) between 2 and 80),
  add constraint comunidade_denuncias_detalhe_tamanho_check
    check (char_length(detalhe) <= 1200),
  add constraint comunidade_denuncias_observacao_tamanho_check
    check (char_length(observacao_admin) <= 1200),
  add constraint comunidade_denuncias_analise_coerente_check
    check (
      (
        status = 'pendente'
        and analisado_por is null
        and analisado_em is null
      )
      or status in ('em_analise', 'resolvida', 'rejeitada')
    );

-- ============================================================
-- MOTIVOS PERMITIDOS PARA NOVAS DENÚNCIAS
-- ============================================================

create or replace function public.comunidade_motivo_denuncia_valido(
  p_motivo text
)
returns boolean
language sql
immutable
security invoker
set search_path = pg_catalog
as $$
  select btrim(coalesce(p_motivo, '')) in (
    -- Valores legados já usados pela interface atual.
    'Conteúdo inadequado',
    'Conteúdo impróprio',
    'Conteúdo ofensivo',
    'Spam',
    'Assédio',
    'Ódio ou discriminação',
    'Ameaça ou violência',
    'Conteúdo sexual impróprio',
    'Risco envolvendo menor',
    'Plágio ou direitos autorais',
    'Exposição de informações pessoais',
    'Fraude ou golpe',
    'Perfil falso',
    'Outro',

    -- Códigos estáveis preparados para o modal compartilhado futuro.
    'conteudo_inadequado',
    'spam',
    'assedio',
    'odio_discriminacao',
    'ameaca_violencia',
    'conteudo_sexual',
    'risco_menor',
    'plagio_direitos_autorais',
    'informacoes_pessoais',
    'fraude',
    'perfil_falso',
    'outro'
  );
$$;

comment on function public.comunidade_motivo_denuncia_valido(text) is
  'Valida motivos aceitos para novas denúncias da Comunidade.';

revoke all
  on function public.comunidade_motivo_denuncia_valido(text)
  from public, anon, authenticated;

-- ============================================================
-- DUPLICIDADE: SOMENTE DENÚNCIAS ATIVAS
-- ============================================================

-- Preserva o registro ativo mais antigo e encerra duplicatas ativas antigas
-- sem apagar o histórico.
with denuncias_ativas_ordenadas as (
  select
    id,
    row_number() over (
      partition by alvo_tipo, alvo_id, denunciante_id
      order by criado_em asc, id asc
    ) as ordem
  from public.comunidade_denuncias
  where status in ('pendente', 'em_analise')
), duplicatas as (
  select id
  from denuncias_ativas_ordenadas
  where ordem > 1
)
update public.comunidade_denuncias denuncia
set
  status = 'rejeitada',
  arquivada = true,
  observacao_admin = left(
    concat_ws(
      E'\n',
      nullif(btrim(denuncia.observacao_admin), ''),
      'Duplicata ativa encerrada automaticamente durante a proteção da tabela.'
    ),
    1200
  ),
  analisado_em = coalesce(denuncia.analisado_em, now()),
  atualizado_em = now()
from duplicatas
where denuncia.id = duplicatas.id;

drop index if exists public.comunidade_denuncias_unica_idx;
drop index if exists public.comunidade_denuncias_alvo_denunciante_uidx;
drop index if exists public.comunidade_denuncias_ativa_uidx;

create unique index comunidade_denuncias_ativa_uidx
  on public.comunidade_denuncias (
    alvo_tipo,
    alvo_id,
    denunciante_id
  )
  where status in ('pendente', 'em_analise');

create index if not exists comunidade_denuncias_denunciante_criado_idx
  on public.comunidade_denuncias (denunciante_id, criado_em desc);

create index if not exists comunidade_denuncias_status_arquivada_criado_idx
  on public.comunidade_denuncias (status, arquivada, criado_em desc);

create index if not exists comunidade_denuncias_alvo_idx
  on public.comunidade_denuncias (alvo_tipo, alvo_id, criado_em desc);

-- ============================================================
-- TRIGGER DE INTEGRIDADE E SEGURANÇA
-- ============================================================

create or replace function public.validar_comunidade_denuncia()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  v_usuario_atual uuid := auth.uid();
  v_service_role boolean := coalesce(auth.role() = 'service_role', false);
  v_e_admin boolean := coalesce(public.comunidade_usuario_e_admin(), false);
  v_alvo_texto text;
  v_alvo_uuid uuid;
  v_autor_alvo uuid;
  v_total_ultima_hora integer := 0;
begin
  if tg_op = 'INSERT' then
    new.alvo_tipo := lower(btrim(coalesce(new.alvo_tipo, '')));
    new.motivo := btrim(coalesce(new.motivo, ''));
    new.detalhe := btrim(coalesce(new.detalhe, ''));

    if not v_service_role and v_usuario_atual is null then
      raise exception 'Entre na sua conta para enviar uma denúncia.'
        using errcode = '42501';
    end if;

    if not v_service_role then
      if new.denunciante_id is distinct from v_usuario_atual then
        raise exception 'O denunciante precisa ser o usuário autenticado.'
          using errcode = '42501';
      end if;
    elsif new.denunciante_id is null then
      raise exception 'A denúncia precisa informar o denunciante.'
        using errcode = '23502';
    end if;

    if new.alvo_tipo not in ('post', 'comentario', 'comentario_capitulo') then
      raise exception 'Tipo de conteúdo denunciado inválido.'
        using errcode = '22023';
    end if;

    if new.alvo_id is null then
      raise exception 'A denúncia precisa informar o conteúdo denunciado.'
        using errcode = '23502';
    end if;

    v_alvo_texto := btrim(new.alvo_id::text);

    if v_alvo_texto = ''
      or new.alvo_id::text is distinct from v_alvo_texto
    then
      raise exception 'Identificador do conteúdo denunciado inválido.'
        using errcode = '22023';
    end if;

    begin
      v_alvo_uuid := v_alvo_texto::uuid;
    exception
      when invalid_text_representation then
        raise exception 'Identificador do conteúdo denunciado inválido.'
          using errcode = '22023';
    end;

    if not public.comunidade_motivo_denuncia_valido(new.motivo) then
      raise exception 'Motivo da denúncia inválido.'
        using errcode = '22023';
    end if;

    if char_length(new.detalhe) > 1200 then
      raise exception 'A explicação da denúncia pode ter no máximo 1200 caracteres.'
        using errcode = '22001';
    end if;

    if new.alvo_tipo = 'post' then
      select post.autor_id
      into v_autor_alvo
      from public.comunidade_posts post
      where post.id = v_alvo_uuid
      limit 1;

      if not found then
        raise exception 'A publicação denunciada não existe mais.'
          using errcode = 'P0002';
      end if;
    elsif new.alvo_tipo = 'comentario' then
      select comentario.autor_id
      into v_autor_alvo
      from public.comunidade_comentarios comentario
      where comentario.id = v_alvo_uuid
      limit 1;

      if not found then
        raise exception 'O comentário denunciado não existe mais.'
          using errcode = 'P0002';
      end if;
    else
      select comentario_capitulo.user_id
      into v_autor_alvo
      from public.comentarios_capitulos comentario_capitulo
      where comentario_capitulo.id = v_alvo_uuid
      limit 1;

      if not found then
        raise exception 'O comentário de capítulo denunciado não existe mais.'
          using errcode = 'P0002';
      end if;
    end if;

    if v_autor_alvo = new.denunciante_id then
      raise exception 'Você não pode denunciar seu próprio conteúdo.'
        using errcode = '22023';
    end if;

    if not v_service_role and not v_e_admin then
      select count(*)::integer
      into v_total_ultima_hora
      from public.comunidade_denuncias denuncia
      where denuncia.denunciante_id = new.denunciante_id
        and denuncia.criado_em >= now() - interval '1 hour';

      if v_total_ultima_hora >= 20 then
        raise exception 'Limite temporário de denúncias atingido. Tente novamente mais tarde.'
          using errcode = 'P0001';
      end if;
    end if;

    -- O denunciante nunca pode definir o resultado ou os campos da moderação.
    if new.status is distinct from 'pendente'
      or coalesce(new.arquivada, false)
      or btrim(coalesce(new.observacao_admin, '')) <> ''
      or new.analisado_por is not null
      or new.analisado_em is not null
    then
      raise exception 'Campos administrativos não podem ser definidos ao criar uma denúncia.'
        using errcode = '42501';
    end if;

    new.status := 'pendente';
    new.arquivada := false;
    new.observacao_admin := '';
    new.analisado_por := null;
    new.analisado_em := null;
    new.criado_em := now();
    new.atualizado_em := now();

    return new;
  end if;

  if tg_op = 'UPDATE' then
    if not v_service_role and not v_e_admin then
      raise exception 'Somente administradores e moderadores podem atualizar denúncias.'
        using errcode = '42501';
    end if;

    if new.alvo_tipo is distinct from old.alvo_tipo
      or new.alvo_id is distinct from old.alvo_id
      or new.denunciante_id is distinct from old.denunciante_id
      or new.motivo is distinct from old.motivo
      or new.detalhe is distinct from old.detalhe
      or new.criado_em is distinct from old.criado_em
    then
      raise exception 'Os dados originais da denúncia não podem ser alterados durante a moderação.'
        using errcode = '42501';
    end if;

    new.observacao_admin := btrim(coalesce(new.observacao_admin, ''));

    if new.status not in ('pendente', 'em_analise', 'resolvida', 'rejeitada') then
      raise exception 'Status da denúncia inválido.'
        using errcode = '22023';
    end if;

    if char_length(new.observacao_admin) > 1200 then
      raise exception 'A observação administrativa pode ter no máximo 1200 caracteres.'
        using errcode = '22001';
    end if;

    if new.status = 'pendente' then
      new.analisado_por := null;
      new.analisado_em := null;
    elsif new.status is distinct from old.status
      or new.analisado_em is null
    then
      if not v_service_role and v_usuario_atual is not null then
        new.analisado_por := v_usuario_atual;
      end if;

      new.analisado_em := now();
    end if;

    new.atualizado_em := now();
    return new;
  end if;

  return new;
end;
$$;

comment on function public.validar_comunidade_denuncia() is
  'Valida alvo, autoria, motivo, limite de envio e integridade administrativa das denúncias.';

revoke all
  on function public.validar_comunidade_denuncia()
  from public, anon, authenticated;

drop trigger if exists comunidade_denuncias_validar_integridade
  on public.comunidade_denuncias;

create trigger comunidade_denuncias_validar_integridade
before insert or update
on public.comunidade_denuncias
for each row
execute function public.validar_comunidade_denuncia();

-- ============================================================
-- RLS E PRIVILÉGIOS
-- ============================================================

-- Mantém a leitura e a moderação conforme a estrutura administrativa atual.
-- A leitura das próprias denúncias será ampliada em uma etapa específica,
-- sem expor observações internas ou dados de outras pessoas.
drop policy if exists "comunidade_denuncias_insert_propria"
  on public.comunidade_denuncias;

drop policy if exists "comunidade_denuncias_insert_proprio"
  on public.comunidade_denuncias;

create policy "comunidade_denuncias_insert_proprio"
  on public.comunidade_denuncias
  for insert
  to authenticated
  with check (
    auth.uid() is not null
    and denunciante_id = auth.uid()
    and status = 'pendente'
    and arquivada = false
    and observacao_admin = ''
    and analisado_por is null
    and analisado_em is null
  );

revoke all
  on public.comunidade_denuncias
  from public, anon, authenticated;

grant insert
  on public.comunidade_denuncias
  to authenticated;

-- O painel administrativo atual precisa destes privilégios; as policies RLS
-- continuam restringindo select, update e delete a admin/moderador.
grant select, update, delete
  on public.comunidade_denuncias
  to authenticated;

commit;