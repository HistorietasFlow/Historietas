import type { PreferenciasConta, ResumoLocal } from "./configuracoes-account-models";

export function calcularTotalBibliotecaConfiguracoes(resumo: ResumoLocal) {
  return resumo.favoritas + resumo.concluidas + resumo.seguindoObras;
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
