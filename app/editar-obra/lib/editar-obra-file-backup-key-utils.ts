import { criarSlugBase, normalizarTexto } from "../../../lib/utils";

type ObraComChavesBackupArquivoEdicaoObra = {
  id: string;
  slug: string;
  titulo: string;
  link: string;
};

export function obterChavesBackupArquivoEdicaoObra(
  obra: ObraComChavesBackupArquivoEdicaoObra,
) {
  return Array.from(
    new Set(
      [
        `id:${obra.id}`,
        `slug:${obra.slug || criarSlugBase(obra.titulo)}`,
        `titulo:${normalizarTexto(obra.titulo)}`,
        obra.link ? `link:${obra.link}` : "",
      ].filter((chave) => Boolean(chave.trim())),
    ),
  );
}
