import type { Dispatch, SetStateAction } from "react";
import { supabase } from "../../../lib/supabase/client";
import {
  bloquearUsuario,
  desbloquearUsuario,
  type EstadoBloqueioPerfil,
  type EstadoRelacionamentoPerfil,
  type PermissoesAbasPerfil,
} from "../../../lib/historietasPrivacy";
import type { AutorPerfil } from "../types";
import { idAutorSupabaseValido } from "../lib/profile-formatters";

export function usePerfilAutorBlockActions({
  podeEditarPerfil,
  perfilParaMostrar,
  bloqueioPerfilSalvando,
  usuarioIdLogado,
  estadoBloqueioPerfil,
  avisarLoginNecessario,
  setMenuPerfilAberto,
  setMensagemAcao,
  setBloqueioPerfilSalvando,
  setEstadoBloqueioPerfil,
  setSeguindoUsuarioPerfil,
  setEstadoRelacionamentoPerfil,
  setPermissoesAbasPerfil,
}: {
  podeEditarPerfil: boolean;
  perfilParaMostrar: AutorPerfil | null;
  bloqueioPerfilSalvando: boolean;
  usuarioIdLogado: string;
  estadoBloqueioPerfil: EstadoBloqueioPerfil;
  avisarLoginNecessario: (mensagem: string) => void;
  setMenuPerfilAberto: Dispatch<SetStateAction<boolean>>;
  setMensagemAcao: (mensagem: string) => void;
  setBloqueioPerfilSalvando: Dispatch<SetStateAction<boolean>>;
  setEstadoBloqueioPerfil: Dispatch<SetStateAction<EstadoBloqueioPerfil>>;
  setSeguindoUsuarioPerfil: Dispatch<SetStateAction<boolean>>;
  setEstadoRelacionamentoPerfil: Dispatch<
    SetStateAction<EstadoRelacionamentoPerfil>
  >;
  setPermissoesAbasPerfil: Dispatch<SetStateAction<PermissoesAbasPerfil>>;
}) {
  async function alternarBloqueioPerfil() {
    if (
      podeEditarPerfil ||
      !perfilParaMostrar ||
      bloqueioPerfilSalvando
    ) {
      return;
    }

    const perfilUserId = perfilParaMostrar.autorId.trim();

    if (!perfilUserId || !idAutorSupabaseValido(perfilUserId)) {
      setMensagemAcao("Não foi possível identificar este perfil.");
      return;
    }

    let usuarioAtualId = usuarioIdLogado.trim();

    if (!usuarioAtualId) {
      try {
        const { data } = await supabase.auth.getUser();
        usuarioAtualId = data.user?.id?.trim() || "";
      } catch {
        usuarioAtualId = "";
      }
    }

    if (!usuarioAtualId) {
      setMenuPerfilAberto(false);
      avisarLoginNecessario(
        "Entre na sua conta para bloquear este usuário.",
      );
      return;
    }

    if (usuarioAtualId === perfilUserId) {
      setMensagemAcao("Você não pode bloquear o próprio perfil.");
      return;
    }

    const desbloquear = estadoBloqueioPerfil.bloqueadoPorMim;
    const nomePerfil = perfilParaMostrar.nome || "este usuário";
    const confirmou = window.confirm(
      desbloquear
        ? `Desbloquear ${nomePerfil}?`
        : `Bloquear ${nomePerfil}? Vocês deixarão de se seguir e não poderão interagir entre si.`,
    );

    if (!confirmou) {
      return;
    }

    setMenuPerfilAberto(false);
    setMensagemAcao("");
    setBloqueioPerfilSalvando(true);

    const resultado = desbloquear
      ? await desbloquearUsuario(perfilUserId)
      : await bloquearUsuario(perfilUserId);

    setBloqueioPerfilSalvando(false);

    if (!resultado.ok) {
      setMensagemAcao(
        resultado.erro ||
          (desbloquear
            ? "Não foi possível desbloquear este usuário."
            : "Não foi possível bloquear este usuário."),
      );
      return;
    }

    setEstadoBloqueioPerfil(resultado.estado);

    if (!desbloquear) {
      setSeguindoUsuarioPerfil(false);
      setEstadoRelacionamentoPerfil("nenhum");
      setPermissoesAbasPerfil({
        obras: false,
        sobre: false,
        diario: false,
        comunidade: false,
        biblioteca: false,
        atividades: false,
      });
    }

    setMensagemAcao(
      desbloquear
        ? `${nomePerfil} foi desbloqueado.`
        : `${nomePerfil} foi bloqueado.`,
    );
  }

  return { alternarBloqueioPerfil };
}
