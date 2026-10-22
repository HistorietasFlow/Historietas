import type { UsuarioBloqueadoConfiguracoes } from "./configuracoes-account-models";
import type {
  ExecutarAcaoAssincronaComArgumentoConfiguracoes,
  ExecutarAcaoAssincronaConfiguracoes,
} from "./configuracoes-callback-primitives";

export type CarregarUsuariosBloqueadosConfiguracoes =
  ExecutarAcaoAssincronaConfiguracoes;

export type DesbloquearUsuarioConfiguracoes =
  ExecutarAcaoAssincronaComArgumentoConfiguracoes<UsuarioBloqueadoConfiguracoes>;
