import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const hook = readFileSync(
  new URL("../../app/publicar/hooks/use-publicar-cover-upload.ts", import.meta.url),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/publicar/page.tsx", import.meta.url),
  "utf8",
);
const controladorFormulario = readFileSync(
  new URL("../../app/publicar/hooks/use-publicar-form-controller.ts", import.meta.url),
  "utf8",
);
const propsComponentesPagina = readFileSync(
  new URL("../../app/publicar/lib/publicar-page-component-props.ts", import.meta.url),
  "utf8",
);
const formularioPublicacao = readFileSync(
  new URL("../../app/publicar/components/PublicarPublicationForm.tsx", import.meta.url),
  "utf8",
);

test("usePublicarCoverUpload preserva estado, validação e leitura da capa", () => {
  assert.match(hook, /^"use client";/);
  assert.match(hook, /const \[capa, setCapa\] = useState\(""\);/);
  assert.match(hook, /const \[capaNome, setCapaNome\] = useState\(""\);/);
  assert.match(hook, /const \[capaArquivo, setCapaArquivo\] = useState<File \| null>\(null\);/);
  assert.match(hook, /const \[capaErro, setCapaErro\] = useState\(""\);/);
  assert.match(hook, /const capaInputRef = useRef<HTMLInputElement \| null>\(null\);/);
  assert.match(hook, /function selecionarCapa\(event: ChangeEvent<HTMLInputElement>\)/);
  assert.match(hook, /setCapaErro\(""\);[\s\S]*?setErro\(""\);/);
  assert.match(hook, /arquivoImagemAceito\(arquivo\)/);
  assert.match(hook, /arquivo\.size > TAMANHO_MAXIMO_CAPA/);
  assert.match(hook, /const leitor = new FileReader\(\);/);
  assert.match(hook, /leitor\.readAsDataURL\(arquivo\);/);
  assert.match(hook, /setCapa\(resultado\);[\s\S]*?setCapaNome\(arquivo\.name\);[\s\S]*?setCapaArquivo\(arquivo\);/);
  assert.match(hook, /function removerCapa\(\)[\s\S]*?setCapa\(""\);[\s\S]*?setCapaNome\(""\);[\s\S]*?setCapaArquivo\(null\);[\s\S]*?capaInputRef\.current\.value = "";/);
  assert.match(hook, /return \{[\s\S]*?capa,[\s\S]*?capaArquivo,[\s\S]*?capaErro,[\s\S]*?capaInputRef,[\s\S]*?capaNome,[\s\S]*?removerCapa,[\s\S]*?selecionarCapa,/);
  assert.doesNotMatch(hook, /supabase|localStorage|useEffect|window\.|document\./);
});

test("Publicar delega somente o estado e as ações da capa ao hook", () => {
  assert.match(pagina, /import \{ usePublicarFormController \} from "\.\/hooks\/use-publicar-form-controller";/);
  assert.match(controladorFormulario, /import \{ usePublicarCoverUpload \} from "\.\/use-publicar-cover-upload";/);
  assert.match(controladorFormulario, /const coverUpload = usePublicarCoverUpload\(\{ setErro \}\);/);
  assert.doesNotMatch(pagina, /const \[capa, setCapa\] = useState/);
  assert.doesNotMatch(pagina, /const \[capaNome, setCapaNome\] = useState/);
  assert.doesNotMatch(pagina, /const \[capaArquivo, setCapaArquivo\] = useState/);
  assert.doesNotMatch(pagina, /const \[capaErro, setCapaErro\] = useState/);
  assert.doesNotMatch(pagina, /function selecionarCapa\(event: ChangeEvent<HTMLInputElement>\)/);
  assert.doesNotMatch(pagina, /function removerCapa\(\)/);
  assert.match(pagina, /<PublicarPublicationForm \{\.\.\.publicationFormProps\} \/>/);
  assert.match(propsComponentesPagina, /capaInputRef: formulario\.capaInputRef,[\s\S]*?onRemoverCapa: formulario\.removerCapa,[\s\S]*?onSelecionarCapa: formulario\.selecionarCapa,/);
  assert.match(formularioPublicacao, /<PublicarCoverUpload[\s\S]*?capaInputRef=\{capaInputRef\}[\s\S]*?onRemoverCapa=\{onRemoverCapa\}[\s\S]*?onSelecionarCapa=\{onSelecionarCapa\}/);
});
