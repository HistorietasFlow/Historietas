import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const modulo = readFileSync(
  new URL("../../app/em-alta/lib/em-alta-route-utils.ts", import.meta.url),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/em-alta/page.tsx", import.meta.url),
  "utf8",
);
const executavel = modulo
  .replace(
    'import {\n  criarSlugBase,\n  idObraSupabaseValido,\n} from "../../../lib/utils";\n',
    'const criarSlugBase = (texto) => String(texto).trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");\nconst idObraSupabaseValido = (id) => id === "00000000-0000-4000-8000-000000000001";\n',
  )
  .replace(
    'import type {\n  CapituloLocal,\n  ObraLocal,\n} from "./em-alta-models";\n',
    "",
  );
const javascriptModulo = typescript.transpileModule(executavel, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const utils = await import(
  `data:text/javascript;base64,${Buffer.from(javascriptModulo).toString("base64")}`,
);
const obraValida = {
  id: "00000000-0000-4000-8000-000000000001",
  slug: "obra-publicada",
  titulo: "Obra Publicada",
  publicado: true,
};
const capitulo = { id: "capitulo com espaço" };

function definirWindow(windowMock) {
  const descritorAnterior = Object.getOwnPropertyDescriptor(globalThis, "window");

  if (windowMock) {
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: windowMock,
    });
  } else {
    delete globalThis.window;
  }

  return () => {
    if (descritorAnterior) {
      Object.defineProperty(globalThis, "window", descritorAnterior);
    } else {
      delete globalThis.window;
    }
  };
}

test("criarLoginHrefEmAlta preserva redirect seguro", () => {
  let restaurar = definirWindow();
  assert.equal(utils.criarLoginHrefEmAlta(), "/login?redirectTo=%2Fem-alta");
  restaurar();

  restaurar = definirWindow({ location: { pathname: "/em-alta", search: "" } });
  assert.equal(utils.criarLoginHrefEmAlta(), "/login?redirectTo=%2Fem-alta");
  restaurar();

  restaurar = definirWindow({
    location: { pathname: "/em-alta", search: "?tipo=geral" },
  });
  assert.equal(
    utils.criarLoginHrefEmAlta(),
    "/login?redirectTo=%2Fem-alta%3Ftipo%3Dgeral",
  );
  restaurar();

  restaurar = definirWindow({ location: { pathname: "//externo", search: "" } });
  assert.equal(utils.criarLoginHrefEmAlta(), "/login?redirectTo=%2Fem-alta");
  restaurar();
});

test("criarHrefLeituraCapitulo preserva rota pública e fallback", () => {
  assert.equal(
    utils.criarHrefLeituraCapitulo(obraValida, capitulo, 3),
    "/obra/obra-publicada/capitulo/3",
  );
  assert.equal(
    utils.criarHrefLeituraCapitulo(
      { ...obraValida, slug: "", titulo: "Obra & Especial" },
      capitulo,
      1,
    ),
    "/obra/obra-especial/capitulo/1",
  );

  for (const [obra, numeroCapitulo] of [
    [{ ...obraValida, publicado: false }, 1],
    [{ ...obraValida, id: "obra local" }, 1],
    [obraValida, 0],
    [obraValida, 1.5],
  ]) {
    assert.equal(
      utils.criarHrefLeituraCapitulo(obra, capitulo, numeroCapitulo),
      `/ler-capitulo?obraId=${encodeURIComponent(obra.id)}&capituloId=capitulo%20com%20espa%C3%A7o`,
    );
  }
});

test("criarLinkPerfilAutorRanking preserva parâmetros, trims e fallback", () => {
  assert.equal(
    utils.criarLinkPerfilAutorRanking(" Ana "),
    "/perfil-autor?autor=Ana",
  );
  assert.equal(
    utils.criarLinkPerfilAutorRanking("", " id-autor "),
    "/perfil-autor?autorId=id-autor&userId=id-autor",
  );
  assert.equal(
    utils.criarLinkPerfilAutorRanking(" Ana & Bia ", " id-autor "),
    "/perfil-autor?autor=Ana+%26+Bia&autorId=id-autor&userId=id-autor",
  );
  assert.equal(utils.criarLinkPerfilAutorRanking("   ", "  "), "/perfil-autor");
});

test("Em Alta delega as três rotas à fronteira pura", () => {
  assert.match(
    pagina,
    /import \{[\s\S]*?criarHrefLeituraCapitulo,[\s\S]*?criarLinkPerfilAutorRanking,[\s\S]*?criarLoginHrefEmAlta,[\s\S]*?\} from "\.\/lib\/em-alta-route-utils";/,
  );

  for (const nome of [
    "criarLoginHrefEmAlta",
    "criarHrefLeituraCapitulo",
    "criarLinkPerfilAutorRanking",
  ]) {
    assert.doesNotMatch(pagina, new RegExp(`function ${nome}\\b`));
    assert.match(modulo, new RegExp(`export function ${nome}\\b`));
  }

  for (const proibido of [
    /react/i,
    /\buse[A-Z]\w*\b/,
    /supabase\/client/,
    /localStorage/,
    /\bauth\b/i,
    /<[A-Z][\w.]*\s+[\w-]+=/,
  ]) {
    assert.doesNotMatch(modulo, proibido);
  }
});
