import type { ChangeEventHandler, RefObject } from "react";
import {
  chapterImportBoxStyle,
  chapterImportContentStyle,
  chapterImportIconStyle,
  chapterImportTitleStyle,
  coverButtonStyle,
  coverButtonsStyle,
  coverErrorStyle,
  criarCoverUploadIconBoxStyle,
  desktopChapterImportBoxStyle,
  desktopChapterImportContentStyle,
  desktopCoverButtonStyle,
  desktopCoverButtonsStyle,
  desktopCoverUploadIconBoxStyle,
  desktopFullWidthFieldStyle,
  desktopRemoveCoverButtonStyle,
  fieldGroupStyle,
  fileNameStyle,
  hiddenInputStyle,
  hintStyle,
  removeCoverButtonStyle,
} from "../lib/publicar-form-upload-styles";

type ChaveTextoCapaPublicar =
  | "adicionarCapa"
  | "capaSelecionada"
  | "dicaCapa"
  | "escolherImagem"
  | "remover";

type PublicarCoverUploadProps = {
  capa: string;
  capaErro: string;
  capaInputRef: RefObject<HTMLInputElement | null>;
  capaNome: string;
  isDesktop: boolean;
  onRemoverCapa: () => void;
  onSelecionarCapa: ChangeEventHandler<HTMLInputElement>;
  t: (chave: ChaveTextoCapaPublicar) => string;
  traduzirMensagem: (mensagem: string) => string;
};

export function PublicarCoverUpload({
  capa,
  capaErro,
  capaInputRef,
  capaNome,
  isDesktop,
  onRemoverCapa,
  onSelecionarCapa,
  t,
  traduzirMensagem,
}: PublicarCoverUploadProps) {
  return (
    <div style={isDesktop ? desktopFullWidthFieldStyle : fieldGroupStyle}>
      <input
        ref={capaInputRef}
        type="file"
        accept=".png,.jpg,.jpeg,.webp,.gif,image/png,image/jpeg,image/webp,image/gif"
        onChange={onSelecionarCapa}
        style={hiddenInputStyle}
      />

      <div style={isDesktop ? desktopChapterImportBoxStyle : chapterImportBoxStyle}>
        <div
          style={
            isDesktop
              ? {
                  ...criarCoverUploadIconBoxStyle(capa),
                  ...desktopCoverUploadIconBoxStyle,
                }
              : criarCoverUploadIconBoxStyle(capa)
          }
        >
          {!capa && <span style={chapterImportIconStyle}>+</span>}
        </div>

        <div style={isDesktop ? desktopChapterImportContentStyle : chapterImportContentStyle}>
          <strong style={chapterImportTitleStyle}>
            {capa ? t("capaSelecionada") : t("adicionarCapa")}
          </strong>

          <span style={hintStyle}>{t("dicaCapa")}</span>

          {capaNome && <span style={fileNameStyle}>{capaNome}</span>}

          {capaErro && (
            <span style={coverErrorStyle}>{traduzirMensagem(capaErro)}</span>
          )}

          <div style={isDesktop ? desktopCoverButtonsStyle : coverButtonsStyle}>
            <button
              type="button"
              onClick={() => capaInputRef.current?.click()}
              style={isDesktop ? desktopCoverButtonStyle : coverButtonStyle}
            >
              {t("escolherImagem")}
            </button>

            {capa && (
              <button
                type="button"
                onClick={onRemoverCapa}
                style={isDesktop ? desktopRemoveCoverButtonStyle : removeCoverButtonStyle}
              >
                {t("remover")}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
