import type { PreferenciasConta } from "./configuracoes-account-models";

export function calcularTotalBibliotecaConfiguracoes(
  favoritas: number,
  concluidas: number,
  seguindoObras: number,
) {
  return favoritas + concluidas + seguindoObras;
}

export function criarPreferenciaAtualizadaConfiguracoes<
  K extends keyof PreferenciasConta,
>(
  preferencias: PreferenciasConta,
  campo: K,
  valor: PreferenciasConta[K],
) {
  return {
    ...preferencias,
    [campo]: valor,
  };
}

export function criarPreferenciasComAvisosAlternadosConfiguracoes(
  preferencias: PreferenciasConta,
) {
  return {
    ...preferencias,
    receberAvisos: !preferencias.receberAvisos,
  };
}
