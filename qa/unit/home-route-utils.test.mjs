import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const modulo = readFileSync(
  new URL("../../app/lib/home-route-utils.ts", import.meta.url),
  "utf8",
);
const pagina = readFileSync(new URL("../../app/page.tsx", import.meta.url), "utf8");
const cardObraLocal = readFileSync(
  new URL("../../app/lib/home-local-work-card-view-utils.ts", import.meta.url),
  "utf8",
);
const authSession = readFileSync(
  new URL("../../app/hooks/use-home-auth-session.ts", import.meta.url),
  "utf8",
);

test("home-route-utils preserva os quatro contratos de rota da Home", () => {
  assert.match(
    modulo,
    /import \{ criarSlugBase, idObraSupabaseValido \} from "\.\.\/\.\.\/lib\/utils";/,
  );
  assert.match(modulo, /export function criarLoginHrefHome\(\)/);
  assert.match(
    modulo,
    /redirectTo && redirectTo\.startsWith\("\/"\) && !redirectTo\.startsWith\("\/\/"\)/,
  );
  assert.match(modulo, /return `\/login\?\$\{params\.toString\(\)\}`;/);
  assert.match(modulo, /export function criarHrefLeituraCapituloHome\(/);
  assert.match(modulo, /idObraSupabaseValido\(obra\.id\)/);
  assert.match(
    modulo,
    /return `\/obra\/\$\{encodeURIComponent\(slugSeguro\)\}\/capitulo\/\$\{numeroCapitulo\}`;/,
  );
  assert.match(modulo, /return `\/ler-capitulo\?obraId=\$\{encodeURIComponent\(/);
  assert.match(modulo, /export function criarHrefObraCatalogoHome\(/);
  assert.match(modulo, /if \(!obra\.disponivel\) \{\s*return "\/explorar";/);
  assert.match(modulo, /return `\/obra\/\$\{slugObra\}`;/);
  assert.match(
    modulo,
    /export function criarHrefPerfilAutorHome\(nomeAutor: string, autorId = ""\)/,
  );
  assert.match(modulo, /parametros\.set\("autorId", autorIdLimpo\);/);
  assert.match(modulo, /parametros\.set\("userId", autorIdLimpo\);/);
  assert.match(
    modulo,
    /return query \? `\/perfil-autor\?\$\{query\}` : "\/perfil-autor";/,
  );
});

test("Home delega os utilitários de rota ao módulo dedicado", () => {
  assert.match(
    pagina,
    /import \{[\s\S]*?criarHrefObraCatalogoHome,[\s\S]*?\} from "\.\/lib\/home-route-utils";/,
  );
  assert.match(
    cardObraLocal,
    /import \{[\s\S]*?criarHrefLeituraCapituloHome,[\s\S]*?criarHrefPerfilAutorHome,[\s\S]*?\} from "\.\/home-route-utils";/,
  );

  for (const nomeFuncao of [
    "criarLoginHrefHome",
    "criarHrefLeituraCapituloHome",
    "criarHrefObraCatalogoHome",
    "criarHrefPerfilAutorHome",
  ]) {
    assert.doesNotMatch(pagina, new RegExp(`function ${nomeFuncao}\\b`));
  }

  assert.doesNotMatch(pagina, /criarLoginHrefHome/);
  assert.match(authSession, /import \{ criarLoginHrefHome \} from "\.\.\/lib\/home-route-utils";/);
  assert.match(authSession, /router\.push\(criarLoginHrefHome\(\)\);/);
  assert.match(pagina, /criarHrefObraCatalogoHome\(/);
  assert.match(cardObraLocal, /criarHrefLeituraCapituloHome\(/);
  assert.match(cardObraLocal, /criarHrefPerfilAutorHome\(/);
});
