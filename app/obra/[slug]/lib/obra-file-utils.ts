import { criarSlugBase } from "../../../../lib/utils";

export function decodificarCaminhoArquivoObra(caminho: string) {
  try {
    return decodeURIComponent(caminho);
  } catch {
    return caminho;
  }
}

export function normalizarCategoriaArquivoSupabase(categoria: string | null) {
  if (
    categoria === "texto" ||
    categoria === "documento" ||
    categoria === "imagem" ||
    categoria === "outro"
  ) {
    return categoria;
  }

  return "outro";
}

export function obterChavesBackupObra(obra: {
  id: string;
  slug: string;
  titulo: string;
}) {
  return Array.from(
    new Set(
      [obra.id, obra.slug, criarSlugBase(obra.titulo)].filter((chave) =>
        Boolean(chave.trim())
      )
    )
  );
}
