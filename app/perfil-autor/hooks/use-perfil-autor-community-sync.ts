import { useEffect, type Dispatch, type SetStateAction } from "react";
import { comunidadePerfilVazia } from "../constants";
import type { ComunidadePerfilEstado } from "../types";
import { carregarComunidadePerfilSupabase } from "../lib/profile-community-loader";
import { idAutorSupabaseValido } from "../lib/profile-formatters";

export function usePerfilAutorCommunitySync({
  perfilAutorId,
  comunidadePerfilVisivel,
  perfilPertenceAoUsuario,
  setComunidadePerfil,
}: {
  perfilAutorId: string;
  comunidadePerfilVisivel: boolean;
  perfilPertenceAoUsuario: boolean;
  setComunidadePerfil: Dispatch<SetStateAction<ComunidadePerfilEstado>>;
}) {
  useEffect(() => {
    const userIdPerfil = perfilAutorId.trim();
    let cancelado = false;

    async function carregarComunidadePerfil() {
      if (
        !comunidadePerfilVisivel ||
        !userIdPerfil ||
        !idAutorSupabaseValido(userIdPerfil)
      ) {
        setComunidadePerfil(comunidadePerfilVazia);
        return;
      }

      setComunidadePerfil({
        ...comunidadePerfilVazia,
        carregando: true,
      });

      try {
        const comunidadeCarregada = await carregarComunidadePerfilSupabase(
          userIdPerfil,
          perfilPertenceAoUsuario,
        );

        if (!cancelado) {
          setComunidadePerfil({
            carregando: false,
            erro: "",
            ...comunidadeCarregada,
          });
        }
      } catch (error) {
        console.warn(
          "Não consegui carregar as publicações da Comunidade deste perfil:",
          error,
        );

        if (!cancelado) {
          setComunidadePerfil({
            ...comunidadePerfilVazia,
            erro: "Não foi possível carregar as publicações deste perfil agora.",
          });
        }
      }
    }

    const carregarComunidadeTimer = window.setTimeout(() => {
      void carregarComunidadePerfil();
    }, 0);

    return () => {
      cancelado = true;
      window.clearTimeout(carregarComunidadeTimer);
    };
  }, [
    perfilAutorId,
    comunidadePerfilVisivel,
    perfilPertenceAoUsuario,
    setComunidadePerfil,
  ]);
}
