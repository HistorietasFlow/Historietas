import type { TipoAlvoDenuncia } from "./admin-comunidade-report-label-utils";

type DenunciaComAlvo = {
  alvoTipo: TipoAlvoDenuncia;
  alvoId: string;
};

export function agruparIdsAlvosDenunciados(
  denunciasMapeadas: readonly DenunciaComAlvo[]
) {
  const idsPorTipo = <T extends TipoAlvoDenuncia>(tipo: T) =>
    Array.from(
      new Set(
        denunciasMapeadas
          .filter((denuncia) => denuncia.alvoTipo === tipo)
          .map((denuncia) => denuncia.alvoId)
          .filter(Boolean)
      )
    );

  const postIds = idsPorTipo("post");
  const comentarioIds = idsPorTipo("comentario");
  const comentarioCapituloIds = idsPorTipo("comentario_capitulo");
  const obraIdsDenunciadas = idsPorTipo("obra");
  const capituloIdsDenunciados = idsPorTipo("capitulo");
  const comentarioObraIds = idsPorTipo("comentario_obra");
  const diarioAnotacaoIds = idsPorTipo("diario_anotacao");
  const comentarioDiarioIds = idsPorTipo("comentario_diario");

  return {
    postIds,
    comentarioIds,
    comentarioCapituloIds,
    obraIdsDenunciadas,
    capituloIdsDenunciados,
    comentarioObraIds,
    diarioAnotacaoIds,
    comentarioDiarioIds,
  };
}
