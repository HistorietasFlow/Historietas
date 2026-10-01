import { criarSlugBase, idObraSupabaseValido } from "../../../../lib/utils";

export function decodificarCaminhoArquivoObra(caminho: string) {
  try {
    return decodeURIComponent(caminho);
  } catch {
    return caminho;
  }
}

export function normalizarCaminhoStorageArquivoObra(caminho: string) {
  const caminhoSemBusca = caminho.split("?")[0]?.split("#")[0] || "";
  const caminhoDecodificado = decodificarCaminhoArquivoObra(caminhoSemBusca)
    .replace(/^\/+/, "")
    .trim();
  const prefixos = [
    "storage/v1/object/sign/arquivos-obras/",
    "storage/v1/object/public/arquivos-obras/",
    "storage/v1/object/authenticated/arquivos-obras/",
    "storage/v1/object/arquivos-obras/",
    "arquivos-obras/",
  ];

  let caminhoObjeto = caminhoDecodificado;

  for (const prefixo of prefixos) {
    const indicePrefixo = caminhoDecodificado.indexOf(prefixo);

    if (indicePrefixo >= 0) {
      caminhoObjeto = caminhoDecodificado.slice(
        indicePrefixo + prefixo.length
      );
      break;
    }
  }

  const caminhoLimpo = caminhoObjeto.replace(/^\/+/, "").trim();
  const pastaProprietario = caminhoLimpo.split("/")[0] || "";

  return idObraSupabaseValido(pastaProprietario) ? caminhoLimpo : "";
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
