import type { PreferenciasConta } from "./configuracoes-account-models";
import type {
  AtualizarCampoConfiguracoes,
  AtualizarValorConfiguracoes,
} from "./configuracoes-callback-primitives";
import type { PreferenciasPrivacidadeHistorietas } from "./configuracoes-privacy-preferences";

export type AtualizarPreferenciaConfiguracoes =
  AtualizarCampoConfiguracoes<PreferenciasConta>;

export type AtualizarPrivacidadeConfiguracoes =
  AtualizarCampoConfiguracoes<PreferenciasPrivacidadeHistorietas>;

export type AplicarPrivacidadeAtualizadaConfiguracoes =
  AtualizarValorConfiguracoes<PreferenciasPrivacidadeHistorietas>;
