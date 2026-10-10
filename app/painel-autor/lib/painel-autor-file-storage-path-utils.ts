export function obterCaminhoStoragePainel(
  bucket: "capas-obras" | "arquivos-obras",
  referencia: string
) {
  const referenciaLimpa = referencia.trim();

  if (!referenciaLimpa || referenciaLimpa.startsWith("data:")) {
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
    const prefixo = prefixos.find((valor) => url.pathname.includes(valor));

    if (!prefixo) {
      return "";
    }

    const indice = url.pathname.indexOf(prefixo);
    const caminhoCodificado = url.pathname.slice(indice + prefixo.length);

    return decodeURIComponent(caminhoCodificado).replace(/^\/+/, "");
  } catch {
    return "";
  }
}

export function caminhoStoragePertenceAoUsuarioPainel(
  caminho: string,
  userId: string
) {
  const primeiraPasta = caminho.trim().split("/")[0] || "";

  return Boolean(
    primeiraPasta &&
      userId.trim() &&
      primeiraPasta.toLowerCase() === userId.trim().toLowerCase()
  );
}
