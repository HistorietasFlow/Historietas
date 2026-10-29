import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const modulePath = path.join(root, "app/explorar/lib/explorar-published-state.ts");
const pagePath = path.join(root, "app/explorar/page.tsx");

async function carregarPossuiObrasPublicadasExplorar() {
  const source = await readFile(modulePath, "utf8");
  const executable = source
    .replace(
      /import \{[\s\S]*?\} from "\.\/explorar-work-normalizers";\r?\n\r?\n/,
      "",
    )
    .replace(
      "export function possuiObrasPublicadasExplorar(obrasLocais: ObraLocal[])",
      "function possuiObrasPublicadasExplorar(obrasLocais)",
    );

  return new Function(
    "obraTemConteudoPublicadoExplorar",
    `${executable}\nreturn possuiObrasPublicadasExplorar;`,
  )((obra) => Boolean(obra.temConteudoPublicado));
}

test("reconhece somente obras publicadas com conteúdo", async () => {
  const possuiObrasPublicadasExplorar =
    await carregarPossuiObrasPublicadasExplorar();

  assert.equal(possuiObrasPublicadasExplorar([]), false);
  assert.equal(
    possuiObrasPublicadasExplorar([
      { publicado: false, temConteudoPublicado: true },
    ]),
    false,
  );
  assert.equal(
    possuiObrasPublicadasExplorar([
      { publicado: true, temConteudoPublicado: false },
    ]),
    false,
  );
  assert.equal(
    possuiObrasPublicadasExplorar([
      { publicado: true, temConteudoPublicado: true },
    ]),
    true,
  );
  assert.equal(
    possuiObrasPublicadasExplorar([
      { publicado: false, temConteudoPublicado: true },
      { publicado: true, temConteudoPublicado: true },
    ]),
    true,
  );
});

test("preserva some, short-circuit e delegação da página", async () => {
  const [source, pageRaw] = await Promise.all([
    readFile(modulePath, "utf8"),
    readFile(pagePath, "utf8"),
  ]);
  const page = pageRaw.replace(/\r\n/g, "\n");

  assert.match(source, /return obrasLocais\.some\(\(obra\) => \{/);
  assert.match(
    source,
    /obra\.publicado && obraTemConteudoPublicadoExplorar\(obra\)/,
  );
  assert.doesNotMatch(source, /\.filter\(/);
  assert.match(page, /import \{ possuiObrasPublicadasExplorar \} from "\.\/lib\/explorar-published-state";/);
  assert.match(
    page,
    /const possuiObrasPublicadas =\n    possuiObrasPublicadasExplorar\(obrasLocais\);/,
  );
  assert.doesNotMatch(page, /obraTemConteudoPublicadoExplorar/);
});
