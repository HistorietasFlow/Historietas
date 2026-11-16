import { useRef, useState } from "react";
import type { ContextoModeracao } from "../lib/admin-comunidade-action-control";

export function useAdminComunidadeModerationActionState() {
  const controleModeracao = useRef<ContextoModeracao | null>(null);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [acaoEmAndamento, setAcaoEmAndamento] = useState("");
  const [menuDenunciaAbertoId, setMenuDenunciaAbertoId] = useState("");

  function alternarMenuDenuncia(denunciaId: string) {
    setMenuDenunciaAbertoId((denunciaAbertaId) =>
      denunciaAbertaId === denunciaId ? "" : denunciaId
    );
  }

  function fecharMenuDenuncia() {
    setMenuDenunciaAbertoId("");
  }

  return {
    controleModeracao,
    erro,
    setErro,
    sucesso,
    setSucesso,
    acaoEmAndamento,
    setAcaoEmAndamento,
    menuDenunciaAbertoId,
    setMenuDenunciaAbertoId,
    alternarMenuDenuncia,
    fecharMenuDenuncia,
  };
}
