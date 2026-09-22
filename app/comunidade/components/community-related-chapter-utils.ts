import { SEPARADOR_CAPITULO_RELACIONADO } from "./community-related-chapter-constants";

export function separarObraECapituloRelacionados(valor: string) {
  const valorLimpo = valor.trim();
  const separadorIndice = valorLimpo.indexOf(SEPARADOR_CAPITULO_RELACIONADO);

  if (separadorIndice < 0) {
    return {
      obraRelacionada: valorLimpo.slice(0, 90),
      capituloRelacionado: "",
    };
  }

  return {
    obraRelacionada: valorLimpo.slice(0, separadorIndice).trim().slice(0, 90),
    capituloRelacionado: valorLimpo
      .slice(separadorIndice + SEPARADOR_CAPITULO_RELACIONADO.length)
      .trim()
      .slice(0, 60),
  };
}

export function juntarObraECapituloRelacionados(obra: string, capitulo: string) {
  const obraLimpa = obra.trim();
  const capituloLimpo = capitulo.trim();

  if (!obraLimpa) {
    return "";
  }

  if (!capituloLimpo) {
    return obraLimpa.slice(0, 90);
  }

  const obraCompacta = obraLimpa.slice(0, 60);
  const limiteCapitulo = Math.max(
    0,
    90 - obraCompacta.length - SEPARADOR_CAPITULO_RELACIONADO.length,
  );

  return `${obraCompacta}${SEPARADOR_CAPITULO_RELACIONADO}${capituloLimpo.slice(
    0,
    limiteCapitulo,
  )}`;
}

