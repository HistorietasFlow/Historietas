export function criarLoginHrefLeitor(
  obraId?: string,
  capituloId?: string,
) {
  const obraIdLimpo = obraId?.trim() || "";
  const capituloIdLimpo = capituloId?.trim() || "";
  const paramsLeitor = new URLSearchParams();

  if (obraIdLimpo) {
    paramsLeitor.set("obraId", obraIdLimpo);
  }

  if (capituloIdLimpo) {
    paramsLeitor.set("capituloId", capituloIdLimpo);
  }

  const queryLeitor = paramsLeitor.toString();
  const redirectTo = queryLeitor ? `/ler-capitulo?${queryLeitor}` : "/ler-capitulo";
  const paramsLogin = new URLSearchParams({
    redirectTo,
  });

  return `/login?${paramsLogin.toString()}`;
}
