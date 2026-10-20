import { mesclarNotificacoes } from "./notificacoes-merge-utils";
import {
  prepararNotificacaoTexto,
  salvarNotificacoes,
} from "./notificacoes-local-state-utils";
import type { NotificacaoLocal } from "./notificacoes-models";

type CriarAtualizadorNotificacoesParametros = {
  setNotificacoes: (notificacoes: NotificacaoLocal[]) => void;
  definirNotificacoesNaoLidas: (total: number) => void;
  usuarioNotificacoesId: string;
};

export function criarAtualizadorNotificacoes({
  setNotificacoes,
  definirNotificacoesNaoLidas,
  usuarioNotificacoesId,
}: CriarAtualizadorNotificacoesParametros) {
  return function atualizarNotificacoes(novasNotificacoes: NotificacaoLocal[]) {
    const notificacoesNormalizadas = mesclarNotificacoes(
      [],
      novasNotificacoes
    ).map((notificacao) => prepararNotificacaoTexto(notificacao));

    setNotificacoes(notificacoesNormalizadas);
    definirNotificacoesNaoLidas(
      notificacoesNormalizadas.filter((notificacao) => !notificacao.lida).length
    );
    salvarNotificacoes(notificacoesNormalizadas, usuarioNotificacoesId);
  };
}
