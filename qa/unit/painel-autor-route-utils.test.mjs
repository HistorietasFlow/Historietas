import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const utilsSource = readFileSync(
  new URL(
    "../../app/painel-autor/lib/painel-autor-route-utils.ts",
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
const { criarLoginHrefPainelAutor, criarPerfilAutorHref } = await import(
  `data:text/javascript;base64,${Buffer.from(utilsJavascript).toString("base64")}`,
);

test("criarLoginHrefPainelAutor preserva redirect e encoding", () => {
  assert.equal(
    criarLoginHrefPainelAutor(),
    "/login?redirectTo=%2Fpainel-autor",
  );
});

test("criarPerfilAutorHref preserva limpeza, fallbacks e parâmetros", () => {
  assert.equal(criarPerfilAutorHref("  Ana  "), "/perfil-autor?autor=Ana");
  assert.equal(
    criarPerfilAutorHref("Ana", " autor-1 ", " user-1 "),
    "/perfil-autor?autor=Ana&autorId=autor-1&userId=user-1",
  );
  assert.equal(
    criarPerfilAutorHref("", "autor-1"),
    "/perfil-autor?autor=Autor+n%C3%A3o+informado&autorId=autor-1&userId=autor-1",
  );
  assert.equal(
    criarPerfilAutorHref("Ana", "   ", "   "),
    "/perfil-autor?autor=Ana",
  );
});

test("Painel do Autor delega somente os helpers de navegação", () => {
  assert.match(
    pagina,
    /import \{[\s\S]*?criarLoginHrefPainelAutor,[\s\S]*?criarPerfilAutorHref,[\s\S]*?\} from "\.\/lib\/painel-autor-route-utils";/,
  );
  assert.doesNotMatch(pagina, /function criarLoginHrefPainelAutor\(/);
  assert.doesNotMatch(pagina, /function criarPerfilAutorHref\(/);
  assert.equal((pagina.match(/\bcriarLoginHrefPainelAutor\b/g) || []).length, 3);
  assert.equal((pagina.match(/\bcriarPerfilAutorHref\b/g) || []).length, 2);
  assert.match(pagina, /function criarHrefLeituraCapituloPainel\(/);
  assert.match(pagina, /supabase\.auth\.getUser\(\)/);
  assert.match(pagina, /const STORAGE_KEY/);
  assert.doesNotMatch(utilsSource, /supabase|localStorage|useState|useEffect/);
});
