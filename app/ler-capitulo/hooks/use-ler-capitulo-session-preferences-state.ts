"use client";

import { useState } from "react";
import type { TamanhoFonte } from "../components/ler-capitulo-reader-content";
import type { PerfilComentarioLeitor } from "../lib/ler-capitulo-comments-read-loader";

export function useLerCapituloSessionPreferencesState() {
  const [perfilComentarioLeitor, setPerfilComentarioLeitor] =
    useState<PerfilComentarioLeitor>({
      userId: "",
      nome: "Usuário",
      avatar: "",
    });
  const [usuarioIdLogado, setUsuarioIdLogado] = useState("");
  const [tamanhoFonte, setTamanhoFonte] = useState<TamanhoFonte>(3);
  const [mostrarLinhaProgresso, setMostrarLinhaProgresso] = useState(false);
  const [preferenciasCarregadas, setPreferenciasCarregadas] = useState(false);

  return {
    perfilComentarioLeitor,
    setPerfilComentarioLeitor,
    usuarioIdLogado,
    setUsuarioIdLogado,
    tamanhoFonte,
    setTamanhoFonte,
    mostrarLinhaProgresso,
    setMostrarLinhaProgresso,
    preferenciasCarregadas,
    setPreferenciasCarregadas,
  };
}
