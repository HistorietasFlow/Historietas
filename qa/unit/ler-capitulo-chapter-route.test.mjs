import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import typescript from "typescript";

const ler = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const fonte = ler("../../app/ler-capitulo/lib/ler-capitulo-chapter-route.ts");
const pagina = ler("../../app/ler-capitulo/page.tsx");
const executavel = fonte.replace(
  /import \{[\s\S]*?\} from "\.\.\/\.\.\/\.\.\/lib\/utils";/,
  `const criarSlugBase = (titulo) => titulo.trim().toLowerCase().replace(/\\s+/g, "-");\nconst idObraSupabaseValido = (id) => id === "obra-valida";`,
);
const javascript = typescript.transpileModule(executavel, {
  compilerOptions: { module: typescript.ModuleKind.ESNext, target: typescript.ScriptTarget.ES2022 },
}).outputText;
const { criarHrefLeituraCapituloLeitor } = await import(
  `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`,
);
const obra = (sobrescritas = {}) => ({
  id: "obra-valida", slug: "slug-da-obra", titulo: "Título da obra", publicado: true,
  capitulos: [{ id: "cap-1" }, { id: "cap-2" }], ...sobrescritas,
});

test("criarHrefLeituraCapituloLeitor preserva rota pública, índice e fallbacks", () => {
  assert.equal(criarHrefLeituraCapituloLeitor(obra(), "cap-2"), "/obra/slug-da-obra/capitulo/2");
  assert.equal(criarHrefLeituraCapituloLeitor(obra({ slug: "" }), "cap-1"), "/obra/t%C3%ADtulo-da-obra/capitulo/1");
  assert.equal(criarHrefLeituraCapituloLeitor(obra({ publicado: false, id: "obra /?" }), "cap ?&"), "/ler-capitulo?obraId=obra%20%2F%3F&capituloId=cap%20%3F%26");
  assert.equal(criarHrefLeituraCapituloLeitor(obra({ capitulos: [] }), "desconhecido"), "/obra/slug-da-obra/capitulo/1");
});

test("a rota preserva guardas e o factory de notificação usa o helper importado", () => {
  assert.match(fonte, /\.findIndex\(/);
  assert.match(fonte, /indiceCapitulo >= 0 \? indiceCapitulo \+ 1 : 1/);
  assert.match(fonte, /criarSlugBase\(obra\.titulo\)/);
  assert.match(fonte, /obra\.publicado/);
  assert.match(fonte, /idObraSupabaseValido\(obra\.id\)/);
  assert.match(fonte, /Number\.isInteger\(numeroCapitulo\)/);
  assert.match(fonte, /encodeURIComponent\(slugSeguro\)/);
  assert.match(fonte, /encodeURIComponent\(capituloId\)/);
  assert.match(pagina, /criarRegistrarNotificacaoInteracaoCapituloSupabase\(criarHrefLeituraCapituloLeitor\)/);
  assert.doesNotMatch(pagina, /function criarHrefLeituraCapituloLeitor\(/);
});
