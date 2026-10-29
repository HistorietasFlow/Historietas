import { salvarTop5 } from "./top5-selection-storage";

export function sincronizarSelecaoInicialTop5(
  userId: string,
  idsSalvos: string[],
  idsNormalizados: string[],
) {
  if (
    userId &&
    JSON.stringify(idsSalvos) !==
      JSON.stringify(idsNormalizados)
  ) {
    salvarTop5(userId, idsNormalizados);
  }
}
