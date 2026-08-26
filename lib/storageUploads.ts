export type BucketStorageUsuario =
  | "avatars"
  | "capas-obras"
  | "arquivos-obras";

export const LIMITES_BYTES_STORAGE: Readonly<
  Record<BucketStorageUsuario, number>
> = {
  avatars: 1 * 1024 * 1024,
  "capas-obras": 2 * 1024 * 1024,
  "arquivos-obras": 5 * 1024 * 1024,
};

const TIPOS_MIME_IMAGEM = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);

const TIPOS_MIME_ARQUIVO_OBRA = new Set([
  "application/pdf",
  "text/plain",
  "text/markdown",
  "text/x-markdown",
  ...TIPOS_MIME_IMAGEM,
]);

const TIPO_MIME_POR_EXTENSAO: Readonly<Record<string, string>> = {
  ".pdf": "application/pdf",
  ".txt": "text/plain",
  ".md": "text/markdown",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

const EXTENSAO_CANONICA_POR_TIPO_MIME: Readonly<Record<string, string>> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};

function obterExtensao(nome: string) {
  const nomeNormalizado = nome.trim().toLowerCase();
  const indicePonto = nomeNormalizado.lastIndexOf(".");

  return indicePonto >= 0 ? nomeNormalizado.slice(indicePonto) : "";
}

export function obterTipoMimeUploadStorage(
  bucket: BucketStorageUsuario,
  arquivo: Pick<File, "name" | "type">,
) {
  const tiposPermitidos =
    bucket === "arquivos-obras"
      ? TIPOS_MIME_ARQUIVO_OBRA
      : TIPOS_MIME_IMAGEM;
  const tipoInformado = arquivo.type.trim().toLowerCase();

  if (tiposPermitidos.has(tipoInformado)) {
    return tipoInformado;
  }

  const tipoInferido = TIPO_MIME_POR_EXTENSAO[obterExtensao(arquivo.name)] || "";

  return tiposPermitidos.has(tipoInferido) ? tipoInferido : null;
}

export function criarCaminhoAvatarStorage(
  userId: string,
  arquivo: Pick<File, "name" | "type">,
) {
  const tipoMime = obterTipoMimeUploadStorage("avatars", arquivo);
  const extensao = tipoMime
    ? EXTENSAO_CANONICA_POR_TIPO_MIME[tipoMime]
    : null;

  return extensao ? `${userId}/avatar.${extensao}` : null;
}

export function obterCaminhoObjetoStorage(
  bucket: BucketStorageUsuario,
  referencia: string,
) {
  const referenciaLimpa = referencia.trim();

  if (
    !referenciaLimpa ||
    referenciaLimpa.startsWith("data:") ||
    referenciaLimpa.startsWith("blob:")
  ) {
    return "";
  }

  if (!/^https?:\/\//i.test(referenciaLimpa)) {
    return referenciaLimpa
      .replace(new RegExp(`^${bucket}/`), "")
      .replace(/^\/+/, "");
  }

  try {
    const url = new URL(referenciaLimpa);
    const prefixos = [
      `/storage/v1/object/public/${bucket}/`,
      `/storage/v1/object/sign/${bucket}/`,
      `/storage/v1/object/authenticated/${bucket}/`,
    ];
    const prefixo = prefixos.find((item) => url.pathname.includes(item));

    if (!prefixo) {
      return "";
    }

    const indice = url.pathname.indexOf(prefixo);

    return decodeURIComponent(url.pathname.slice(indice + prefixo.length))
      .replace(/^\/+/, "");
  } catch {
    return "";
  }
}

export function versionarUrlPublicaStorage(url: string, versao: number) {
  const urlLimpa = url.trim();

  if (!urlLimpa) {
    return "";
  }

  try {
    const urlPublica = new URL(urlLimpa);
    urlPublica.searchParams.set("v", String(versao));
    return urlPublica.toString();
  } catch {
    return urlLimpa;
  }
}

export function mensagemAmigavelErroUploadStorage(mensagem: string) {
  const mensagemLimpa = mensagem.trim();

  if (
    /row-level security|security policy|policy|quota|exceed|maximum|too large/i.test(
      mensagemLimpa,
    )
  ) {
    return "O upload foi recusado pelas regras de segurança ou pela cota de armazenamento. Remova arquivos antigos e tente novamente.";
  }

  return mensagemLimpa || "O Storage recusou o upload.";
}
