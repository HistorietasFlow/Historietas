export function obterNomeUsuario(email: string, nomeProfile = "") {
  const nomeLimpo = nomeProfile.trim();

  if (nomeLimpo) {
    return nomeLimpo;
  }

  const nomeEmail = email.trim().split("@")[0];

  return nomeEmail || "Usuário";
}
