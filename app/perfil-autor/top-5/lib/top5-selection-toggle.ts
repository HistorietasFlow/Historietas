import { TOP_FIVE_MAXIMO } from "./top5-selection-storage";

export type ResultadoAlternarIdSelecionadoTop5 = {
  ids: string[];
  limiteAtingido: boolean;
};

export function alternarIdSelecionadoTop5(
  idsAtuais: string[],
  chave: string,
): ResultadoAlternarIdSelecionadoTop5 {
  if (idsAtuais.includes(chave)) {
    return {
      ids: idsAtuais.filter((id) => id !== chave),
      limiteAtingido: false,
    };
  }

  if (idsAtuais.length >= TOP_FIVE_MAXIMO) {
    return {
      ids: idsAtuais,
      limiteAtingido: true,
    };
  }

  return {
    ids: [...idsAtuais, chave],
    limiteAtingido: false,
  };
}
