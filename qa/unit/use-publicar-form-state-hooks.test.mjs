import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const opcoes = readFileSync(
  new URL("../../app/publicar/hooks/use-publicar-publication-options.ts", import.meta.url),
  "utf8",
);
const upload = readFileSync(
  new URL("../../app/publicar/hooks/use-publicar-content-file-upload.ts", import.meta.url),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/publicar/page.tsx", import.meta.url),
  "utf8",
);

test("usePublicarPublicationOptions preserva estados, limites e reset da classificação", () => {
  assert.match(opcoes, /^"use client";/);
  assert.match(opcoes, /const \[genero, setGenero\] = useState\(""\);/);
  assert.match(opcoes, /const \[formato, setFormato\] = useState\(""\);/);
  assert.match(opcoes, /const \[classificacaoIndicativa, setClassificacaoIndicativa\] = useState\(""\);/);
  assert.match(opcoes, /const \[avisosConteudo18, setAvisosConteudo18\] = useState<AvisoConteudo18\[\]>\(\[\]\);/);
  assert.match(opcoes, /function alternarAvisoConteudo18\(aviso: AvisoConteudo18\)[\s\S]*?avisosAtuais\.includes\(aviso\)[\s\S]*?setErro\(""\);/);
  assert.match(opcoes, /valor !== OUTRO_FORMATO_VALUE[\s\S]*?setFormatoPersonalizado\(""\);/);
  assert.match(opcoes, /valor !== OUTRO_GENERO_VALUE[\s\S]*?setGeneroPersonalizado\(""\);/);
  assert.match(opcoes, /limparTextoPersonalizado\([\s\S]*?LIMITE_CARACTERES_FORMATO_GENERO_PERSONALIZADO/);
  assert.match(opcoes, /if \(!ehClassificacao18\(valor\)\) \{[\s\S]*?setAvisosConteudo18\(\[\]\);/);
  assert.doesNotMatch(opcoes, /supabase|localStorage|useEffect|window\.|document\./);
});

test("usePublicarContentFileUpload preserva validação, leitura e limpeza do conteúdo", () => {
  assert.match(upload, /^"use client";/);
  assert.match(upload, /const \[arquivoObra, setArquivoObra\] = useState<ArquivoObraLocal \| null>\(null\);/);
  assert.match(upload, /const \[arquivoTextoPendente, setArquivoTextoPendente\] = useState<File \| null>\(null\);/);
  assert.match(upload, /const arquivoConteudoInputRef = useRef<HTMLInputElement \| null>\(null\);/);
  assert.match(upload, /arquivoObraAceito\(arquivo\)/);
  assert.match(upload, /arquivoTextoAceito\(arquivo\)/);
  assert.match(upload, /arquivo\.size > TAMANHO_MAXIMO_ARQUIVO_OBRA/);
  assert.match(upload, /arquivo\.size > TAMANHO_MAXIMO_ARQUIVO_TEXTO/);
  assert.match(upload, /identificarCategoriaArquivo\(arquivo\)/);
  assert.match(upload, /resultado\.replace\(\/\\r\\n\/g, "\\n"\)\.trim\(\)/);
  assert.match(upload, /contarCaracteresValidos\(textoImportado\) < 20/);
  assert.match(upload, /leitor\.readAsDataURL\(arquivo\);/);
  assert.match(upload, /leitor\.readAsText\(arquivo, "UTF-8"\);/);
  assert.match(upload, /limparSelecaoConteudoArquivo[\s\S]*?arquivoConteudoInputRef\.current\.value = "";/);
  assert.doesNotMatch(upload, /supabase|localStorage|useEffect|window\.|document\./);
});

test("Publicar delega os dois estados locais sem reter implementações duplicadas", () => {
  assert.match(pagina, /usePublicarPublicationOptions\(\{ setErro \}\)/);
  assert.match(pagina, /usePublicarContentFileUpload\(\{ setErro \}\)/);
  assert.doesNotMatch(pagina, /function anexarArquivoCompleto\(arquivo: File\)/);
  assert.doesNotMatch(pagina, /function limparSelecaoConteudoArquivo\(\)/);
  assert.doesNotMatch(pagina, /function alternarAvisoConteudo18\(aviso: AvisoConteudo18\)/);
});
