import {testarAdaptadorModeracao} from "../helpers/admin-moderacao-action-contract.mjs";

testarAdaptadorModeracao({
  file: "atualizar-status-denuncia-perfil-moderacao",
  name: "persistirStatusDenunciaPerfilModeracao",
  profile: true,
  resolved: false,
  params: {novoStatus: "resolvida", atualizadoEm: "2026-11-14T00:00:00Z"},
  payload: {status: "resolvida", atualizado_em: "2026-11-14T00:00:00Z"},
});
