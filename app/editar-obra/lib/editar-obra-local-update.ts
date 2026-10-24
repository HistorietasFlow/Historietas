import { normalizarObra } from "./editar-obra-work-normalizer";

type ObraNormalizadaEdicaoObra = ReturnType<typeof normalizarObra>;
type ObraEditavelEdicaoObra = Parameters<typeof normalizarObra>[0];

type AtualizarObraNaListaLocalEdicaoParams = {
  obras: ObraEditavelEdicaoObra[];
  obraId: string;
  titulo: string;
  autor: string;
  genero: string;
  formato: string;
  classificacaoIndicativa: string;
  avisosConteudo: ObraNormalizadaEdicaoObra["avisosConteudo"];
  sinopse: string;
  tags: string[];
  capa: string;
  capaNome: string;
  arquivoObra: ObraNormalizadaEdicaoObra["arquivoObra"];
};

export function atualizarObraNaListaLocalEdicao({
  obras,
  obraId,
  titulo,
  autor,
  genero,
  formato,
  classificacaoIndicativa,
  avisosConteudo,
  sinopse,
  tags,
  capa,
  capaNome,
  arquivoObra,
}: AtualizarObraNaListaLocalEdicaoParams) {
  return obras.map((obra, index) => {
    const obraNormalizada = normalizarObra(obra, index);

    if (obraNormalizada.id !== obraId) {
      return obraNormalizada;
    }

    return normalizarObra(
      {
        ...obraNormalizada,
        titulo,
        autor,
        genero,
        formato,
        classificacaoIndicativa,
        avisosConteudo,
        sinopse,
        tags,
        capa,
        capaNome,
        arquivoObra,
      },
      index,
    );
  });
}
