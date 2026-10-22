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

export type LimparMensagemAcaoConfiguracoes = (mensagem: null) => void;

export type DeveMostrarConfiguracoes = (...termos: string[]) => boolean;

export type ExecutarAcaoConfiguracoes = () => void;

export type ExecutarAcaoAssincronaConfiguracoes = () => Promise<void>;

export type ExecutarAcaoAssincronaComArgumentoConfiguracoes<Argumento> = (
  argumento: Argumento,
) => Promise<void>;

export type AtualizarValorConfiguracoes<Valor> = (valor: Valor) => void;

export type AtualizarTextoConfiguracoes = AtualizarValorConfiguracoes<string>;

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

export type AlternarConfiguracao = ExecutarAcaoConfiguracoes;

export type AlternarPerfilPrivadoConfiguracoes = AlternarConfiguracao;

export type AlternarAprovacaoNovosSeguidoresConfiguracoes =
  AlternarConfiguracao;

export type AplicarPrivacidadeAtualizadaConfiguracoes = (
  privacidadeAtualizada: PreferenciasPrivacidadeHistorietas,
) => void;

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
