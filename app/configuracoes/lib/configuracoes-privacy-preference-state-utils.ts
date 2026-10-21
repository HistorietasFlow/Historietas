import type { PreferenciasPrivacidadeHistorietas } from "./configuracoes-privacy-preferences";

export function criarPrivacidadeAtualizadaConfiguracoes<
  K extends keyof PreferenciasPrivacidadeHistorietas,
>(
  privacidade: PreferenciasPrivacidadeHistorietas,
  campo: K,
  valor: PreferenciasPrivacidadeHistorietas[K],
) {
  return {
    ...privacidade,
    [campo]: valor,
  };
}

export function criarPrivacidadeComPerfilPrivadoAlternadoConfiguracoes(
  privacidade: PreferenciasPrivacidadeHistorietas,
) {
  const perfilPrivado = !privacidade.perfilPrivado;

  return {
    ...privacidade,
    perfilPrivado,
    aprovarNovosSeguidores: perfilPrivado
      ? true
      : privacidade.aprovarNovosSeguidores,
  };
}

export function criarPrivacidadeComAprovacaoAlternadaConfiguracoes(
  privacidade: PreferenciasPrivacidadeHistorietas,
) {
  const aprovarNovosSeguidores = !privacidade.aprovarNovosSeguidores;

  return {
    ...privacidade,
    aprovarNovosSeguidores,
    perfilPrivado: aprovarNovosSeguidores
      ? privacidade.perfilPrivado
      : false,
  };
}
