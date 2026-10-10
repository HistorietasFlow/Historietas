import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const utilsSource = readFileSync(
  new URL(
    "../../app/painel-autor/lib/painel-autor-profile-utils.ts",
    import.meta.url,
  ),
  "utf8",
);
const pagina = readFileSync(
  new URL("../../app/painel-autor/page.tsx", import.meta.url),
  "utf8",
);
const utilsJavascript = typescript
  .transpileModule(utilsSource, {
    compilerOptions: {
      module: typescript.ModuleKind.ESNext,
      target: typescript.ScriptTarget.ES2022,
    },
  })
  .outputText.replace(
    'import { obraPertenceAoUsuarioPainel } from "./painel-autor-ownership-utils";',
    'const obraPertenceAoUsuarioPainel = (obra, userId) => Boolean(userId.trim() && obra.autorId?.trim().toLowerCase() === userId.trim().toLowerCase());',
  );
const { obterNomeProfilePainelAutor, aplicarNomeProfileNasObrasPainel } = await import(
  `data:text/javascript;base64,${Buffer.from(utilsJavascript).toString("base64")}`,
);

test("obterNomeProfilePainelAutor preserva validação e trim", () => {
  assert.equal(obterNomeProfilePainelAutor({ nome: "  Autora  " }), "Autora");
  assert.equal(obterNomeProfilePainelAutor({ nome: "   " }), "");
  assert.equal(obterNomeProfilePainelAutor({ nome: 12 }), "");
  assert.equal(obterNomeProfilePainelAutor(null), "");
});

test("aplicarNomeProfileNasObrasPainel preserva identidade, ordem e fallback de autor", () => {
  const propriaComAutor = { id: "1", autor: "Antigo", autorId: " user-1 " };
  const propriaSemAutor = { id: "2", autor: "Antigo", autorId: "" };
  const outra = { id: "3", autor: "Outra", autorId: "user-2" };
  const obras = [propriaComAutor, propriaSemAutor, outra];

  const atualizadas = aplicarNomeProfileNasObrasPainel(
    obras,
    "user-1",
    "  Novo nome  ",
  );

  assert.deepEqual(atualizadas, [
    { id: "1", autor: "Novo nome", autorId: " user-1 " },
    propriaSemAutor,
    outra,
  ]);
  assert.notStrictEqual(atualizadas[0], propriaComAutor);
  assert.strictEqual(atualizadas[1], propriaSemAutor);
  assert.strictEqual(atualizadas[2], outra);
});

test("aplicarNomeProfileNasObrasPainel devolve a lista original quando o nome é vazio", () => {
  const obras = [{ id: "1", autor: "Autora", autorId: "user-1" }];
  assert.strictEqual(aplicarNomeProfileNasObrasPainel(obras, "user-1", "  "), obras);
});

test("Painel do Autor delega somente os helpers de perfil ao módulo extraído", () => {
  assert.match(
    pagina,
    /import \{\s*aplicarNomeProfileNasObrasPainel,\s*obterNomeProfilePainelAutor,\s*\} from "\.\/lib\/painel-autor-profile-utils";/,
  );
  assert.doesNotMatch(pagina, /function obterNomeProfilePainelAutor\(/);
  assert.doesNotMatch(pagina, /function aplicarNomeProfileNasObrasPainel\(/);
  assert.equal((pagina.match(/\bobterNomeProfilePainelAutor\b/g) || []).length, 3);
  assert.equal((pagina.match(/\baplicarNomeProfileNasObrasPainel\b/g) || []).length, 4);
  assert.match(pagina, /async function carregarProfilePainelAutor\(/);
  assert.match(
    utilsSource,
    /import \{ obraPertenceAoUsuarioPainel \} from "\.\/painel-autor-ownership-utils";/,
  );
  assert.doesNotMatch(utilsSource, /supabase|localStorage|useState|useEffect/);
});
