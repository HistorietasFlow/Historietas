export function obterParametroBuscaComunidade(
  parametrosUrl: URLSearchParams
): string {
  return (parametrosUrl.get("busca") || "").trim();
}

export function obterParametroObraComunidade(
  parametrosUrl: URLSearchParams
): string {
  return (parametrosUrl.get("obra") || "").trim().slice(0, 90);
}

export function obterParametroPostComunidade(
  parametrosUrl: URLSearchParams
): string | null {
  return parametrosUrl.get("post");
}
