type ObraComArquivo<TArquivo extends { conteudo: string }> = {
  capa: string;
  arquivoObra?: TArquivo | null;
};

export function ehDataUrlAdicionarCapitulo(valor: string) {
  return valor.startsWith("data:");
}

export function prepararObraAdicionarCapituloParaStorage<
  TObra extends ObraComArquivo<TArquivo>,
  TArquivo extends { conteudo: string },
>(obra: TObra) {
  return {
    ...obra,
    capa: ehDataUrlAdicionarCapitulo(obra.capa) ? "" : obra.capa,
    arquivoObra: obra.arquivoObra
      ? {
          ...obra.arquivoObra,
          conteudo: ehDataUrlAdicionarCapitulo(obra.arquivoObra.conteudo)
            ? ""
            : obra.arquivoObra.conteudo,
        }
      : null,
  };
}
