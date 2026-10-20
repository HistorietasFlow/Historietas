import {
  ALIASES_BUSCA_CONFIGURACOES,
  normalizarTextoBuscaConfiguracoes,
} from "./configuracoes-search-utils";

export function deveMostrarSecaoConfiguracoes(
  buscaNormalizada: string,
  ...termos: string[]
) {
  if (!buscaNormalizada) {
    return true;
  }

  const termosExpandidos = termos.flatMap((termo) => {
    const termoNormalizado = normalizarTextoBuscaConfiguracoes(termo);
    const aliases = ALIASES_BUSCA_CONFIGURACOES[termoNormalizado] || [];

    return [termoNormalizado, ...aliases];
  });

  return termosExpandidos
    .map(normalizarTextoBuscaConfiguracoes)
    .join(" ")
    .includes(buscaNormalizada);
}
