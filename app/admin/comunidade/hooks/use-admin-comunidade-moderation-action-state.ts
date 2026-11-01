import { useState } from "react";

export function useAdminComunidadeModerationActionState() {
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
