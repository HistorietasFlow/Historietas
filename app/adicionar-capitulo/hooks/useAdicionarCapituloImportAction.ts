import type { ChangeEvent, Dispatch, SetStateAction } from "react";
import { prepararImportacaoArquivoTextoAdicionarCapitulo } from "../lib/adicionar-capitulo-text-import";

type UseAdicionarCapituloImportActionProps = {
  titulo: string;
  numeroNovoCapitulo: number;
  erro: string;
  capituloCriado: object | null;
  notificacaoCriada: object | null;
  preservarCriacao?: boolean;
  setTitulo: Dispatch<SetStateAction<string>>;
  setTexto: Dispatch<SetStateAction<string>>;
  setErro: Dispatch<SetStateAction<string>>;
  setCapituloCriado: (capitulo: null) => void;
  setNotificacaoCriada: (notificacao: null) => void;
  setArquivoImportadoNome: Dispatch<SetStateAction<string>>;
  setArquivoImportadoErro: Dispatch<SetStateAction<string>>;
};

export function useAdicionarCapituloImportAction({
  titulo,
  numeroNovoCapitulo,
  erro,
  capituloCriado,
  notificacaoCriada,
  preservarCriacao = false,
  setTitulo,
  setTexto,
  setErro,
  setCapituloCriado,
  setNotificacaoCriada,
  setArquivoImportadoNome,
  setArquivoImportadoErro,
}: UseAdicionarCapituloImportActionProps) {
  function limparFeedback() {
    if (erro) {
      setErro("");
    }

    if (capituloCriado && !preservarCriacao) {
      setCapituloCriado(null);
    }

    if (notificacaoCriada && !preservarCriacao) {
      setNotificacaoCriada(null);
    }
  }

  async function importarArquivoTexto(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const arquivo = event.target.files?.[0] || null;
    event.target.value = "";

    if (!arquivo) {
      return;
    }

    limparFeedback();
    setArquivoImportadoNome("");
    setArquivoImportadoErro("");

    const resultado =
      await prepararImportacaoArquivoTextoAdicionarCapitulo(
        arquivo,
        titulo,
        numeroNovoCapitulo,
      );

    if (!resultado.ok) {
      setArquivoImportadoErro(resultado.erro);
      return;
    }

    setTexto(resultado.textoImportado);

    if (!titulo.trim() && resultado.tituloArquivo) {
      setTitulo(resultado.tituloArquivo);
    }

    setArquivoImportadoNome(resultado.resumoArquivo);
  }

  return { limparFeedback, importarArquivoTexto };
}
