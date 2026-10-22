import type { ChangeEventHandler, RefObject } from "react";
import type { ArquivoObraLocal } from "../lib/publicar-models";
import {
  chapterImportBoxStyle,
  chapterImportContentStyle,
  chapterImportIconBoxStyle,
  chapterImportIconStyle,
  chapterImportStatsStyle,
  chapterImportTitleStyle,
  coverButtonStyle,
  coverButtonsStyle,
  coverErrorStyle,
  desktopCoverButtonStyle,
  desktopCoverButtonsStyle,
  desktopFileUploadIconBoxStyle,
  desktopFullWidthArquivoObraBoxStyle,
  desktopFullWidthArquivoObraContentStyle,
  desktopFullWidthFieldStyle,
  desktopRemoveCoverButtonStyle,
  fieldGroupStyle,
  fileNameStyle,
  fileOptionalBadgeStyle,
  fileUploadLabelRowStyle,
  hiddenInputStyle,
  hintStyle,
  inlineStatStyle,
  labelStyle,
  removeCoverButtonStyle,
} from "../lib/publicar-form-upload-styles";

type ChaveTextoArquivoPublicar =
  | "adicionarConteudoArquivo"
  | "anexadoObra"
  | "anexarArquivoCompleto"
  | "arquivoCompletoAnexado"
  | "cancelar"
  | "comoUsarArquivo"
  | "dicaArquivo"
  | "dicaArquivoPendente"
  | "enviarArquivo"
  | "escolherArquivo"
  | "opcional"
  | "palavras"
  | "primeiroCapitulo"
  | "primeiroCapituloImportado"
  | "remover"
  | "texto"
  | "titulo"
  | "transformarCapitulo"
  | "trocarArquivo";

type PublicarContentFileUploadProps = {
  arquivoCapituloErro: string;
  arquivoCapituloMinutos: number;
  arquivoCapituloNome: string;
  arquivoCapituloPalavras: number;
  arquivoCapituloTitulo: string;
  arquivoConteudoInputRef: RefObject<HTMLInputElement | null>;
  arquivoObra: ArquivoObraLocal | null;
  arquivoObraErro: string;
  arquivoObraTamanhoTexto: string;
  arquivoObraTipoTexto: string;
  arquivoTextoPendente: File | null;
  arquivoTextoPendenteTamanhoTexto: string;
  isDesktop: boolean;
  onAnexarArquivoCompleto: (arquivo: File) => void;
  onCancelarEscolhaArquivoTexto: () => void;
  onLimparSelecaoConteudoArquivo: () => void;
  onSelecionarConteudoArquivo: ChangeEventHandler<HTMLInputElement>;
  onTransformarArquivoTextoEmCapitulo: (arquivo: File) => void;
  t: (chave: ChaveTextoArquivoPublicar) => string;
  temCapituloImportado: boolean;
  temConteudoPorArquivo: boolean;
  traduzirMensagem: (mensagem: string) => string;
};

export function PublicarContentFileUpload({
  arquivoCapituloErro,
  arquivoCapituloMinutos,
  arquivoCapituloNome,
  arquivoCapituloPalavras,
  arquivoCapituloTitulo,
  arquivoConteudoInputRef,
  arquivoObra,
  arquivoObraErro,
  arquivoObraTamanhoTexto,
  arquivoObraTipoTexto,
  arquivoTextoPendente,
  arquivoTextoPendenteTamanhoTexto,
  isDesktop,
  onAnexarArquivoCompleto,
  onCancelarEscolhaArquivoTexto,
  onLimparSelecaoConteudoArquivo,
  onSelecionarConteudoArquivo,
  onTransformarArquivoTextoEmCapitulo,
  t,
  temCapituloImportado,
  temConteudoPorArquivo,
  traduzirMensagem,
}: PublicarContentFileUploadProps) {
  return (
    <div style={isDesktop ? desktopFullWidthFieldStyle : fieldGroupStyle}>
      <div style={fileUploadLabelRowStyle}>
        <label style={labelStyle}>{t("adicionarConteudoArquivo")}</label>
        <span style={fileOptionalBadgeStyle}>{t("opcional")}</span>
      </div>

      <input
        ref={arquivoConteudoInputRef}
        type="file"
        accept=".pdf,.txt,.md,.png,.jpg,.jpeg,.webp,.gif,application/pdf,text/plain,text/markdown,image/png,image/jpeg,image/webp,image/gif"
        onChange={onSelecionarConteudoArquivo}
        style={hiddenInputStyle}
      />

      <div style={isDesktop ? desktopFullWidthArquivoObraBoxStyle : chapterImportBoxStyle}>
        <div
          style={
            isDesktop
              ? { ...chapterImportIconBoxStyle, ...desktopFileUploadIconBoxStyle }
              : chapterImportIconBoxStyle
          }
        >
          <span style={chapterImportIconStyle}>
            {temCapituloImportado ? "⇧" : "▣"}
          </span>
        </div>

        <div
          style={
            isDesktop
              ? desktopFullWidthArquivoObraContentStyle
              : chapterImportContentStyle
          }
        >
          <strong style={chapterImportTitleStyle}>
            {arquivoTextoPendente
              ? t("comoUsarArquivo")
              : arquivoObra
                ? t("arquivoCompletoAnexado")
                : temCapituloImportado
                  ? t("primeiroCapituloImportado")
                  : t("enviarArquivo")}
          </strong>

          <span style={hintStyle}>
            {arquivoTextoPendente ? t("dicaArquivoPendente") : t("dicaArquivo")}
          </span>

          {arquivoTextoPendente && (
            <span style={fileNameStyle}>
              {arquivoTextoPendente.name} • {t("texto")} • {arquivoTextoPendenteTamanhoTexto}
            </span>
          )}

          {arquivoObra && !arquivoTextoPendente && (
            <span style={fileNameStyle}>
              {arquivoObra.nome} • {arquivoObraTipoTexto} • {arquivoObraTamanhoTexto}
            </span>
          )}

          {temCapituloImportado && !arquivoTextoPendente && (
            <span style={fileNameStyle}>
              {arquivoCapituloNome} • {t("primeiroCapitulo")}
            </span>
          )}

          {arquivoObraErro && (
            <span style={coverErrorStyle}>{traduzirMensagem(arquivoObraErro)}</span>
          )}

          {arquivoCapituloErro && (
            <span style={coverErrorStyle}>{traduzirMensagem(arquivoCapituloErro)}</span>
          )}

          {arquivoTextoPendente ? (
            <div style={isDesktop ? desktopCoverButtonsStyle : coverButtonsStyle}>
              <button
                type="button"
                onClick={() => onTransformarArquivoTextoEmCapitulo(arquivoTextoPendente)}
                style={isDesktop ? desktopCoverButtonStyle : coverButtonStyle}
              >
                {t("transformarCapitulo")}
              </button>

              <button
                type="button"
                onClick={() => onAnexarArquivoCompleto(arquivoTextoPendente)}
                style={isDesktop ? desktopCoverButtonStyle : coverButtonStyle}
              >
                {t("anexarArquivoCompleto")}
              </button>

              <button
                type="button"
                onClick={onCancelarEscolhaArquivoTexto}
                style={isDesktop ? desktopRemoveCoverButtonStyle : removeCoverButtonStyle}
              >
                {t("cancelar")}
              </button>
            </div>
          ) : (
            <div style={isDesktop ? desktopCoverButtonsStyle : coverButtonsStyle}>
              <button
                type="button"
                onClick={() => arquivoConteudoInputRef.current?.click()}
                style={isDesktop ? desktopCoverButtonStyle : coverButtonStyle}
              >
                {temConteudoPorArquivo ? t("trocarArquivo") : t("escolherArquivo")}
              </button>

              {temConteudoPorArquivo && (
                <button
                  type="button"
                  onClick={onLimparSelecaoConteudoArquivo}
                  style={isDesktop ? desktopRemoveCoverButtonStyle : removeCoverButtonStyle}
                >
                  {t("remover")}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {arquivoObra && !arquivoTextoPendente && (
        <div style={chapterImportStatsStyle}>
          <span style={inlineStatStyle}>{arquivoObraTipoTexto}</span>
          <span style={inlineStatStyle}>{arquivoObraTamanhoTexto}</span>
          <span style={inlineStatStyle}>{t("anexadoObra")}</span>
        </div>
      )}

      {temCapituloImportado && !arquivoTextoPendente && (
        <div style={chapterImportStatsStyle}>
          <span style={inlineStatStyle}>
            {t("titulo")}: {arquivoCapituloTitulo || `${t("primeiroCapitulo")} 1`}
          </span>
          <span style={inlineStatStyle}>
            {arquivoCapituloPalavras} {t("palavras")}
          </span>
          <span style={inlineStatStyle}>{arquivoCapituloMinutos} min</span>
        </div>
      )}
    </div>
  );
}
