import type {
  AtualizarBuscaConfiguracoes,
  TraduzirTextoConfiguracoes,
} from "../lib/configuracoes-callback-types";

export type ConfiguracoesSearchProps = {
  busca: string;
  onBuscaChange: AtualizarBuscaConfiguracoes;
  traduzirTexto: TraduzirTextoConfiguracoes;
};
