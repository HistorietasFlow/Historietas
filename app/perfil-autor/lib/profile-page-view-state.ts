import type { AutorPerfil } from "../types";

export function obterEstadoVisualPaginaPerfilAutor({
  carregando,
  carregamentoAtual = true,
  privacidadeAtual = true,
  erroCarregamento = false,
  erroPrivacidade = false,
  redirecionandoParaLogin,
  autorNaoEncontrado,
  perfilParaMostrar,
}: {
  carregando: boolean;
  carregamentoAtual?: boolean;
  privacidadeAtual?: boolean;
  erroCarregamento?: boolean;
  erroPrivacidade?: boolean;
  redirecionandoParaLogin: boolean;
  autorNaoEncontrado: boolean;
  perfilParaMostrar: AutorPerfil | null;
}) {
  if (carregando || redirecionandoParaLogin) {
    return "carregando";
  }

  if (!carregamentoAtual || (!privacidadeAtual && !erroPrivacidade)) {
    return "carregando";
  }

  if (erroCarregamento || erroPrivacidade) return "erro-carregamento";

  if (autorNaoEncontrado) {
    return "autor-nao-encontrado";
  }

  if (!perfilParaMostrar) {
    return "perfil-ausente";
  }

  return "pronto";
}
