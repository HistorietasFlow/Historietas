import type { EstadoRelacionamentoPerfil } from "../../../lib/historietasPrivacy";
import type { AutorPerfil } from "../types";
import {
  obterApresentacaoBotaoSeguimentoPerfilAutor,
  obterDadosAcaoSeguimentoPerfilAutor,
  obterEstadoSeguimentoPerfilAutor,
} from "./profile-follow-display-utils";

export function obterEstadoVisualSeguimentoPerfilAutor({
  perfilParaMostrar,
  autoresSeguidos,
  estadoRelacionamentoPerfil,
  seguindoUsuarioPerfil,
  seguidoresUsuarioPerfilTotal,
  seguindoUsuarioPerfilTotal,
  podeEditarPerfil,
  seguirUsuarioSalvando,
}: {
  perfilParaMostrar: Pick<AutorPerfil, "autorId" | "nome"> | null;
  autoresSeguidos: string[];
  estadoRelacionamentoPerfil: EstadoRelacionamentoPerfil;
  seguindoUsuarioPerfil: boolean;
  seguidoresUsuarioPerfilTotal: number;
  seguindoUsuarioPerfilTotal: number;
  podeEditarPerfil: boolean;
  seguirUsuarioSalvando: boolean;
}) {
  const {
    autorChavePerfil,
    autorNormalizadoParaSeguir,
    seguindoAutor,
    seguindoPerfilAtual,
    solicitacaoSeguimentoPendente,
    seguidoresTotal,
    seguindoTotalPerfil,
    seguidoresPerfilHref,
    seguindoPerfilHref,
    obrasSeguidasPerfilHref,
  } = obterEstadoSeguimentoPerfilAutor({
    perfilParaMostrar,
    autoresSeguidos,
    estadoRelacionamentoPerfil,
    seguindoUsuarioPerfil,
    seguidoresUsuarioPerfilTotal,
    seguindoUsuarioPerfilTotal,
    podeEditarPerfil,
  });

  const {
    ariaLabelSeguimento,
    titleSeguimento,
    rotuloSeguimento,
  } = obterDadosAcaoSeguimentoPerfilAutor({
    seguindoPerfilAtual,
    solicitacaoSeguimentoPendente,
    salvando: seguirUsuarioSalvando,
  });
  const {
    botaoSeguimentoAtivo,
    opacidadeBotaoSeguimento,
    cursorBotaoSeguimento,
  } = obterApresentacaoBotaoSeguimentoPerfilAutor({
    seguindoPerfilAtual,
    solicitacaoSeguimentoPendente,
    salvando: seguirUsuarioSalvando,
  });

  return {
    autorChavePerfil,
    autorNormalizadoParaSeguir,
    seguindoAutor,
    seguindoPerfilAtual,
    solicitacaoSeguimentoPendente,
    seguidoresTotal,
    seguindoTotalPerfil,
    seguidoresPerfilHref,
    seguindoPerfilHref,
    obrasSeguidasPerfilHref,
    ariaLabelSeguimento,
    titleSeguimento,
    rotuloSeguimento,
    botaoSeguimentoAtivo,
    opacidadeBotaoSeguimento,
    cursorBotaoSeguimento,
  };
}
