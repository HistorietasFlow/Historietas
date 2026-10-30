import type { AutorPerfil } from "../types";

export function obterEstadoVisualPaginaPerfilAutor({
  carregando,
  redirecionandoParaLogin,
  autorNaoEncontrado,
  perfilParaMostrar,
}: {
  carregando: boolean;
  redirecionandoParaLogin: boolean;
  autorNaoEncontrado: boolean;
  perfilParaMostrar: AutorPerfil | null;
}) {
  if (carregando || redirecionandoParaLogin) {
    return "carregando";
  }

  if (autorNaoEncontrado) {
    return "autor-nao-encontrado";
  }

  if (!perfilParaMostrar) {
    return "perfil-ausente";
  }

  return "pronto";
}
