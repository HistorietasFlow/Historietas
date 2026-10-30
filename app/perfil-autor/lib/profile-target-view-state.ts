import type {
  ObraLocal,
  PerfilUsuarioRemoto,
  TotaisInteracoesObrasPerfilAutor,
} from "../types";
import { criarPerfilUsuarioRemotoComoAutor } from "./data-normalizers";
import { montarPerfisAutoresPorObras } from "./profile-author-groups";
import { resolverEstadoPerfilAutor } from "./profile-resolution-utils";

export function obterEstadoAlvoPerfilAutor({
  obras,
  totaisInteracoesObras,
  perfilUsuarioRemoto,
  autorSelecionado,
  autorIdSelecionado,
  usuarioIdLogado,
  autenticacaoCarregada,
}: {
  obras: ObraLocal[];
  totaisInteracoesObras: TotaisInteracoesObrasPerfilAutor;
  perfilUsuarioRemoto: PerfilUsuarioRemoto | null;
  autorSelecionado: string;
  autorIdSelecionado: string;
  usuarioIdLogado: string;
  autenticacaoCarregada: boolean;
}) {
  const perfisAutores = montarPerfisAutoresPorObras(
    obras,
    totaisInteracoesObras,
  );

  const perfilUsuarioRemotoComoAutor = perfilUsuarioRemoto?.userId
    ? criarPerfilUsuarioRemotoComoAutor(perfilUsuarioRemoto)
    : null;

  const {
    autorNaoEncontrado,
    perfilDoUsuarioLogado,
    perfilParaMostrar,
    perfilPertenceAoUsuario,
    redirecionandoParaLogin,
  } = resolverEstadoPerfilAutor({
    perfisAutores,
    autorSelecionado,
    autorIdSelecionado,
    usuarioIdLogado,
    perfilUsuarioRemotoComoAutor,
    autenticacaoCarregada,
  });
  const perfilAutorId = perfilParaMostrar?.autorId || "";
  const perfilNome = perfilParaMostrar?.nome || "";
  const obrasPerfil = perfilParaMostrar?.obras || [];
  const totalObrasPerfil = obrasPerfil.length;

  return {
    autorNaoEncontrado,
    perfilDoUsuarioLogado,
    perfilParaMostrar,
    perfilPertenceAoUsuario,
    redirecionandoParaLogin,
    perfilAutorId,
    perfilNome,
    obrasPerfil,
    totalObrasPerfil,
  };
}
