import { ehClassificacao18 } from "../../../lib/historietasAdultContent";
import { criarSlugBase } from "../../../lib/utils";
import type { ObraRelacionadaSugestao } from "./community-related-work-suggestion";

export type SupabaseObraPublicaRow = {
  id: string;
  user_id: string | null;
  titulo: string | null;
  autor: string | null;
  classificacao_indicativa: string | null;
  publicado: boolean | null;
  slug: string | null;
  link: string | null;
};

export function normalizarSugestaoObraSupabase(
  obra: SupabaseObraPublicaRow,
  index = 0
): ObraRelacionadaSugestao | null {
  const titulo = obra.titulo?.trim() || "";

  if (
    !titulo ||
    obra.publicado !== true ||
    ehClassificacao18(obra.classificacao_indicativa)
  ) {
    return null;
  }

  const slug = obra.slug?.trim() || criarSlugBase(titulo);

  return {
    id: obra.id || `obra-supabase-${index}`,
    titulo,
    autor: obra.autor?.trim() || "Autor não informado",
    autorId: obra.user_id?.trim() || "",
    slug,
    link: obra.link?.trim() || `/obra/${slug}`,
  };
}
