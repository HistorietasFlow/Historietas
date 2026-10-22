import type { ResumoLocal } from "../lib/configuracoes-account-models";
import type {
  DeveMostrarConfiguracoes,
  TraduzirTextoConfiguracoes,
} from "../lib/configuracoes-callback-types";

export type ConfiguracoesUsageSummarySectionProps = {
  deveMostrar: DeveMostrarConfiguracoes;
  traduzirTexto: TraduzirTextoConfiguracoes;
  resumo: ResumoLocal;
  totalBiblioteca: number;
  notificacoesNaoLidas: number;
};
