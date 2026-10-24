import { criarSlugBase } from "../../../lib/utils";

type ObraLocalAtualParaBackupEdicaoObra = {
  slug?: string;
  link?: string;
};

type CriarAlvoBackupArquivoEdicaoObraParams = {
  obraId: string;
  obraLocalAtual: ObraLocalAtualParaBackupEdicaoObra | null;
  tituloFinal: string;
};

export function criarAlvoBackupArquivoEdicaoObra({
  obraId,
  obraLocalAtual,
  tituloFinal,
}: CriarAlvoBackupArquivoEdicaoObraParams) {
  const slug = obraLocalAtual?.slug || criarSlugBase(tituloFinal);

  return {
    id: obraId,
    slug,
    titulo: tituloFinal,
    link: obraLocalAtual?.link || `/obra/${slug}`,
  };
}
