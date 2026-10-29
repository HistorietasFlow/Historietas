import {
  obraTemConteudoPublicadoExplorar,
  type ObraLocal,
} from "./explorar-work-normalizers";

export function obterAutorIdsExplorar(obrasLocais: ObraLocal[]) {
  return Array.from(
    new Set(
      obrasLocais
        .filter(
          (obra) =>
            obra.publicado && obraTemConteudoPublicadoExplorar(obra)
        )
        .map((obra) => obra.autorId?.trim() || "")
        .filter(Boolean)
    )
  );
}
