import type {
  StatusDenuncia,
  StatusDenunciaPerfil,
} from "./admin-comunidade-status-utils";

type DenunciaParaTotais = {
  status: StatusDenuncia;
};

type DenunciaPerfilParaTotais = {
  status: StatusDenunciaPerfil;
};

export function calcularTotaisModeracao(
  denunciasAtivas: readonly DenunciaParaTotais[],
  denunciasPerfis: readonly DenunciaPerfilParaTotais[],
) {
  const totalPendentes = denunciasAtivas.filter(
    (denuncia) => denuncia.status === "pendente"
  ).length;

  const totalEmAnalise = denunciasAtivas.filter(
    (denuncia) => denuncia.status === "em_analise"
  ).length;

  const totalResolvidas = denunciasAtivas.filter(
    (denuncia) => denuncia.status === "resolvida"
  ).length;

  const totalRejeitadas = denunciasAtivas.filter(
    (denuncia) => denuncia.status === "rejeitada"
  ).length;

  const totalPerfisPendentes = denunciasPerfis.filter(
    (denuncia) => denuncia.status === "pendente"
  ).length;

  return {
    totalPendentes,
    totalEmAnalise,
    totalResolvidas,
    totalRejeitadas,
    totalPerfisPendentes,
  };
}
