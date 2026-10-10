import { normalizarArquivoObra } from "./painel-autor-file-normalizer";

type ObraComStatusPainel = {
  publicado: boolean;
  capitulos: Array<{ publicado?: boolean }>;
  arquivoObra?: unknown | null;
};

export function obraPublicadaComConteudoPainel(
  obra: ObraComStatusPainel
) {
  const temCapituloPublicado = obra.capitulos.some(
    (capitulo) => capitulo.publicado !== false
  );

  return (
    obra.publicado &&
    (temCapituloPublicado || Boolean(normalizarArquivoObra(obra.arquivoObra)))
  );
}

export function obraRascunhoOuSemConteudoPainel(
  obra: ObraComStatusPainel
) {
  return !obraPublicadaComConteudoPainel(obra);
}

export function obterStatusPainelAutor(obra: ObraComStatusPainel) {
  if (obraPublicadaComConteudoPainel(obra)) {
    return "Publicado";
  }

  return obra.publicado ? "Sem conteúdo" : "Rascunho";
}
