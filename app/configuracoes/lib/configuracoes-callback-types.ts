import type { ExecutarAcaoConfiguracoes } from "./configuracoes-callback-primitives";

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
export type {
  AtualizarBuscaConfiguracoes,
  DeveMostrarConfiguracoes,
  TraduzirTextoConfiguracoes,
} from "./configuracoes-presentation-types";
export type {
  LimparMensagemAcaoConfiguracoes,
  MostrarMensagemAcaoConfiguracoes,
} from "./configuracoes-feedback-action-types";
export type {
  AplicarPrivacidadeAtualizadaConfiguracoes,
  AtualizarPreferenciaConfiguracoes,
  AtualizarPrivacidadeConfiguracoes,
} from "./configuracoes-preference-action-types";
export type {
  AlternarAprovacaoNovosSeguidoresConfiguracoes,
  AlternarConfiguracao,
  AlternarPerfilPrivadoConfiguracoes,
  AlternarReceberAvisosConfiguracoes,
  AlternarUsuariosBloqueadosConfiguracoes,
} from "./configuracoes-toggle-types";
export type {
  LimparErroUsernameConfiguracoes,
  SalvarConfiguracoes,
  SairDaContaConfiguracoes,
  CopiarBackupConfiguracoes,
  BaixarBackupConfiguracoes,
} from "./configuracoes-account-action-types";
export type {
  AbrirSegurancaConfiguracoes,
  AbrirExclusaoContaConfiguracoes,
  FecharOverlayConfiguracoes,
  EnviarFormularioConfiguracoes,
  AtualizarBooleanoConfiguracoes,
} from "./configuracoes-overlay-action-types";
export type {
  CarregarUsuariosBloqueadosConfiguracoes,
  DesbloquearUsuarioConfiguracoes,
} from "./configuracoes-blocked-users-action-types";

export type VoltarConfiguracoes = ExecutarAcaoConfiguracoes;
