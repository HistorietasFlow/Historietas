import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const normalizerSource = readFileSync(
  new URL(
    "../../app/painel-autor/lib/painel-autor-file-normalizer.ts",
    import.meta.url,
  ),
  "utf8",
);
const utilsSource = readFileSync(
  new URL(
    "../../app/painel-autor/lib/painel-autor-work-status-utils.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/painel-autor/page.tsx", import.meta.url),
  "utf8",
);
const normalizerJavascript = typescript.transpileModule(normalizerSource, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const { normalizarArquivoObra } = await import(
  `data:text/javascript;base64,${Buffer.from(normalizerJavascript).toString("base64")}`,
);

globalThis.__painelAutorNormalizarArquivoObra = normalizarArquivoObra;
const utilsJavascript = typescript.transpileModule(
  utilsSource.replace(
    'import { normalizarArquivoObra } from "./painel-autor-file-normalizer";',
    "const normalizarArquivoObra = globalThis.__painelAutorNormalizarArquivoObra;",
  ),
  {
    compilerOptions: {
      module: typescript.ModuleKind.ESNext,
      target: typescript.ScriptTarget.ES2022,
    },
  },
).outputText;
const {
  obraPublicadaComConteudoPainel,
  obraRascunhoOuSemConteudoPainel,
  obterStatusPainelAutor,
} = await import(
  `data:text/javascript;base64,${Buffer.from(utilsJavascript).toString("base64")}`,
);
delete globalThis.__painelAutorNormalizarArquivoObra;

test("obraPublicadaComConteudoPainel preserva capítulos publicados e conteúdo normalizado", () => {
  assert.equal(
    obraPublicadaComConteudoPainel({
      publicado: true,
      capitulos: [{ publicado: false }, {}],
    }),
    true,
  );
  assert.equal(
    obraPublicadaComConteudoPainel({
      publicado: true,
      capitulos: [{ publicado: false }],
      arquivoObra: { nome: "obra.md", conteudo: "texto" },
    }),
    true,
  );
  assert.equal(
    obraPublicadaComConteudoPainel({
      publicado: true,
      capitulos: [{ publicado: false }],
      arquivoObra: { nome: "obra.md", conteudo: "  " },
    }),
    false,
  );
  assert.equal(
    obraPublicadaComConteudoPainel({
      publicado: false,
      capitulos: [{}],
      arquivoObra: { nome: "obra.md", conteudo: "texto" },
    }),
    false,
  );
});

test("obraRascunhoOuSemConteudoPainel e obterStatusPainelAutor preservam fallbacks", () => {
  const publicada = { publicado: true, capitulos: [{}] };
  const semConteudo = { publicado: true, capitulos: [{ publicado: false }] };
  const rascunho = { publicado: false, capitulos: [{}] };

  assert.equal(obraRascunhoOuSemConteudoPainel(publicada), false);
  assert.equal(obraRascunhoOuSemConteudoPainel(semConteudo), true);
  assert.equal(obterStatusPainelAutor(publicada), "Publicado");
  assert.equal(obterStatusPainelAutor(semConteudo), "Sem conteúdo");
  assert.equal(obterStatusPainelAutor(rascunho), "Rascunho");
});

test("Painel do Autor delega somente os helpers de status ao módulo extraído", () => {
  assert.match(
    pagina,
    /import \{\s*obraPublicadaComConteudoPainel,\s*obraRascunhoOuSemConteudoPainel,\s*obterStatusPainelAutor,\s*\} from "\.\/lib\/painel-autor-work-status-utils";/,
  );
  assert.doesNotMatch(pagina, /function obraPublicadaComConteudoPainel\(/);
  assert.doesNotMatch(pagina, /function obraRascunhoOuSemConteudoPainel\(/);
  assert.doesNotMatch(pagina, /function obterStatusPainelAutor\(/);
  assert.equal((pagina.match(/\bobraPublicadaComConteudoPainel\b/g) || []).length, 4);
  assert.equal((pagina.match(/\bobraRascunhoOuSemConteudoPainel\b/g) || []).length, 3);
  assert.equal((pagina.match(/\bobterStatusPainelAutor\b/g) || []).length, 2);
  assert.match(
    utilsSource,
    /import \{ normalizarArquivoObra \} from "\.\/painel-autor-file-normalizer";/,
  );
  assert.match(utilsSource, /capitulo\.publicado !== false/);
  assert.match(utilsSource, /return obra\.publicado \? "Sem conteúdo" : "Rascunho";/);
  assert.doesNotMatch(utilsSource, /supabase|localStorage|useState|useEffect/);
});
