import { normalizarTexto } from "../../../lib/utils";

type ObraRelacionadaSugestao = {
  id: string;
  titulo: string;
  autor: string;
  autorId: string;
  slug: string;
  link: string;
};

export function obterObraRelacionadaPermitida(
  titulo: string,
  sugestoesObras: ObraRelacionadaSugestao[]
) {
  const tituloNormalizado = normalizarTexto(titulo);

  if (!tituloNormalizado) {
    return null;
  }

  return (
    sugestoesObras.find((obra) => {
      return normalizarTexto(obra.titulo) === tituloNormalizado;
    }) || null
  );
}
