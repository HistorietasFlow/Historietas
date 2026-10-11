import type { AutorPerfil } from "../types";
import { normalizarNomeAutor } from "./profile-formatters";

function normalizarIdPerfilAutor(valor: string) {
  return valor.trim().toLowerCase();
}

export function resolverEstadoPerfilAutor({
  perfisAutores,
  autorSelecionado,
  autorIdSelecionado,
  usuarioIdLogado,
  perfilUsuarioRemotoComoAutor,
  autenticacaoCarregada,
}: {
  perfisAutores: AutorPerfil[];
  autorSelecionado: string;
  autorIdSelecionado: string;
  usuarioIdLogado: string;
  perfilUsuarioRemotoComoAutor: AutorPerfil | null;
  autenticacaoCarregada: boolean;
}) {
  let perfilAtual: AutorPerfil | null = null;

  if (autorSelecionado || autorIdSelecionado) {
    const autorIdNormalizado = normalizarIdPerfilAutor(autorIdSelecionado);

    if (autorIdNormalizado) {
      perfilAtual =
        perfisAutores.find(
          (perfil) =>
            normalizarIdPerfilAutor(perfil.autorId) === autorIdNormalizado,
        ) || null;

      if (
        !perfilAtual &&
        perfilUsuarioRemotoComoAutor &&
        normalizarIdPerfilAutor(perfilUsuarioRemotoComoAutor.autorId) ===
          autorIdNormalizado
      ) {
        perfilAtual = perfilUsuarioRemotoComoAutor;
      }
    }

    if (!perfilAtual) {
      const autorNormalizado = normalizarNomeAutor(autorSelecionado);

      perfilAtual =
        perfisAutores.find(
          (perfil) => normalizarNomeAutor(perfil.nome) === autorNormalizado,
        ) || null;
    }
  }

  const autorNaoEncontrado = Boolean(
    (autorSelecionado || autorIdSelecionado) && !perfilAtual,
  );

  const usuarioIdNormalizado = normalizarIdPerfilAutor(usuarioIdLogado);
  const perfilDoUsuarioLogado = usuarioIdNormalizado
    ? perfisAutores.find(
        (perfil) =>
          normalizarIdPerfilAutor(perfil.autorId) === usuarioIdNormalizado,
      ) ||
      (perfilUsuarioRemotoComoAutor &&
      normalizarIdPerfilAutor(perfilUsuarioRemotoComoAutor.autorId) ===
        usuarioIdNormalizado
        ? perfilUsuarioRemotoComoAutor
        : null)
    : null;

  const perfilSemParametro =
    !autorSelecionado.trim() && !autorIdSelecionado.trim();
  const perfilSemLoginSemParametro =
    perfilSemParametro && !usuarioIdLogado.trim();

  const perfilParaMostrar =
    autorSelecionado || autorIdSelecionado
      ? perfilAtual
      : perfilSemLoginSemParametro
        ? null
        : perfilDoUsuarioLogado || perfilUsuarioRemotoComoAutor || null;

  const autorIdPerfilNormalizado =
    normalizarIdPerfilAutor(perfilParaMostrar?.autorId || "");
  const autorIdUrlNormalizado = normalizarIdPerfilAutor(autorIdSelecionado);

  const perfilPertenceAoUsuario = Boolean(
    usuarioIdNormalizado &&
      (perfilSemParametro ||
        autorIdPerfilNormalizado === usuarioIdNormalizado ||
        autorIdUrlNormalizado === usuarioIdNormalizado),
  );

  return {
    perfilAtual,
    autorNaoEncontrado,
    perfilDoUsuarioLogado,
    perfilSemParametro,
    perfilSemLoginSemParametro,
    perfilParaMostrar,
    perfilPertenceAoUsuario,
    redirecionandoParaLogin:
      autenticacaoCarregada && perfilSemLoginSemParametro,
  };
}
