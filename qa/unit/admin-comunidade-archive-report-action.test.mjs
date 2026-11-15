import {testarAdaptadorModeracao} from "../helpers/admin-moderacao-action-contract.mjs";

testarAdaptadorModeracao({
  file: "arquivar-denuncia-moderacao",
  name: "persistirArquivamentoDenunciaModeracao",
  profile: false,
  resolved: false,
  params: {},
  payload: {arquivada: true},
});
