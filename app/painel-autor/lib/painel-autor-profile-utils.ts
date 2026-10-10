import { obraPertenceAoUsuarioPainel } from "./painel-autor-ownership-utils";

type ProfilePainelAutor = {
  nome?: unknown;
};

export function obterNomeProfilePainelAutor(
  profile: ProfilePainelAutor | null | undefined
) {
  return typeof profile?.nome === "string" && profile.nome.trim()
    ? profile.nome.trim()
    : "";
}

export function aplicarNomeProfileNasObrasPainel<
  T extends { autor: string; autorId?: string }
>(
  obrasParaAtualizar: T[],
  userId: string,
  nomeProfile: string
) {
  const nomeLimpo = nomeProfile.trim();

  if (!nomeLimpo) {
    return obrasParaAtualizar;
  }

  return obrasParaAtualizar.map((obra) => {
    if (!obraPertenceAoUsuarioPainel(obra, userId)) {
      return obra;
    }

    return {
      ...obra,
      autor: nomeLimpo,
      autorId: obra.autorId || userId,
    };
  });
}
