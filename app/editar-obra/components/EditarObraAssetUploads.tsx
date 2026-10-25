import type { ChangeEvent, CSSProperties, RefObject } from "react";
import { criarMiniCoverStyle } from "../lib/editar-obra-cover-style-utils";
import {
  fieldGroupStyle,
  hintStyle,
  labelStyle,
  safeTextStyle,
} from "../styles/editar-obra-shared-styles";

type ArquivoObraUpload = {
  nome: string;
};

type EditarObraAssetUploadsProps = {
  isDesktop: boolean;
  capa: string;
  capaErro: string;
  capaInputRef: RefObject<HTMLInputElement | null>;
  onSelecionarCapa: (event: ChangeEvent<HTMLInputElement>) => void;
  onRemoverCapa: () => void;
  arquivoObra: ArquivoObraUpload | null;
  arquivoObraErro: string;
  arquivoObraInputRef: RefObject<HTMLInputElement | null>;
  onSelecionarArquivoObra: (event: ChangeEvent<HTMLInputElement>) => void;
  onRemoverArquivoObra: () => void;
};

export function EditarObraAssetUploads({
  isDesktop,
  capa,
  capaErro,
  capaInputRef,
  onSelecionarCapa,
  onRemoverCapa,
  arquivoObra,
  arquivoObraErro,
  arquivoObraInputRef,
  onSelecionarArquivoObra,
  onRemoverArquivoObra,
}: EditarObraAssetUploadsProps) {
  return (
    <>
      <div style={fieldGroupStyle}>
        <input
          ref={capaInputRef}
          type="file"
          accept=".png,.jpg,.jpeg,.webp,.gif,image/png,image/jpeg,image/webp,image/gif"
          onChange={onSelecionarCapa}
          style={hiddenInputStyle}
        />

        <div style={isDesktop ? desktopCoverUploadBoxStyle : coverUploadBoxStyle}>
          <div style={coverUploadPreviewStyle}>
            <div style={criarMiniCoverStyle(capa, coverPlaceholderStyle)}>
              {!capa && (
                <>
                  <span style={coverPlaceholderIconStyle}>+</span>
                  <span style={coverPlaceholderTextStyle}>Adicionar capa</span>
                </>
              )}
            </div>
          </div>

          <div style={coverUploadContentStyle}>
            <strong style={coverUploadTitleStyle}>
              {capa ? "Capa atual" : "Adicionar capa"}
            </strong>

            <span style={hintStyle}>Imagem vertical. Máximo: 2 MB.</span>

            {capaErro && <span style={coverErrorStyle}>{capaErro}</span>}

            <div style={coverButtonsStyle}>
              <button
                type="button"
                onClick={() => capaInputRef.current?.click()}
                style={coverButtonStyle}
              >
                {capa ? "Trocar" : "Escolher"}
              </button>

              {capa && (
                <button
                  type="button"
                  onClick={onRemoverCapa}
                  style={removeCoverButtonStyle}
                >
                  Remover
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div style={fieldGroupStyle}>
        <label style={labelStyle}>Arquivo completo da obra</label>

        <input
          ref={arquivoObraInputRef}
          type="file"
          accept=".pdf,.txt,.md,.png,.jpg,.jpeg,.webp,.gif,application/pdf,text/plain,text/markdown,text/x-markdown,image/png,image/jpeg,image/webp,image/gif"
          onChange={onSelecionarArquivoObra}
          style={hiddenInputStyle}
        />

        <div style={isDesktop ? desktopFileUploadBoxStyle : fileUploadBoxStyle}>
          <div style={fileUploadIconBoxStyle}>
            <span style={fileUploadIconStyle}>▣</span>
          </div>

          <div style={fileUploadContentStyle}>
            <strong style={coverUploadTitleStyle}>
              {arquivoObra ? "Arquivo atual" : "Enviar PDF, texto ou imagem"}
            </strong>

            <span style={hintStyle}>
              Opcional. Anexe PDF, texto, imagem ou página de mangá. Máximo: 5 MB.
            </span>

            {arquivoObra && (
              <span data-historietas-i18n-ignore="true" style={fileNameStyle}>
                {arquivoObra.nome}
              </span>
            )}

            {arquivoObraErro && (
              <span style={coverErrorStyle}>{arquivoObraErro}</span>
            )}

            <div style={coverButtonsStyle}>
              <button
                type="button"
                onClick={() => arquivoObraInputRef.current?.click()}
                style={coverButtonStyle}
              >
                {arquivoObra ? "Trocar arquivo" : "Escolher arquivo"}
              </button>

              {arquivoObra && (
                <button
                  type="button"
                  onClick={onRemoverArquivoObra}
                  style={removeCoverButtonStyle}
                >
                  Remover
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

const hiddenInputStyle: CSSProperties = {
  display: "none",
};

const coverUploadBoxStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(70px, 82px) minmax(0, 1fr)",
  gap: "10px",
  alignItems: "stretch",
  padding: 0,
  borderRadius: 0,
  background: "transparent",
  border: "0",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "visible",
  boxShadow: "none",
};

const desktopCoverUploadBoxStyle: CSSProperties = {
  ...coverUploadBoxStyle,
  gridTemplateColumns: "108px minmax(0, 1fr)",
  gap: "16px",
  alignItems: "center",
};

const coverUploadPreviewStyle: CSSProperties = {
  minWidth: 0,
  maxWidth: "100%",
};

const coverPlaceholderStyle: CSSProperties = {
  minHeight: "96px",
  borderRadius: "16px",
  background: "var(--historietas-editar-obra-bg-deep, #000000)",
  backgroundImage: "linear-gradient(135deg, var(--historietas-editar-obra-surface, #050505) 0%, var(--historietas-editar-obra-bg-deep, #000000) 100%)",
  border: "1px solid rgba(255,255,255,0.08)",
  display: "grid",
  alignContent: "center",
  justifyItems: "center",
  gap: "5px",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "hidden",
  boxShadow: "none",
};

const coverPlaceholderIconStyle: CSSProperties = {
  width: "26px",
  height: "26px",
  borderRadius: "999px",
  background: "var(--historietas-accent, var(--historietas-editar-obra-accent, #FFFFFF))",
  color: "#FFFFFF",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "18px",
  fontWeight: 950,
  position: "relative",
  zIndex: 1,
};

const coverPlaceholderTextStyle: CSSProperties = {
  color: "var(--historietas-text-secondary, #D4D4D8)",
  fontSize: "10px",
  fontWeight: 900,
  textAlign: "center",
  position: "relative",
  zIndex: 1,
  ...safeTextStyle,
};

const coverUploadContentStyle: CSSProperties = {
  display: "grid",
  alignContent: "center",
  gap: "5px",
  minWidth: 0,
};

const coverUploadTitleStyle: CSSProperties = {
  color: "var(--historietas-text-primary, #FFFFFF)",
  fontSize: "15px",
  fontWeight: 950,
  letterSpacing: "-0.045em",
  ...safeTextStyle,
};

const coverErrorStyle: CSSProperties = {
  color: "var(--historietas-danger-button-text, var(--historietas-editar-obra-danger-text, #FFFFFF))",
  fontSize: "11px",
  fontWeight: 850,
  ...safeTextStyle,
};

const coverButtonsStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "7px",
  minWidth: 0,
};

const coverButtonStyle: CSSProperties = {
  flex: "1 1 94px",
  minHeight: "36px",
  maxWidth: "100%",
  padding: "0 12px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.10)",
  background: "var(--historietas-editar-obra-surface, #050505)",
  color: "#FFFFFF",
  fontSize: "11px",
  fontWeight: 950,
  cursor: "pointer",
  fontFamily: "inherit",
  textAlign: "center",
  boxSizing: "border-box",
  whiteSpace: "normal",
  boxShadow: "none",
  ...safeTextStyle,
};

const removeCoverButtonStyle: CSSProperties = {
  ...coverButtonStyle,
};

const fileUploadBoxStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(56px, 64px) minmax(0, 1fr)",
  gap: "12px",
  alignItems: "stretch",
  padding: 0,
  borderRadius: 0,
  background: "transparent",
  border: "0",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "visible",
  boxShadow: "none",
};

const desktopFileUploadBoxStyle: CSSProperties = {
  ...fileUploadBoxStyle,
  gridTemplateColumns: "88px minmax(0, 1fr)",
  gap: "16px",
  alignItems: "center",
  padding: 0,
  borderRadius: 0,
  background: "transparent",
  border: "0",
  boxShadow: "none",
};

const fileUploadIconBoxStyle: CSSProperties = {
  minHeight: "82px",
  borderRadius: "18px",
  background: "var(--historietas-editar-obra-bg-deep, #000000)",
  border: "1px solid rgba(255,255,255,0.08)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  minWidth: 0,
  maxWidth: "100%",
  boxSizing: "border-box",
  boxShadow: "none",
};

const fileUploadIconStyle: CSSProperties = {
  background: "transparent",
  color: "var(--historietas-text-primary, #FFFFFF)",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "20px",
  fontWeight: 950,
  lineHeight: 1,
  boxShadow: "none",
};

const fileUploadContentStyle: CSSProperties = {
  display: "grid",
  alignContent: "center",
  gap: "7px",
  minWidth: 0,
  maxWidth: "100%",
};

const fileNameStyle: CSSProperties = {
  color: "var(--historietas-accent, var(--historietas-editar-obra-accent-soft, #FFFFFF))",
  fontSize: "11px",
  fontWeight: 850,
  ...safeTextStyle,
};
