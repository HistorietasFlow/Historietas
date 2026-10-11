import { useEffect, type Dispatch, type SetStateAction } from "react";
import type { AbaPerfilAutor } from "../types";

export function usePerfilAutorVisibleTabSync({
  abaPerfil,
  obrasPerfilVisivel,
  diarioPerfilVisivel,
  comunidadePerfilVisivel,
  sobrePerfilVisivel,
  bibliotecaPerfilVisivel,
  primeiraAbaPerfilVisivel,
  setAbaPerfil,
}: {
  abaPerfil: AbaPerfilAutor;
  obrasPerfilVisivel: boolean;
  diarioPerfilVisivel: boolean;
  comunidadePerfilVisivel: boolean;
  sobrePerfilVisivel: boolean;
  bibliotecaPerfilVisivel: boolean;
  primeiraAbaPerfilVisivel: AbaPerfilAutor | null;
  setAbaPerfil: Dispatch<SetStateAction<AbaPerfilAutor>>;
}) {
  useEffect(() => {
    const abaAtualVisivel =
      (abaPerfil === "obras" && obrasPerfilVisivel) ||
      (abaPerfil === "diario" && diarioPerfilVisivel) ||
      (abaPerfil === "comunidade" && comunidadePerfilVisivel) ||
      (abaPerfil === "sobre" && sobrePerfilVisivel) ||
      (abaPerfil === "biblioteca" && bibliotecaPerfilVisivel);

    if (!abaAtualVisivel && primeiraAbaPerfilVisivel) {
      const corrigirAbaTimer = window.setTimeout(() => {
        setAbaPerfil(primeiraAbaPerfilVisivel);
      }, 0);

      return () => {
        window.clearTimeout(corrigirAbaTimer);
      };
    }
  }, [
    abaPerfil,
    obrasPerfilVisivel,
    diarioPerfilVisivel,
    comunidadePerfilVisivel,
    sobrePerfilVisivel,
    bibliotecaPerfilVisivel,
    primeiraAbaPerfilVisivel,
    setAbaPerfil,
  ]);
}
