import { contarComentaristasUnicosPostComunidade } from "./community-unique-post-commenters-count";
import { contarCurtidasUnicasPostComunidade } from "./community-unique-post-likes-count";

type PostPontuavelComunidade = {
  curtidas: string[];
  comentarios: Array<{ autorId: string }>;
};

export function obterPontuacaoPost(post: PostPontuavelComunidade) {
  return (
    contarCurtidasUnicasPostComunidade(post) * 2 +
    contarComentaristasUnicosPostComunidade(post) * 3
  );
}
