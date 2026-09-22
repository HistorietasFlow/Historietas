import { normalizarTexto } from "../../../lib/utils";

type ObraRelacionadaSugestao = {
  id: string;
  titulo: string;
  autor: string;
  autorId: string;
  slug: string;
  link: string;
};

export function removerSugestoesObrasDuplicadas(obrasBase: ObraRelacionadaSugestao[]) {
  const titulosRegistrados = new Set<string>();

  return obrasBase.filter((obra) => {
    const chaveTitulo = normalizarTexto(obra.titulo);

    if (!chaveTitulo || titulosRegistrados.has(chaveTitulo)) {
      return false;
    }

    titulosRegistrados.add(chaveTitulo);
    return true;
  });
}

