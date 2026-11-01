"use client";

import { useState } from "react";
import type { TextoTraduzido } from "../lib/admin-exclusoes-conta-text-utils";

type CarregarFila = () => Promise<void>;

type RecarregarFilaParams = {
  carregarSolicitacoes: CarregarFila;
  carregarOperacoesRecuperaveis: CarregarFila;
};

export function useAdminExclusoesContaActionState(
  t: (texto: TextoTraduzido) => string,
) {
  const [abertaId, setAbertaId] = useState("");
  const [acaoEmAndamento, setAcaoEmAndamento] = useState("");
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  function alternarSolicitacaoAberta(solicitacaoId: string) {
    setAbertaId((atual) =>
      atual === solicitacaoId ? "" : solicitacaoId,
    );
  }

  async function recarregarFila({
    carregarSolicitacoes,
    carregarOperacoesRecuperaveis,
  }: RecarregarFilaParams) {
    setAcaoEmAndamento("recarregar");
    setErro("");
    setSucesso("");

    try {
      await Promise.all([
        carregarSolicitacoes(),
        carregarOperacoesRecuperaveis(),
      ]);
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : t({
              pt: "Não foi possível atualizar a fila.",
              en: "The queue could not be refreshed.",
              es: "No se pudo actualizar la cola.",
            }),
      );
    } finally {
      setAcaoEmAndamento("");
    }
  }

  return {
    abertaId,
    acaoEmAndamento,
    setAcaoEmAndamento,
    erro,
    setErro,
    sucesso,
    setSucesso,
    alternarSolicitacaoAberta,
    recarregarFila,
  };
}
