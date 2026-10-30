import type { ComunidadePerfilEstado } from "../types";
import { compactarNumeroPerfilAutor } from "./profile-formatters";
import {
  obterAriaLabelsEstatisticasComunidadePerfilAutor,
  obterAvisoComunidadeVaziaPerfilAutor,
  comunidadeSemPublicacoesRecentesPerfilAutor,
  obterPaddingInferiorPublicacaoComunidadePerfilAutor,
  obterTituloComunidadePerfilAutor,
  obterValoresEstatisticasComunidadePerfilAutor,
} from "./profile-community-publication-utils";

export function obterEstadoVisualComunidadePerfilAutor({
  comunidadePerfil,
  podeEditarPerfil,
  perfilNome,
  language,
}: {
  comunidadePerfil: ComunidadePerfilEstado;
  podeEditarPerfil: boolean;
  perfilNome: string;
  language: string;
}) {
  const publicacoesRecentesComunidade =
    comunidadePerfil.publicacoesRecentes;
  const comunidadeSemPublicacoesRecentes =
    comunidadeSemPublicacoesRecentesPerfilAutor(
      publicacoesRecentesComunidade,
    );
  const erroComunidadePerfil = comunidadePerfil.erro;
  const avisoComunidadeVazia = obterAvisoComunidadeVaziaPerfilAutor({
    podeEditarPerfil,
    nomePerfil: perfilNome,
  });
  const tituloComunidadePerfil = obterTituloComunidadePerfilAutor({
    language,
    nomePerfil: perfilNome,
  });
  const ariaLabelsEstatisticasComunidade =
    obterAriaLabelsEstatisticasComunidadePerfilAutor(
      perfilNome,
    );
  const valoresEstatisticasComunidade =
    obterValoresEstatisticasComunidadePerfilAutor({
      totalPublicacoes: comunidadePerfil.totalPublicacoes,
      totalTeorias: comunidadePerfil.totalTeorias,
      totalReviews: comunidadePerfil.totalReviews,
      formatarNumero: compactarNumeroPerfilAutor,
    });
  const paddingInferiorPublicacaoComunidade =
    obterPaddingInferiorPublicacaoComunidadePerfilAutor(podeEditarPerfil);

  return {
    publicacoesRecentesComunidade,
    comunidadeSemPublicacoesRecentes,
    erroComunidadePerfil,
    avisoComunidadeVazia,
    tituloComunidadePerfil,
    ariaLabelsEstatisticasComunidade,
    valoresEstatisticasComunidade,
    paddingInferiorPublicacaoComunidade,
  };
}
