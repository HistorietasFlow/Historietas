import type { MutableRefObject } from "react";
import { verificarAcessoModeracao } from "../loaders/verificar-acesso-moderacao";

export type ContextoModeracao = {
  ativo: boolean;
  usuarioId: string;
  ehAdmin: boolean;
  leitura: number;
  acao: symbol | null;
  incertos: Set<string>;
};
export type ControleModeracao = MutableRefObject<ContextoModeracao | null>;
export type AcaoModeracao = {contexto: ContextoModeracao; token: symbol};
export function substituirContextoModeracao(controle: ControleModeracao) {
  if (controle.current) controle.current.ativo = false;
  const contexto: ContextoModeracao = {ativo: true, usuarioId: "", ehAdmin: false, leitura: 0, acao: null, incertos: new Set()};
  controle.current = contexto;
  return contexto;
}
export function iniciarAcaoModeracao(controle: ControleModeracao, usuarioId: string, ehAdmin: boolean) {
  const contexto = controle.current;
  if (!contexto?.ativo || !usuarioId || !ehAdmin || contexto.usuarioId !== usuarioId || !contexto.ehAdmin || contexto.acao) return null;
  const token = Symbol();
  contexto.acao = token;
  contexto.leitura++;
  return {contexto, token};
}
export function contextoModeracaoVigente(controle: ControleModeracao, contexto: ContextoModeracao) {
  return controle.current === contexto && contexto.ativo;
}
export function acaoModeracaoVigente(controle: ControleModeracao, acao: AcaoModeracao) {
  return contextoModeracaoVigente(controle, acao.contexto) && acao.contexto.acao === acao.token;
}
export async function validarAcaoModeracao(controle: ControleModeracao, acao: AcaoModeracao) {
  const acesso = await verificarAcessoModeracao();
  if (!acaoModeracaoVigente(controle, acao)) return false;
  if (!acesso.adminConfirmado || acesso.user?.id !== acao.contexto.usuarioId) throw new Error("Sua autorização administrativa não foi confirmada. Reabra o painel antes de continuar.");
  return true;
}
export function finalizarAcaoModeracao(controle: ControleModeracao, acao: AcaoModeracao) {
  if (!acaoModeracaoVigente(controle, acao)) return false;
  acao.contexto.acao = null;
  return true;
}
