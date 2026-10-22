import { normalizarTexto } from "../../../lib/utils";

export function gerarUuidFallback() {
  const bytes = new Uint8Array(16);
  const cryptoGlobal =
    typeof globalThis !== "undefined" && "crypto" in globalThis
      ? globalThis.crypto
      : null;

  if (cryptoGlobal && typeof cryptoGlobal.getRandomValues === "function") {
    cryptoGlobal.getRandomValues(bytes);
  } else {
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256);
    }
  }

  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0"));

  return `${hex[0]}${hex[1]}${hex[2]}${hex[3]}-${hex[4]}${hex[5]}-${hex[6]}${hex[7]}-${hex[8]}${hex[9]}-${hex[10]}${hex[11]}${hex[12]}${hex[13]}${hex[14]}${hex[15]}`;
}

export function criarUuidSeguro() {
  const cryptoGlobal =
    typeof globalThis !== "undefined" && "crypto" in globalThis
      ? globalThis.crypto
      : null;

  if (cryptoGlobal && typeof cryptoGlobal.randomUUID === "function") {
    return cryptoGlobal.randomUUID();
  }

  return gerarUuidFallback();
}

export function criarId() {
  return criarUuidSeguro();
}

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
