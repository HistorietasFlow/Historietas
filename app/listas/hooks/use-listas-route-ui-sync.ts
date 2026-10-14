import { useEffect, type Dispatch, type SetStateAction } from "react";

type UseListasRouteUiSyncParams<TCategoria> = {
  categoriaUrl: TCategoria;
  setCategoria: Dispatch<SetStateAction<TCategoria>>;
  categoria: TCategoria;
  busca: string;
  ordenacao: unknown;
  modo: unknown;
  secao: string;
  genero: string;
  setQuantidadeVisivel: Dispatch<SetStateAction<number>>;
};

export function useListasRouteUiSync<TCategoria>({
  categoriaUrl,
  setCategoria,
  categoria,
  busca,
  ordenacao,
  modo,
  secao,
  genero,
  setQuantidadeVisivel,
}: UseListasRouteUiSyncParams<TCategoria>) {
  useEffect(() => {
    setCategoria(categoriaUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Preserva as dependências do efeito original.
  }, [categoriaUrl]);

  useEffect(() => {
    setQuantidadeVisivel(40);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Preserva as dependências do efeito original.
  }, [categoria, busca, ordenacao, modo, secao, genero]);
}
