import type { TipoMensagemAcaoConfiguracoes } from "./configuracoes-action-message-models";
import type {
  AtualizarValorConfiguracoes,
  ExecutarAcaoComArgumentosConfiguracoes,
} from "./configuracoes-callback-primitives";

export type MostrarMensagemAcaoConfiguracoes =
  ExecutarAcaoComArgumentosConfiguracoes<
    [TipoMensagemAcaoConfiguracoes, string]
  >;

export type LimparMensagemAcaoConfiguracoes = AtualizarValorConfiguracoes<null>;
