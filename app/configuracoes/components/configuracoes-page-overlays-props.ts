import type { MensagemAcaoConfiguracoesVisual } from "../lib/configuracoes-action-message-models";
import type {
  AtualizarTextoConfiguracoes,
  EnviarFormularioConfiguracoes,
  FecharOverlayConfiguracoes,
  TraduzirTextoConfiguracoes,
} from "../lib/configuracoes-callback-types";

export type ConfiguracoesPageOverlaysProps = {
  mostrarSeguranca: boolean;
  onFecharSeguranca: FecharOverlayConfiguracoes;
  onAlterarSenha: EnviarFormularioConfiguracoes;
  senhaAtual: string;
  onSenhaAtualChange: AtualizarTextoConfiguracoes;
  novaSenha: string;
  onNovaSenhaChange: AtualizarTextoConfiguracoes;
  confirmarNovaSenha: string;
  onConfirmarNovaSenhaChange: AtualizarTextoConfiguracoes;
  salvandoSenha: boolean;
  erroSenha: string;
  senhaAlterada: boolean;
  mostrarExclusaoConta: boolean;
  onFecharExclusaoConta: FecharOverlayConfiguracoes;
  onExcluirConta: EnviarFormularioConfiguracoes;
  senhaExclusaoConta: string;
  onSenhaExclusaoContaChange: AtualizarTextoConfiguracoes;
  confirmacaoExclusaoConta: string;
  onConfirmacaoExclusaoContaChange: AtualizarTextoConfiguracoes;
  excluindoConta: boolean;
  erroExclusaoConta: string;
  mensagemAcao: MensagemAcaoConfiguracoesVisual | null;
  onFecharMensagemAcao: FecharOverlayConfiguracoes;
  traduzirTexto: TraduzirTextoConfiguracoes;
};
