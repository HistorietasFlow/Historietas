import type {
  AbaBibliotecaPerfil,
  DiarioPerfilEstado,
  DiarioPerfilItem,
  ObraLocal,
} from "../types";
import { selecionarItensBibliotecaPerfil } from "./profile-library-active-items";
import { montarItensBibliotecaPerfilAutor } from "./profile-library-items-builder";
import {
  encontrarItemBibliotecaMenuAberto,
  obterMensagemBibliotecaVaziaPerfil,
  obterRotuloBibliotecaPerfil,
} from "./profile-library-display-utils";
import { obterTotaisBibliotecaPerfilAutor } from "./profile-library-totals";

export function obterEstadoVisualBibliotecaPerfilAutor({
  bibliotecaPerfilVisivel,
  diarioPerfil,
  atividadesDiarioPerfil,
  obras,
  obrasSeguidasBiblioteca,
  obrasConcluidas,
  obrasConcluidasPerfilPorObrasDoAutor,
  abaBibliotecaPerfil,
  bibliotecaMenuAbertoChave,
}: {
  bibliotecaPerfilVisivel: boolean;
  diarioPerfil: DiarioPerfilEstado;
  atividadesDiarioPerfil: DiarioPerfilItem[];
  obras: ObraLocal[];
  obrasSeguidasBiblioteca: string[];
  obrasConcluidas: string[];
  obrasConcluidasPerfilPorObrasDoAutor: number;
  abaBibliotecaPerfil: AbaBibliotecaPerfil;
  bibliotecaMenuAbertoChave: string;
}) {
  const {
    queroLer: itensBibliotecaQueroLer,
    lendoAgora: itensBibliotecaLendoAgora,
    favoritas: itensBibliotecaFavoritas,
    concluidas: itensBibliotecaConcluidas,
    historico: itensBibliotecaHistorico,
    salvos: itensBibliotecaSalvos,
  } = montarItensBibliotecaPerfilAutor({
    bibliotecaPerfilVisivel,
    queroLer: diarioPerfil.queroLer,
    lendoAgora: diarioPerfil.lendoAgora,
    favoritas: diarioPerfil.favoritas,
    concluidas: diarioPerfil.concluidas,
    atividades: atividadesDiarioPerfil,
    obras,
  });

  const itensBibliotecaQueroLerTotal = itensBibliotecaQueroLer.length;
  const itensBibliotecaConcluidasTotal = itensBibliotecaConcluidas.length;
  const {
    obrasSeguidasPerfilTotal,
    obrasConcluidasPerfilTotal,
  } = obterTotaisBibliotecaPerfilAutor({
    obras,
    obrasSeguidasBiblioteca,
    obrasConcluidas,
    itensBibliotecaQueroLerTotal,
    itensBibliotecaConcluidasTotal,
    obrasConcluidasPerfilPorObrasDoAutor,
  });

  const itensBibliotecaAtivos = selecionarItensBibliotecaPerfil({
    aba: abaBibliotecaPerfil,
    queroLer: itensBibliotecaQueroLer,
    lendoAgora: itensBibliotecaLendoAgora,
    favoritas: itensBibliotecaFavoritas,
    concluidas: itensBibliotecaConcluidas,
    salvos: itensBibliotecaSalvos,
    historico: itensBibliotecaHistorico,
  });

  const bibliotecaMenuAberto = encontrarItemBibliotecaMenuAberto(
    itensBibliotecaAtivos,
    bibliotecaMenuAbertoChave,
  );

  const rotuloBibliotecaAtiva = obterRotuloBibliotecaPerfil(
    abaBibliotecaPerfil,
  );
  const mensagemBibliotecaVazia =
    obterMensagemBibliotecaVaziaPerfil(rotuloBibliotecaAtiva);

  return {
    itensBibliotecaQueroLer,
    itensBibliotecaLendoAgora,
    itensBibliotecaFavoritas,
    itensBibliotecaConcluidas,
    itensBibliotecaHistorico,
    itensBibliotecaSalvos,
    itensBibliotecaQueroLerTotal,
    itensBibliotecaConcluidasTotal,
    obrasSeguidasPerfilTotal,
    obrasConcluidasPerfilTotal,
    itensBibliotecaAtivos,
    bibliotecaMenuAberto,
    rotuloBibliotecaAtiva,
    mensagemBibliotecaVazia,
  };
}
