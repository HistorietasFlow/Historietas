import {
  ehDataUrlEdicaoObra,
  normalizarArquivoObraPersistivel,
} from "./editar-obra-file-normalization";

type ObraPreparavelEdicaoObra = {
  capa: string;
  arquivoObra?: unknown;
};

type ObraPreparadaParaStorage<T extends ObraPreparavelEdicaoObra> = Omit<
  T,
  "capa" | "arquivoObra"
> & {
  capa: string;
  arquivoObra: ReturnType<typeof normalizarArquivoObraPersistivel>;
};

export function prepararObraEdicaoParaStorage<
  T extends ObraPreparavelEdicaoObra,
>(obra: T): ObraPreparadaParaStorage<T> {
  return {
    ...obra,
    capa: ehDataUrlEdicaoObra(obra.capa) ? "" : obra.capa,
    arquivoObra: normalizarArquivoObraPersistivel(obra.arquivoObra),
  };
}
