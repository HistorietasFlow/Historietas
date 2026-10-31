"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { historietasThemeCss, useHistorietasTheme } from "../../lib/historietasTheme";
import { useHistorietasLanguage } from "../../components/HistorietasLanguageProvider";
import { prepararImportacaoArquivoTextoAdicionarCapitulo } from "./lib/adicionar-capitulo-text-import";
import { useAdicionarCapituloCreateAction } from "./hooks/useAdicionarCapituloCreateAction";
import { useAdicionarCapituloDesktopMode } from "./hooks/useAdicionarCapituloDesktopMode";
import { useAdicionarCapituloDerivedValues } from "./hooks/useAdicionarCapituloDerivedValues";
import { useAdicionarCapituloLanguageBridge } from "./hooks/useAdicionarCapituloLanguageBridge";
import { useAdicionarCapituloInitialLoad } from "./hooks/useAdicionarCapituloInitialLoad";
import {
  adicionarCapituloPageCss,
} from "./lib/adicionar-capitulo-page-css";
import {
  mobileTopWaterFadeStyle,
  desktopTopWaterFadeStyle,
  pageStyle,
  containerStyle,
  titleHeaderStyle,
  desktopTitleHeaderStyle,
  headerTitleLinkStyle,
  desktopHeaderTitleLinkStyle,
  headerTitleTextStyle,
  desktopHeaderTitleTextStyle,
  errorBoxStyle,
  errorTitleStyle,
  errorTextStyle,
  mainGridStyle,
  formPanelStyle,
  formHeaderStyle,
  formMiniTitleStyle,
  formTitleStyle,
  fieldGroupStyle,
  labelStyle,
  inputStyle,
  textareaStyle,
  hintStyle,
  importBoxStyle,
  importInfoStyle,
  importIconStyle,
  importIconBoxStyle,
  importTitleStyle,
  importSuccessStyle,
  importErrorStyle,
  importButtonStyle,
  hiddenFileInputStyle,
  buttonAreaStyle,
  primaryButtonStyle,
  disabledButtonStyle,
  secondaryButtonStyle,
  cancelButtonStyle,
  desktopCancelButtonStyle,
  previewPanelStyle,
  previewHeaderStyle,
  previewMiniTitleStyle,
  previewChapterCardStyle,
  previewChapterTitleStyle,
  previewChapterTextStyle,
  desktopPreviewChapterTextStyle,
  desktopPreviewChapterTitleStyle,
  previewTopRowStyle,
  desktopContainerStyle,
  desktopMainGridSoloStyle,
  desktopFormPanelStyle,
  desktopFormHeaderStyle,
  desktopFormTitleStyle,
  desktopImportBoxStyle,
  desktopImportButtonStyle,
  desktopTextareaStyle,
  desktopButtonAreaStyle,
  desktopPrimaryButtonStyle,
  desktopDisabledButtonStyle,
  desktopSecondaryButtonStyle,
  desktopPreviewPanelStyle,
  desktopPreviewChapterCardStyle,
} from "./lib/adicionar-capitulo-styles";
import { normalizarObra } from "./lib/adicionar-capitulo-work-normalizer";
import {
  restaurarArquivoObraComBackup,
} from "./lib/adicionar-capitulo-file-backup-utils";
import {
  carregarBackupArquivosObras,
} from "./lib/adicionar-capitulo-file-backup-storage";
import { atualizarObrasLocaisDoUsuario } from "./lib/adicionar-capitulo-ownership-utils";
import {
  carregarObrasLocais,
  salvarObrasAdicionarCapituloStorage,
} from "./lib/adicionar-capitulo-local-work-storage";

type CapituloLocal = {
  id: string;
  titulo: string;
  texto: string;
  curtiu: boolean;
  salvo: boolean;
  comentario: string;
  criadoEm: string;
  lido: boolean;
  lidoEm: string;
  publicado?: boolean;
  ordem?: number;
};

type ArquivoObraLocal = {
  nome: string;
  tipo: string;
  tamanho: number;
  conteudo: string;
  categoria: "texto" | "documento" | "imagem" | "outro";
  criadoEm: string;
};

type ObraLocal = {
  id: string;
  titulo: string;
  autor: string;
  autorId?: string;
  genero: string;
  formato: string;
  classificacaoIndicativa: string;
  sinopse: string;
  tags: string[];
  capa: string;
  capaNome: string;
  arquivoObra?: ArquivoObraLocal | null;
  publicado: boolean;
  capitulos: CapituloLocal[];
  criadaEm: string;
  ultimoCapituloLidoId: string;
  ultimaLeituraEm: string;
  progressoLeitura: number;
  visualizacoes?: number;
  totalCurtidas?: number;
  totalComentarios?: number;
  totalSalvos?: number;
  totalLidos?: number;
  slug: string;
  link: string;
};

type NotificacaoLocal = {
  id: string;
  tipo: "novo-capitulo";
  titulo: string;
  mensagem: string;
  obraId: string;
  obraTitulo: string;
  autor: string;
  capituloId: string;
  capituloTitulo: string;
  href: string;
  lida: boolean;
  criadaEm: string;
  obraPublicada: boolean;
  capa: string;
  classificacaoIndicativa: string;
};

export default function AdicionarCapituloPage() {
  const router = useRouter();

  const {
    obraId,
    usuarioIdLogado,
    obras,
    carregando,
    setObras,
  } = useAdicionarCapituloInitialLoad({
    router,
  });
  const [titulo, setTitulo] = useState("");
  const [texto, setTexto] = useState("");
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState("");
  const [capituloCriado, setCapituloCriado] = useState<CapituloLocal | null>(
    null
  );
  const [notificacaoCriada, setNotificacaoCriada] =
    useState<NotificacaoLocal | null>(null);
  const [arquivoImportadoNome, setArquivoImportadoNome] = useState("");
  const [arquivoImportadoErro, setArquivoImportadoErro] = useState("");
  const isDesktop = useAdicionarCapituloDesktopMode();
  const { pageThemeStyle } = useHistorietasTheme(pageStyle);
  const { language } = useHistorietasLanguage();
  const criandoCapituloRef = useRef(false);
  const raizTraducaoRef = useRef<HTMLElement | null>(null);

  const {
    obraAtual,
    numeroNovoCapitulo,
    tituloPreview,
    textoPreview,
    minhaObraHref,
    capituloCriadoHref,
  } = useAdicionarCapituloDerivedValues({
    obras,
    obraId,
    titulo,
    texto,
    capituloCriado,
  });

  const { criarCapitulo } = useAdicionarCapituloCreateAction({
    router,
    obraAtual,
    obraId,
    obras,
    usuarioIdLogado,
    titulo,
    texto,
    numeroNovoCapitulo,
    processando,
    criandoCapituloRef,
    salvarObras,
    setProcessando,
    setErro,
    setCapituloCriado,
    setNotificacaoCriada,
    setTitulo,
    setTexto,
    setArquivoImportadoNome,
    setArquivoImportadoErro,
  });

  useAdicionarCapituloLanguageBridge({
    raizTraducaoRef,
    language,
    carregando,
    obraAtual,
  });

  function salvarObras(novasObras: ObraLocal[]) {
    const backupArquivosObras = carregarBackupArquivosObras(usuarioIdLogado);
    const obrasNormalizadas = novasObras.map((obra, index) =>
      restaurarArquivoObraComBackup(
        normalizarObra(obra, index),
        backupArquivosObras
      )
    );

    if (!usuarioIdLogado) {
      setObras(obrasNormalizadas);
      return;
    }

    let todasObrasLocaisAtuais: ObraLocal[] = [];

    try {
      todasObrasLocaisAtuais = carregarObrasLocais(usuarioIdLogado);
    } catch {
      todasObrasLocaisAtuais = [];
    }

    const obrasLocaisAtualizadas = atualizarObrasLocaisDoUsuario(
      todasObrasLocaisAtuais,
      obrasNormalizadas,
      usuarioIdLogado
    );

    salvarObrasAdicionarCapituloStorage(obrasLocaisAtualizadas, usuarioIdLogado);
    setObras(obrasNormalizadas);
  }

  function limparFeedback() {
    if (erro) {
      setErro("");
    }

    if (capituloCriado) {
      setCapituloCriado(null);
    }

    if (notificacaoCriada) {
      setNotificacaoCriada(null);
    }
  }

  async function importarArquivoTexto(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const arquivo = event.target.files?.[0] || null;
    event.target.value = "";

    if (!arquivo) {
      return;
    }

    limparFeedback();
    setArquivoImportadoNome("");
    setArquivoImportadoErro("");

    const resultado = await prepararImportacaoArquivoTextoAdicionarCapitulo(
      arquivo,
      titulo,
      numeroNovoCapitulo
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

  if (carregando) {
    return (
      <main ref={raizTraducaoRef} style={pageThemeStyle}>
        <style>{`${historietasThemeCss}${adicionarCapituloPageCss}`}</style>

        {isDesktop && <div style={desktopTopWaterFadeStyle} aria-hidden="true" />}
        {!isDesktop && <div style={mobileTopWaterFadeStyle} aria-hidden="true" />}
      </main>
    );
  }

  if (!obraAtual) {
    return (
      <main ref={raizTraducaoRef} style={pageThemeStyle}>
        <style>{`${historietasThemeCss}${adicionarCapituloPageCss}`}</style>

        {isDesktop && <div style={desktopTopWaterFadeStyle} aria-hidden="true" />}
        {!isDesktop && <div style={mobileTopWaterFadeStyle} aria-hidden="true" />}

        <section style={isDesktop ? desktopContainerStyle : containerStyle}>
          <p
            style={{
              margin: "10px 0 0",
              color: "#FFFFFF",
              fontSize: "12px",
              fontWeight: 800,
              textAlign: "center",
            }}
          >
            Obra não encontrada
          </p>
        </section>
      </main>
    );
  }

  return (
    <main ref={raizTraducaoRef} style={pageThemeStyle}>
      <style>{`${historietasThemeCss}${adicionarCapituloPageCss}`}</style>

      {isDesktop && <div style={desktopTopWaterFadeStyle} aria-hidden="true" />}
      {!isDesktop && <div style={mobileTopWaterFadeStyle} aria-hidden="true" />}

      <section style={isDesktop ? desktopContainerStyle : containerStyle}>
        <header style={isDesktop ? desktopTitleHeaderStyle : titleHeaderStyle}>
          <Link
            href="/"
            style={isDesktop ? desktopHeaderTitleLinkStyle : headerTitleLinkStyle}
            aria-label="Voltar para a Home"
          >
            <span
              className="historietas-theme-title"
              style={isDesktop ? desktopHeaderTitleTextStyle : headerTitleTextStyle}
            >
              ADICIONAR CAPÍTULO
            </span>
          </Link>

        </header>

        {erro && (
          <section style={errorBoxStyle}>
            <h2 style={errorTitleStyle}>Não foi possível criar</h2>

            <p style={errorTextStyle}>{erro}</p>
          </section>
        )}

        <section style={isDesktop ? desktopMainGridSoloStyle : mainGridStyle}>
          <form onSubmit={criarCapitulo} style={isDesktop ? desktopFormPanelStyle : formPanelStyle}>
            <div
              style={
                isDesktop
                  ? { ...desktopFormHeaderStyle, gridColumn: "1 / -1" }
                  : formHeaderStyle
              }
            >
              <span style={formMiniTitleStyle}>Capítulo {String(numeroNovoCapitulo || 1).padStart(2, "0")}</span>

              <h2 style={isDesktop ? desktopFormTitleStyle : formTitleStyle}>
                {obraAtual.titulo}
              </h2>
            </div>

            <div style={fieldGroupStyle}>
              <label htmlFor="adicionar-capitulo-titulo" style={labelStyle}>Título do capítulo</label>

              <input
                id="adicionar-capitulo-titulo"
                value={titulo}
                onChange={(event) => {
                  setTitulo(event.target.value);
                  limparFeedback();
                  setArquivoImportadoErro("");
                }}
                style={inputStyle}
                placeholder={`Ex: Capítulo ${numeroNovoCapitulo}`}
                type="text"
              />

              <span style={hintStyle}>
                Opcional. Se deixar vazio, o sistema usa Capítulo{" "}
                {numeroNovoCapitulo}.
              </span>
            </div>

            <div
              style={
                isDesktop
                  ? { ...fieldGroupStyle, gridColumn: "1 / -1" }
                  : fieldGroupStyle
              }
            >
              <label htmlFor="adicionar-capitulo-texto" style={labelStyle}>Texto do capítulo</label>

              <div style={isDesktop ? desktopImportBoxStyle : importBoxStyle}>
                <div style={importIconBoxStyle}>
                  <span style={importIconStyle}>TXT</span>
                </div>

                <div style={importInfoStyle}>
                  <strong style={importTitleStyle}>Importar versão revisada</strong>

                  <span style={hintStyle}>
                    Opcional. Importe um arquivo .txt ou .md.
                  </span>

                  {arquivoImportadoNome && (
                    <span style={importSuccessStyle}>
                      Arquivo importado: {arquivoImportadoNome}
                    </span>
                  )}

                  {arquivoImportadoErro && (
                    <span style={importErrorStyle}>{arquivoImportadoErro}</span>
                  )}

                  <label style={isDesktop ? desktopImportButtonStyle : importButtonStyle}>
                    Importar .txt/.md
                    <input
                      type="file"
                      accept=".txt,.md,text/plain,text/markdown"
                      onChange={importarArquivoTexto}
                      style={hiddenFileInputStyle}
                    />
                  </label>
                </div>
              </div>

              <textarea
                id="adicionar-capitulo-texto"
                value={texto}
                onChange={(event) => {
                  setTexto(event.target.value);
                  limparFeedback();
                  setArquivoImportadoErro("");
                }}
                style={isDesktop ? desktopTextareaStyle : textareaStyle}
                placeholder="Escreva o texto do capítulo aqui..."
              />
            </div>
            <div style={isDesktop ? desktopButtonAreaStyle : buttonAreaStyle}>
              <button
                type="submit"
                style={{
                  ...(processando
                    ? isDesktop
                      ? desktopDisabledButtonStyle
                      : disabledButtonStyle
                    : isDesktop
                      ? desktopPrimaryButtonStyle
                      : primaryButtonStyle),
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "7px",
                }}
                disabled={processando}
              >
                {processando ? (
                  "Salvando..."
                ) : capituloCriado ? (
                  <>
                    <span>Criado</span>
                    <svg
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                      style={{ width: 17, height: 17, flex: "0 0 auto" }}
                    >
                      <path
                        d="M20 6 9 17l-5-5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </>
                ) : (
                  "Criar capítulo"
                )}
              </button>

              <Link href={capituloCriadoHref || minhaObraHref} style={isDesktop ? desktopSecondaryButtonStyle : secondaryButtonStyle}>
                {capituloCriado ? "Ler capítulo" : "Ver obra"}
              </Link>

              <Link href={minhaObraHref} style={isDesktop ? desktopCancelButtonStyle : cancelButtonStyle}>
                Cancelar
              </Link>
            </div>

          </form>

          <aside style={isDesktop ? desktopPreviewPanelStyle : previewPanelStyle}>
            <div style={previewHeaderStyle}>
              <span style={previewMiniTitleStyle}>PRÉVIA DO CAPÍTULO</span>
            </div>

            <article style={isDesktop ? desktopPreviewChapterCardStyle : previewChapterCardStyle}>
              <div style={previewTopRowStyle}>
                <h3 style={isDesktop ? desktopPreviewChapterTitleStyle : previewChapterTitleStyle}>
                  {tituloPreview}
                </h3>
              </div>

              <p style={isDesktop ? desktopPreviewChapterTextStyle : previewChapterTextStyle}>
                {textoPreview}
              </p>
            </article>
          </aside>
        </section>
      </section>
    </main>
  );
}
