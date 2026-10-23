"use client";

import { useMemo } from "react";
import {
  ehClassificacao18,
  normalizarAvisosConteudo18,
  type AvisoConteudo18,
} from "../../../lib/historietasAdultContent";
import { normalizarTexto } from "../../../lib/utils";
import {
  LIMITE_CARACTERES_FORMATO_GENERO_PERSONALIZADO,
  LIMITE_CARACTERES_TAG_PERSONALIZADA,
  OUTRO_FORMATO_VALUE,
  OUTRO_GENERO_VALUE,
} from "../lib/publicar-static-options";
import {
  campoValido,
  contarCaracteresValidos,
  textoPersonalizadoValido,
} from "../lib/publicar-text-utils";
import { normalizarClassificacaoIndicativaPublicar } from "../lib/publicar-work-utils";

type UsePublicarFormValidationParams = {
  arquivoCapituloTexto: string;
  arquivoObra: unknown;
  autor: string;
  avisosConteudo18: AvisoConteudo18[];
  capa: string;
  classificacaoIndicativa: string;
  formato: string;
  formatoPersonalizado: string;
  genero: string;
  generoPersonalizado: string;
  sinopse: string;
  tagPersonalizada: string;
  tags: string;
  titulo: string;
  usarTagPersonalizada: boolean;
};

export function usePublicarFormValidation({
  arquivoCapituloTexto,
  arquivoObra,
  autor,
  avisosConteudo18,
  capa,
  classificacaoIndicativa,
  formato,
  formatoPersonalizado,
  genero,
  generoPersonalizado,
  sinopse,
  tagPersonalizada,
  tags,
  titulo,
  usarTagPersonalizada,
}: UsePublicarFormValidationParams) {
  const formatoEhPersonalizado = formato === OUTRO_FORMATO_VALUE;
  const generoEhPersonalizado = genero === OUTRO_GENERO_VALUE;
  const formatoFinal = formatoEhPersonalizado
    ? formatoPersonalizado.trim().replace(/\s+/g, " ")
    : formato.trim();
  const generoFinal = generoEhPersonalizado
    ? generoPersonalizado.trim().replace(/\s+/g, " ")
    : genero.trim();
  const tagPersonalizadaFinal = tagPersonalizada.trim().replace(/\s+/g, " ");
  const formatoPersonalizadoValido =
    !formatoEhPersonalizado ||
    textoPersonalizadoValido(
      formatoPersonalizado,
      3,
      LIMITE_CARACTERES_FORMATO_GENERO_PERSONALIZADO
    );
  const generoPersonalizadoValido =
    !generoEhPersonalizado ||
    textoPersonalizadoValido(
      generoPersonalizado,
      3,
      LIMITE_CARACTERES_FORMATO_GENERO_PERSONALIZADO
    );
  const tagPersonalizadaValida =
    !usarTagPersonalizada ||
    (textoPersonalizadoValido(
      tagPersonalizada,
      2,
      LIMITE_CARACTERES_TAG_PERSONALIZADA
    ) &&
      normalizarTexto(tagPersonalizadaFinal) !== normalizarTexto(formatoFinal) &&
      normalizarTexto(tagPersonalizadaFinal) !== normalizarTexto(generoFinal));

  const tituloValido = campoValido(titulo, 3);
  const autorValido = campoValido(autor, 2);
  const generoValido = Boolean(generoFinal) && generoPersonalizadoValido;
  const formatoValido = Boolean(formatoFinal) && formatoPersonalizadoValido;
  const classificacaoFinal = normalizarClassificacaoIndicativaPublicar(
    classificacaoIndicativa,
  );
  const classificacao18Selecionada = ehClassificacao18(classificacaoFinal);
  const avisosConteudo18Normalizados = normalizarAvisosConteudo18(
    avisosConteudo18,
    classificacaoFinal,
  );
  const classificacaoValida = Boolean(classificacaoFinal) &&
    (!classificacao18Selecionada || avisosConteudo18.length > 0);
  const sinopseValida = campoValido(sinopse, 20);

  const temArquivoObra = Boolean(arquivoObra);
  const temCapituloImportado = Boolean(arquivoCapituloTexto.trim());
  const temConteudoPorArquivo = Boolean(arquivoObra || temCapituloImportado);
  const arquivoCapituloValido =
    !temCapituloImportado || contarCaracteresValidos(arquivoCapituloTexto) >= 20;

  const progresso = useMemo(() => {
    const camposValidos = [
      tituloValido,
      autorValido,
      generoValido,
      formatoValido,
      classificacaoValida,
      sinopseValida,
    ].filter(Boolean).length;

    return Math.round((camposValidos / 6) * 100);
  }, [
    tituloValido,
    autorValido,
    generoValido,
    formatoValido,
    classificacaoValida,
    sinopseValida,
  ]);

  const previewTemConteudo = Boolean(
    titulo.trim() ||
      autor.trim() ||
      generoFinal ||
      formatoFinal ||
      classificacaoIndicativa.trim() ||
      sinopse.trim() ||
      tags.trim() ||
      capa ||
      temArquivoObra ||
      temCapituloImportado
  );

  function validarFormulario() {
    if (!tituloValido) {
      return "O título precisa ter pelo menos 3 letras ou números. Não pode ser só ponto.";
    }

    if (!autorValido) {
      return "O nome do autor precisa ter pelo menos 2 letras ou números.";
    }

    if (!formatoValido) {
      return formatoEhPersonalizado
        ? "O formato personalizado precisa ter 3 a 14 caracteres, sem vírgula, emoji ou símbolo estranho."
        : "Escolha o formato da obra.";
    }

    if (!generoValido) {
      return generoEhPersonalizado
        ? "O gênero personalizado precisa ter 3 a 14 caracteres, sem vírgula, emoji ou símbolo estranho."
        : "Escolha o gênero principal da obra.";
    }

    if (!tagPersonalizadaValida) {
      return "A tag personalizada precisa ter 2 a 10 caracteres, sem vírgula, emoji ou símbolo estranho, e não pode repetir gênero ou formato.";
    }

    if (!classificacaoFinal) {
      return "Escolha a classificação indicativa da obra.";
    }

    if (classificacao18Selecionada && avisosConteudo18.length === 0) {
      return "Selecione pelo menos um aviso de conteúdo para a obra 18+.";
    }

    if (!sinopseValida) {
      return "A sinopse precisa ter pelo menos 20 letras ou números.";
    }

    if (temCapituloImportado && !arquivoCapituloValido) {
      return "O arquivo importado precisa ter pelo menos 20 letras ou números para virar o primeiro capítulo.";
    }

    return "";
  }

  return {
    avisosConteudo18Normalizados,
    classificacao18Selecionada,
    classificacaoFinal,
    formatoEhPersonalizado,
    formatoFinal,
    generoEhPersonalizado,
    generoFinal,
    progresso,
    previewTemConteudo,
    sinopseValida,
    temCapituloImportado,
    temConteudoPorArquivo,
    validarFormulario,
  };
}
