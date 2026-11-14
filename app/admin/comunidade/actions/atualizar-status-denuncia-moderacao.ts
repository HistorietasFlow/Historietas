import type { StatusDenuncia } from "../lib/admin-comunidade-status-utils";
import { escreverEstadoDenunciaModeracao, type EstadoDenuncia } from "../lib/admin-comunidade-confirmed-write";

export async function persistirStatusDenunciaModeracao({denunciaId, novoStatus, observacaoAtual, usuarioId, analisadoEm, esperada}: {
  denunciaId: string; novoStatus: StatusDenuncia; observacaoAtual: string; usuarioId: string; analisadoEm: string; esperada: EstadoDenuncia;
}) {
  if (denunciaId !== esperada.id) throw new Error("A denúncia mudou durante a ação.");
  return escreverEstadoDenunciaModeracao(esperada, {status: novoStatus, observacao_admin: observacaoAtual.slice(0, 800), analisado_por: usuarioId, analisado_em: analisadoEm});
}
