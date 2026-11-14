import { escreverPerfilModeracao, type EstadoPerfilModeracao } from "../lib/admin-comunidade-profile-write";
import type { StatusDenunciaPerfil } from "../lib/admin-comunidade-status-utils";
export async function persistirStatusDenunciaPerfilModeracao({denunciaId, novoStatus, atualizadoEm, esperada}: {
  denunciaId: string; novoStatus: StatusDenunciaPerfil; atualizadoEm: string; esperada: EstadoPerfilModeracao;
}) {
  if (denunciaId !== esperada.id) throw new Error("A denúncia mudou durante a ação.");
  return escreverPerfilModeracao(esperada, {status: novoStatus, atualizado_em: atualizadoEm});
}
