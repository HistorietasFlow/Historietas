import { ehClassificacao18 } from "../../../lib/historietasAdultContent";
import { criarSlugBase } from "../../../lib/utils";

type ObraRelacionadaSugestao = {
  id: string;
  titulo: string;
  autor: string;
  autorId: string;
  slug: string;
  link: string;
};

export function normalizarSugestaoObraLocal(valor: unknown, index: number) {
  if (!valor || typeof valor !== "object" || Array.isArray(valor)) {
    return null;
  }

  const obra = valor as Record<string, unknown>;
  const titulo =
    typeof obra.titulo === "string" && obra.titulo.trim()
      ? obra.titulo.trim()
      : "";
  const classificacaoIndicativa =
    typeof obra.classificacaoIndicativa === "string"
      ? obra.classificacaoIndicativa
      : typeof obra.classificacao_indicativa === "string"
        ? obra.classificacao_indicativa
        : "";

  if (
    !titulo ||
    obra.publicado !== true ||
    ehClassificacao18(classificacaoIndicativa)
  ) {
    return null;
  }

  const autor =
    typeof obra.autor === "string" && obra.autor.trim()
      ? obra.autor.trim()
      : "Autor não informado";

  const id =
    typeof obra.id === "string" && obra.id.trim()
      ? obra.id.trim()
      : `obra-local-${index}`;

  const autorId =
    typeof obra.autorId === "string" && obra.autorId.trim()
      ? obra.autorId.trim()
      : typeof obra.user_id === "string" && obra.user_id.trim()
        ? obra.user_id.trim()
        : "";

  const slug =
    typeof obra.slug === "string" && obra.slug.trim()
      ? obra.slug.trim()
      : criarSlugBase(titulo);

  const link =
    typeof obra.link === "string" && obra.link.trim()
      ? obra.link.trim()
      : `/obra/${slug}`;

  return {
    id,
    titulo,
    autor,
    autorId,
    slug,
    link,
  } satisfies ObraRelacionadaSugestao;
}

