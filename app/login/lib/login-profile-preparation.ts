type PrepararDadosProfileLoginResultado = {
  userIdLimpo: string;
  metadata: Record<string, unknown>;
  nomeMetadata: string;
  emailLimpo: string;
  nomeFinal: string;
};

export function prepararDadosProfileLogin(
  userId: string,
  nomeInformado: string,
  emailInformado: string,
  userMetadata?: Record<string, unknown> | null,
): PrepararDadosProfileLoginResultado {
  const userIdLimpo = userId.trim();
  const metadata =
    userMetadata && typeof userMetadata === "object" ? userMetadata : {};
  const nomeMetadata =
    [metadata.nome, metadata.name, metadata.full_name]
      .find(
        (valor): valor is string =>
          typeof valor === "string" && Boolean(valor.trim()),
      )
      ?.trim() || "";
  const emailLimpo = emailInformado.trim();
  const nomeFinal =
    nomeInformado.trim() ||
    nomeMetadata ||
    emailLimpo.split("@")[0] ||
    "Usuário";

  return {
    userIdLimpo,
    metadata,
    nomeMetadata,
    emailLimpo,
    nomeFinal,
  };
}
