type ObraComAutorProfile = {
  autor: string;
  autorId?: string;
};

export function obterNomeProfileEditarCapitulo(profile: unknown) {
  if (!profile || typeof profile !== "object" || Array.isArray(profile)) {
    return "";
  }

  const registro = profile as Record<string, unknown>;
  const nome = registro.nome;

  return typeof nome === "string" ? nome.trim() : "";
}

export function aplicarNomeAutorProfileEditarCapitulo<
  T extends ObraComAutorProfile,
>(obras: T[], userId: string, nomeProfile: string): T[] {
  const usuarioIdLimpo = userId.trim();
  const nomeProfileLimpo = nomeProfile.trim();

  if (!usuarioIdLimpo || !nomeProfileLimpo) {
    return obras;
  }

  return obras.map((obra) => {
    const autorId = obra.autorId?.trim() || "";

    if (autorId && autorId !== usuarioIdLimpo) {
      return obra;
    }

    return {
      ...obra,
      autor: nomeProfileLimpo,
      autorId: autorId || usuarioIdLimpo,
    };
  });
}
