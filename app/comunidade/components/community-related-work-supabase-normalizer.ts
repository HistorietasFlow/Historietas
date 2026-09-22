import { ehClassificacao18 } from "../../../lib/historietasAdultContent";
import { criarSlugBase } from "../../../lib/utils";

type SupabaseObraPublicaRow = {
  id: string;
  user_id: string | null;
  titulo: string | null;
  autor: string | null;
  classificacao_indicativa: string | null;
  publicado: boolean | null;
  slug: string | null;
  link: string | null;
};

type ObraRelacionadaSugestao = {
  id: string;
  titulo: string;
  autor: string;
  autorId: string;
  slug: string;
  link: string;
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
