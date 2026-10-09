import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const utilsSource = readFileSync(
  new URL(
    "../../app/painel-autor/lib/painel-autor-file-storage-path-utils.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/painel-autor/page.tsx", import.meta.url),
  "utf8",
);
const utilsJavascript = typescript.transpileModule(utilsSource, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const {
  obterCaminhoStoragePainel,
  caminhoStoragePertenceAoUsuarioPainel,
} = await import(
  `data:text/javascript;base64,${Buffer.from(utilsJavascript).toString("base64")}`,
);

test("obterCaminhoStoragePainel preserva referências diretas e fallbacks", () => {
  assert.equal(
    obterCaminhoStoragePainel("capas-obras", "capas-obras/user-1/capa.webp"),
    "user-1/capa.webp",
  );
  assert.equal(
    obterCaminhoStoragePainel("arquivos-obras", "/user-1/obra.pdf"),
    "user-1/obra.pdf",
  );
  assert.equal(obterCaminhoStoragePainel("capas-obras", "  "), "");
  assert.equal(
    obterCaminhoStoragePainel("capas-obras", "data:image/png;base64,abc"),
    "",
  );
});

test("obterCaminhoStoragePainel reconhece URLs dos buckets e decodifica caminhos", () => {
  const projeto = "https://project.supabase.co";

  assert.equal(
    obterCaminhoStoragePainel(
      "arquivos-obras",
      `${projeto}/storage/v1/object/public/arquivos-obras/user-1%2Fobra%20final.pdf`,
    ),
    "user-1/obra final.pdf",
  );
  assert.equal(
    obterCaminhoStoragePainel(
      "arquivos-obras",
      `${projeto}/storage/v1/object/sign/arquivos-obras/user-1%2Fobra.pdf?token=abc`,
    ),
    "user-1/obra.pdf",
  );
  assert.equal(
    obterCaminhoStoragePainel(
      "capas-obras",
      `${projeto}/storage/v1/object/authenticated/capas-obras/user-1%2Fcapa.webp`,
    ),
    "user-1/capa.webp",
  );
  assert.equal(
    obterCaminhoStoragePainel("capas-obras", "https://example.com/capa.webp"), "");
});

test("caminhoStoragePertenceAoUsuarioPainel preserva normalização e fallbacks", () => {
  assert.equal(caminhoStoragePertenceAoUsuarioPainel(" User-1/capa.webp ", "user-1"), true);
  assert.equal(caminhoStoragePertenceAoUsuarioPainel("outro/capa.webp", "user-1"), false);
  assert.equal(caminhoStoragePertenceAoUsuarioPainel("", "user-1"), false);
  assert.equal(caminhoStoragePertenceAoUsuarioPainel("user-1/capa.webp", "  "), false);
});

test("Painel do Autor delega somente os caminhos do Storage aos helpers extraídos", () => {
  assert.match(
    pagina,
    /import \{\s*caminhoStoragePertenceAoUsuarioPainel,\s*obterCaminhoStoragePainel,\s*\} from "\.\/lib\/painel-autor-file-storage-path-utils";/,
  );
  assert.doesNotMatch(pagina, /function obterCaminhoStoragePainel\(/);
  assert.doesNotMatch(pagina, /function caminhoStoragePertenceAoUsuarioPainel\(/);
  assert.equal((pagina.match(/\bobterCaminhoStoragePainel\b/g) || []).length, 4);
  assert.equal((pagina.match(/\bcaminhoStoragePertenceAoUsuarioPainel\b/g) || []).length, 3);
  assert.match(pagina, /const caminho = obterCaminhoStoragePainel\(\s*"arquivos-obras",\s*referenciaLimpa\s*\);/);
  assert.match(pagina, /caminho: caminhoStoragePertenceAoUsuarioPainel\(\s*caminhoCapa,\s*userId\s*\)/);
  assert.match(pagina, /caminho: caminhoStoragePertenceAoUsuarioPainel\(\s*caminhoArquivoObra,\s*userId\s*\)/);
  assert.doesNotMatch(utilsSource, /supabase|localStorage|useState|useEffect/);
});
