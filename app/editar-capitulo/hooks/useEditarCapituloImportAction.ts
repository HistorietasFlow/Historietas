import type { ChangeEvent, Dispatch, SetStateAction } from "react";
import { prepararImportacaoArquivoTextoEditarCapitulo } from "../lib/editar-capitulo-text-import";

type UseEditarCapituloImportActionProps = {
  salvou: boolean;
  erro: string;
  arquivoImportadoErro: string;
  titulo: string;
  numeroCapitulo: number;
  setSalvou: Dispatch<SetStateAction<boolean>>;
  setErro: Dispatch<SetStateAction<string>>;
  setArquivoImportadoErro: Dispatch<SetStateAction<string>>;
  setArquivoImportadoNome: Dispatch<SetStateAction<string>>;
  setTexto: Dispatch<SetStateAction<string>>;
  setTitulo: Dispatch<SetStateAction<string>>;
};

export function useEditarCapituloImportAction({
  salvou,
  erro,
  arquivoImportadoErro,
  titulo,
  numeroCapitulo,
  setSalvou,
  setErro,
  setArquivoImportadoErro,
  setArquivoImportadoNome,
  setTexto,
  setTitulo,
}: UseEditarCapituloImportActionProps) {
  function marcarAlteracao() {
    if (salvou) {
      setSalvou(false);
    }

    if (erro) {
      setErro("");
    }

    if (arquivoImportadoErro) {
      setArquivoImportadoErro("");
    }
  }

  async function importarArquivoTexto(event: ChangeEvent<HTMLInputElement>) {
    const arquivo = event.target.files?.[0] || null;
    event.target.value = "";

    if (!arquivo) {
      return;
    }

    marcarAlteracao();
    setArquivoImportadoNome("");
    setArquivoImportadoErro("");

    const resultado = await prepararImportacaoArquivoTextoEditarCapitulo(
      arquivo,
      titulo,
      numeroCapitulo,
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

  return { marcarAlteracao, importarArquivoTexto };
}
