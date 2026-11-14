import {testarAdaptadorModeracao} from "../helpers/admin-moderacao-action-contract.mjs";

testarAdaptadorModeracao({
  file: "remover-denuncia-resolvida-moderacao",
  name: "persistirRemocaoDenunciaResolvidaModeracao",
  profile: false,
  resolved: true,
  params: {},
  payload: null,
});
