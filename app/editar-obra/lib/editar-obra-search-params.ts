export function obterObraIdEdicaoObra(searchParams: string) {
  const params = new URLSearchParams(searchParams);

  return params.get("obraId") || "";
}
