import { escreverEstadoDenunciaModeracao, type EstadoDenuncia } from "../lib/admin-comunidade-confirmed-write";
export async function persistirArquivamentoDenunciaModeracao({denunciaId, esperada}: {denunciaId: string; esperada: EstadoDenuncia}) {
  if (denunciaId !== esperada.id) throw new Error("A denúncia mudou durante a ação.");
  return escreverEstadoDenunciaModeracao(esperada, {arquivada: true});
}
