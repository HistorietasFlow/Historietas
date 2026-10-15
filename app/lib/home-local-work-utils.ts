type CapituloObraLocalHome = {
  curtiu: boolean;
  comentario: string;
};

type ObraLocalHome = {
  arquivoObra?: unknown;
  capitulos: CapituloObraLocalHome[];
  totalComentarios: number;
  totalCurtidas: number;
};

export function contarCurtidasObraLocal(obra: ObraLocalHome) {
  return obra.capitulos.filter((capitulo) => capitulo.curtiu).length;
}

export function contarComentariosObraLocal(obra: ObraLocalHome) {
  return obra.capitulos.filter((capitulo) => capitulo.comentario.trim()).length;
}

export function obterTotalCurtidasObraHome(obra: ObraLocalHome) {
  return Math.max(obra.totalCurtidas || 0, contarCurtidasObraLocal(obra));
}

export function obterTotalComentariosObraHome(obra: ObraLocalHome) {
  return Math.max(obra.totalComentarios || 0, contarComentariosObraLocal(obra));
}

export function obraTemArquivoAnexado(obra: ObraLocalHome) {
  const arquivo = obra.arquivoObra;

  if (!arquivo || typeof arquivo !== "object" || Array.isArray(arquivo)) {
    return false;
  }

  const arquivoValidado = arquivo as Record<string, unknown>;

  return Boolean(
    typeof arquivoValidado.nome === "string" &&
      arquivoValidado.nome.trim() &&
      typeof arquivoValidado.conteudo === "string" &&
      arquivoValidado.conteudo.trim()
  );
}

export function obraTemConteudoPublicoHome(obra: ObraLocalHome) {
  return obra.capitulos.length > 0 || obraTemArquivoAnexado(obra);
}
