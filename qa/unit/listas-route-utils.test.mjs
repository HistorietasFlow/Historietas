import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const utilsSource = readFileSync(
  new URL("../../app/listas/lib/listas-route-utils.ts", import.meta.url),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/listas/page.tsx", import.meta.url),
  "utf8",
);
const utilsJavascript = typescript.transpileModule(utilsSource, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const {
  normalizarCategoriaPerfil,
  normalizarModoLista,
  normalizarOrdenacao,
  normalizarOrigemPerfil,
} = await import(
  `data:text/javascript;base64,${Buffer.from(utilsJavascript).toString("base64")}`,
);

test("normalizarModoLista preserva valores permitidos e fallback", () => {
  assert.equal(normalizarModoLista("perfil"), "perfil");
  assert.equal(normalizarModoLista("autores"), "autores");
  assert.equal(normalizarModoLista("obras"), "obras");
  assert.equal(normalizarModoLista("invalido"), "obras");
  assert.equal(normalizarModoLista(null), "obras");
});

test("normalizarOrigemPerfil preserva biblioteca e fallback diario", () => {
  assert.equal(normalizarOrigemPerfil("biblioteca"), "biblioteca");
  assert.equal(normalizarOrigemPerfil("diario"), "diario");
  assert.equal(normalizarOrigemPerfil("invalida"), "diario");
  assert.equal(normalizarOrigemPerfil(null), "diario");
});

test("normalizarCategoriaPerfil preserva os sete valores aceitos", () => {
  for (const categoria of [
    "lendo",
    "quero-ler",
    "favoritas",
    "concluidas",
    "avaliacoes",
    "historico",
    "tudo",
  ]) {
    assert.equal(normalizarCategoriaPerfil(categoria), categoria);
  }

  assert.equal(normalizarCategoriaPerfil("invalida"), "tudo");
  assert.equal(normalizarCategoriaPerfil(null), "tudo");
});

test("normalizarOrdenacao preserva especiais e recentes por fallback", () => {
  assert.equal(normalizarOrdenacao("titulo"), "titulo");
  assert.equal(normalizarOrdenacao("avaliacao"), "avaliacao");
  assert.equal(normalizarOrdenacao("popularidade"), "popularidade");
  assert.equal(normalizarOrdenacao("recentes"), "recentes");
  assert.equal(normalizarOrdenacao("invalida"), "recentes");
  assert.equal(normalizarOrdenacao(null), "recentes");
});

test("Listas delega somente a normalizacao de parametros de rota", () => {
  assert.match(
    pagina,
    /import \{[\s\S]*?normalizarCategoriaPerfil,[\s\S]*?normalizarModoLista,[\s\S]*?normalizarOrdenacao,[\s\S]*?normalizarOrigemPerfil,[\s\S]*?\} from "\.\/lib\/listas-route-utils";/,
  );

  for (const helper of [
    "normalizarModoLista",
    "normalizarOrigemPerfil",
    "normalizarCategoriaPerfil",
    "normalizarOrdenacao",
  ]) {
    assert.doesNotMatch(pagina, new RegExp(`function ${helper}\\(`));
  }

  assert.match(
    pagina,
    /const modo: ModoLista = normalizarModoLista\(searchParams\.get\("modo"\)\);/,
  );
  assert.match(
    pagina,
    /const origemPerfil: OrigemPerfil = normalizarOrigemPerfil\([\s\S]*?searchParams\.get\("origem"\),[\s\S]*?\);/,
  );
  assert.match(
    pagina,
    /const categoriaUrl = normalizarCategoriaPerfil\(searchParams\.get\("categoria"\)\);/,
  );
  assert.match(
    pagina,
    /const ordenacao: OrdenacaoLista = normalizarOrdenacao\([\s\S]*?searchParams\.get\("ordem"\),[\s\S]*?\);/,
  );

  for (const tipo of [
    "ModoLista",
    "OrigemPerfil",
    "CategoriaPerfil",
    "OrdenacaoLista",
  ]) {
    assert.match(pagina, new RegExp(`type ${tipo} =`));
  }

  assert.match(pagina, /function normalizarQuemPodeComentarAnotacaoListas\(/);
  assert.match(pagina, /function normalizarVisibilidadeComentariosAnotacaoListas\(/);
  assert.match(pagina, /const searchParams = useSearchParams\(\);/);
  assert.match(pagina, /useState/);
  assert.match(pagina, /useEffect/);
  assert.match(pagina, /supabase/);
  assert.match(pagina, /localStorage/);
  assert.doesNotMatch(utilsSource, /useState|useEffect|supabase|localStorage/);
});
