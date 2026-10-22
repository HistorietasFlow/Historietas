import type {
  AtualizarBooleanoConfiguracoes,
  AtualizarTextoConfiguracoes,
} from "./configuracoes-callback-types";

type AcoesAberturaExclusaoContaConfiguracoes = {
  setSenhaExclusaoConta: AtualizarTextoConfiguracoes;
  setConfirmacaoExclusaoConta: AtualizarTextoConfiguracoes;
  setErroExclusaoConta: AtualizarTextoConfiguracoes;
  setMostrarExclusaoConta: AtualizarBooleanoConfiguracoes;
};

type AcoesFechamentoExclusaoContaConfiguracoes =
  AcoesAberturaExclusaoContaConfiguracoes & {
    excluindoConta: boolean;
  };

type AcoesAberturaSegurancaConfiguracoes = {
  setSenhaAtual: AtualizarTextoConfiguracoes;
  setNovaSenha: AtualizarTextoConfiguracoes;
  setConfirmarNovaSenha: AtualizarTextoConfiguracoes;
  setErroSenha: AtualizarTextoConfiguracoes;
  setSenhaAlterada: AtualizarBooleanoConfiguracoes;
  setMostrarSeguranca: AtualizarBooleanoConfiguracoes;
};

type AcoesFechamentoSegurancaConfiguracoes =
  AcoesAberturaSegurancaConfiguracoes & {
    salvandoSenha: boolean;
  };

export function abrirExclusaoContaConfiguracoes({
  setSenhaExclusaoConta,
  setConfirmacaoExclusaoConta,
  setErroExclusaoConta,
  setMostrarExclusaoConta,
}: AcoesAberturaExclusaoContaConfiguracoes) {
  setSenhaExclusaoConta("");
  setConfirmacaoExclusaoConta("");
  setErroExclusaoConta("");
  setMostrarExclusaoConta(true);
}

export function fecharExclusaoContaConfiguracoes({
  excluindoConta,
  setSenhaExclusaoConta,
  setConfirmacaoExclusaoConta,
  setErroExclusaoConta,
  setMostrarExclusaoConta,
}: AcoesFechamentoExclusaoContaConfiguracoes) {
  if (excluindoConta) {
    return;
  }

  setMostrarExclusaoConta(false);
  setSenhaExclusaoConta("");
  setConfirmacaoExclusaoConta("");
  setErroExclusaoConta("");
}

export function abrirSegurancaConfiguracoes({
  setSenhaAtual,
  setNovaSenha,
  setConfirmarNovaSenha,
  setErroSenha,
  setSenhaAlterada,
  setMostrarSeguranca,
}: AcoesAberturaSegurancaConfiguracoes) {
  setSenhaAtual("");
  setNovaSenha("");
  setConfirmarNovaSenha("");
  setErroSenha("");
  setSenhaAlterada(false);
  setMostrarSeguranca(true);
}

export function fecharSegurancaConfiguracoes({
  salvandoSenha,
  setSenhaAtual,
  setNovaSenha,
  setConfirmarNovaSenha,
  setErroSenha,
  setSenhaAlterada,
  setMostrarSeguranca,
}: AcoesFechamentoSegurancaConfiguracoes) {
  if (salvandoSenha) {
    return;
  }

  setMostrarSeguranca(false);
  setSenhaAtual("");
  setNovaSenha("");
  setConfirmarNovaSenha("");
  setErroSenha("");
  setSenhaAlterada(false);
}
