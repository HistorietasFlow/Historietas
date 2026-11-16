import type { RefObject } from "react";
import type { ProblemaTecnico } from "./admin-problemas-tecnicos-normalization-utils";

export type ExecucaoChamados = {
  usuarioId: string;
  ehAdmin: boolean;
  ativo: boolean;
  leitura: number;
  revisao: number;
  registros: Map<string, ProblemaTecnico>;
  fila: Promise<void>;
  pendentes: Map<string, Promise<void>>;
  ultimaChave: string;
};
export type ReferenciaExecucaoChamados = RefObject<ExecucaoChamados>;

export function criarExecucaoChamados(): ExecucaoChamados {
  return { usuarioId: "", ehAdmin: false, ativo: true, leitura: 0, revisao: 0,
    registros: new Map(), fila: Promise.resolve(), pendentes: new Map(), ultimaChave: "" };
}
export function execucaoChamadosEstaAtual(ref: ReferenciaExecucaoChamados, execucao: ExecucaoChamados) {
  return execucao.ativo && ref.current === execucao;
}
export function agendarOperacaoChamados<T>(execucao: ExecucaoChamados, operar: () => Promise<T>) {
  const tarefa = execucao.fila.then(operar);
  execucao.fila = tarefa.then(() => {}, () => {});
  return tarefa;
}
