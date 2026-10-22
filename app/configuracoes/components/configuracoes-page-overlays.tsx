import type { FormEventHandler } from "react";
import { ConfiguracoesAccountDeletionModal } from "./configuracoes-account-deletion-modal";
import { ConfiguracoesActionToast } from "./configuracoes-action-toast";
import { ConfiguracoesSecurityPasswordModal } from "./configuracoes-security-password-modal";
import type {
  MensagemAcaoConfiguracoesVisual,
  TraduzirTextoConfiguracoes,
} from "../lib/configuracoes-callback-types";

type ConfiguracoesPageOverlaysProps = {
  mostrarSeguranca: boolean;
  onFecharSeguranca: () => void;
  onAlterarSenha: FormEventHandler<HTMLFormElement>;
  senhaAtual: string;
  onSenhaAtualChange: (valor: string) => void;
  novaSenha: string;
  onNovaSenhaChange: (valor: string) => void;
  confirmarNovaSenha: string;
  onConfirmarNovaSenhaChange: (valor: string) => void;
  salvandoSenha: boolean;
  erroSenha: string;
  senhaAlterada: boolean;
  mostrarExclusaoConta: boolean;
  onFecharExclusaoConta: () => void;
  onExcluirConta: FormEventHandler<HTMLFormElement>;
  senhaExclusaoConta: string;
  onSenhaExclusaoContaChange: (valor: string) => void;
  confirmacaoExclusaoConta: string;
  onConfirmacaoExclusaoContaChange: (valor: string) => void;
  excluindoConta: boolean;
  erroExclusaoConta: string;
  mensagemAcao: MensagemAcaoConfiguracoesVisual | null;
  onFecharMensagemAcao: () => void;
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
