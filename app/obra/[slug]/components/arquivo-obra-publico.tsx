"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { MouseEvent } from "react";
import { formatarData, formatarTamanhoArquivo } from "../../../../lib/utils";
import { solicitarUrlTemporariaArquivoObra } from "../../../../lib/arquivosObras";
import LoadingSpinner from "../ObraLoadingSpinner";
import {
  obterCaminhoStorageArquivoObra,
  type ArquivoObraLocal,
} from "../lib/obra-file-utils";
import {
  desktopFileActionsStyle,
  desktopFileBoxStyle,
  desktopFileInfoCardStyle,
  fileActionsStyle,
  fileBoxStyle,
  fileIconBoxStyle,
  fileImagePreviewStyle,
  fileInfoCardStyle,
  fileInfoTextStyle,
  fileMetaStyle,
  filePreviewLinkStyle,
  filePrimaryButtonStyle,
  fileSecondaryButtonStyle,
} from "../lib/obra-style-utils";

const DURACAO_UTIL_URL_ARQUIVO_OBRA_MS = 9 * 60 * 1000;

export default function ArquivoObraPublico({
  obraId,
  arquivo,
  tituloObra,
  isDesktop,
}: {
  obraId: string;
  arquivo: ArquivoObraLocal;
  tituloObra: string;
  isDesktop: boolean;
}) {
  const tamanhoArquivo = formatarTamanhoArquivo(arquivo.tamanho);
  const dataArquivo = formatarData(arquivo.criadoEm);
  const arquivoConteudo = arquivo.conteudo.trim();
  const caminhoStorageArquivo =
    obterCaminhoStorageArquivoObra(arquivoConteudo);
  const nomeArquivoDownload =
    arquivo.nome?.trim() || "arquivo-da-obra";
  const [arquivoAssinado, setArquivoAssinado] = useState({
    caminho: "",
    url: "",
    erro: "",
    expiraEm: 0,
  });

  useEffect(() => {
    if (!caminhoStorageArquivo || arquivo.categoria !== "imagem") {
      return;
    }

    let cancelado = false;
    const controlador = new AbortController();

    async function prepararArquivoPrivado() {
      try {
        const url = await solicitarUrlTemporariaArquivoObra(
          obraId,
          controlador.signal,
        );

        if (!cancelado) {
          setArquivoAssinado({
            caminho: caminhoStorageArquivo,
            url,
            erro: "",
            expiraEm: Date.now() + DURACAO_UTIL_URL_ARQUIVO_OBRA_MS,
          });
        }
      } catch {
        if (!cancelado) {
          setArquivoAssinado({
            caminho: caminhoStorageArquivo,
            url: "",
            erro: "Não foi possível liberar este arquivo agora.",
            expiraEm: 0,
          });
        }
      }
    }

    void prepararArquivoPrivado();

    return () => {
      cancelado = true;
      controlador.abort();
    };
  }, [arquivo.categoria, caminhoStorageArquivo, obraId]);

  const assinaturaAtual =
    arquivoAssinado.caminho === caminhoStorageArquivo;
  const arquivoHref = caminhoStorageArquivo
    ? assinaturaAtual
      ? arquivoAssinado.url
      : ""
    : arquivoConteudo;
  const arquivoErro =
    caminhoStorageArquivo && assinaturaAtual
      ? arquivoAssinado.erro
      : "";
  const arquivoCarregando = Boolean(
    caminhoStorageArquivo &&
      arquivo.categoria === "imagem" &&
      !assinaturaAtual,
  );
  const podeTentarNovamente = Boolean(
    caminhoStorageArquivo && !arquivoCarregando && !arquivoHref,
  );
  const arquivoIndisponivel = Boolean(
    !arquivoHref && !podeTentarNovamente,
  );
  const arquivoHrefInterativo =
    arquivoHref || (podeTentarNovamente ? "#" : undefined);

  async function obterUrlArquivoAtual() {
    if (!caminhoStorageArquivo) {
      return arquivoConteudo;
    }

    if (
      assinaturaAtual &&
      arquivoAssinado.url &&
      arquivoAssinado.expiraEm > Date.now()
    ) {
      return arquivoAssinado.url;
    }

    try {
      const url = await solicitarUrlTemporariaArquivoObra(obraId);

      setArquivoAssinado({
        caminho: caminhoStorageArquivo,
        url,
        erro: "",
        expiraEm: Date.now() + DURACAO_UTIL_URL_ARQUIVO_OBRA_MS,
      });

      return url;
    } catch (error) {
      setArquivoAssinado({
        caminho: caminhoStorageArquivo,
        url: "",
        erro: "Não foi possível liberar este arquivo agora.",
        expiraEm: 0,
      });

      throw error;
    }
  }

  async function abrirArquivo(event: MouseEvent<HTMLAnchorElement>) {
    if (!caminhoStorageArquivo) {
      if (arquivoIndisponivel) {
        event.preventDefault();
      }

      return;
    }

    const assinaturaAindaValida = Boolean(
      assinaturaAtual &&
        arquivoAssinado.url &&
        arquivoAssinado.expiraEm > Date.now(),
    );

    if (assinaturaAindaValida) {
      return;
    }

    event.preventDefault();
    const novaJanela = window.open("about:blank", "_blank");

    if (novaJanela) {
      novaJanela.opener = null;
    }

    try {
      const url = await obterUrlArquivoAtual();

      if (novaJanela) {
        novaJanela.location.replace(url);
      } else {
        window.location.assign(url);
      }
    } catch {
      novaJanela?.close();
    }
  }

  async function baixarArquivo() {
    if (arquivoIndisponivel) {
      return;
    }

    const urlArquivo = await obterUrlArquivoAtual().catch(() => "");

    if (!urlArquivo) {
      return;
    }

    try {
      const resposta = await fetch(urlArquivo);

      if (!resposta.ok) {
        throw new Error("Não foi possível baixar o arquivo.");
      }

      const arquivoBlob = await resposta.blob();
      const arquivoUrlTemporaria =
        window.URL.createObjectURL(arquivoBlob);
      const linkDownload = document.createElement("a");

      linkDownload.href = arquivoUrlTemporaria;
      linkDownload.download = nomeArquivoDownload;
      document.body.appendChild(linkDownload);
      linkDownload.click();
      linkDownload.remove();

      window.setTimeout(() => {
        window.URL.revokeObjectURL(arquivoUrlTemporaria);
      }, 1000);
    } catch {
      const linkDownload = document.createElement("a");

      linkDownload.href = urlArquivo;
      linkDownload.download = nomeArquivoDownload;
      linkDownload.rel = "noopener noreferrer";
      document.body.appendChild(linkDownload);
      linkDownload.click();
      linkDownload.remove();
    }
  }

  return (
    <section style={isDesktop ? desktopFileBoxStyle : fileBoxStyle}>
      <div style={isDesktop ? desktopFileInfoCardStyle : fileInfoCardStyle}>
        <a
          href={arquivoHrefInterativo}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            ...filePreviewLinkStyle,
            opacity: arquivoIndisponivel ? 0.56 : 1,
            pointerEvents: arquivoIndisponivel ? "none" : "auto",
          }}
          aria-label={`Abrir arquivo ${arquivo.nome}`}
          aria-disabled={arquivoIndisponivel}
          onClick={abrirArquivo}
        >
          {arquivo.categoria === "imagem" && arquivoHref ? (
            <Image
              src={arquivoHref}
              alt={`Prévia do arquivo ${arquivo.nome}`}
              width={74}
              height={74}
              unoptimized
              style={fileImagePreviewStyle}
            />
          ) : (
            <span style={fileIconBoxStyle}>
              {arquivo.categoria === "documento"
                ? "PDF"
                : arquivo.categoria === "texto"
                  ? "TXT"
                  : "ARQ"}
            </span>
          )}
        </a>

        <div style={fileInfoTextStyle}>
          <span style={fileMetaStyle}>
            {tituloObra} • {tamanhoArquivo} • {dataArquivo}
          </span>

          {arquivoErro ? (
            <span
              style={{
                ...fileMetaStyle,
                color: "var(--historietas-obra-danger, #FFFFFF)",
              }}
            >
              {arquivoErro}
            </span>
          ) : null}

          <div style={isDesktop ? desktopFileActionsStyle : fileActionsStyle}>
            <a
              href={arquivoHrefInterativo}
              target="_blank"
              rel="noopener noreferrer"
              aria-disabled={arquivoIndisponivel}
              onClick={abrirArquivo}
              style={{
                ...filePrimaryButtonStyle,
                opacity: arquivoIndisponivel ? 0.58 : 1,
                pointerEvents: arquivoIndisponivel ? "none" : "auto",
              }}
            >
              {arquivoCarregando ? (
                <LoadingSpinner
                  compacto
                  label="Preparando arquivo"
                />
              ) : arquivoErro ? (
                "Tentar novamente"
              ) : (
                "Abrir arquivo"
              )}
            </a>

            <button
              type="button"
              onClick={baixarArquivo}
              disabled={arquivoIndisponivel}
              style={{
                ...fileSecondaryButtonStyle,
                opacity: arquivoIndisponivel ? 0.58 : 1,
                cursor: arquivoIndisponivel
                  ? "not-allowed"
                  : "pointer",
              }}
            >
              {arquivoCarregando ? (
                <LoadingSpinner
                  compacto
                  label="Preparando download"
                />
              ) : (
                "Baixar arquivo"
              )}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
