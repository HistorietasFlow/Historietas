"use client";

import { useRef, useState } from "react";
import { criarMensagemErro } from "../lib/admin-problemas-tecnicos-error-utils";

type CarregarProblemasTecnicos = () => Promise<void>;

export function useAdminProblemasTecnicosActionState() {
  const recargaRef = useRef<(() => boolean) | null>(null);
  const [chamadoAbertoId, setChamadoAbertoId] = useState("");
  const [acaoEmAndamento, setAcaoEmAndamento] = useState("");
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  function alternarChamadoAberto(chamadoId: string) {
    setChamadoAbertoId((atual) =>
      atual === chamadoId ? "" : chamadoId,
    );
  }

  async function recarregarProblemasTecnicos(
    carregarProblemas: CarregarProblemasTecnicos,
    atual: () => boolean,
  ) {
    if (!atual() || recargaRef.current?.()) return;
    recargaRef.current = atual;
    setAcaoEmAndamento("recarregar");
    setErro("");
    setSucesso("");

    try {
      await carregarProblemas();
    } catch (error) {
      if (atual()) setErro(
        criarMensagemErro(
          "Erro ao atualizar problemas técnicos",
          error,
        ),
      );
    } finally {
      if (recargaRef.current === atual) recargaRef.current = null;
      if (atual()) setAcaoEmAndamento(acaoAtual => acaoAtual === "recarregar" ? "" : acaoAtual);
    }
  }

  return {
    chamadoAbertoId,
    acaoEmAndamento,
    setAcaoEmAndamento,
    erro,
    setErro,
    sucesso,
    setSucesso,
    alternarChamadoAberto,
    recarregarProblemasTecnicos,
  };
}
