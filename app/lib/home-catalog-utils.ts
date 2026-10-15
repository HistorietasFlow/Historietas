type ObraCatalogoHome = object;

export function obterImagemObraCatalogo(obra: ObraCatalogoHome) {
  const obraComImagem = obra as ObraCatalogoHome & {
    capa?: string;
    capaUrl?: string;
    cover?: string;
    imagem?: string;
  };

  return (
    [
      obraComImagem.capa,
      obraComImagem.capaUrl,
      obraComImagem.cover,
      obraComImagem.imagem,
    ].find((imagem): imagem is string => {
      return typeof imagem === "string" && Boolean(imagem.trim());
    }) || ""
  );
}

export function obterFormatoObraCatalogoHome(obra: ObraCatalogoHome) {
  const obraComFormato = obra as ObraCatalogoHome & {
    formato?: string;
  };

  return obraComFormato.formato?.trim() || "História";
}

export function obterTotalCapitulosObraCatalogoHome(obra: ObraCatalogoHome) {
  const obraComCapitulos = obra as ObraCatalogoHome & {
    capitulos?: unknown;
  };

  return Array.isArray(obraComCapitulos.capitulos)
    ? obraComCapitulos.capitulos.length
    : 0;
}

export function obraCatalogoTemArquivoAnexadoHome(obra: ObraCatalogoHome) {
  const obraComArquivo = obra as ObraCatalogoHome & {
    arquivoObra?: unknown;
  };
  const arquivo = obraComArquivo.arquivoObra;

  if (!arquivo || typeof arquivo !== "object" || Array.isArray(arquivo)) {
    return false;
  }

  const arquivoValidado = arquivo as Record<string, unknown>;

  return Boolean(
    typeof arquivoValidado.nome === "string" &&
      arquivoValidado.nome.trim() &&
      typeof arquivoValidado.conteudo === "string" &&
      arquivoValidado.conteudo.trim(),
  );
}
