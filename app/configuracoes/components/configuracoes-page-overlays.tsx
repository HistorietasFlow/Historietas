import { ConfiguracoesAccountDeletionModal } from "./configuracoes-account-deletion-modal";
import { ConfiguracoesActionToast } from "./configuracoes-action-toast";
import { ConfiguracoesSecurityPasswordModal } from "./configuracoes-security-password-modal";
import type {
  MensagemAcaoConfiguracoesVisual,
  AtualizarTextoConfiguracoes,
  EnviarFormularioConfiguracoes,
  FecharOverlayConfiguracoes,
  TraduzirTextoConfiguracoes,
} from "../lib/configuracoes-callback-types";

type ConfiguracoesPageOverlaysProps = {
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

export function ConfiguracoesPageOverlays({
  mostrarSeguranca,
  onFecharSeguranca,
  onAlterarSenha,
  senhaAtual,
  onSenhaAtualChange,
  novaSenha,
  onNovaSenhaChange,
  confirmarNovaSenha,
  onConfirmarNovaSenhaChange,
  salvandoSenha,
  erroSenha,
  senhaAlterada,
  mostrarExclusaoConta,
  onFecharExclusaoConta,
  onExcluirConta,
  senhaExclusaoConta,
  onSenhaExclusaoContaChange,
  confirmacaoExclusaoConta,
  onConfirmacaoExclusaoContaChange,
  excluindoConta,
  erroExclusaoConta,
  mensagemAcao,
  onFecharMensagemAcao,
  traduzirTexto,
}: ConfiguracoesPageOverlaysProps) {
  return (
    <>
      {mostrarSeguranca ? (
        <ConfiguracoesSecurityPasswordModal
          onFechar={onFecharSeguranca}
          onSubmit={onAlterarSenha}
          senhaAtual={senhaAtual}
          onSenhaAtualChange={onSenhaAtualChange}
          novaSenha={novaSenha}
          onNovaSenhaChange={onNovaSenhaChange}
          confirmarNovaSenha={confirmarNovaSenha}
          onConfirmarNovaSenhaChange={onConfirmarNovaSenhaChange}
          salvandoSenha={salvandoSenha}
          erroSenha={erroSenha}
          senhaAlterada={senhaAlterada}
          traduzirTexto={traduzirTexto}
        />
      ) : null}

      {mostrarExclusaoConta ? (
        <ConfiguracoesAccountDeletionModal
          onFechar={onFecharExclusaoConta}
          onSubmit={onExcluirConta}
          senhaExclusaoConta={senhaExclusaoConta}
          onSenhaExclusaoContaChange={onSenhaExclusaoContaChange}
          confirmacaoExclusaoConta={confirmacaoExclusaoConta}
          onConfirmacaoExclusaoContaChange={onConfirmacaoExclusaoContaChange}
          excluindoConta={excluindoConta}
          erroExclusaoConta={erroExclusaoConta}
          traduzirTexto={traduzirTexto}
        />
      ) : null}

      {mensagemAcao ? (
        <ConfiguracoesActionToast
          mensagem={mensagemAcao}
          onFechar={onFecharMensagemAcao}
          traduzirTexto={traduzirTexto}
        />
      ) : null}
    </>
  );
}
