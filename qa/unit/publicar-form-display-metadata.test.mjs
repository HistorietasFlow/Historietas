import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const metadataSource = readFileSync(
  new URL(
    "../../app/publicar/lib/publicar-form-display-metadata.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/publicar/page.tsx", import.meta.url),
  "utf8",
);
const controladorPagina = readFileSync(
  new URL("../../app/publicar/hooks/use-publicar-page-controller.ts", import.meta.url),
  "utf8",
);
const controladorFormulario = readFileSync(
  new URL("../../app/publicar/hooks/use-publicar-form-controller.ts", import.meta.url),
  "utf8",
);
const metadataJavascript = typescript.transpileModule(
  metadataSource
    .replace(
      'import { formatarTamanhoArquivo } from "../../../lib/utils";',
      `const formatarTamanhoArquivo = (tamanho: number) => {
        if (!Number.isFinite(tamanho) || tamanho <= 0) return "0 KB";
        return \`${"${"}Math.max(1, Math.round(tamanho / 1024))} KB\`;
      };`,
    )
    .replace(
      /import \{[\s\S]*?\} from "\.\/publicar-text-utils";/,
      `const contarCaracteresValidos = (texto: string) => (texto.match(/[A-Za-zÀ-ÿ0-9]/g) || []).length;
       const contarPalavras = (texto: string) => texto.trim() ? texto.trim().split(/\\s+/).length : 0;
       const calcularMinutosLeitura = (texto: string) => Math.ceil(contarPalavras(texto) / 220);`,
    ),
  {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
  },
).outputText;
const { obterMetadadosFormularioPublicar } = await import(
  `data:text/javascript;base64,${Buffer.from(metadataJavascript).toString("base64")}`,
);

test("metadados visuais do formulário preservam contadores e tamanhos", () => {
  const t = (chave) =>
    ({ arquivo: "Arquivo", imagem: "Imagem", texto: "Texto" })[chave];
  const metadados = obterMetadadosFormularioPublicar({
    arquivoCapituloTexto: "um dois três",
    arquivoObra: {
      nome: "obra.pdf",
      tipo: "application/pdf",
      tamanho: 2048,
      conteudo: "data:application/pdf;base64,AA==",
      categoria: "documento",
      criadoEm: "2026-10-23T00:00:00.000Z",
    },
    arquivoTextoPendente: { size: 1024 },
    sinopse: " Uma sinopse válida 123. ",
    t,
  });

  assert.equal(metadados.sinopseCaracteresValidos, 19);
  assert.equal(metadados.sinopsePalavras, 4);
  assert.equal(metadados.arquivoObraTamanhoTexto, "2 KB");
  assert.equal(metadados.arquivoObraTipoTexto, "PDF");
  assert.equal(metadados.arquivoTextoPendenteTamanhoTexto, "1 KB");
  assert.equal(metadados.arquivoCapituloPalavras, 3);
  assert.equal(metadados.arquivoCapituloMinutos, 1);
});

test("metadados visuais preservam fallbacks e rótulos da categoria do arquivo", () => {
  const t = (chave) =>
    ({ arquivo: "Arquivo", imagem: "Imagem", texto: "Texto" })[chave];

  for (const [categoria, esperado] of [
    ["imagem", "Imagem"],
    ["texto", "Texto"],
    ["outro", "Arquivo"],
  ]) {
    assert.equal(
      obterMetadadosFormularioPublicar({
        arquivoCapituloTexto: "",
        arquivoObra: {
          nome: "arquivo",
          tipo: "application/octet-stream",
          tamanho: 0,
          conteudo: "",
          categoria,
          criadoEm: "",
        },
        arquivoTextoPendente: null,
        sinopse: "",
        t,
      }).arquivoObraTipoTexto,
      esperado,
    );
  }

  const semArquivo = obterMetadadosFormularioPublicar({
    arquivoCapituloTexto: "",
    arquivoObra: null,
    arquivoTextoPendente: null,
    sinopse: "",
    t,
  });
  assert.equal(semArquivo.arquivoObraTamanhoTexto, "");
  assert.equal(semArquivo.arquivoObraTipoTexto, "");
  assert.equal(semArquivo.arquivoTextoPendenteTamanhoTexto, "");
});

test("Publicar delega metadados visuais sem mover runtime da publicação", () => {
  assert.match(
    controladorPagina,
    /import \{ usePublicarFormController \} from "\.\/use-publicar-form-controller";/,
  );
  assert.match(
    controladorFormulario,
    /import \{ obterMetadadosFormularioPublicar \} from "\.\.\/lib\/publicar-form-display-metadata";/,
  );
  assert.match(
    controladorFormulario,
    /obterMetadadosFormularioPublicar\(\{[\s\S]*?arquivoCapituloTexto: contentFileUpload\.arquivoCapituloTexto,[\s\S]*?arquivoObra: contentFileUpload\.arquivoObra,[\s\S]*?arquivoTextoPendente: contentFileUpload\.arquivoTextoPendente,[\s\S]*?sinopse: basicFields\.sinopse,[\s\S]*?t,/,
  );
  assert.doesNotMatch(pagina, /const arquivoObraTipoTexto = arquivoObra/);
  assert.doesNotMatch(pagina, /const arquivoCapituloMinutos = calcularMinutosLeitura\(arquivoCapituloTexto\)/);
  assert.match(metadataSource, /export function obterMetadadosFormularioPublicar/);
  assert.match(metadataSource, /formatarTamanhoArquivo/);
  assert.match(metadataSource, /calcularMinutosLeitura/);
  assert.match(metadataSource, /contarCaracteresValidos/);
  assert.match(metadataSource, /contarPalavras/);
  assert.doesNotMatch(metadataSource, /useState|useEffect|supabase|localStorage|window\.|document\.|JSX/);
});
