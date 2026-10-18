import type { AbaConteudoSeguindo } from "./seguindo-page-types";

export function obterRotulosListaSocial(
  abaConteudo: AbaConteudoSeguindo,
  perfilSocialNome: string,
) {
  const tituloListaSocial =
    abaConteudo === "seguidores"
      ? "SEGUIDORES"
      : abaConteudo === "pessoas"
        ? "PESSOAS SEGUIDAS"
        : "OBRAS SEGUIDAS";
  const descricaoListaSocial = perfilSocialNome.trim()
    ? `${tituloListaSocial.toLowerCase()} de ${perfilSocialNome.trim()}`
    : tituloListaSocial.toLowerCase();
  return { tituloListaSocial, descricaoListaSocial };
}
