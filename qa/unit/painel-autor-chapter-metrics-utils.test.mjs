import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const utilsSource = readFileSync(
  new URL(
    "../../app/painel-autor/lib/painel-autor-chapter-metrics-utils.ts",
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
const { calcularCurtidas, calcularComentarios, calcularSalvos } = await import(
  `data:text/javascript;base64,${Buffer.from(utilsJavascript).toString("base64")}`,
);

const obra = {
  capitulos: [
    { curtiu: true, salvo: false, comentario: "   " },
    { curtiu: false, salvo: true, comentario: "Comentado" },
    { curtiu: true, salvo: true, comentario: "  Outro comentario  " },
  ],
};

test("metricas preservam as contagens por capitulo", () => {
  assert.equal(calcularCurtidas(obra), 2);
  assert.equal(calcularSalvos(obra), 2);
});

test("comentarios ignora texto vazio ou somente espacos", () => {
  assert.equal(calcularComentarios(obra), 2);
  assert.equal(calcularComentarios({ capitulos: [] }), 0);
});

test("Painel do Autor delega somente os helpers puros de metricas", () => {
  assert.match(
    pagina,
    /import \{[\s\S]*?calcularComentarios,[\s\S]*?calcularCurtidas,[\s\S]*?calcularSalvos,[\s\S]*?\} from "\.\/lib\/painel-autor-chapter-metrics-utils";/,
  );
  assert.doesNotMatch(pagina, /function calcularCurtidas\(/);
  assert.doesNotMatch(pagina, /function calcularComentarios\(/);
  assert.doesNotMatch(pagina, /function calcularSalvos\(/);
  assert.equal((pagina.match(/\bcalcularCurtidas\b/g) || []).length, 2);
  assert.equal((pagina.match(/\bcalcularComentarios\b/g) || []).length, 2);
  assert.equal((pagina.match(/\bcalcularSalvos\b/g) || []).length, 2);
  assert.match(pagina, /supabase\.auth\.getUser\(\)/);
  assert.doesNotMatch(utilsSource, /supabase|useState|useEffect/);
});
