type AcoesComentariosRef = {
  current: Set<string>;
};

type CriarControlesComentariosCapituloProps = {
  acoesComentariosCapituloRef:
    AcoesComentariosRef;

  setComentarioStatus:
    (valor: string) => void;

  setMostrarComentario:
    (
      valor:
        | boolean
        | ((atual: boolean) => boolean)
    ) => void;
};

export function criarControlesComentariosCapitulo({
  acoesComentariosCapituloRef,
  setComentarioStatus,
  setMostrarComentario,
}: CriarControlesComentariosCapituloProps) {
  async function alternarComentarioVisivel() {
    setComentarioStatus("");

    setMostrarComentario(
      (valorAtual) =>
        !valorAtual,
    );
  }

  function fecharComentariosCapitulo() {
    setMostrarComentario(false);
  }

  function iniciarAcaoComentariosCapitulo(
    chave: string,
  ) {
    if (
      acoesComentariosCapituloRef
        .current
        .has(chave)
    ) {
      return false;
    }

    acoesComentariosCapituloRef
      .current
      .add(chave);

    return true;
  }

  function finalizarAcaoComentariosCapitulo(
    chave: string,
  ) {
    acoesComentariosCapituloRef
      .current
      .delete(chave);
  }

  return {
    alternarComentarioVisivel,
    fecharComentariosCapitulo,
    iniciarAcaoComentariosCapitulo,
    finalizarAcaoComentariosCapitulo,
  };
}
