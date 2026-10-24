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
const abrirArquivoSource = readFileSync(
  new URL(
    "../../app/painel-autor/lib/painel-autor-open-file-action.ts",
    import.meta.url,
  ),
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

test("Painel do Autor delega os caminhos do Storage e a abertura do arquivo", () => {
  assert.match(
    pagina,
    /import \{\s*caminhoStoragePertenceAoUsuarioPainel,\s*obterCaminhoStoragePainel,\s*\} from "\.\/lib\/painel-autor-file-storage-path-utils";/,
  );
  assert.doesNotMatch(pagina, /function obterCaminhoStoragePainel\(/);
  assert.doesNotMatch(pagina, /function caminhoStoragePertenceAoUsuarioPainel\(/);
  assert.equal((pagina.match(/\bobterCaminhoStoragePainel\b/g) || []).length, 3);
  assert.equal((pagina.match(/\bcaminhoStoragePertenceAoUsuarioPainel\b/g) || []).length, 3);
  assert.match(pagina, /caminho: caminhoStoragePertenceAoUsuarioPainel\(\s*caminhoCapa,\s*userId\s*\)/);
  assert.match(pagina, /caminho: caminhoStoragePertenceAoUsuarioPainel\(\s*caminhoArquivoObra,\s*userId\s*\)/);
  assert.match(
    pagina,
    /import \{ abrirArquivoObraPainel \} from "\.\/lib\/painel-autor-open-file-action";/,
  );
  assert.match(
    pagina,
    /function abrirArquivoObra\(obra: ObraLocal\) \{\s*return abrirArquivoObraPainel\(obra, language\);\s*\}/,
  );
  assert.doesNotMatch(pagina, /async function criarUrlAssinadaArquivoObraPainel\(/);
  assert.doesNotMatch(pagina, /async function abrirArquivoObra\(/);
  assert.match(
    abrirArquivoSource,
    /import \{ solicitarUrlTemporariaArquivoObra \} from "\.\.\/\.\.\/\.\.\/lib\/arquivosObras";/,
  );
  assert.match(
    abrirArquivoSource,
    /import \{ obterCaminhoStoragePainel \} from "\.\/painel-autor-file-storage-path-utils";/,
  );
  assert.match(abrirArquivoSource, /export async function criarUrlAssinadaArquivoObraPainel\(/);
  assert.match(abrirArquivoSource, /export async function abrirArquivoObraPainel\(/);
  assert.match(
    abrirArquivoSource,
    /const referencia = obra\.arquivoObra\?\.conteudo\?\.trim\(\) \|\| "";/,
  );
  assert.match(
    abrirArquivoSource,
    /"Esta obra não possui arquivo disponível\."/,
  );
  assert.match(
    abrirArquivoSource,
    /const caminho = obterCaminhoStoragePainel\(\s*"arquivos-obras",\s*referenciaLimpa,\s*\);/,
  );
  assert.match(abrirArquivoSource, /if \(!caminho\) \{\s*return referenciaLimpa;\s*\}/);
  assert.match(abrirArquivoSource, /return solicitarUrlTemporariaArquivoObra\(obraId\);/);
  assert.match(abrirArquivoSource, /document\.createElement\("a"\)/);
  assert.match(abrirArquivoSource, /linkArquivo\.target = "_blank"/);
  assert.match(abrirArquivoSource, /linkArquivo\.rel = "noopener noreferrer"/);
  assert.match(abrirArquivoSource, /document\.body\.appendChild\(linkArquivo\)/);
  assert.match(abrirArquivoSource, /linkArquivo\.click\(\)/);
  assert.match(abrirArquivoSource, /linkArquivo\.remove\(\)/);
  assert.match(abrirArquivoSource, /"Não consegui abrir o arquivo da obra agora\."/);
  assert.match(abrirArquivoSource, /console\.warn\("Não consegui abrir o arquivo da obra:", error\)/);
  assert.doesNotMatch(abrirArquivoSource, /supabase|localStorage|useState|useEffect/);
  assert.doesNotMatch(utilsSource, /supabase|localStorage|useState|useEffect/);
});
