type AcoesAberturaExclusaoContaConfiguracoes = {
  setSenhaExclusaoConta: (senha: string) => void;
  setConfirmacaoExclusaoConta: (confirmacao: string) => void;
  setErroExclusaoConta: (erro: string) => void;
  setMostrarExclusaoConta: (mostrar: boolean) => void;
};

type AcoesFechamentoExclusaoContaConfiguracoes =
  AcoesAberturaExclusaoContaConfiguracoes & {
    excluindoConta: boolean;
  };

type AcoesAberturaSegurancaConfiguracoes = {
  setSenhaAtual: (senha: string) => void;
  setNovaSenha: (senha: string) => void;
  setConfirmarNovaSenha: (senha: string) => void;
  setErroSenha: (erro: string) => void;
  setSenhaAlterada: (alterada: boolean) => void;
  setMostrarSeguranca: (mostrar: boolean) => void;
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
