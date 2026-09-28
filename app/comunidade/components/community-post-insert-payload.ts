import type { CategoriaComunidade } from "./community-category";
import type { VisibilidadePostComunidade } from "./community-post-visibility";
import type { TipoPublicacaoComunidade } from "./community-publication-type";
import { juntarObraECapituloRelacionados } from "./community-related-chapter-utils";

type PrepararDadosInsercaoPostComunidadeParams = {
  usuarioAutenticadoId: string;
  autorNomeSeguro: string;
  categoriaPost: CategoriaComunidade;
  tipoPublicacaoPost: TipoPublicacaoComunidade;
  publicacaoEhEnquete: boolean;
  temSpoilerPost: boolean;
  textoLimpo: string;
  obraRelacionadaTitulo: string;
  capituloLimpo: string;
  visibilidadeSegura: VisibilidadePostComunidade;
};

export function prepararDadosInsercaoPostComunidade({
  usuarioAutenticadoId,
  autorNomeSeguro,
  categoriaPost,
  tipoPublicacaoPost,
  publicacaoEhEnquete,
  temSpoilerPost,
  textoLimpo,
  obraRelacionadaTitulo,
  capituloLimpo,
  visibilidadeSegura,
}: PrepararDadosInsercaoPostComunidadeParams) {
  const textoPostBanco = textoLimpo.slice(0, 700);
  const obraPostBanco = juntarObraECapituloRelacionados(
    obraRelacionadaTitulo,
    capituloLimpo,
  );
  const dadosPostBanco = {
    autor_id: usuarioAutenticadoId,
    autor_nome: autorNomeSeguro,
    categoria: categoriaPost,
    tipo_publicacao: publicacaoEhEnquete ? "Discussão" : tipoPublicacaoPost,
    tem_spoiler: temSpoilerPost,
    texto: textoPostBanco,
    obra_relacionada: obraPostBanco,
    visibilidade: visibilidadeSegura,
  };

  return {
    textoPostBanco,
    obraPostBanco,
    dadosPostBanco,
  };
}
