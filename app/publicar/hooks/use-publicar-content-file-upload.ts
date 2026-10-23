"use client";

import { useRef, useState } from "react";
import type { ChangeEvent } from "react";
import {
  arquivoObraAceito,
  arquivoTextoAceito,
  identificarCategoriaArquivo,
} from "../lib/publicar-file-utils";
import type { ArquivoObraLocal } from "../lib/publicar-models";
import {
  contarCaracteresValidos,
  nomeArquivoParaTitulo,
} from "../lib/publicar-text-utils";
import {
  TAMANHO_MAXIMO_ARQUIVO_OBRA,
  TAMANHO_MAXIMO_ARQUIVO_TEXTO,
} from "../lib/publicar-static-options";

type UsePublicarContentFileUploadParams = {
  setErro: (erro: string) => void;
};

export function usePublicarContentFileUpload({
  setErro,
}: UsePublicarContentFileUploadParams) {
  const [arquivoObra, setArquivoObra] = useState<ArquivoObraLocal | null>(null);
  const [arquivoObraArquivo, setArquivoObraArquivo] = useState<File | null>(null);
  const [arquivoObraErro, setArquivoObraErro] = useState("");
  const [arquivoCapituloNome, setArquivoCapituloNome] = useState("");
  const [arquivoCapituloTitulo, setArquivoCapituloTitulo] = useState("");
  const [arquivoCapituloTexto, setArquivoCapituloTexto] = useState("");
  const [arquivoCapituloErro, setArquivoCapituloErro] = useState("");
  const [arquivoTextoPendente, setArquivoTextoPendente] = useState<File | null>(null);
  const arquivoConteudoInputRef = useRef<HTMLInputElement | null>(null);

  function limparArquivoAnexado() {
    setArquivoObra(null);
    setArquivoObraArquivo(null);
    setArquivoObraErro("");
  }

  function limparCapituloImportado() {
    setArquivoCapituloNome("");
    setArquivoCapituloTitulo("");
    setArquivoCapituloTexto("");
    setArquivoCapituloErro("");
  }

  function limparSelecaoConteudoArquivo() {
    limparArquivoAnexado();
    limparCapituloImportado();
    setArquivoTextoPendente(null);

    if (arquivoConteudoInputRef.current) {
      arquivoConteudoInputRef.current.value = "";
    }
  }

  function anexarArquivoCompleto(arquivo: File) {
    setArquivoObraErro("");
    setArquivoCapituloErro("");
    setErro("");

    const leitor = new FileReader();

    leitor.onload = () => {
      const resultado = typeof leitor.result === "string" ? leitor.result : "";

      if (!resultado) {
        setArquivoObraErro("Não consegui carregar esse arquivo.");
        return;
      }

      limparCapituloImportado();
      setArquivoObra({
        nome: arquivo.name,
        tipo: arquivo.type || "application/octet-stream",
        tamanho: arquivo.size,
        conteudo: resultado,
        categoria: identificarCategoriaArquivo(arquivo),
        criadoEm: new Date().toISOString(),
      });
      setArquivoObraArquivo(arquivo);
      setArquivoTextoPendente(null);

      if (arquivoConteudoInputRef.current) {
        arquivoConteudoInputRef.current.value = "";
      }
    };

    leitor.onerror = () => {
      setArquivoObraErro("Não consegui carregar esse arquivo.");
    };

    leitor.readAsDataURL(arquivo);
  }

  function transformarArquivoTextoEmCapitulo(arquivo: File) {
    setArquivoObraErro("");
    setArquivoCapituloErro("");
    setErro("");

    if (arquivo.size > TAMANHO_MAXIMO_ARQUIVO_TEXTO) {
      setArquivoCapituloErro(
        "Para virar capítulo, o arquivo de texto precisa ter no máximo 900 KB. Você ainda pode anexá-lo como arquivo completo.",
      );
      return;
    }

    const leitor = new FileReader();

    leitor.onload = () => {
      const resultado = typeof leitor.result === "string" ? leitor.result : "";
      const textoImportado = resultado.replace(/\r\n/g, "\n").trim();

      if (contarCaracteresValidos(textoImportado) < 20) {
        setArquivoCapituloErro(
          "Esse arquivo tem pouco texto para virar um capítulo.",
        );
        return;
      }

      limparArquivoAnexado();
      setArquivoCapituloNome(arquivo.name);
      setArquivoCapituloTitulo(nomeArquivoParaTitulo(arquivo.name));
      setArquivoCapituloTexto(textoImportado);
      setArquivoTextoPendente(null);

      if (arquivoConteudoInputRef.current) {
        arquivoConteudoInputRef.current.value = "";
      }
    };

    leitor.onerror = () => {
      setArquivoCapituloErro("Não consegui ler esse arquivo.");
    };

    leitor.readAsText(arquivo, "UTF-8");
  }

  function cancelarEscolhaArquivoTexto() {
    setArquivoTextoPendente(null);
    setArquivoObraErro("");
    setArquivoCapituloErro("");

    if (arquivoConteudoInputRef.current) {
      arquivoConteudoInputRef.current.value = "";
    }
  }

  function selecionarConteudoArquivo(event: ChangeEvent<HTMLInputElement>) {
    const arquivo = event.target.files?.[0];

    setArquivoObraErro("");
    setArquivoCapituloErro("");
    setErro("");

    if (!arquivo) {
      return;
    }

    if (!arquivoObraAceito(arquivo)) {
      setArquivoObraErro(
        "Escolha PDF, TXT, MD ou imagem em PNG, JPG, WEBP ou GIF.",
      );
      event.target.value = "";
      return;
    }

    if (arquivo.size > TAMANHO_MAXIMO_ARQUIVO_OBRA) {
      setArquivoObraErro("O arquivo precisa ter no máximo 5 MB.");
      event.target.value = "";
      return;
    }

    if (arquivoTextoAceito(arquivo)) {
      setArquivoTextoPendente(arquivo);
      return;
    }

    anexarArquivoCompleto(arquivo);
  }

  return {
    anexarArquivoCompleto,
    arquivoCapituloErro,
    arquivoCapituloNome,
    arquivoCapituloTexto,
    arquivoCapituloTitulo,
    arquivoConteudoInputRef,
    arquivoObra,
    arquivoObraArquivo,
    arquivoObraErro,
    arquivoTextoPendente,
    cancelarEscolhaArquivoTexto,
    limparSelecaoConteudoArquivo,
    selecionarConteudoArquivo,
    transformarArquivoTextoEmCapitulo,
  };
}
