type DenunciaPerfilParaHref = { denunciadoId: string; perfilUrl: string; };
type DenunciaDiarioParaHref = { alvoPerfilUserId?: string | null; alvoObraId?: string | null; };

export function criarLoginHrefAdminModeracao() {
  const redirectTo = typeof window !== "undefined" ? `${window.location.pathname}${window.location.search}` : "/admin";
  const destinoSeguro = redirectTo && redirectTo.startsWith("/") && !redirectTo.startsWith("//") ? redirectTo : "/admin";
  const params = new URLSearchParams({ redirectTo: destinoSeguro });
  return `/login?${params.toString()}`;
}

export function criarHrefPerfilDenunciado(denuncia: DenunciaPerfilParaHref) {
  const url = denuncia.perfilUrl.trim();
  if (url && url.startsWith("/") && !url.startsWith("//")) return url;
  return `/perfil-autor?userId=${encodeURIComponent(denuncia.denunciadoId)}`;
}

export function criarHrefDiarioDenunciado(denuncia: DenunciaDiarioParaHref) {
  const params = new URLSearchParams({ modo: "perfil", origem: "diario" });
  const perfilUserId = denuncia.alvoPerfilUserId?.trim() || "";
  const obraId = denuncia.alvoObraId?.trim() || "";
  if (perfilUserId) params.set("userId", perfilUserId);
  if (obraId) params.set("obraId", obraId);
  return `/listas?${params.toString()}`;
}
