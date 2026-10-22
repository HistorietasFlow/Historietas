import type {
  AtualizarTextoConfiguracoes,
  VerificarCondicaoConfiguracoes,
} from "./configuracoes-callback-primitives";

export type TraduzirTextoConfiguracoes = (
  portugues: string,
  ingles: string,
  espanhol: string,
) => string;

export type DeveMostrarConfiguracoes =
  VerificarCondicaoConfiguracoes<string[]>;

export type AtualizarBuscaConfiguracoes = AtualizarTextoConfiguracoes;
