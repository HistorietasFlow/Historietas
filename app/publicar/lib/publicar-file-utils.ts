import {
  EXTENSOES_IMAGEM_ACEITAS,
  TIPOS_MIME_IMAGEM_ACEITOS,
  TIPOS_MIME_PDF_ACEITOS,
  TIPOS_MIME_TEXTO_ACEITOS,
} from "./publicar-static-options";
import type { ArquivoObraLocal } from "./publicar-models";

export function identificarCategoriaArquivo(
  arquivo: File,
): ArquivoObraLocal["categoria"] {
  const nome = arquivo.name.toLowerCase();

  if (arquivo.type.startsWith("image/")) {
    return "imagem";
  }

  if (
    nome.endsWith(".txt") ||
    nome.endsWith(".md") ||
    arquivo.type.startsWith("text/")
  ) {
    return "texto";
  }

  if (nome.endsWith(".pdf") || arquivo.type === "application/pdf") {
    return "documento";
  }

  return "outro";
}

export function arquivoTemExtensao(
  nomeArquivo: string,
  extensoes: readonly string[],
) {
  const nome = nomeArquivo.toLowerCase();

  return extensoes.some((extensao) => nome.endsWith(extensao));
}

export function arquivoImagemAceito(arquivo: File) {
  return (
    arquivoTemExtensao(arquivo.name, EXTENSOES_IMAGEM_ACEITAS) &&
    tipoMimeCompativel(arquivo, TIPOS_MIME_IMAGEM_ACEITOS)
  );
}

export function tipoMimeCompativel(
  arquivo: File,
  tiposAceitos: ReadonlySet<string>,
) {
  const tipo = arquivo.type.trim().toLowerCase();

  return !tipo || tipo === "application/octet-stream" || tiposAceitos.has(tipo);
}

export function arquivoPdfAceito(arquivo: File) {
  return (
    arquivoTemExtensao(arquivo.name, [".pdf"]) &&
    tipoMimeCompativel(arquivo, TIPOS_MIME_PDF_ACEITOS)
  );
}

export function arquivoObraAceito(arquivo: File) {
  return (
    arquivoPdfAceito(arquivo) ||
    arquivoTextoAceito(arquivo) ||
    arquivoImagemAceito(arquivo)
  );
}

export function arquivoTextoAceito(arquivo: File) {
  return (
    arquivoTemExtensao(arquivo.name, [".txt", ".md"]) &&
    tipoMimeCompativel(arquivo, TIPOS_MIME_TEXTO_ACEITOS)
  );
}
