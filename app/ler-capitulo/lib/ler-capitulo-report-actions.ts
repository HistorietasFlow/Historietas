import type {
  ComentarioCapituloPublico,
} from "../components/ler-capitulo-comments-sheet";

import type {
  CapituloLocal,
} from "./ler-capitulo-work-normalization";

import {
  criarLoginHrefLeitor,
} from "./ler-capitulo-login-route";

export type AlvoDenunciaLeitor = {
  alvoTipo:
    | "capitulo"
    | "comentario_capitulo";
  alvoId: string;
  alvoTitulo: string;
};

type RouterDenunciaLeitor = {
  push: (href: string) => void;
};

type CriarAcoesDenunciaLeitorProps = {
  obraId: string;
  capituloId: string;
  capituloAtual: CapituloLocal | null;
  comentariosCapitulo:
    ComentarioCapituloPublico[];
  router: RouterDenunciaLeitor;

  obterUsuarioLogadoIdAtual:
    () => Promise<string>;

  setMensagemAcao:
    (valor: string) => void;

  setMostrarAjustes:
    (valor: boolean) => void;

  setComentarioStatus:
    (valor: string) => void;

  setDenunciaAlvo:
    (
      valor:
        | AlvoDenunciaLeitor
        | null,
    ) => void;
};

export function criarAcoesDenunciaLeitor({
  obraId,
  capituloId,
  capituloAtual,
  comentariosCapitulo,
  router,
  obterUsuarioLogadoIdAtual,
  setMensagemAcao,
  setMostrarAjustes,
  setComentarioStatus,
  setDenunciaAlvo,
}: CriarAcoesDenunciaLeitorProps) {
  async function abrirDenunciaCapituloAtual() {
    const userIdAtual =
      await obterUsuarioLogadoIdAtual();

    if (!userIdAtual) {
      setMensagemAcao(
        "Entre na sua conta para denunciar este capítulo.",
      );

      router.push(
        criarLoginHrefLeitor(
          obraId,
          capituloId,
        ),
      );

      return;
    }

    if (!capituloAtual) {
      return;
    }

    setMostrarAjustes(false);

    setDenunciaAlvo({
      alvoTipo: "capitulo",
      alvoId: capituloAtual.id,
      alvoTitulo:
        capituloAtual.titulo,
    });
  }

  async function denunciarComentarioCapitulo(
    comentarioId: string,
  ) {
    const userIdAtual =
      await obterUsuarioLogadoIdAtual();

    if (!userIdAtual) {
      setMensagemAcao(
        "Entre na sua conta para denunciar comentários.",
      );

      router.push(
        criarLoginHrefLeitor(
          obraId,
          capituloId,
        ),
      );

      return;
    }

    const comentario =
      comentariosCapitulo.find(
        (item) =>
          item.id === comentarioId,
      );

    setComentarioStatus("");

    setDenunciaAlvo({
      alvoTipo:
        "comentario_capitulo",
      alvoId: comentarioId,
      alvoTitulo: comentario
        ? `Comentário de ${comentario.nome}`
        : "Comentário de capítulo",
    });
  }

  return {
    abrirDenunciaCapituloAtual,
    denunciarComentarioCapitulo,
  };
}
