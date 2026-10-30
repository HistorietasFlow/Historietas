import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const page = readFileSync(new URL("../../app/listas/page.tsx", import.meta.url), "utf8");
const values = readFileSync(new URL("../../app/listas/lib/listas-value-utils.ts", import.meta.url), "utf8");
const routeState = readFileSync(
  new URL("../../app/listas/lib/listas-page-route-state.ts", import.meta.url),
  "utf8",
);
const storage = readFileSync(new URL("../../app/listas/lib/listas-storage-utils.ts", import.meta.url), "utf8");
const works = readFileSync(new URL("../../app/listas/lib/listas-local-work-utils.ts", import.meta.url), "utf8");
const diary = readFileSync(new URL("../../app/listas/lib/listas-diary-normalizer-utils.ts", import.meta.url), "utf8");
const profileItems = readFileSync(new URL("../../app/listas/lib/listas-profile-items-utils.ts", import.meta.url), "utf8");
const profileState = readFileSync(new URL("../../app/listas/lib/listas-profile-state-utils.ts", import.meta.url), "utf8");
const worksLoader = readFileSync(new URL("../../app/listas/lib/listas-published-works-loader.ts", import.meta.url), "utf8");
const profileLoader = readFileSync(new URL("../../app/listas/lib/listas-profile-loader.ts", import.meta.url), "utf8");
const workMenuActions = readFileSync(
  new URL("../../app/listas/hooks/use-listas-work-menu-actions.ts", import.meta.url),
  "utf8",
);
const annotationActions = readFileSync(
  new URL(
    "../../app/listas/hooks/use-listas-diary-annotation-actions.ts",
    import.meta.url,
  ),
  "utf8",
);
const diaryProfileActions = readFileSync(
  new URL(
    "../../app/listas/hooks/use-listas-diary-profile-actions.ts",
    import.meta.url,
  ),
  "utf8",
);

async function importarModulo(codigo) {
  const javascript = typescript.transpileModule(codigo, {
    compilerOptions: { module: typescript.ModuleKind.ESNext, target: typescript.ScriptTarget.ES2022 },
  }).outputText;
  return import(`data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`);
}

const valores = await importarModulo(values);
const armazenamento = await importarModulo(storage);
const diarioNormalizado = await importarModulo(diary);
const obrasLocais = await importarModulo(
  works
    .replace('import { criarSlugBase, normalizarTexto } from "../../../lib/utils";', 'const criarSlugBase = (valor) => valor.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""); const normalizarTexto = (valor) => valor.normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").toLowerCase();')
    .replace('import { timestampData } from "./listas-format-utils";', 'const timestampData = (valor) => Date.parse(valor) || 0;')
    .replace('import { criarStorageKeyUsuarioListas } from "./listas-storage-utils";', `const criarStorageKeyUsuarioListas = ${armazenamento.criarStorageKeyUsuarioListas.toString()};`)
    .replace('import { pegarNumero, pegarTexto } from "./listas-value-utils";', `const pegarNumero = ${valores.pegarNumero.toString()}; const pegarTexto = ${valores.pegarTexto.toString()};`),
);

test("Listas delega os utilitários locais sem mover fluxos Supabase", () => {
  for (const [source, name] of [
    [routeState, "pegarTexto"],
    [page, "idUsuarioValido"],
  ]) {
    assert.match(source, new RegExp(`import[\\s\\S]*?\\b${name}\\b`));
    assert.doesNotMatch(page, new RegExp(`function ${name}\\(`));
  }
  assert.match(diaryProfileActions, /import[\s\S]*?\bcriarLoginHrefListas\b/);
  assert.doesNotMatch(page, /function criarLoginHrefListas\(/);
  assert.match(diaryProfileActions, /import[\s\S]*?\bobterMensagemErroListas\b/);
  assert.doesNotMatch(page, /function obterMensagemErroListas\(/);
  for (const name of ["pegarBooleanoListas", "normalizarTipoDiarioListas", "obterTipoDiarioDoItemListas"]) {
    assert.match(annotationActions, new RegExp(`import[\\s\\S]*?\\b${name}\\b`));
    assert.doesNotMatch(page, new RegExp(`function ${name}\\(`));
  }
  for (const name of ["carregarListaIdsListas", "salvarListaIdsListas", "colecaoTemObraListas", "removerObraDaColecaoListas"]) {
    assert.match(workMenuActions, new RegExp(`import[\\s\\S]*?\\b${name}\\b`));
    assert.doesNotMatch(page, new RegExp(`function ${name}\\(`));
  }
  assert.doesNotMatch(storage, /supabase/);
  assert.doesNotMatch(works, /supabase/);
  assert.doesNotMatch(diary, /supabase/);
  assert.match(
    profileLoader,
    /import \{[\s\S]*?carregarObrasLocaisListas,[\s\S]*?\} from "\.\/listas-local-work-utils";/,
  );
  assert.match(
    profileItems,
    /import \{ obterIdentificadoresObraListas \} from "\.\/listas-local-work-utils";/,
  );
  assert.doesNotMatch(profileItems, /supabase/);
  assert.match(
    profileState,
    /import \{[\s\S]*?obterProgressoObraLocalListas,[\s\S]*?\} from "\.\/listas-local-work-utils";/,
  );
  assert.doesNotMatch(profileState, /supabase|localStorage/);
  assert.match(
    worksLoader,
    /import \{ pegarNumero, pegarTexto \} from "\.\/listas-value-utils";/,
  );
});

test("módulos preservam parsing, storage isolado, obra local e normalizadores", () => {
  assert.match(values, /valor\.replace\(/);
  assert.match(values, /valor\.trim\(\)/);
  assert.match(values, /\[1-5\]/);
  assert.match(storage, /\$\{chave\}:\$\{userIdLimpo\}/);
  assert.match(storage, /typeof window === "undefined"/);
  assert.match(storage, /JSON\.parse/);
  assert.match(storage, /new Set\(normalizarListaIdsListas/);
  assert.match(storage, /redirectTo/);
  assert.match(works, /timestampData/);
  assert.match(works, /criarSlugBase/);
  assert.match(works, /normalizarTexto/);
  assert.match(works, /Math\.min\(100/);
  assert.match(diary, /"herdar"/);
  assert.match(diary, /"privado"/);
  assert.match(diary, /"atividade"/);
});

test("valores preservam parsing, UUID e mensagens de erro", () => {
  assert.equal(valores.pegarTexto("  texto  "), "texto");
  assert.equal(valores.pegarTexto("  ", "fallback"), "fallback");
  assert.equal(valores.pegarNumero("1.234,5"), 1234.5);
  assert.equal(valores.pegarNumero("invalido", 7), 7);
  assert.equal(valores.pegarBooleanoListas(" TRUE "), true);
  assert.equal(valores.pegarBooleanoListas("0", true), false);
  assert.equal(valores.idUsuarioValido("550e8400-e29b-41d4-a716-446655440000"), true);
  assert.equal(valores.idUsuarioValido("invalido"), false);
  assert.equal(valores.obterMensagemErroListas(new Error(" falhou "), "fallback"), " falhou ");
  assert.equal(valores.obterMensagemErroListas({ message: " detalhe " }, "fallback"), "detalhe");
  assert.equal(valores.obterMensagemErroListas({}, "fallback"), "fallback");
});

test("storage preserva isolamento, deduplicação, vazio, corrupção e redirect seguro", () => {
  const dados = new Map();
  const originalWindow = globalThis.window;
  const originalStorage = globalThis.localStorage;
  globalThis.window = { location: { pathname: "/listas", search: "?modo=perfil" } };
  globalThis.localStorage = { getItem: (key) => dados.get(key) ?? null, setItem: (key, value) => dados.set(key, value) };
  armazenamento.salvarListaIdsListas("colecao", " usuario-a ", ["obra-1", "obra-1", " ", "obra-2"]);
  assert.deepEqual(armazenamento.carregarListaIdsListas("colecao", "usuario-a"), ["obra-1", "obra-2"]);
  assert.deepEqual(armazenamento.carregarListaIdsListas("colecao", "usuario-b"), []);
  dados.set("colecao:usuario-a", "{");
  assert.deepEqual(armazenamento.carregarListaIdsListas("colecao", "usuario-a"), []);
  assert.deepEqual(armazenamento.carregarListaIdsListas("colecao", "sem-dados"), []);
  assert.equal(armazenamento.criarLoginHrefListas(), "/login?redirectTo=%2Flistas%3Fmodo%3Dperfil");
  globalThis.window.location = { pathname: "//externo", search: "" };
  assert.equal(armazenamento.criarLoginHrefListas(), "/login?redirectTo=%2Flistas");
  globalThis.window = originalWindow;
  globalThis.localStorage = originalStorage;
});

test("obras locais preservam identificadores, coleção, progresso e fallbacks", () => {
  const dados = new Map([
    [
      "historietas-obras:usuario-a",
      JSON.stringify([{ id: "obra-1" }, null, ["invalido"]]),
    ],
  ]);
  const originalWindow = globalThis.window;
  const originalStorage = globalThis.localStorage;
  globalThis.window = {};
  globalThis.localStorage = { getItem: (key) => dados.get(key) ?? null };

  assert.deepEqual(obrasLocais.carregarObrasLocaisListas(" usuario-a "), [{ id: "obra-1" }]);
  dados.set("historietas-obras:usuario-a", "{");
  assert.deepEqual(obrasLocais.carregarObrasLocaisListas("usuario-a"), []);
  assert.deepEqual(obrasLocais.carregarObrasLocaisListas(""), []);

  globalThis.window = originalWindow;
  globalThis.localStorage = originalStorage;

  const obra = { id: "obra-1", slug: "minha-obra", titulo: "Minha Obra" };
  assert.equal(obrasLocais.obterIdentificadoresObraListas(obra).includes("obra-1"), true);
  assert.equal(obrasLocais.colecaoTemObraListas(["minha-obra"], obra), true);
  assert.deepEqual(obrasLocais.removerObraDaColecaoListas(["obra-1", "outra"], obra), ["outra"]);
  assert.deepEqual(obrasLocais.obterProgressoObraLocalListas({ capitulos: [{ id: "1", lido: true, lido_em: "2024-02-01" }, { id: "2", lido: false }], progresso: 80 }), { progresso: 80, data: "2024-02-01", capituloId: "1" });
  assert.deepEqual(obrasLocais.obterProgressoObraLocalListas({}), { progresso: 0, data: "", capituloId: "" });
});

test("normalizadores do Diário preservam todos os fallbacks", () => {
  assert.equal(diarioNormalizado.normalizarQuemPodeComentarAnotacaoListas("invalido", "seguidores"), "seguidores");
  assert.equal(diarioNormalizado.normalizarQuemPodeComentarAnotacaoListas("herdar", "seguidores"), "herdar");
  assert.equal(diarioNormalizado.normalizarVisibilidadeComentariosAnotacaoListas("invalido"), "herdar");
  assert.equal(diarioNormalizado.normalizarVisibilidadeComentariosAnotacaoListas("herdar", "seguidores"), "herdar");
  assert.equal(diarioNormalizado.normalizarQuemPodeAvaliarDiarioListas("invalido"), "todos");
  assert.equal(diarioNormalizado.normalizarVisibilidadeAnotacaoListas("invalido"), "privado");
  assert.equal(diarioNormalizado.normalizarTipoDiarioListas("invalido"), "");
  assert.equal(diarioNormalizado.obterTipoDiarioDoItemListas("tudo", { categorias: ["favoritas"] }), "favorita");
  assert.equal(diarioNormalizado.obterTipoDiarioDoItemListas("historico"), "atividade");
});
