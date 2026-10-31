"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { historietasThemeCss, useHistorietasTheme } from "../../lib/historietasTheme";
import { useState } from "react";
import { useHistorietasLanguage } from "../../components/HistorietasLanguageProvider";
import type { ChangeEvent } from "react";
import { EditarCapituloLanguageBridge } from "./components/EditarCapituloLanguageBridge";
import { useEditarCapituloDesktopMode } from "./hooks/useEditarCapituloDesktopMode";
import { useEditarCapituloDerivedValues } from "./hooks/useEditarCapituloDerivedValues";
import { useEditarCapituloDeleteAction } from "./hooks/useEditarCapituloDeleteAction";
import { useEditarCapituloInitialLoad } from "./hooks/useEditarCapituloInitialLoad";
import { useEditarCapituloSaveAction } from "./hooks/useEditarCapituloSaveAction";
import { editarCapituloPageCss } from "./lib/editar-capitulo-page-css";
import { prepararImportacaoArquivoTextoEditarCapitulo } from "./lib/editar-capitulo-text-import";
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
  formStyle,
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
  importTitleStyle,
  importIconBoxStyle,
  importIconStyle,
  importSuccessStyle,
  importErrorStyle,
  importButtonStyle,
  hiddenFileInputStyle,
  buttonAreaStyle,
  saveButtonStyle,
  disabledButtonStyle,
  secondaryButtonStyle,
  cancelButtonStyle,
  deleteButtonStyle,
  disabledDeleteButtonStyle,
  previewPanelStyle,
  previewHeaderStyle,
  previewMiniTitleStyle,
  previewChapterCardStyle,
  previewChapterTitleStyle,
  previewChapterTextStyle,
  previewTopRowStyle,
  desktopContainerStyle,
  desktopMainGridStyle,
  desktopFormStyle,
  desktopFormHeaderStyle,
  desktopFormTitleStyle,
  desktopImportBoxStyle,
  desktopImportButtonStyle,
  desktopTextareaStyle,
  desktopButtonAreaStyle,
  desktopSaveButtonStyle,
  desktopDisabledButtonStyle,
  desktopSecondaryButtonStyle,
  desktopCancelButtonStyle,
  desktopDeleteButtonStyle,
  desktopDisabledDeleteButtonStyle,
  desktopPreviewPanelStyle,
  desktopPreviewChapterCardStyle,
  desktopPreviewChapterTitleStyle,
  desktopPreviewChapterTextStyle,
} from "./lib/editar-capitulo-styles";

export default function EditarCapituloPage() {
  const router = useRouter();
  const [salvou, setSalvou] = useState(false);
  const [processando, setProcessando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [erro, setErro] = useState("");
  const [tipoErro, setTipoErro] = useState<"salvar" | "excluir">("salvar");

  const [titulo, setTitulo] = useState("");
  const [texto, setTexto] = useState("");
  const [arquivoImportadoNome, setArquivoImportadoNome] = useState("");
  const [arquivoImportadoErro, setArquivoImportadoErro] = useState("");
  const {
    obraId,
    capituloId,
    obras,
    setObras,
    carregando,
    verificandoAcesso,
  } = useEditarCapituloInitialLoad({
    router,
    setTitulo,
    setTexto,
  });
  const isDesktop = useEditarCapituloDesktopMode();
  const { language } = useHistorietasLanguage();
  const { pageThemeStyle } = useHistorietasTheme(pageStyle);

  const {
    obraAtual,
    capituloAtual,
    numeroCapitulo,
    capituloLabel,
    minhaObraHref,
    lerCapituloHref,
    tituloPreview,
    textoPreview,
  } = useEditarCapituloDerivedValues({
    obras,
    obraId,
    capituloId,
    titulo,
    texto,
  });

  const { salvarEdicao } = useEditarCapituloSaveAction({
    router,
    obraId,
    capituloId,
    obras,
    obraAtual,
    capituloAtual,
    numeroCapitulo,
    titulo,
    texto,
    processando,
    excluindo,
    setObras,
    setProcessando,
    setErro,
    setTipoErro,
    setSalvou,
  });

  const { excluirCapitulo } = useEditarCapituloDeleteAction({
    router,
    language,
    obraId,
    capituloId,
    obras,
    obraAtual,
    capituloAtual,
    processando,
    excluindo,
    setObras,
    setExcluindo,
    setErro,
    setTipoErro,
    setSalvou,
  });

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

  if (carregando || verificandoAcesso) {
    return (
      <main data-historietas-editar-capitulo-root="true" style={pageThemeStyle}>
        <style>{`${historietasThemeCss}${editarCapituloPageCss}`}</style>
        <EditarCapituloLanguageBridge />

        {isDesktop && <div style={desktopTopWaterFadeStyle} aria-hidden="true" />}
        {!isDesktop && <div style={mobileTopWaterFadeStyle} aria-hidden="true" />}
      </main>
    );
  }

  if (!obraAtual || !capituloAtual) {
    return (
      <main data-historietas-editar-capitulo-root="true" style={pageThemeStyle}>
        <style>{`${historietasThemeCss}${editarCapituloPageCss}`}</style>
        <EditarCapituloLanguageBridge />

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
            Capítulo não encontrado
          </p>
        </section>
      </main>
    );
  }

  return (
    <main data-historietas-editar-capitulo-root="true" style={pageThemeStyle}>
      <style>{`${historietasThemeCss}${editarCapituloPageCss}`}</style>
      <EditarCapituloLanguageBridge />

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
              EDITAR CAPÍTULO
            </span>
          </Link>

        </header>

        {erro && (
          <section style={errorBoxStyle}>
            <h2 style={errorTitleStyle}>
              {tipoErro === "excluir"
                ? "Não foi possível excluir"
                : "Não foi possível salvar"}
            </h2>

            <p style={errorTextStyle}>{erro}</p>
          </section>
        )}

        <section style={isDesktop ? desktopMainGridStyle : mainGridStyle}>
          <form onSubmit={salvarEdicao} style={isDesktop ? desktopFormStyle : formStyle}>
            <div
              style={
                isDesktop
                  ? { ...desktopFormHeaderStyle, gridColumn: "1 / -1" }
                  : formHeaderStyle
              }
            >
              <span style={formMiniTitleStyle}>{capituloLabel}</span>

              <h2 style={isDesktop ? desktopFormTitleStyle : formTitleStyle}>
                <span data-historietas-i18n-ignore="true">
                  {obraAtual.titulo}
                </span>
              </h2>
            </div>

            <div style={fieldGroupStyle}>
              <label htmlFor="editar-capitulo-titulo" style={labelStyle}>Título do capítulo</label>

              <input
                id="editar-capitulo-titulo"
                value={titulo}
                onChange={(event) => {
                  setTitulo(event.target.value);
                  marcarAlteracao();
                }}
                placeholder={`Ex: Capítulo ${numeroCapitulo}`}
                style={inputStyle}
                type="text"
              />

              <span style={hintStyle}>
                Se deixar vazio, o sistema usa Capítulo {numeroCapitulo}.
              </span>
            </div>

            <div
              style={
                isDesktop
                  ? { ...fieldGroupStyle, gridColumn: "1 / -1" }
                  : fieldGroupStyle
              }
            >
              <label htmlFor="editar-capitulo-texto" style={labelStyle}>Texto do capítulo</label>

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
                id="editar-capitulo-texto"
                value={texto}
                onChange={(event) => {
                  setTexto(event.target.value);
                  marcarAlteracao();
                }}
                placeholder="Escreva o texto do capítulo"
                style={isDesktop ? desktopTextareaStyle : textareaStyle}
              />

              <span style={hintStyle}>Mínimo: 20 letras ou números.</span>
            </div>

            <div style={isDesktop ? desktopButtonAreaStyle : buttonAreaStyle}>
              <button
                type="submit"
                style={{
                  ...((processando || excluindo)
                    ? isDesktop
                      ? desktopDisabledButtonStyle
                      : disabledButtonStyle
                    : isDesktop
                      ? desktopSaveButtonStyle
                      : saveButtonStyle),
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "7px",
                }}
                disabled={processando || excluindo}
              >
                {processando ? (
                  "Salvando..."
                ) : salvou ? (
                  <>
                    <span>Atualizado</span>
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
                  "Salvar alterações"
                )}
              </button>

              <Link href={lerCapituloHref} style={isDesktop ? desktopSecondaryButtonStyle : secondaryButtonStyle}>
                Ler capítulo
              </Link>

              <Link href={minhaObraHref} style={isDesktop ? desktopCancelButtonStyle : cancelButtonStyle}>
                Cancelar
              </Link>

              <button
                type="button"
                onClick={() => {
                  void excluirCapitulo();
                }}
                style={
                  excluindo || processando
                    ? isDesktop
                      ? desktopDisabledDeleteButtonStyle
                      : disabledDeleteButtonStyle
                    : isDesktop
                      ? desktopDeleteButtonStyle
                      : deleteButtonStyle
                }
                disabled={excluindo || processando}
              >
                {excluindo ? "Excluindo..." : "Excluir capítulo"}
              </button>
            </div>
          </form>

          <aside style={isDesktop ? desktopPreviewPanelStyle : previewPanelStyle}>
            <div style={previewHeaderStyle}>
              <span style={previewMiniTitleStyle}>PRÉVIA DO CAPÍTULO</span>
            </div>

            <article style={isDesktop ? desktopPreviewChapterCardStyle : previewChapterCardStyle}>
              <div style={previewTopRowStyle}>
                <h3 style={isDesktop ? desktopPreviewChapterTitleStyle : previewChapterTitleStyle}>
                  {titulo.trim() ? (
                    <span data-historietas-i18n-ignore="true">{tituloPreview}</span>
                  ) : (
                    tituloPreview
                  )}
                </h3>
              </div>

              <p style={isDesktop ? desktopPreviewChapterTextStyle : previewChapterTextStyle}>
                {texto.trim() ? (
                  <span data-historietas-i18n-ignore="true">{textoPreview}</span>
                ) : (
                  textoPreview
                )}
              </p>
            </article>
          </aside>
        </section>
      </section>
    </main>
  );
}
