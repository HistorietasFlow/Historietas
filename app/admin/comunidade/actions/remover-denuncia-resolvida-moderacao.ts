import { escreverEstadoDenunciaModeracao, type EstadoDenuncia } from "../lib/admin-comunidade-confirmed-write";
export async function persistirRemocaoDenunciaResolvidaModeracao({denunciaId, esperada}: {denunciaId: string; esperada: EstadoDenuncia}) {
  if (denunciaId !== esperada.id || esperada.status !== "resolvida") throw new Error("Somente denúncias resolvidas podem ser removidas do painel.");
  return escreverEstadoDenunciaModeracao(esperada, null);
}
