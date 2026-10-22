import type {
  AtualizarTextoConfiguracoes,
  LimparMensagemAcaoConfiguracoes,
} from "./configuracoes-callback-types";

type AcoesCamposOverlayConfiguracoes = {
  setSenhaAtual: AtualizarTextoConfiguracoes;
  setNovaSenha: AtualizarTextoConfiguracoes;
  setConfirmarNovaSenha: AtualizarTextoConfiguracoes;
  setErroSenha: AtualizarTextoConfiguracoes;
  setSenhaExclusaoConta: AtualizarTextoConfiguracoes;
  setConfirmacaoExclusaoConta: AtualizarTextoConfiguracoes;
  setErroExclusaoConta: AtualizarTextoConfiguracoes;
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
