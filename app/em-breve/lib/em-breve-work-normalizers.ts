import { criarSlugBase } from "../../../lib/utils";

export type SupabaseObraEmBreveRow = {
  id: string;
  user_id: string | null;
  titulo: string | null;
  autor: string | null;
  genero: string | null;
  formato: string | null;
  classificacao_indicativa: string | null;
  capa_url: string | null;
  arquivo_url: string | null;
  publicado: boolean | null;
  slug: string | null;
  link: string | null;
  criada_em: string | null;
};

export type ObraEmBreveCard = {
  id: string;
  titulo: string;
  autor: string;
  genero: string;
  formato: string;
  views: string;
  likes: string;
  comentarios: string;
  slug: string;
  link: string;
  capa: string;
  origem: "supabase";
};

export function obraSupabaseTemArquivoEmBreve(
  obra: Pick<SupabaseObraEmBreveRow, "arquivo_url">
) {
  return Boolean(obra.arquivo_url?.trim());
}

export function normalizarObraSupabaseEmBreve(
  obra: SupabaseObraEmBreveRow
): ObraEmBreveCard {
  const titulo = obra.titulo?.trim() || "Obra sem título";
  const slug = obra.slug?.trim() || criarSlugBase(titulo);
  return {
    id: obra.id || slug || titulo,
    titulo,
    autor: obra.autor?.trim() || "Autor não informado",
    genero: obra.genero?.trim() || "Não informado",
    formato: obra.formato?.trim() || "Original",
    views: "0",
    likes: "0",
    comentarios: "0",
    slug,
    link: obra.link?.trim() || `/obra/${slug}`,
    capa: obra.capa_url?.trim() || "",
    origem: "supabase",
  };
}
