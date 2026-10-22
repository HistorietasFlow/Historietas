import type {
  FecharOverlayConfiguracoes,
  TraduzirTextoConfiguracoes,
} from "../lib/configuracoes-callback-types";
import type { MensagemAcaoConfiguracoesVisual } from "../lib/configuracoes-action-message-models";

export type ConfiguracoesActionToastProps = {
  mensagem: MensagemAcaoConfiguracoesVisual;
  onFechar: FecharOverlayConfiguracoes;
  traduzirTexto: TraduzirTextoConfiguracoes;
};
