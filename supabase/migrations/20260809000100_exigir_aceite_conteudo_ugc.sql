-- Exige aceite vigente antes de criar ou editar conteudo social/publicado.
-- Mantem operacoes privadas e atualizacoes tecnicas fora do bloqueio sempre que possivel.

drop trigger if exists "exigir_aceite_termos_comentarios_capitulos" on public.comentarios_capitulos;
create trigger "exigir_aceite_termos_comentarios_capitulos"
before insert or update on public.comentarios_capitulos
for each row
execute function public.exigir_aceite_termos_antes_de_publicar();

drop trigger if exists "exigir_aceite_termos_comentarios_obras" on public.comentarios_obras;
create trigger "exigir_aceite_termos_comentarios_obras"
before insert or update on public.comentarios_obras
for each row
execute function public.exigir_aceite_termos_antes_de_publicar();

drop trigger if exists "exigir_aceite_termos_obra_comentarios" on public.obra_comentarios;
create trigger "exigir_aceite_termos_obra_comentarios"
before insert or update on public.obra_comentarios
for each row
execute function public.exigir_aceite_termos_antes_de_publicar();

drop trigger if exists "exigir_aceite_termos_comunidade_comentarios" on public.comunidade_comentarios;
create trigger "exigir_aceite_termos_comunidade_comentarios"
before insert or update on public.comunidade_comentarios
for each row
execute function public.exigir_aceite_termos_antes_de_publicar();

drop trigger if exists "exigir_aceite_termos_autor_avaliacoes" on public.autor_avaliacoes;
create trigger "exigir_aceite_termos_autor_avaliacoes"
before insert or update on public.autor_avaliacoes
for each row
execute function public.exigir_aceite_termos_antes_de_publicar();

drop trigger if exists "exigir_aceite_termos_obra_avaliacoes" on public.obra_avaliacoes;
create trigger "exigir_aceite_termos_obra_avaliacoes"
before insert or update on public.obra_avaliacoes
for each row
execute function public.exigir_aceite_termos_antes_de_publicar();

drop trigger if exists "exigir_aceite_termos_diario_avaliacoes" on public.diario_avaliacoes;
create trigger "exigir_aceite_termos_diario_avaliacoes"
before insert or update on public.diario_avaliacoes
for each row
execute function public.exigir_aceite_termos_antes_de_publicar();

drop trigger if exists "exigir_aceite_termos_diario_comentarios" on public.diario_anotacao_comentarios;
create trigger "exigir_aceite_termos_diario_comentarios"
before insert or update on public.diario_anotacao_comentarios
for each row
execute function public.exigir_aceite_termos_antes_de_publicar();

drop trigger if exists "exigir_aceite_termos_diario_anotacoes_insert" on public.diario_anotacoes;
create trigger "exigir_aceite_termos_diario_anotacoes_insert"
before insert on public.diario_anotacoes
for each row
when (new.visibilidade in ('publico', 'parcial'))
execute function public.exigir_aceite_termos_antes_de_publicar();

drop trigger if exists "exigir_aceite_termos_diario_anotacoes_update" on public.diario_anotacoes;
create trigger "exigir_aceite_termos_diario_anotacoes_update"
before update of texto, visibilidade on public.diario_anotacoes
for each row
when (new.visibilidade in ('publico', 'parcial'))
execute function public.exigir_aceite_termos_antes_de_publicar();

drop trigger if exists "exigir_aceite_termos_comunidade_post_republicar" on public.comunidade_posts;
create trigger "exigir_aceite_termos_comunidade_post_republicar"
before update of visibilidade on public.comunidade_posts
for each row
when (
  old.visibilidade = 'somente_eu'
  and new.visibilidade is distinct from 'somente_eu'
)
execute function public.exigir_aceite_termos_antes_de_publicar();

create or replace function public.exigir_aceite_termos_capitulo_publicado()
returns trigger
language plpgsql
security definer
set search_path = 'pg_catalog', 'public', 'auth', 'pg_temp'
as $$
declare
  v_obra_publicada boolean := false;
begin
  if auth.uid() is null then
    return new;
  end if;

  select coalesce(obra.publicado, false)
    into v_obra_publicada
  from public.obras obra
  where obra.id = new.obra_id
  limit 1;

  if coalesce(new.publicado, false)
    and v_obra_publicada
    and not public.usuario_aceitou_termos_publicacao(auth.uid())
  then
    raise exception 'ACEITE_TERMOS_PUBLICACAO_OBRIGATORIO'
      using
        errcode = 'P0001',
        hint = 'Aceite os Termos de Uso e as Diretrizes da Comunidade antes de publicar.';
  end if;

  return new;
end;
$$;

revoke all on function public.exigir_aceite_termos_capitulo_publicado() from public;

drop trigger if exists "exigir_aceite_termos_capitulo_edicao_publicada" on public.capitulos;
create trigger "exigir_aceite_termos_capitulo_edicao_publicada"
before update of titulo, texto on public.capitulos
for each row
when (new.publicado is true)
execute function public.exigir_aceite_termos_capitulo_publicado();

drop trigger if exists "exigir_aceite_termos_capitulo_ao_publicar" on public.capitulos;
create trigger "exigir_aceite_termos_capitulo_ao_publicar"
before update of publicado on public.capitulos
for each row
when (
  old.publicado is distinct from true
  and new.publicado is true
)
execute function public.exigir_aceite_termos_capitulo_publicado();

drop trigger if exists "exigir_aceite_termos_obra_edicao_publicada" on public.obras;
create trigger "exigir_aceite_termos_obra_edicao_publicada"
before update of
  titulo,
  genero,
  formato,
  classificacao_indicativa,
  avisos_conteudo,
  sinopse,
  tags,
  capa_url,
  capa_nome,
  arquivo_url,
  arquivo_nome,
  arquivo_tipo,
  arquivo_tamanho,
  arquivo_categoria,
  link
on public.obras
for each row
when (new.publicado is true)
execute function public.exigir_aceite_termos_antes_de_publicar();