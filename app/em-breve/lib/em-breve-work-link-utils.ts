import { criarSlugBase } from "../../../lib/utils";
import type {
  ObraEmBreveCard,
  SupabaseObraEmBreveRow,
} from "./em-breve-work-normalizers";

export function criarLinkCardEmBreve(obra: ObraEmBreveCard) {
  const params = new URLSearchParams({
    obraId: obra.id,
    obra: obra.titulo,
  });

  return `/em-breve?${params.toString()}`;
}

export function criarLinkObraPublicadaEmBreve(
  obra: Pick<SupabaseObraEmBreveRow, "titulo" | "slug" | "link">
) {
  const titulo = obra.titulo?.trim() || "obra";
  const slug = obra.slug?.trim() || criarSlugBase(titulo);
  const link = obra.link?.trim() || "";

  return link && !link.startsWith("/em-breve")
    ? link
    : `/obra/${slug}`;
}
