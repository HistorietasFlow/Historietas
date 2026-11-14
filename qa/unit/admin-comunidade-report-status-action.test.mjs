import {testarAdaptadorModeracao} from "../helpers/admin-moderacao-action-contract.mjs";

testarAdaptadorModeracao({
  file: "atualizar-status-denuncia-moderacao",
  name: "persistirStatusDenunciaModeracao",
  profile: false,
  resolved: false,
  params: {novoStatus: "resolvida", observacaoAtual: "x".repeat(801), usuarioId: "A", analisadoEm: "2026-11-14T00:00:00Z"},
  payload: {status: "resolvida", observacao_admin: "x".repeat(800), analisado_por: "A", analisado_em: "2026-11-14T00:00:00Z"},
});
