import type { EstadoRelacionamentoPerfil } from "../../../lib/historietasPrivacy";
import type { AutorPerfil } from "../types";
import {
  criarChaveAutorPerfil,
  criarHrefListaSeguimentoPerfilAutor,
  idAutorSupabaseValido,
  normalizarNomeAutor,
} from "./profile-formatters";

export function obterApresentacaoBotaoSeguimentoPerfilAutor({
  seguindoPerfilAtual,
  solicitacaoSeguimentoPendente,
  salvando,
}: {
  seguindoPerfilAtual: boolean;
  solicitacaoSeguimentoPendente: boolean;
  salvando: boolean;
}) {
  return {
    botaoSeguimentoAtivo:
      seguindoPerfilAtual || solicitacaoSeguimentoPendente,
    opacidadeBotaoSeguimento: salvando ? 0.58 : 1,
    cursorBotaoSeguimento: salvando ? "not-allowed" : "pointer",
  };
}


export function obterDadosAcaoSeguimentoPerfilAutor({
  seguindoPerfilAtual,
  solicitacaoSeguimentoPendente,
  salvando,
}: {
  seguindoPerfilAtual: boolean;
  solicitacaoSeguimentoPendente: boolean;
  salvando: boolean;
}) {
  const ariaLabelSeguimento = solicitacaoSeguimentoPendente
    ? "Cancelar solicitação"
    : seguindoPerfilAtual
      ? "Deixar de seguir"
      : "Seguir";

  return {
    ariaLabelSeguimento,
    titleSeguimento: solicitacaoSeguimentoPendente
      ? "Cancelar solicitação"
      : undefined,
    rotuloSeguimento: salvando
      ? "..."
      : solicitacaoSeguimentoPendente
        ? "Solicitado"
        : seguindoPerfilAtual
          ? "Seguindo"
          : "Seguir",
  };
}


export function obterEstadoSeguimentoPerfilAutor({
  perfilParaMostrar,
  autoresSeguidos,
  estadoRelacionamentoPerfil,
  seguindoUsuarioPerfil,
  seguidoresUsuarioPerfilTotal,
  seguindoUsuarioPerfilTotal,
  podeEditarPerfil,
}: {
  perfilParaMostrar: Pick<AutorPerfil, "autorId" | "nome"> | null;
  autoresSeguidos: string[];
  estadoRelacionamentoPerfil: EstadoRelacionamentoPerfil;
  seguindoUsuarioPerfil: boolean;
  seguidoresUsuarioPerfilTotal: number;
  seguindoUsuarioPerfilTotal: number;
  podeEditarPerfil: boolean;
}) {
  const autorChavePerfil = perfilParaMostrar
    ? criarChaveAutorPerfil(perfilParaMostrar.autorId, perfilParaMostrar.nome)
    : "";
  const autorNormalizadoParaSeguir = perfilParaMostrar
    ? normalizarNomeAutor(perfilParaMostrar.nome)
    : "";
  const seguindoAutor = Boolean(
    autorChavePerfil &&
      (autoresSeguidos.includes(autorChavePerfil) ||
        autoresSeguidos.includes(autorNormalizadoParaSeguir)),
  );
  const perfilUserIdParaSeguir = perfilParaMostrar?.autorId.trim() || "";
  const podeUsarSeguimentoUsuario = Boolean(
    perfilUserIdParaSeguir && idAutorSupabaseValido(perfilUserIdParaSeguir),
  );

  return {
    autorChavePerfil,
    autorNormalizadoParaSeguir,
    seguindoAutor,
    perfilUserIdParaSeguir,
    podeUsarSeguimentoUsuario,
    seguindoPerfilAtual: podeUsarSeguimentoUsuario
      ? estadoRelacionamentoPerfil === "seguindo" || seguindoUsuarioPerfil
      : seguindoAutor,
    solicitacaoSeguimentoPendente: Boolean(
      podeUsarSeguimentoUsuario &&
        estadoRelacionamentoPerfil === "solicitado",
    ),
    seguidoresTotal: podeUsarSeguimentoUsuario
      ? seguidoresUsuarioPerfilTotal
      : seguindoAutor
        ? 1
        : 0,
    seguindoTotalPerfil: podeUsarSeguimentoUsuario
      ? seguindoUsuarioPerfilTotal
      : podeEditarPerfil
        ? autoresSeguidos.length
        : 0,
    seguidoresPerfilHref: podeEditarPerfil
      ? "/seguindo?conteudo=seguidores"
      : criarHrefListaSeguimentoPerfilAutor("seguidores", perfilParaMostrar),
    seguindoPerfilHref: podeEditarPerfil
      ? "/seguindo?conteudo=pessoas"
      : criarHrefListaSeguimentoPerfilAutor("seguindo", perfilParaMostrar),
    obrasSeguidasPerfilHref: "/seguindo?conteudo=obras",
  };
}
