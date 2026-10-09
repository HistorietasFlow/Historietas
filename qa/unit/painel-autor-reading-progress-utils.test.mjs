import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const utilsSource = readFileSync(
  new URL(
    "../../app/painel-autor/lib/painel-autor-reading-progress-utils.ts",
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
  obterCapitulosPublicadosPainel,
  calcularProgressoLeitura,
  encontrarCapituloParaContinuar,
} = await import(
  `data:text/javascript;base64,${Buffer.from(utilsJavascript).toString("base64")}`,
);

test("filtra somente capitulos explicitamente nao publicados e preserva identidade", () => {
  const primeiro = { id: "1", publicado: true, lido: false };
  const segundo = { id: "2", lido: true };
  const rascunho = { id: "3", publicado: false, lido: true };
  const publicados = obterCapitulosPublicadosPainel([primeiro, segundo, rascunho]);

  assert.deepEqual(publicados, [primeiro, segundo]);
  assert.equal(publicados[0], primeiro);
  assert.equal(publicados[1], segundo);
});

test("calcula progresso com capitulos publicados, lidos, arredondamento e fallback", () => {
  assert.equal(
    calcularProgressoLeitura([
      { publicado: true, lido: true },
      { publicado: true, lido: false },
      { publicado: true, lido: true },
    ]),
    67,
  );
  assert.equal(
    calcularProgressoLeitura([{ publicado: false, lido: true }]),
    0,
  );
  assert.equal(calcularProgressoLeitura([]), 0);
});

test("encontra o proximo capitulo nao lido apos o ultimo lido", () => {
  const primeiro = { id: "1", publicado: true, lido: true };
  const segundo = { id: "2", publicado: true, lido: false };
  const terceiro = { id: "3", publicado: true, lido: false };

  assert.equal(
    encontrarCapituloParaContinuar({
      capitulos: [primeiro, segundo, terceiro],
      ultimoCapituloLidoId: "1",
    }),
    segundo,
  );
});

test("preserva fallbacks do capitulo para continuar", () => {
  const primeiro = { id: "1", publicado: true, lido: false };
  const ultimo = { id: "2", publicado: true, lido: true };

  assert.equal(
    encontrarCapituloParaContinuar({
      capitulos: [primeiro, ultimo],
      ultimoCapituloLidoId: "inexistente",
    }),
    primeiro,
  );
  assert.equal(
    encontrarCapituloParaContinuar({
      capitulos: [ultimo, { id: "3", publicado: false, lido: false }],
      ultimoCapituloLidoId: "2",
    }),
    ultimo,
  );
  assert.equal(
    encontrarCapituloParaContinuar({
      capitulos: [{ id: "1", publicado: true, lido: false }],
      ultimoCapituloLidoId: "",
    }),
    null,
  );
});

test("Painel do Autor delega somente helpers puros de progresso", () => {
  assert.match(
    pagina,
    /import \{[\s\S]*?calcularProgressoLeitura,[\s\S]*?encontrarCapituloParaContinuar,[\s\S]*?obterCapitulosPublicadosPainel,[\s\S]*?\} from "\.\/lib\/painel-autor-reading-progress-utils";/,
  );
  assert.doesNotMatch(pagina, /function obterCapitulosPublicadosPainel\(/);
  assert.doesNotMatch(pagina, /function calcularProgressoLeitura\(/);
  assert.doesNotMatch(pagina, /function encontrarCapituloParaContinuar\(/);
  assert.equal((pagina.match(/\bobterCapitulosPublicadosPainel\b/g) || []).length, 3);
  assert.equal((pagina.match(/\bcalcularProgressoLeitura\b/g) || []).length, 4);
  assert.equal((pagina.match(/\bencontrarCapituloParaContinuar\b/g) || []).length, 2);
  assert.match(pagina, /supabase\.auth\.getUser\(\)/);
  assert.doesNotMatch(utilsSource, /supabase|useState|useEffect/);
});
