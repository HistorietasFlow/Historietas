import type {
  TraduzirTextoConfiguracoes,
  VoltarConfiguracoes,
} from "../lib/configuracoes-callback-types";

export type ConfiguracoesPageHeaderProps = {
  onVoltar: VoltarConfiguracoes;
  traduzirTexto: TraduzirTextoConfiguracoes;
};
