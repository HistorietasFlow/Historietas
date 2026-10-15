import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const modulo = readFileSync(
  new URL("../../app/lib/home-catalog-utils.ts", import.meta.url),
  "utf8",
);
const pagina = readFileSync(new URL("../../app/page.tsx", import.meta.url), "utf8");
const javascriptModulo = typescript.transpileModule(modulo, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const {
  obterFormatoObraCatalogoHome,
  obterImagemObraCatalogo,
  obterTotalCapitulosObraCatalogoHome,
  obraCatalogoTemArquivoAnexadoHome,
} = await import(
  `data:text/javascript;base64,${Buffer.from(javascriptModulo).toString("base64")}`,
);

test("home-catalog-utils preserva a prioridade e os fallbacks da imagem", () => {
  assert.equal(
    obterImagemObraCatalogo({
      capa: "capa-prioritaria",
      capaUrl: "capa-url",
      cover: "cover",
      imagem: "imagem",
    }),
    "capa-prioritaria",
  );
  assert.equal(
    obterImagemObraCatalogo({ capaUrl: "capa-url", cover: "cover", imagem: "imagem" }),
    "capa-url",
  );
  assert.equal(
    obterImagemObraCatalogo({ cover: "cover", imagem: "imagem" }),
    "cover",
  );
  assert.equal(obterImagemObraCatalogo({ imagem: "imagem" }), "imagem");
  assert.equal(
    obterImagemObraCatalogo({ capa: "  ", capaUrl: "", cover: "", imagem: "  " }),
    "",
  );
  assert.equal(obterImagemObraCatalogo({}), "");
});

test("home-catalog-utils preserva formato e total de capítulos", () => {
  assert.equal(obterFormatoObraCatalogoHome({ formato: "  Webnovel  " }), "Webnovel");
  assert.equal(obterFormatoObraCatalogoHome({ formato: "  " }), "História");
  assert.equal(obterFormatoObraCatalogoHome({}), "História");
  assert.equal(obterTotalCapitulosObraCatalogoHome({ capitulos: [{}, {}] }), 2);
  assert.equal(obterTotalCapitulosObraCatalogoHome({ capitulos: "inválido" }), 0);
  assert.equal(obterTotalCapitulosObraCatalogoHome({}), 0);
});

test("home-catalog-utils preserva a validação de arquivo anexado", () => {
  assert.equal(
    obraCatalogoTemArquivoAnexadoHome({
      arquivoObra: { nome: "obra.pdf", conteudo: "conteúdo" },
    }),
    true,
  );
  assert.equal(obraCatalogoTemArquivoAnexadoHome({}), false);
  assert.equal(obraCatalogoTemArquivoAnexadoHome({ arquivoObra: [] }), false);
  assert.equal(
    obraCatalogoTemArquivoAnexadoHome({ arquivoObra: { conteudo: "conteúdo" } }),
    false,
  );
  assert.equal(
    obraCatalogoTemArquivoAnexadoHome({ arquivoObra: { nome: "obra.pdf" } }),
    false,
  );
  assert.equal(
    obraCatalogoTemArquivoAnexadoHome({
      arquivoObra: { nome: "  ", conteudo: "conteúdo" },
    }),
    false,
  );
  assert.equal(
    obraCatalogoTemArquivoAnexadoHome({
      arquivoObra: { nome: "obra.pdf", conteudo: "  " },
    }),
    false,
  );
});

test("home-catalog-utils estabelece a fronteira pura do catálogo", () => {
  for (const nomeFuncao of [
    "obterImagemObraCatalogo",
    "obterFormatoObraCatalogoHome",
    "obterTotalCapitulosObraCatalogoHome",
    "obraCatalogoTemArquivoAnexadoHome",
  ]) {
    assert.match(modulo, new RegExp(`export function ${nomeFuncao}\\b`));
    assert.doesNotMatch(pagina, new RegExp(`function ${nomeFuncao}\\b`));
  }
  assert.match(pagina, /from "\.\/lib\/home-catalog-utils";/);
  assert.match(modulo, /\.find\(\(imagem\): imagem is string =>/);
  assert.match(modulo, /typeof imagem === "string" && Boolean\(imagem\.trim\(\)\)/);
  assert.match(modulo, /Array\.isArray\(obraComCapitulos\.capitulos\)/);
  assert.doesNotMatch(modulo, /supabase|localStorage|useEffect|useState/);
});
