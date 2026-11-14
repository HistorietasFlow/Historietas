import {testarAdaptadorModeracao} from "../helpers/admin-moderacao-action-contract.mjs";

testarAdaptadorModeracao({
  file: "restaurar-denuncia-moderacao",
  name: "persistirRestauracaoDenunciaModeracao",
  profile: false,
  resolved: false,
  params: {},
  payload: {arquivada: false},
});
