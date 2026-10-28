import { normalizarTexto } from "../../../lib/utils";
import type { ObraEmBreveCard } from "./em-breve-work-normalizers";

export function selecionarObrasExibidasEmBreve(
  obrasEmBreve: ObraEmBreveCard[],
  obraIdConsultada: string,
  nomeObra: string
) {
  const obraConsultada = obraIdConsultada || nomeObra
    ? obrasEmBreve.find((obra) => {
        if (obraIdConsultada && obra.id === obraIdConsultada) {
          return true;
        }

        return (
          Boolean(nomeObra) &&
          normalizarTexto(obra.titulo) === normalizarTexto(nomeObra)
        );
      }) || null
    : null;

  return obraConsultada
    ? [
        obraConsultada,
        ...obrasEmBreve.filter((obra) => obra.id !== obraConsultada.id),
      ].slice(0, 8)
    : obrasEmBreve.slice(0, 8);
}
