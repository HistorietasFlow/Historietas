import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const source = readFileSync(
  new URL(
    "../../app/seguindo/lib/seguindo-work-collection-utils.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/seguindo/page.tsx", import.meta.url),
  "utf8",
);
const filtroObras = readFileSync(
  new URL("../../app/seguindo/lib/seguindo-filtered-works.ts", import.meta.url),
  "utf8",
);
const acoesObraAutor = readFileSync(
  new URL(
    "../../app/seguindo/hooks/use-seguindo-work-author-actions.ts",
    import.meta.url,
  ),
  "utf8",
);
const utilsSource = readFileSync(
  new URL("../../lib/utils.ts", import.meta.url),
  "utf8",
);
const formatSource = readFileSync(
  new URL(
    "../../app/seguindo/lib/seguindo-format-utils.ts",
    import.meta.url,
  ),
  "utf8",
);

const options = {
  compilerOptions: {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ES2022,
  },
};
const utilsJs = typescript.transpileModule(utilsSource, options).outputText;
const utilsUrl =
  `data:text/javascript;base64,${Buffer.from(utilsJs).toString("base64")}`;

const formatExecutable = formatSource.replace(
  '"../../../lib/utils"',
  JSON.stringify(utilsUrl),
);
const formatJs = typescript.transpileModule(
  formatExecutable,
  options,
).outputText;
const formatUrl =
  `data:text/javascript;base64,${Buffer.from(formatJs).toString("base64")}`;

const executable = source
  .replace('"../../../lib/utils"', JSON.stringify(utilsUrl))
  .replace(
    '"./seguindo-format-utils"',
    JSON.stringify(formatUrl),
  );
const javascript = typescript.transpileModule(
  executable,
  options,
).outputText;

const {
  criarChavesObra,
  obraEstaNaLista,
  removerObraDaLista,
} = await import(
  `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`
);

const obra = {
  id: " obra-1 ",
  titulo: " Minha História ",
  slug: "minha-historia",
  link: "/obra/minha-historia",
};

test("chaves da obra preservam IDs, slug, título normalizado e link", () => {
  assert.deepEqual(
    criarChavesObra(obra),
    [
      "obra-1",
      "minha-historia",
      "minha historia",
      "/obra/minha-historia",
    ],
  );
});

test("presença na lista aceita qualquer chave equivalente da obra", () => {
  assert.equal(
    obraEstaNaLista(obra, [" outra ", "minha-historia"]),
    true,
  );
  assert.equal(
    obraEstaNaLista(obra, ["outra"]),
    false,
  );
});

test("remoção elimina todas as chaves equivalentes e preserva as demais", () => {
  assert.deepEqual(
    removerObraDaLista(
      obra,
      [
        " obra-1 ",
        "minha-historia",
        "minha historia",
        "/obra/minha-historia",
        "outra",
        " outra ",
      ],
    ),
    ["outra"],
  );
});

test("página e hook delegam coleções de obra ao módulo dedicado", () => {
  assert.match(
    filtroObras,
    /import \{ obraEstaNaLista \} from "\.\/seguindo-work-collection-utils";/,
  );
  assert.match(
    acoesObraAutor,
    /import \{ removerObraDaLista \} from "\.\.\/lib\/seguindo-work-collection-utils";/,
  );
  assert.doesNotMatch(
    pagina,
    /\bcriarChavesObra\b/,
  );

  for (const [nome, consumidor] of [
    ["criarChavesObra", pagina],
    ["obraEstaNaLista", filtroObras],
    ["removerObraDaLista", acoesObraAutor],
  ]) {
    assert.doesNotMatch(
      consumidor,
      new RegExp(`function ${nome}\\(`),
    );
  }
});
