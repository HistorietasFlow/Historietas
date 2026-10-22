import type { LimparMensagemAcaoConfiguracoes } from "./configuracoes-callback-types";

type AcoesCamposOverlayConfiguracoes = {
  setSenhaAtual: (senha: string) => void;
  setNovaSenha: (senha: string) => void;
  setConfirmarNovaSenha: (senha: string) => void;
  setErroSenha: (erro: string) => void;
  setSenhaExclusaoConta: (senha: string) => void;
  setConfirmacaoExclusaoConta: (confirmacao: string) => void;
  setErroExclusaoConta: (erro: string) => void;
  setMensagemAcao: LimparMensagemAcaoConfiguracoes;
};

export function criarAcoesCamposOverlayConfiguracoes({
  setSenhaAtual,
  setNovaSenha,
  setConfirmarNovaSenha,
  setErroSenha,
  setSenhaExclusaoConta,
  setConfirmacaoExclusaoConta,
  setErroExclusaoConta,
  setMensagemAcao,
}: AcoesCamposOverlayConfiguracoes) {
  return {
    onSenhaAtualChange(valor: string) {
      setSenhaAtual(valor);
      setErroSenha("");
    },
    onNovaSenhaChange(valor: string) {
      setNovaSenha(valor);
      setErroSenha("");
    },
    onConfirmarNovaSenhaChange(valor: string) {
      setConfirmarNovaSenha(valor);
      setErroSenha("");
    },
    onSenhaExclusaoContaChange(valor: string) {
      setSenhaExclusaoConta(valor);
      setErroExclusaoConta("");
    },
    onConfirmacaoExclusaoContaChange(valor: string) {
      setConfirmacaoExclusaoConta(valor);
      setErroExclusaoConta("");
    },
    onFecharMensagemAcao() {
      setMensagemAcao(null);
    },
  };
}
