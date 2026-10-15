import { calcularProgressoLeitura } from "./home-reading-utils";

type CapituloLeituraHome = {
  id: string;
  criadoEm: string;
  lido: boolean;
  lidoEm: string;
};

type ObraLeituraHome<TCapitulo extends CapituloLeituraHome> = {
  capitulos: TCapitulo[];
  ultimoCapituloLidoId: string;
  ultimaLeituraEm: string;
  progressoLeitura: number;
};

type ProgressoLeituraHomeRow = {
  lido: boolean | null;
  atualizado_em: string | null;
};

export function aplicarProgressoLeituraHome<
  TCapitulo extends CapituloLeituraHome,
  TObra extends ObraLeituraHome<TCapitulo>,
>(
  obra: TObra,
  progressoPorCapitulo: Map<string, ProgressoLeituraHomeRow>,
  progressoCarregado: boolean
) {
  if (!progressoCarregado) {
    return obra;
  }

  let ultimoCapituloLidoId = "";
  let ultimaLeituraEm = "";

  const capitulos = obra.capitulos.map((capitulo) => {
    const registro = progressoPorCapitulo.get(capitulo.id);
    const lido = Boolean(registro?.lido);
    const lidoEmRemoto =
      typeof registro?.atualizado_em === "string"
        ? registro.atualizado_em
        : "";
    const lidoEm = lido ? lidoEmRemoto || capitulo.lidoEm : "";

    if (lido) {
      const tempoAtual = new Date(lidoEm).getTime();
      const tempoUltimaLeitura = new Date(ultimaLeituraEm).getTime();
      const tempoAtualSeguro = Number.isNaN(tempoAtual) ? 0 : tempoAtual;
      const tempoUltimaLeituraSeguro = Number.isNaN(tempoUltimaLeitura)
        ? 0
        : tempoUltimaLeitura;

      if (
        !ultimoCapituloLidoId ||
        tempoAtualSeguro >= tempoUltimaLeituraSeguro
      ) {
        ultimoCapituloLidoId = capitulo.id;
        ultimaLeituraEm = lidoEm;
      }
    }

    return {
      ...capitulo,
      lido,
      lidoEm,
    };
  });

  return {
    ...obra,
    capitulos,
    ultimoCapituloLidoId,
    ultimaLeituraEm,
    progressoLeitura: calcularProgressoLeitura(capitulos),
  };
}
