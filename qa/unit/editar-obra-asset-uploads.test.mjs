import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const pageSource = readFileSync(
  new URL("../../app/editar-obra/page.tsx", import.meta.url),
  "utf8",
);
const uploadsSource = readFileSync(
  new URL(
    "../../app/editar-obra/components/EditarObraAssetUploads.tsx",
    import.meta.url,
  ),
  "utf8",
);
const sharedStylesSource = readFileSync(
  new URL(
    "../../app/editar-obra/styles/editar-obra-shared-styles.ts",
    import.meta.url,
  ),
  "utf8",
);

test("Editar Obra delega somente os blocos visuais de upload", () => {
  assert.match(
    pageSource,
    /import \{ EditarObraAssetUploads \} from "\.\/components\/EditarObraAssetUploads";/,
  );
  assert.match(
    pageSource,
    /<EditarObraAssetUploads[\s\S]*?isDesktop=\{isDesktop\}[\s\S]*?capa=\{capa\}[\s\S]*?capaErro=\{capaErro\}[\s\S]*?capaInputRef=\{capaInputRef\}[\s\S]*?onSelecionarCapa=\{selecionarCapa\}[\s\S]*?onRemoverCapa=\{removerCapa\}[\s\S]*?arquivoObra=\{arquivoObra\}[\s\S]*?arquivoObraErro=\{arquivoObraErro\}[\s\S]*?arquivoObraInputRef=\{arquivoObraInputRef\}[\s\S]*?onSelecionarArquivoObra=\{selecionarArquivoObra\}[\s\S]*?onRemoverArquivoObra=\{removerArquivoObra\}[\s\S]*?\/>/,
  );
  assert.doesNotMatch(pageSource, /accept="\.png,\.jpg,\.jpeg,\.webp,\.gif,image\/png/);
  assert.doesNotMatch(pageSource, /accept="\.pdf,\.txt,\.md,\.png,\.jpg,\.jpeg,\.webp,\.gif,application\/pdf/);
  assert.match(pageSource, /function selecionarCapa\(event: ChangeEvent<HTMLInputElement>\)/);
  assert.match(pageSource, /function removerCapa\(\)/);
  assert.match(pageSource, /function selecionarArquivoObra\(event: ChangeEvent<HTMLInputElement>\)/);
  assert.match(pageSource, /function removerArquivoObra\(\)/);
  assert.match(pageSource, /const capaInputRef = useRef<HTMLInputElement \| null>\(null\)/);
  assert.match(pageSource, /const arquivoObraInputRef = useRef<HTMLInputElement \| null>\(null\)/);
});

test("uploads preservam inputs, textos, fallbacks, callbacks e prévia da capa", () => {
  for (const trecho of [
    'type="file"',
    'accept=".png,.jpg,.jpeg,.webp,.gif,image/png,image/jpeg,image/webp,image/gif"',
    'accept=".pdf,.txt,.md,.png,.jpg,.jpeg,.webp,.gif,application/pdf,text/plain,text/markdown,text/x-markdown,image/png,image/jpeg,image/webp,image/gif"',
    "ref={capaInputRef}",
    "ref={arquivoObraInputRef}",
    "onChange={onSelecionarCapa}",
    "onChange={onSelecionarArquivoObra}",
    "capaInputRef.current?.click()",
    "arquivoObraInputRef.current?.click()",
    "criarMiniCoverStyle(capa, coverPlaceholderStyle)",
    "Adicionar capa",
    'capa ? "Capa atual" : "Adicionar capa"',
    "Imagem vertical. Máximo: 2 MB.",
    'capa ? "Trocar" : "Escolher"',
    "onClick={onRemoverCapa}",
    "Arquivo completo da obra",
    "▣",
    'arquivoObra ? "Arquivo atual" : "Enviar PDF, texto ou imagem"',
    "Opcional. Anexe PDF, texto, imagem ou página de mangá. Máximo: 5 MB.",
    'data-historietas-i18n-ignore="true"',
    "{arquivoObra.nome}",
    'arquivoObra ? "Trocar arquivo" : "Escolher arquivo"',
    "onClick={onRemoverArquivoObra}",
    "{capaErro}",
    "{arquivoObraErro}",
  ]) {
    assert.ok(uploadsSource.includes(trecho), trecho);
  }
});

test("uploads concentram estilos exclusivos e compartilham estilos de campo", () => {
  assert.match(
    uploadsSource,
    /import \{[\s\S]*?fieldGroupStyle,[\s\S]*?hintStyle,[\s\S]*?labelStyle,[\s\S]*?safeTextStyle,[\s\S]*?\} from "\.\.\/styles\/editar-obra-shared-styles";/,
  );
  assert.match(
    pageSource,
    /import \{[\s\S]*?fieldGroupStyle,[\s\S]*?hintStyle,[\s\S]*?labelStyle,[\s\S]*?safeTextStyle,[\s\S]*?\} from "\.\/styles\/editar-obra-shared-styles";/,
  );
  for (const estilo of [
    "fieldGroupStyle",
    "labelStyle",
    "hintStyle",
    "safeTextStyle",
  ]) {
    assert.match(sharedStylesSource, new RegExp(`export const ${estilo}: CSSProperties`));
  }
  for (const estilo of [
    "hiddenInputStyle",
    "coverUploadBoxStyle",
    "desktopCoverUploadBoxStyle",
    "coverUploadPreviewStyle",
    "coverPlaceholderStyle",
    "coverPlaceholderIconStyle",
    "coverPlaceholderTextStyle",
    "coverUploadContentStyle",
    "coverUploadTitleStyle",
    "coverErrorStyle",
    "coverButtonsStyle",
    "coverButtonStyle",
    "removeCoverButtonStyle",
    "fileUploadBoxStyle",
    "desktopFileUploadBoxStyle",
    "fileUploadIconBoxStyle",
    "fileUploadIconStyle",
    "fileUploadContentStyle",
    "fileNameStyle",
  ]) {
    assert.match(uploadsSource, new RegExp(`const ${estilo}: CSSProperties`));
    assert.doesNotMatch(pageSource, new RegExp(`const ${estilo}: CSSProperties`));
  }
  assert.doesNotMatch(pageSource, /const fieldGroupStyle: CSSProperties/);
  assert.doesNotMatch(pageSource, /const labelStyle: CSSProperties/);
  assert.doesNotMatch(pageSource, /const hintStyle: CSSProperties/);
});
