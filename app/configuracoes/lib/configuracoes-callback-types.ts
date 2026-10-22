import type { FormEventHandler } from "react";
import type { UsuarioBloqueadoConfiguracoes } from "./configuracoes-account-models";
import type {
  AtualizarValorConfiguracoes,
  ExecutarAcaoAssincronaComArgumentoConfiguracoes,
  ExecutarAcaoAssincronaConfiguracoes,
  ExecutarAcaoConfiguracoes,
} from "./configuracoes-callback-primitives";

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

export type LimparErroUsernameConfiguracoes = ExecutarAcaoConfiguracoes;

export type SalvarConfiguracoes = ExecutarAcaoConfiguracoes;

export type AbrirSegurancaConfiguracoes = ExecutarAcaoConfiguracoes;

export type AbrirExclusaoContaConfiguracoes = ExecutarAcaoConfiguracoes;

export type SairDaContaConfiguracoes = ExecutarAcaoConfiguracoes;

export type VoltarConfiguracoes = ExecutarAcaoConfiguracoes;

export type CopiarBackupConfiguracoes = ExecutarAcaoConfiguracoes;

export type BaixarBackupConfiguracoes = ExecutarAcaoConfiguracoes;

export type FecharOverlayConfiguracoes = ExecutarAcaoConfiguracoes;

export type EnviarFormularioConfiguracoes =
  FormEventHandler<HTMLFormElement>;

export type AtualizarBooleanoConfiguracoes = AtualizarValorConfiguracoes<boolean>;

export type CarregarUsuariosBloqueadosConfiguracoes =
  ExecutarAcaoAssincronaConfiguracoes;

export type DesbloquearUsuarioConfiguracoes =
  ExecutarAcaoAssincronaComArgumentoConfiguracoes<UsuarioBloqueadoConfiguracoes>;
