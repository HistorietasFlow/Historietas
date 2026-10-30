import type { HistorietasLanguage } from "../../../lib/i18n";
import { traduzirTextoPerfilAutor } from "../translations";
import type {
  AutorPerfil,
  PerfilUsuarioRemoto,
  PerfisAutoresSalvos,
  TotaisInteracoesObrasPerfilAutor,
} from "../types";
import {
  obterBioSobreExibicaoPerfilAutor,
  obterDadosExibicaoPerfilAutor,
} from "./profile-display-utils";
import { obterTotalObrasConcluidasPerfilAutor } from "./profile-work-display-utils";

export function obterEstadoVisualExibicaoAutorPerfil({
  perfilParaMostrar,
  totaisInteracoesObras,
  obrasConcluidas,
  perfilUsuarioRemoto,
  perfisAutoresSalvos,
  autorChavePerfil,
  autorNormalizadoParaSeguir,
  language,
}: {
  perfilParaMostrar: AutorPerfil | null;
  totaisInteracoesObras: TotaisInteracoesObrasPerfilAutor;
  obrasConcluidas: string[];
  perfilUsuarioRemoto: PerfilUsuarioRemoto | null;
  perfisAutoresSalvos: PerfisAutoresSalvos;
  autorChavePerfil: string;
  autorNormalizadoParaSeguir: string;
  language: HistorietasLanguage;
}) {
  const obrasConcluidasPerfilPorObrasDoAutor =
    obterTotalObrasConcluidasPerfilAutor({
      perfilParaMostrar,
      totaisInteracoesObras,
      obrasConcluidas,
    });
  const {
    perfilSalvoAutor,
    perfilUsuarioRemotoAtivo,
    bioPadraoAutor,
    bioAutorPersonalizada,
    bioAutor,
    bioSobrePersonalizada,
    bioSobreAutor,
    entradaHistorietasPerfil,
    caracteresRestantesBioSobre,
    bioSobreAutorEhPadrao,
    autorHandlePerfil,
    avatarAutor,
  } = obterDadosExibicaoPerfilAutor({
    perfilParaMostrar,
    perfilUsuarioRemoto,
    perfisAutoresSalvos,
    autorChavePerfil,
    autorNormalizadoParaSeguir,
  });
  const mostrarDestaquesAutor = perfilSalvoAutor.mostrarDestaques;

  const {
    bioSobreAutorExibido,
    bioSobreAutorUserContent,
  } = obterBioSobreExibicaoPerfilAutor({
    bioSobreAutor,
    bioSobreAutorEhPadrao,
    traduzirTexto: (texto) => traduzirTextoPerfilAutor(texto, language),
  });

  return {
    obrasConcluidasPerfilPorObrasDoAutor,
    perfilSalvoAutor,
    perfilUsuarioRemotoAtivo,
    bioPadraoAutor,
    bioAutorPersonalizada,
    bioAutor,
    bioSobrePersonalizada,
    bioSobreAutor,
    entradaHistorietasPerfil,
    caracteresRestantesBioSobre,
    bioSobreAutorEhPadrao,
    autorHandlePerfil,
    avatarAutor,
    mostrarDestaquesAutor,
    bioSobreAutorExibido,
    bioSobreAutorUserContent,
  };
}
