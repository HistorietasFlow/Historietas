import type { AtualizarTextoConfiguracoes } from "./configuracoes-callback-types";
import type { RouterConfiguracoesHistorico } from "./configuracoes-navigation-types";

type AcoesConteudoConfiguracoes = {
  router: RouterConfiguracoesHistorico;
  setErroUsername: AtualizarTextoConfiguracoes;
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
