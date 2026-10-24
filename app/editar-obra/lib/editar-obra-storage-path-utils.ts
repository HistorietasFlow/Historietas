import { normalizarTexto } from "../../../lib/utils";

export function limparNomeArquivoStorage(nomeArquivo: string) {
  const partes = nomeArquivo.split(".");
  const extensao =
    partes.length > 1 ? `.${partes[partes.length - 1].toLowerCase()}` : "";
  const nomeBase = partes
    .slice(0, partes.length > 1 ? -1 : partes.length)
    .join(".")
    .trim();

  const nomeSeguro =
    normalizarTexto(nomeBase)
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "arquivo";

  return `${nomeSeguro}${extensao}`;
}

export function obterCaminhoStorageEdicaoObra(
  bucket: "capas-obras" | "arquivos-obras",
  referencia: string
) {
  const referenciaLimpa = referencia.trim();

  if (!referenciaLimpa || referenciaLimpa.startsWith("data:")) {
    return "";
  }

  if (!/^https?:\/\//i.test(referenciaLimpa)) {
    const caminhoDireto = referenciaLimpa
      .replace(new RegExp(`^${bucket}/`), "")
      .replace(/^\/+/, "");

    return caminhoDireto;
  }

  try {
    const url = new URL(referenciaLimpa);
    const prefixos = [
      `/storage/v1/object/public/${bucket}/`,
      `/storage/v1/object/sign/${bucket}/`,
      `/storage/v1/object/authenticated/${bucket}/`,
    ];

    const prefixoEncontrado = prefixos.find((prefixo) =>
      url.pathname.includes(prefixo)
    );

    if (!prefixoEncontrado) {
      return "";
    }

    const indice = url.pathname.indexOf(prefixoEncontrado);
    const caminhoCodificado = url.pathname.slice(
      indice + prefixoEncontrado.length
    );

    return decodeURIComponent(caminhoCodificado).replace(/^\/+/, "");
  } catch {
    return "";
  }
}
