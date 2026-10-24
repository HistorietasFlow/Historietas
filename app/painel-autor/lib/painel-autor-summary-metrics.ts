import {
  obraPublicadaComConteudoPainel,
  obraRascunhoOuSemConteudoPainel,
} from "./painel-autor-work-status-utils";

type CapituloParaResumoPainel = {
  publicado?: boolean;
};

type ObraParaResumoPainel<TCapitulo extends CapituloParaResumoPainel> = {
  publicado: boolean;
  capitulos: TCapitulo[];
  totalCurtidas: number;
  totalComentarios: number;
  totalSalvos: number;
  arquivoObra?: unknown | null;
};

export function obterResumoMetricasPainel<
  TCapitulo extends CapituloParaResumoPainel,
  TObra extends ObraParaResumoPainel<TCapitulo>,
>(obrasComMetricas: TObra[]) {
  const obrasPublicadas = obrasComMetricas.filter((obra) =>
    obraPublicadaComConteudoPainel(obra)
  );
  const obrasRascunhos = obrasComMetricas.filter((obra) =>
    obraRascunhoOuSemConteudoPainel(obra)
  );

  const totalCapitulos = obrasComMetricas.reduce(
    (total, obra) => total + obra.capitulos.length,
    0
  );

  const totalCurtidas = obrasComMetricas.reduce(
    (total, obra) => total + obra.totalCurtidas,
    0
  );

  const totalComentarios = obrasComMetricas.reduce(
    (total, obra) => total + obra.totalComentarios,
    0
  );

  const totalSalvos = obrasComMetricas.reduce(
    (total, obra) => total + obra.totalSalvos,
    0
  );

  const totalArquivos = obrasComMetricas.filter((obra) => obra.arquivoObra).length;

  return {
    obrasPublicadas,
    obrasRascunhos,
    totalCapitulos,
    totalCurtidas,
    totalComentarios,
    totalSalvos,
    totalArquivos,
  };
}
