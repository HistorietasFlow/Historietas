import { escreverPerfilModeracao, type EstadoPerfilModeracao } from "../lib/admin-comunidade-profile-write";
export async function persistirRemocaoDenunciaPerfilResolvidaModeracao({denunciaId, esperada}: {denunciaId: string; esperada: EstadoPerfilModeracao}) {
  if (denunciaId !== esperada.id || esperada.status !== "resolvida") throw new Error("Somente denúncias de perfis resolvidas podem ser removidas do painel.");
  return escreverPerfilModeracao(esperada, null);
}
