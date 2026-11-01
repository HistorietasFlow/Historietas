"use client";

import { useState } from "react";
import { criarMensagemErro } from "../lib/admin-problemas-tecnicos-error-utils";

type CarregarProblemasTecnicos = () => Promise<void>;

export function useAdminProblemasTecnicosActionState() {
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
  ) {
    setAcaoEmAndamento("recarregar");
    setErro("");
    setSucesso("");

    try {
      await carregarProblemas();
    } catch (error) {
      setErro(
        criarMensagemErro(
          "Erro ao atualizar problemas técnicos",
          error,
        ),
      );
    } finally {
      setAcaoEmAndamento("");
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
