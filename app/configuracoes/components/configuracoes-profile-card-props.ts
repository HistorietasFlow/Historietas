import type { TraduzirTextoConfiguracoes } from "../lib/configuracoes-callback-types";

export type ConfiguracoesProfileCardProps = {
  nomeExibicao: string;
  username: string;
  emailContato: string;
  usuarioNome: string | undefined;
  usuarioEmail: string | undefined;
  traduzirTexto: TraduzirTextoConfiguracoes;
};
