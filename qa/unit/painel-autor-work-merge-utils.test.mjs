import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const utilsSource = readFileSync(
  new URL(
    "../../app/painel-autor/lib/painel-autor-work-merge-utils.ts",
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
    'import { criarSlugBase } from "../../../lib/utils";',
    'const criarSlugBase = (texto) => texto.trim().toLowerCase().replace(/\\s+/g, "-");',
  );
const { mesclarObrasPainelAutor } = await import(
  `data:text/javascript;base64,${Buffer.from(utilsJavascript).toString("base64")}`,
);

test("mesclarObrasPainelAutor preserva correspondência, prioridade e ordem", () => {
  const localPorId = { id: "1", slug: "local", titulo: "Local", origem: "local" };
  const localPorSlug = { id: "2", slug: "", titulo: "Outra Obra", origem: "local" };
  const supabasePorId = { id: "1", slug: "remota", titulo: "Remota", origem: "supabase" };
  const supabasePorSlug = { id: "3", slug: "outra-obra", titulo: "Outra remota", origem: "supabase" };
  const supabaseNova = { id: "4", slug: "nova", titulo: "Nova", origem: "supabase" };

  const obrasLocais = [localPorId, localPorSlug];
  const obrasSupabase = [supabasePorId, supabasePorSlug, supabaseNova];
  const resultado = mesclarObrasPainelAutor(
    obrasLocais,
    obrasSupabase,
  );

  assert.deepEqual(resultado, [
    supabaseNova,
    { ...localPorId, ...supabasePorId },
    { ...localPorSlug, ...supabasePorSlug },
  ]);
  assert.notStrictEqual(resultado, obrasLocais);
  assert.notStrictEqual(resultado[1], localPorId);
  assert.notStrictEqual(resultado[2], localPorSlug);
  assert.strictEqual(resultado[0], supabaseNova);
});

test("mesclarObrasPainelAutor devolve nova lista e preserva referências sem Supabase", () => {
  const obraLocal = { id: "1", slug: "obra", titulo: "Obra" };
  const obrasLocais = [obraLocal];

  const resultado = mesclarObrasPainelAutor(obrasLocais, []);

  assert.deepEqual(resultado, obrasLocais);
  assert.notStrictEqual(resultado, obrasLocais);
  assert.strictEqual(resultado[0], obraLocal);
});

test("Painel do Autor delega somente a mesclagem de obras ao módulo extraído", () => {
  assert.match(
    pagina,
    /import \{ mesclarObrasPainelAutor \} from "\.\/lib\/painel-autor-work-merge-utils";/,
  );
  assert.doesNotMatch(pagina, /function mesclarObrasPainelAutor\(/);
  assert.equal((pagina.match(/\bmesclarObrasPainelAutor\b/g) || []).length, 2);
  assert.match(pagina, /async function carregarPainelAutorSupabase\(/);
  assert.match(
    utilsSource,
    /import \{ criarSlugBase \} from "\.\.\/\.\.\/\.\.\/lib\/utils";/,
  );
  assert.match(utilsSource, /obrasMescladas\.unshift\(obraSupabase\);/);
  assert.doesNotMatch(utilsSource, /supabase|localStorage|useState|useEffect/);
});
