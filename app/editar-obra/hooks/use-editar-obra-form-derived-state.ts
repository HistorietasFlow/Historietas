import { useMemo } from "react";
import type { AvisoConteudo18 } from "../../../lib/historietasAdultContent";
import {
  LIMITE_CARACTERES_FORMATO_GENERO_PERSONALIZADO,
  LIMITE_CARACTERES_TAG_PERSONALIZADA,
  LIMITE_TAGS_OBRA,
  OUTRO_FORMATO_VALUE,
  OUTRO_GENERO_VALUE,
} from "../lib/editar-obra-form-config";
import { calcularValoresDerivadosFormularioEdicaoObra } from "../lib/editar-obra-derived-form-values";
import { calcularProgressoFormularioEdicaoObra } from "../lib/editar-obra-form-validation";
import { obterHrefsObraEditarObra } from "../lib/editar-obra-navigation-utils";
import { prepararTagsEdicaoObra } from "../lib/editar-obra-tags-list-utils";
import type { ObraLocal } from "../types";

type UseEditarObraFormDerivedStateProps = {
  obras: ObraLocal[];
  obraId: string;
  tags: string;
  formato: string;
  genero: string;
  tagPersonalizada: string;
  usarTagPersonalizada: boolean;
  formatoPersonalizado: string;
  generoPersonalizado: string;
  titulo: string;
  autor: string;
  classificacaoIndicativa: string;
  avisosConteudo18: AvisoConteudo18[];
  sinopse: string;
  nomeAutorProfile: string;
};

export function useEditarObraFormDerivedState({
  obras,
  obraId,
  tags,
  formato,
  genero,
  tagPersonalizada,
  usarTagPersonalizada,
  formatoPersonalizado,
  generoPersonalizado,
  titulo,
  autor,
  classificacaoIndicativa,
  avisosConteudo18,
  sinopse,
  nomeAutorProfile,
}: UseEditarObraFormDerivedStateProps) {
  const obraAtual = useMemo(() => {
    return obras.find((obra) => obra.id === obraId) || null;
  }, [obras, obraId]);

  const tagsTratadas = useMemo(() => {
    return prepararTagsEdicaoObra(tags, LIMITE_TAGS_OBRA);
  }, [tags]);

  const {
    formatoEhPersonalizado,
    generoEhPersonalizado,
    formatoFinal,
    generoFinal,
    formatoPersonalizadoValido,
    generoPersonalizadoValido,
    tagPersonalizadaValida,
  } = calcularValoresDerivadosFormularioEdicaoObra({
    formato,
    genero,
    tagPersonalizada,
    usarTagPersonalizada,
    formatoPersonalizado,
    generoPersonalizado,
    outroFormatoValue: OUTRO_FORMATO_VALUE,
    outroGeneroValue: OUTRO_GENERO_VALUE,
    limiteCaracteresFormatoGeneroPersonalizado:
      LIMITE_CARACTERES_FORMATO_GENERO_PERSONALIZADO,
    limiteCaracteresTagPersonalizada: LIMITE_CARACTERES_TAG_PERSONALIZADA,
  });

  const progresso = useMemo(() => calcularProgressoFormularioEdicaoObra({
    titulo,
    autor,
    generoFinal,
    generoPersonalizadoValido,
    formatoFinal,
    formatoPersonalizadoValido,
    classificacaoIndicativa,
    avisosConteudo18,
    sinopse,
  }), [
    titulo,
    autor,
    generoFinal,
    generoPersonalizadoValido,
    formatoFinal,
    formatoPersonalizadoValido,
    classificacaoIndicativa,
    avisosConteudo18,
    sinopse,
  ]);

  const { minhaObraHref } = obterHrefsObraEditarObra(obraAtual, titulo);
  const autorProfileAtivo = nomeAutorProfile.trim();
  const autorPreview = autorProfileAtivo || autor.trim();

  return {
    obraAtual,
    tagsTratadas,
    formatoEhPersonalizado,
    generoEhPersonalizado,
    formatoFinal,
    generoFinal,
    formatoPersonalizadoValido,
    generoPersonalizadoValido,
    tagPersonalizadaValida,
    progresso,
    minhaObraHref,
    autorProfileAtivo,
    autorPreview,
  };
}
