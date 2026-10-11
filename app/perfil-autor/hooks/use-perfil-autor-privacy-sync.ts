import { useEffect, type Dispatch, type SetStateAction } from "react";
import {
  carregarPermissoesAbasPerfil,
  carregarPreferenciasPrivacidade,
  type EstadoRelacionamentoPerfil,
  type PermissoesAbasPerfil,
} from "../../../lib/historietasPrivacy";
import {
  PERMISSOES_ABAS_PERFIL_PADRAO,
  PERMISSOES_ABAS_PERFIL_PROPRIO,
} from "../constants";
import { idAutorSupabaseValido } from "../lib/profile-formatters";

export function usePerfilAutorPrivacySync({
  perfilAutorId,
  perfilPertenceAoUsuario,
  estadoRelacionamentoPerfil,
  setPermissoesAbasPerfil,
  setPrivacidadePerfilCarregando,
}: {
  perfilAutorId: string;
  perfilPertenceAoUsuario: boolean;
  estadoRelacionamentoPerfil: EstadoRelacionamentoPerfil;
  setPermissoesAbasPerfil: Dispatch<SetStateAction<PermissoesAbasPerfil>>;
  setPrivacidadePerfilCarregando: Dispatch<SetStateAction<boolean>>;
}) {
  useEffect(() => {
    const userIdPerfil = perfilAutorId.trim();
    let cancelado = false;

    async function carregarPrivacidadePerfil() {
      setPrivacidadePerfilCarregando(true);

      if (!userIdPerfil || !idAutorSupabaseValido(userIdPerfil)) {
        if (!cancelado) {
          setPermissoesAbasPerfil(
            perfilPertenceAoUsuario
              ? PERMISSOES_ABAS_PERFIL_PROPRIO
              : PERMISSOES_ABAS_PERFIL_PADRAO,
          );
          setPrivacidadePerfilCarregando(false);
        }

        return;
      }

      const preferencias = await carregarPreferenciasPrivacidade(userIdPerfil, {
        usarFallbackLocal: perfilPertenceAoUsuario,
      });
      const permissoes = perfilPertenceAoUsuario
        ? PERMISSOES_ABAS_PERFIL_PROPRIO
        : await carregarPermissoesAbasPerfil(userIdPerfil, preferencias);

      if (!cancelado) {
        setPermissoesAbasPerfil(permissoes);
        setPrivacidadePerfilCarregando(false);
      }
    }

    void carregarPrivacidadePerfil();

    return () => {
      cancelado = true;
    };
  }, [
    perfilAutorId,
    perfilPertenceAoUsuario,
    estadoRelacionamentoPerfil,
    setPermissoesAbasPerfil,
    setPrivacidadePerfilCarregando,
  ]);
}
