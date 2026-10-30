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
const workCardSource = readFileSync(
  new URL(
    "../../app/painel-autor/components/painel-autor-work-card.tsx",
    import.meta.url,
  ),
  "utf8",
);
const compartilhamentoSource = readFileSync(
  new URL(
    "../../app/painel-autor/lib/painel-autor-share-action.ts",
    import.meta.url,
  ),
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
    'import { criarSlugBase, idObraSupabaseValido } from "../../../lib/utils";',
    'const criarSlugBase = (texto) => texto.trim().toLowerCase().replace(/\\s+/g, "-");\nconst idObraSupabaseValido = (id) => id === "obra-valida";',
  );
const {
  criarHrefLeituraCapituloPainel,
  criarLoginHrefPainelAutor,
  criarPerfilAutorHref,
} = await import(
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

test("criarHrefLeituraCapituloPainel preserva URL publica e fallback", () => {
  assert.equal(
    criarHrefLeituraCapituloPainel(
      { id: "obra-valida", slug: " obra teste ", titulo: "Ignorado", publicado: true },
      { id: "capitulo-1" },
      2,
    ),
    "/obra/obra%20teste/capitulo/2",
  );
  assert.equal(
    criarHrefLeituraCapituloPainel(
      { id: "obra local", titulo: "Titulo da Obra", publicado: false },
      { id: "capitulo especial" },
      0,
    ),
    "/ler-capitulo?obraId=obra%20local&capituloId=capitulo%20especial",
  );
});

test("Painel do Autor delega somente os helpers de navegação", () => {
  assert.match(
    pagina,
    /import \{\s*criarLoginHrefPainelAutor,?\s*\} from "\.\/lib\/painel-autor-route-utils";/,
  );
  assert.doesNotMatch(pagina, /function criarLoginHrefPainelAutor\(/);
  assert.doesNotMatch(pagina, /function criarPerfilAutorHref\(/);
  assert.equal((pagina.match(/\bcriarLoginHrefPainelAutor\b/g) || []).length, 2);
  assert.match(
    pagina,
    /import \{ ObraPainelCard \} from "\.\/components\/painel-autor-work-card";/,
  );
  assert.doesNotMatch(pagina, /function ObraPainelCard\(/);
  assert.match(
    workCardSource,
    /import \{[\s\S]*?criarHrefLeituraCapituloPainel,[\s\S]*?criarPerfilAutorHref,[\s\S]*?\} from "\.\.\/lib\/painel-autor-route-utils";/,
  );
  assert.equal((pagina.match(/\bcriarPerfilAutorHref\b/g) || []).length, 0);
  assert.equal((workCardSource.match(/\bcriarPerfilAutorHref\b/g) || []).length, 2);
  assert.doesNotMatch(pagina, /function criarHrefLeituraCapituloPainel\(/);
  assert.match(
    readFileSync(new URL("../../app/painel-autor/hooks/use-painel-autor-auth-session.ts", import.meta.url), "utf8"),
    /supabase\.auth\.getUser\(\)/,
  );
  assert.match(pagina, /import \{[\s\S]*?STORAGE_KEY,[\s\S]*?\} from "\.\/lib\/painel-autor-storage-keys";/);
  assert.doesNotMatch(utilsSource, /supabase|localStorage|useState|useEffect/);
});

test("Painel do Autor delega o compartilhamento e preserva seus fallbacks", () => {
  assert.match(
    pagina,
    /import \{ compartilharObraPainel \} from "\.\/lib\/painel-autor-share-action";/,
  );
  assert.match(
    pagina,
    /function compartilharObra\(obra: ObraLocal\) \{[\s\S]*?return compartilharObraPainel\(obra, language\);/,
  );
  assert.doesNotMatch(pagina, /function copiarTextoComFallback\(/);
  assert.doesNotMatch(pagina, /async function compartilharObra\(/);
  assert.match(compartilhamentoSource, /export function copiarTextoComFallback\(texto: string\)/);
  assert.match(compartilhamentoSource, /document\.createElement\("textarea"\)/);
  assert.match(compartilhamentoSource, /campoTemporario\.setAttribute\("readonly", "true"\)/);
  assert.match(compartilhamentoSource, /campoTemporario\.style\.position = "fixed"/);
  assert.match(compartilhamentoSource, /campoTemporario\.style\.left = "-9999px"/);
  assert.match(compartilhamentoSource, /document\.execCommand\("copy"\)/);
  assert.match(compartilhamentoSource, /document\.body\.removeChild\(campoTemporario\)/);
  assert.match(compartilhamentoSource, /export async function compartilharObraPainel\(/);
  assert.match(
    compartilhamentoSource,
    /obra\.link \|\| `\/obra\/\$\{obra\.slug \|\| criarSlugBase\(obra\.titulo\)\}`/,
  );
  assert.match(compartilhamentoSource, /new URL\(href, window\.location\.origin\)\.toString\(\)/);
  assert.match(compartilhamentoSource, /title: traduzirTextoPainelAutor\(`\$\{obra\.titulo\} no HISTORIETAS`, language\)/);
  assert.match(compartilhamentoSource, /`Confira a obra \$\{obra\.titulo\} de \$\{obra\.autor\} no HISTORIETAS\.`/);
  assert.match(compartilhamentoSource, /typeof navigator\.share === "function"/);
  assert.match(compartilhamentoSource, /await navigator\.share\(dadosCompartilhamento\)/);
  assert.match(compartilhamentoSource, /error instanceof DOMException && error\.name === "AbortError"/);
  assert.match(compartilhamentoSource, /window\.isSecureContext/);
  assert.match(compartilhamentoSource, /navigator\.clipboard\.writeText\(linkAbsoluto\)/);
  assert.match(compartilhamentoSource, /copiarTextoComFallback\(linkAbsoluto\)/);
  assert.doesNotMatch(compartilhamentoSource, /supabase|localStorage|useState|useEffect/);
});
