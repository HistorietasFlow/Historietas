import {
  obraTemConteudoPublicadoExplorar,
  type ObraLocal,
} from "./explorar-work-normalizers";

export function possuiObrasPublicadasExplorar(obrasLocais: ObraLocal[]) {
  return obrasLocais.some((obra) => {
    return obra.publicado && obraTemConteudoPublicadoExplorar(obra);
  });
}
