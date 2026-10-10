import { criarSlugBase, normalizarTexto } from "../../../lib/utils";

type ObraParaBackupArquivoPainel = {
  id: string;
  slug: string;
  titulo: string;
  link?: string;
};

export function obterChavesBackupArquivoPainel(
  obra: ObraParaBackupArquivoPainel
) {
  return Array.from(
    new Set(
      [
        obra.id ? `id:${obra.id}` : "",
        obra.id || "",
        obra.slug ? `slug:${obra.slug}` : "",
        `slug:${obra.slug || criarSlugBase(obra.titulo)}`,
        `titulo:${normalizarTexto(obra.titulo)}`,
        obra.link ? `link:${obra.link}` : "",
      ]
        .map((chave) => chave.trim())
        .filter(Boolean)
    )
  );
}
