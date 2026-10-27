type DenunciaComObservacaoModeracao = {
  id: string;
  observacaoAdmin: string;
};

export function sincronizarObservacoesModeracao(
  observacoesAtuais: Record<string, string>,
  denunciasComContexto: DenunciaComObservacaoModeracao[],
) {
  const proximasObservacoes = { ...observacoesAtuais };

  denunciasComContexto.forEach((denuncia) => {
    if (!(denuncia.id in proximasObservacoes)) {
      proximasObservacoes[denuncia.id] = denuncia.observacaoAdmin;
    }
  });

  return proximasObservacoes;
}
