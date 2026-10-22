import type { PreferenciasConta } from "./configuracoes-account-models";
import type { PreferenciasPrivacidadeHistorietas } from "./configuracoes-privacy-preferences";

export type TraduzirTextoConfiguracoes = (
  portugues: string,
  ingles: string,
  espanhol: string,
) => string;

export type TipoMensagemAcaoConfiguracoes = "sucesso" | "erro" | "aviso";

export type MensagemAcaoConfiguracoesVisual = {
  tipo: TipoMensagemAcaoConfiguracoes;
  texto: string;
};

export type MensagemAcaoConfiguracoes = MensagemAcaoConfiguracoesVisual & {
  id: number;
};

export type MostrarMensagemAcaoConfiguracoes = (
  tipo: TipoMensagemAcaoConfiguracoes,
  texto: string,
) => void;

export type DeveMostrarConfiguracoes = (...termos: string[]) => boolean;

export type AtualizarPreferenciaConfiguracoes = <K extends keyof PreferenciasConta>(
  campo: K,
  valor: PreferenciasConta[K],
) => void;

export type AtualizarPrivacidadeConfiguracoes = <
  K extends keyof PreferenciasPrivacidadeHistorietas,
>(
  campo: K,
  valor: PreferenciasPrivacidadeHistorietas[K],
) => void;
