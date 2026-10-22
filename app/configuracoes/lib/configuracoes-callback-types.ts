import type { FormEventHandler } from "react";
import type {
  PreferenciasConta,
  UsuarioBloqueadoConfiguracoes,
} from "./configuracoes-account-models";
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

export type AlternarPerfilPrivadoConfiguracoes = () => void;

export type AlternarAprovacaoNovosSeguidoresConfiguracoes = () => void;

export type AplicarPrivacidadeAtualizadaConfiguracoes = (
  privacidadeAtualizada: PreferenciasPrivacidadeHistorietas,
) => void;

export type LimparErroUsernameConfiguracoes = () => void;

export type SalvarConfiguracoes = () => void;

export type AbrirSegurancaConfiguracoes = () => void;

export type AbrirExclusaoContaConfiguracoes = () => void;

export type SairDaContaConfiguracoes = () => void;

export type AtualizarBuscaConfiguracoes = (valor: string) => void;

export type VoltarConfiguracoes = () => void;

export type AlternarReceberAvisosConfiguracoes = () => void;

export type CopiarBackupConfiguracoes = () => void;

export type BaixarBackupConfiguracoes = () => void;

export type FecharOverlayConfiguracoes = () => void;

export type EnviarFormularioConfiguracoes =
  FormEventHandler<HTMLFormElement>;

export type AtualizarTextoConfiguracoes = (valor: string) => void;

export type CarregarUsuariosBloqueadosConfiguracoes = () => Promise<void>;

export type AlternarUsuariosBloqueadosConfiguracoes = () => void;

export type DesbloquearUsuarioConfiguracoes = (
  usuario: UsuarioBloqueadoConfiguracoes,
) => Promise<void>;
