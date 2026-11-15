import {testarAdaptadorModeracao} from "../helpers/admin-moderacao-action-contract.mjs";

testarAdaptadorModeracao({
  file: "remover-denuncia-perfil-resolvida-moderacao",
  name: "persistirRemocaoDenunciaPerfilResolvidaModeracao",
  profile: true,
  resolved: true,
  params: {},
  payload: null,
});
