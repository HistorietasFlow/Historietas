import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import {
  carregarPreferenciasPrivacidade,
  type EstadoRelacionamentoPerfil,
  type PermissoesAbasPerfil,
} from "../../../lib/historietasPrivacy";
import {
  PERMISSOES_ABAS_PERFIL_PADRAO,
  PERMISSOES_ABAS_PERFIL_PROPRIO,
} from "../constants";
import { idAutorSupabaseValido } from "../lib/profile-formatters";
import { execucaoCarregamentoPerfilAutorEstaAtual, type IdentidadeAutenticadaPerfilAutor } from "../lib/profile-auth-identity";
import { carregarPermissoesAbasPerfilConfirmadas } from "../lib/profile-tab-permissions-loader";

const permissoesNaoConfirmadas: PermissoesAbasPerfil = {
  obras: false, sobre: false, diario: false, comunidade: false, biblioteca: false, atividades: false,
};

export function usePerfilAutorPrivacySync({
  perfilAutorId,
  perfilPertenceAoUsuario,
  estadoRelacionamentoPerfil,
  usuarioIdLogado,
  versaoIdentidade,
  identidadeAutenticadaPerfilRef,
  setPermissoesAbasPerfil,
  setPrivacidadePerfilCarregando,
}: {
  perfilAutorId: string;
  perfilPertenceAoUsuario: boolean;
  estadoRelacionamentoPerfil: EstadoRelacionamentoPerfil;
  usuarioIdLogado: string;
  versaoIdentidade: number;
  identidadeAutenticadaPerfilRef: { current: IdentidadeAutenticadaPerfilAutor };
  setPermissoesAbasPerfil: Dispatch<SetStateAction<PermissoesAbasPerfil>>;
  setPrivacidadePerfilCarregando: Dispatch<SetStateAction<boolean>>;
}) {
  const contexto = useMemo(() => ({ perfilAutorId, perfilPertenceAoUsuario, estadoRelacionamentoPerfil, usuarioIdLogado, versaoIdentidade }),
    [perfilAutorId, perfilPertenceAoUsuario, estadoRelacionamentoPerfil, usuarioIdLogado, versaoIdentidade]);
  const [resultado, setResultado] = useState<{ contexto: typeof contexto; erro: boolean } | null>(null);
  useEffect(() => {
    const userIdPerfil = perfilAutorId.trim();
    let cancelado = false;
    const identidadeEsperada = identidadeAutenticadaPerfilRef.current;
    const execucaoAtual = () => execucaoCarregamentoPerfilAutorEstaAtual({
      cancelada: cancelado, identidadeEsperada, identidadeAtual: identidadeAutenticadaPerfilRef.current,
    });

    async function carregarPrivacidadePerfil() {
      setPrivacidadePerfilCarregando(true);
      setPermissoesAbasPerfil(permissoesNaoConfirmadas);

      if (!userIdPerfil || !idAutorSupabaseValido(userIdPerfil)) {
        if (execucaoAtual()) {
          setPermissoesAbasPerfil(
            perfilPertenceAoUsuario
              ? PERMISSOES_ABAS_PERFIL_PROPRIO
              : PERMISSOES_ABAS_PERFIL_PADRAO,
          );
        }

        return;
      }

      await carregarPreferenciasPrivacidade(userIdPerfil, {
        usarFallbackLocal: perfilPertenceAoUsuario,
      });
      if (!execucaoAtual()) return;
      const permissoes = perfilPertenceAoUsuario
        ? PERMISSOES_ABAS_PERFIL_PROPRIO
        : await carregarPermissoesAbasPerfilConfirmadas(userIdPerfil);

      if (execucaoAtual()) {
        setPermissoesAbasPerfil(permissoes);
      }
    }

    let erro = false;
    void carregarPrivacidadePerfil().catch(() => {
      if (execucaoAtual()) {
        erro = true;
        setPermissoesAbasPerfil(permissoesNaoConfirmadas);
      }
    }).finally(() => {
      if (execucaoAtual()) {
        setResultado({ contexto, erro });
        setPrivacidadePerfilCarregando(false);
      }
    });

    return () => {
      cancelado = true;
    };
  }, [
    perfilAutorId,
    perfilPertenceAoUsuario,
    estadoRelacionamentoPerfil,
    contexto,
    identidadeAutenticadaPerfilRef,
    setPermissoesAbasPerfil,
    setPrivacidadePerfilCarregando,
  ]);
  return {
    privacidadeAtual: resultado?.contexto === contexto && !resultado.erro,
    erroPrivacidade: resultado?.contexto === contexto && resultado.erro,
  };
}
