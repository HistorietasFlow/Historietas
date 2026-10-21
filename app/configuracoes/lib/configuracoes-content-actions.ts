type RouterConfiguracoes = {
  back: () => void;
};

type AcoesConteudoConfiguracoes = {
  router: RouterConfiguracoes;
  setErroUsername: (erro: string) => void;
};

export function criarAcoesConteudoConfiguracoes({
  router,
  setErroUsername,
}: AcoesConteudoConfiguracoes) {
  return {
    onVoltar() {
      router.back();
    },
    onLimparErroUsername() {
      setErroUsername("");
    },
  };
}
