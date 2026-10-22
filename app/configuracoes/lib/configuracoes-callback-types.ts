import type { FormEventHandler } from "react";
import type {
  PreferenciasConta,
  UsuarioBloqueadoConfiguracoes,
} from "./configuracoes-account-models";
import type { TipoMensagemAcaoConfiguracoes } from "./configuracoes-action-message-models";
import type {
  AtualizarCampoConfiguracoes,
  AtualizarTextoConfiguracoes,
  AtualizarValorConfiguracoes,
  ExecutarAcaoAssincronaComArgumentoConfiguracoes,
  ExecutarAcaoAssincronaConfiguracoes,
  ExecutarAcaoComArgumentosConfiguracoes,
  ExecutarAcaoConfiguracoes,
  VerificarCondicaoConfiguracoes,
} from "./configuracoes-callback-primitives";
import type { PreferenciasPrivacidadeHistorietas } from "./configuracoes-privacy-preferences";

export type {
  AtualizarCampoConfiguracoes,
  AtualizarTextoConfiguracoes,
  AtualizarValorConfiguracoes,
  ExecutarAcaoAssincronaComArgumentoConfiguracoes,
  ExecutarAcaoAssincronaConfiguracoes,
  ExecutarAcaoComArgumentosConfiguracoes,
  ExecutarAcaoConfiguracoes,
  VerificarCondicaoConfiguracoes,
} from "./configuracoes-callback-primitives";

export type TraduzirTextoConfiguracoes = (
  portugues: string,
  ingles: string,
  espanhol: string,
) => string;

export type MostrarMensagemAcaoConfiguracoes =
  ExecutarAcaoComArgumentosConfiguracoes<
    [TipoMensagemAcaoConfiguracoes, string]
  >;

export type LimparMensagemAcaoConfiguracoes = AtualizarValorConfiguracoes<null>;

export type DeveMostrarConfiguracoes =
  VerificarCondicaoConfiguracoes<string[]>;

export type AtualizarPreferenciaConfiguracoes =
  AtualizarCampoConfiguracoes<PreferenciasConta>;

export type AtualizarPrivacidadeConfiguracoes =
  AtualizarCampoConfiguracoes<PreferenciasPrivacidadeHistorietas>;

export type AlternarConfiguracao = ExecutarAcaoConfiguracoes;

export type AlternarPerfilPrivadoConfiguracoes = AlternarConfiguracao;

export type AlternarAprovacaoNovosSeguidoresConfiguracoes =
  AlternarConfiguracao;

export type AplicarPrivacidadeAtualizadaConfiguracoes =
  AtualizarValorConfiguracoes<PreferenciasPrivacidadeHistorietas>;

export type LimparErroUsernameConfiguracoes = ExecutarAcaoConfiguracoes;

export type SalvarConfiguracoes = ExecutarAcaoConfiguracoes;

export type AbrirSegurancaConfiguracoes = ExecutarAcaoConfiguracoes;

export type AbrirExclusaoContaConfiguracoes = ExecutarAcaoConfiguracoes;

export type SairDaContaConfiguracoes = ExecutarAcaoConfiguracoes;

export type AtualizarBuscaConfiguracoes = AtualizarTextoConfiguracoes;

export type VoltarConfiguracoes = ExecutarAcaoConfiguracoes;

export type AlternarReceberAvisosConfiguracoes = AlternarConfiguracao;

export type CopiarBackupConfiguracoes = ExecutarAcaoConfiguracoes;

export type BaixarBackupConfiguracoes = ExecutarAcaoConfiguracoes;

export type FecharOverlayConfiguracoes = ExecutarAcaoConfiguracoes;

export type EnviarFormularioConfiguracoes =
  FormEventHandler<HTMLFormElement>;

export type AtualizarBooleanoConfiguracoes = AtualizarValorConfiguracoes<boolean>;

export type CarregarUsuariosBloqueadosConfiguracoes =
  ExecutarAcaoAssincronaConfiguracoes;

export type AlternarUsuariosBloqueadosConfiguracoes = AlternarConfiguracao;

export type DesbloquearUsuarioConfiguracoes =
  ExecutarAcaoAssincronaComArgumentoConfiguracoes<UsuarioBloqueadoConfiguracoes>;
