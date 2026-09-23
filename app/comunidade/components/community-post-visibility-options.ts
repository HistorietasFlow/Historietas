import type { VisibilidadePostComunidade } from "./community-post-visibility";

export const VISIBILIDADES_POST_COMUNIDADE: Array<{
  valor: VisibilidadePostComunidade;
  rotulo: string;
}> = [
  { valor: "publico", rotulo: "Público" },
  { valor: "seguidores", rotulo: "Seguidores" },
  { valor: "seguindo", rotulo: "Pessoas que sigo" },
  { valor: "somente_eu", rotulo: "Somente eu" },
];
