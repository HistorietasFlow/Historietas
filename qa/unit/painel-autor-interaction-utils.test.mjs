import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const utilsSource = readFileSync(
  new URL(
    "../../app/painel-autor/lib/painel-autor-interaction-utils.ts",
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
const { criarChaveInteracao } = await import(
  `data:text/javascript;base64,${Buffer.from(utilsJavascript).toString("base64")}`,
);

test("criarChaveInteracao preserva assinatura e formato", () => {
  assert.equal(criarChaveInteracao("obra-1", "capitulo-2"), "obra-1::capitulo-2");
  assert.equal(criarChaveInteracao(" obra ", " capitulo "), " obra :: capitulo ");
});

test("Painel do Autor delega somente a chave de interação ao helper extraído", () => {
  assert.match(
    pagina,
    /import \{ criarChaveInteracao \} from "\.\/lib\/painel-autor-interaction-utils";/,
  );
  assert.doesNotMatch(pagina, /function criarChaveInteracao\(/);
  assert.equal((pagina.match(/\bcriarChaveInteracao\b/g) || []).length, 5);
  assert.doesNotMatch(utilsSource, /supabase|localStorage|useState|useEffect/);
});
