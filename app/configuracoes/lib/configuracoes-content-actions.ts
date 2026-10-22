import type { RouterConfiguracoesHistorico } from "./configuracoes-navigation-types";

type AcoesConteudoConfiguracoes = {
  router: RouterConfiguracoesHistorico;
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
