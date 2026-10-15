import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const modulo = readFileSync(
  new URL("../../app/lib/home-collection-utils.ts", import.meta.url),
  "utf8",
);
const pagina = readFileSync(new URL("../../app/page.tsx", import.meta.url), "utf8");
const storage = readFileSync(
  new URL("../../app/lib/home-storage-utils.ts", import.meta.url),
  "utf8",
);
const moduloExecutavel = modulo.replace(/\r\n/g, "\n").replace(
  'import { criarSlugBase, normalizarTexto } from "../../lib/utils";\n',
  `const criarSlugBase = (valor) => normalizarTexto(valor).replace(/\\s+/g, "-");
const normalizarTexto = (valor) => String(valor || "")
  .normalize("NFD")
  .replace(/[\\u0300-\\u036f]/g, "")
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, " ")
  .trim();
`,
);
const javascriptModulo = typescript.transpileModule(moduloExecutavel, {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
}).outputText;
const {
  colecaoTemIdentificadorHome,
  criarFavoritosNormalizadosHome,
  criarIdentificadoresObraCatalogoHome,
  criarIdentificadoresObraLocalHome,
  normalizarListaIdsHome,
  obraCatalogoEstaNaMinhaLista,
  obraLocalEstaNaMinhaLista,
  obterIdentificadorFavoritoHome,
  removerIdentificadoresDaListaHome,
} = await import(
  `data:text/javascript;base64,${Buffer.from(javascriptModulo).toString("base64")}`,
);

test("home-collection-utils preserva prioridade, trim e normalização", () => {
  assert.equal(
    obterIdentificadorFavoritoHome({ id: " obra-id ", slug: "obra-slug", titulo: "Outra obra" }),
    "obra-id",
  );
  assert.equal(
    obterIdentificadorFavoritoHome({ slug: " obra-slug ", titulo: "Outra obra" }),
    "obra-slug",
  );
  assert.equal(
    obterIdentificadorFavoritoHome({ titulo: "Árvore Mágica" }),
    "arvore-magica",
  );
  assert.deepEqual(
    normalizarListaIdsHome([" primeiro ", "segundo", "primeiro", "", "   "]),
    ["primeiro", "segundo"],
  );
  assert.deepEqual(
    [...criarFavoritosNormalizadosHome([" favorito ", "", "favorito", "outro "])],
    ["favorito", "outro"],
  );
});

test("home-collection-utils preserva identificadores e comparação das coleções", () => {
  const obraLocal = { id: "local-id", slug: "local-slug", titulo: "Árvore Mágica" };
  const obraCatalogo = { id: " catalogo-id ", slug: " catalogo-slug ", titulo: "Árvore Mágica" };

  assert.deepEqual(criarIdentificadoresObraLocalHome(obraLocal), [
    "local-id",
    "local-slug",
    "arvore-magica",
    "arvore magica",
  ]);
  assert.deepEqual(criarIdentificadoresObraCatalogoHome(obraCatalogo), [
    "catalogo-id",
    "catalogo-slug",
    "arvore-magica",
    "arvore magica",
  ]);
  assert.equal(colecaoTemIdentificadorHome(["local-slug"], [" local-slug "]), true);
  assert.equal(obraLocalEstaNaMinhaLista(obraLocal, ["arvore magica"]), true);
  assert.equal(obraCatalogoEstaNaMinhaLista(obraCatalogo, ["catalogo-id"]), true);
  assert.equal(obraCatalogoEstaNaMinhaLista(obraCatalogo, ["ausente"]), false);
});

test("home-collection-utils preserva remoção e a fronteira pura", () => {
  assert.deepEqual(
    removerIdentificadoresDaListaHome(
      [" manter ", "remover", "tambem-remover", "manter"],
      ["remover", "tambem-remover"],
    ),
    ["manter"],
  );
  assert.match(
    modulo,
    /import \{ criarSlugBase, normalizarTexto \} from "\.\.\/\.\.\/lib\/utils";/,
  );
  for (const nomeFuncao of [
    "obterIdentificadorFavoritoHome",
    "criarFavoritosNormalizadosHome",
    "normalizarListaIdsHome",
    "criarIdentificadoresObraLocalHome",
    "criarIdentificadoresObraCatalogoHome",
    "colecaoTemIdentificadorHome",
    "removerIdentificadoresDaListaHome",
    "obraLocalEstaNaMinhaLista",
    "obraCatalogoEstaNaMinhaLista",
  ]) {
    assert.match(modulo, new RegExp(`export function ${nomeFuncao}\\b`));
    assert.doesNotMatch(pagina, new RegExp(`function ${nomeFuncao}\\b`));
  }
  assert.match(pagina, /from "\.\/lib\/home-collection-utils";/);
  assert.match(storage, /import \{ normalizarListaIdsHome \} from "\.\/home-collection-utils";/);
  assert.match(storage, /return normalizarListaIdsHome\(\[\.\.\.fallback, \.\.\.listaSalva\]\);/);
  assert.doesNotMatch(pagina, /function carregarListaIdsHome\(/);
  assert.doesNotMatch(modulo, /localStorage|supabase|useEffect|useState/);
});
