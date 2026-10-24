const EXTENSOES_IMAGEM_ACEITAS = [".png", ".jpg", ".jpeg", ".webp", ".gif"] as const;
const TIPOS_MIME_IMAGEM_ACEITOS = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);
const TIPOS_MIME_TEXTO_ACEITOS = new Set([
  "text/plain",
  "text/markdown",
  "text/x-markdown",
]);
const TIPOS_MIME_PDF_ACEITOS = new Set(["application/pdf"]);

export function arquivoTemExtensao(nomeArquivo: string, extensoes: readonly string[]) {
  const nome = nomeArquivo.toLowerCase();

  return extensoes.some((extensao) => nome.endsWith(extensao));
}

export function tipoMimeCompativel(arquivo: File, tiposAceitos: ReadonlySet<string>) {
  const tipo = arquivo.type.trim().toLowerCase();

  return !tipo || tipo === "application/octet-stream" || tiposAceitos.has(tipo);
}

export function arquivoImagemAceito(arquivo: File) {
  return (
    arquivoTemExtensao(arquivo.name, EXTENSOES_IMAGEM_ACEITAS) &&
    tipoMimeCompativel(arquivo, TIPOS_MIME_IMAGEM_ACEITOS)
  );
}

export function arquivoTextoAceito(arquivo: File) {
  return (
    arquivoTemExtensao(arquivo.name, [".txt", ".md"]) &&
    tipoMimeCompativel(arquivo, TIPOS_MIME_TEXTO_ACEITOS)
  );
}

export function arquivoPdfAceito(arquivo: File) {
  return (
    arquivoTemExtensao(arquivo.name, [".pdf"]) &&
    tipoMimeCompativel(arquivo, TIPOS_MIME_PDF_ACEITOS)
  );
}

export function identificarCategoriaArquivo(
  arquivo: File,
): "texto" | "documento" | "imagem" | "outro" {
  if (arquivoImagemAceito(arquivo)) {
    return "imagem";
  }

  if (arquivoTextoAceito(arquivo)) {
    return "texto";
  }

  if (arquivoPdfAceito(arquivo)) {
    return "documento";
  }

  return "outro";
}

export function arquivoObraAceito(arquivo: File) {
  return arquivoPdfAceito(arquivo) || arquivoTextoAceito(arquivo) || arquivoImagemAceito(arquivo);
}
