import { useEffect, type Dispatch, type SetStateAction } from "react";
import {
  carregarEstadoRelacionamentoPerfil,
  type EstadoRelacionamentoPerfil,
} from "../../../lib/historietasPrivacy";
import { carregarEstadoSeguimentoUsuarioPerfil } from "../lib/profile-follow-state-loader";
import { idAutorSupabaseValido } from "../lib/profile-formatters";

export function usePerfilAutorFollowStateSync({
  perfilAutorId,
  usuarioIdLogado,
  setEstadoRelacionamentoPerfil,
  setSeguindoUsuarioPerfil,
  setSeguidoresUsuarioPerfilTotal,
  setSeguindoUsuarioPerfilTotal,
}: {
  perfilAutorId: string;
  usuarioIdLogado: string;
  setEstadoRelacionamentoPerfil: Dispatch<
    SetStateAction<EstadoRelacionamentoPerfil>
  >;
  setSeguindoUsuarioPerfil: Dispatch<SetStateAction<boolean>>;
  setSeguidoresUsuarioPerfilTotal: Dispatch<SetStateAction<number>>;
  setSeguindoUsuarioPerfilTotal: Dispatch<SetStateAction<number>>;
}) {
  useEffect(() => {
    const perfilUserId = perfilAutorId.trim();
    const usuarioAtualId = usuarioIdLogado.trim();

    let cancelado = false;

    async function carregarSeguimentoUsuario() {
      if (!perfilUserId || !idAutorSupabaseValido(perfilUserId)) {
        setSeguindoUsuarioPerfil(false);
        setEstadoRelacionamentoPerfil("nenhum");
        return;
      }

      const [estadoSeguimento, estadoRelacionamento] = await Promise.all([
        carregarEstadoSeguimentoUsuarioPerfil(
          usuarioAtualId,
          perfilUserId,
        ),
        usuarioAtualId && idAutorSupabaseValido(usuarioAtualId)
          ? carregarEstadoRelacionamentoPerfil(
              perfilUserId,
              usuarioAtualId,
            )
          : Promise.resolve<EstadoRelacionamentoPerfil>("nenhum"),
      ]);

      if (cancelado) {
        return;
      }

      const seguindoConfirmado =
        estadoRelacionamento === "seguindo" || estadoSeguimento.seguindo;
      const estadoSeguro =
        perfilUserId === usuarioAtualId
          ? "proprio_perfil"
          : seguindoConfirmado
            ? "seguindo"
            : estadoRelacionamento;

      setEstadoRelacionamentoPerfil(estadoSeguro);
      setSeguindoUsuarioPerfil(seguindoConfirmado);
      setSeguidoresUsuarioPerfilTotal(estadoSeguimento.seguidoresTotal);
      setSeguindoUsuarioPerfilTotal(estadoSeguimento.seguindoTotal);
    }

    const carregarSeguimentoTimer = window.setTimeout(() => {
      void carregarSeguimentoUsuario();
    }, 0);

    return () => {
      cancelado = true;
      window.clearTimeout(carregarSeguimentoTimer);
    };
  }, [
    perfilAutorId,
    usuarioIdLogado,
    setEstadoRelacionamentoPerfil,
    setSeguindoUsuarioPerfil,
    setSeguidoresUsuarioPerfilTotal,
    setSeguindoUsuarioPerfilTotal,
  ]);
}
