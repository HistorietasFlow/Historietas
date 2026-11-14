import type { RefObject } from "react";

export type ExecucaoAceite = {
  usuarioId: string;
  ativo: boolean;
  pronto: boolean;
  enviando: boolean;
  aceito: boolean;
};
export type ReferenciaExecucaoAceite = RefObject<ExecucaoAceite>;

export function criarExecucaoAceite(): ExecucaoAceite {
  return { usuarioId: "", ativo: true, pronto: false, enviando: false, aceito: false };
}

export function execucaoAceiteEstaAtual(ref: ReferenciaExecucaoAceite, execucao: ExecucaoAceite) {
  return execucao.ativo && ref.current === execucao;
}
