import type { AutorPerfil, DiarioPerfilEstado } from "../types";
import { obterTituloDiarioPerfilAutor } from "./profile-diary-local-utils";
import { montarItensDiarioTudoPerfil } from "./profile-diary-merge-utils";
import { obterResumoEstatisticasPerfilAutor } from "./profile-summary-stats";
import {
  obterMensagemObrasVaziasPerfilAutor,
  obterObraMenuAbertaPerfilAutor,
  obterObrasVisiveisPerfilAutor,
} from "./profile-work-display-utils";

export function obterEstadoVisualConteudoPerfilAutor({
  perfilParaMostrar,
  perfilPertenceAoUsuario,
  totalObrasPerfil,
  podeEditarPerfil,
  perfilNome,
  diarioPerfil,
  obraMenuAbertoId,
}: {
  perfilParaMostrar: AutorPerfil | null;
  perfilPertenceAoUsuario: boolean;
  totalObrasPerfil: number;
  podeEditarPerfil: boolean;
  perfilNome: string;
  diarioPerfil: DiarioPerfilEstado;
  obraMenuAbertoId: string;
}) {
  const obrasDoPerfilFiltradas = obterObrasVisiveisPerfilAutor({
    perfilParaMostrar,
    perfilPertenceAoUsuario,
  });
  const mensagemObrasVazias = obterMensagemObrasVaziasPerfilAutor({
    totalObras: totalObrasPerfil,
    podeEditarPerfil,
  });
  const tituloDiarioPerfil = obterTituloDiarioPerfilAutor({
    podeEditarPerfil,
    nomePerfil: perfilNome,
  });

  const itensDiarioTudo = montarItensDiarioTudoPerfil(diarioPerfil);
  const atividadesDiarioPerfil = diarioPerfil.atividades;
  const diarioPerfilCarregando = diarioPerfil.carregando;

  const {
    generosEspecialidadesPerfil,
    totalVisualizacoesPerfil,
    totalRascunhosPerfil,
    totalObrasSemCapitulosPerfil,
    temObrasSemCapitulosPerfil,
  } = obterResumoEstatisticasPerfilAutor(perfilParaMostrar);

  const obraMenuAberta = obterObraMenuAbertaPerfilAutor(
    obrasDoPerfilFiltradas,
    obraMenuAbertoId,
  );

  return {
    obrasDoPerfilFiltradas,
    mensagemObrasVazias,
    tituloDiarioPerfil,
    itensDiarioTudo,
    atividadesDiarioPerfil,
    diarioPerfilCarregando,
    generosEspecialidadesPerfil,
    totalVisualizacoesPerfil,
    totalRascunhosPerfil,
    totalObrasSemCapitulosPerfil,
    temObrasSemCapitulosPerfil,
    obraMenuAberta,
  };
}
