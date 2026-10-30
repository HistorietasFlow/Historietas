import type { ChangeEvent, Dispatch, RefObject, SetStateAction } from "react";
import {
  TAMANHO_MAXIMO_ARQUIVO_OBRA,
  TAMANHO_MAXIMO_CAPA,
} from "../lib/editar-obra-form-config";
import {
  arquivoImagemAceito,
  arquivoObraAceito,
  identificarCategoriaArquivo,
} from "../lib/editar-obra-file-validation";
import type { ArquivoObraLocal } from "../types";

type UseEditarObraAssetActionsProps = {
  marcarAlteracao: () => void;
  capaInputRef: RefObject<HTMLInputElement | null>;
  arquivoObraInputRef: RefObject<HTMLInputElement | null>;
  setCapaErro: Dispatch<SetStateAction<string>>;
  setCapa: Dispatch<SetStateAction<string>>;
  setCapaNome: Dispatch<SetStateAction<string>>;
  setCapaArquivo: Dispatch<SetStateAction<File | null>>;
  setCapaRemovidaManualmente: Dispatch<SetStateAction<boolean>>;
  setArquivoObraErro: Dispatch<SetStateAction<string>>;
  setArquivoObra: Dispatch<SetStateAction<ArquivoObraLocal | null>>;
  setArquivoObraArquivo: Dispatch<SetStateAction<File | null>>;
  setArquivoObraRemovidoManualmente: Dispatch<SetStateAction<boolean>>;
};

export function useEditarObraAssetActions({
  marcarAlteracao,
  capaInputRef,
  arquivoObraInputRef,
  setCapaErro,
  setCapa,
  setCapaNome,
  setCapaArquivo,
  setCapaRemovidaManualmente,
  setArquivoObraErro,
  setArquivoObra,
  setArquivoObraArquivo,
  setArquivoObraRemovidoManualmente,
}: UseEditarObraAssetActionsProps) {
  function selecionarCapa(event: ChangeEvent<HTMLInputElement>) {
    const arquivo = event.target.files?.[0];

    setCapaErro("");
    marcarAlteracao();

    if (!arquivo) {
      return;
    }

    setCapaArquivo(null);

    if (!arquivoImagemAceito(arquivo)) {
      setCapaErro("Escolha um arquivo de imagem válido.");
      event.target.value = "";
      return;
    }

    if (arquivo.size > TAMANHO_MAXIMO_CAPA) {
      setCapaErro("A capa precisa ter no máximo 2 MB.");
      event.target.value = "";
      return;
    }

    const leitor = new FileReader();

    leitor.onload = () => {
      const resultado = typeof leitor.result === "string" ? leitor.result : "";

      if (!resultado) {
        setCapaErro("Não consegui carregar essa imagem.");
        return;
      }

      setCapa(resultado);
      setCapaNome(arquivo.name);
      setCapaArquivo(arquivo);
      setCapaRemovidaManualmente(false);
    };

    leitor.onerror = () => {
      setCapaErro("Não consegui carregar essa imagem.");
    };

    leitor.readAsDataURL(arquivo);
  }

  function removerCapa() {
    setCapa("");
    setCapaNome("");
    setCapaArquivo(null);
    setCapaRemovidaManualmente(true);
    setCapaErro("");
    marcarAlteracao();

    if (capaInputRef.current) {
      capaInputRef.current.value = "";
    }
  }

  function selecionarArquivoObra(event: ChangeEvent<HTMLInputElement>) {
    const arquivo = event.target.files?.[0];

    setArquivoObraErro("");
    marcarAlteracao();

    if (!arquivo) {
      return;
    }

    setArquivoObraArquivo(null);

    if (!arquivoObraAceito(arquivo)) {
      setArquivoObraErro(
        "Escolha PDF, TXT, MD ou imagem em PNG, JPG, WEBP ou GIF."
      );
      event.target.value = "";
      return;
    }

    if (arquivo.size > TAMANHO_MAXIMO_ARQUIVO_OBRA) {
      setArquivoObraErro(
        "O arquivo completo precisa ter no máximo 5 MB."
      );
      event.target.value = "";
      return;
    }

    const leitor = new FileReader();

    leitor.onload = () => {
      const resultado = typeof leitor.result === "string" ? leitor.result : "";

      if (!resultado) {
        setArquivoObraErro("Não consegui carregar esse arquivo.");
        return;
      }

      setArquivoObraRemovidoManualmente(false);
      setArquivoObra({
        nome: arquivo.name,
        tipo: arquivo.type || "application/octet-stream",
        tamanho: arquivo.size,
        conteudo: resultado,
        categoria: identificarCategoriaArquivo(arquivo),
        criadoEm: new Date().toISOString(),
      });
      setArquivoObraArquivo(arquivo);
    };

    leitor.onerror = () => {
      setArquivoObraErro("Não consegui carregar esse arquivo.");
    };

    leitor.readAsDataURL(arquivo);
  }

  function removerArquivoObra() {
    setArquivoObra(null);
    setArquivoObraArquivo(null);
    setArquivoObraRemovidoManualmente(true);
    setArquivoObraErro("");
    marcarAlteracao();

    if (arquivoObraInputRef.current) {
      arquivoObraInputRef.current.value = "";
    }
  }

  return {
    selecionarCapa,
    removerCapa,
    selecionarArquivoObra,
    removerArquivoObra,
  };
}
